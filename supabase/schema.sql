-- =============================================
-- LINK DIRECTION — VERİTABANI ŞEMASI
-- Bu SQL dosyasını Supabase Dashboard > SQL Editor'da çalıştırın
-- =============================================

-- =============================================
-- 1. PROFILES TABLOSU
-- Her auth.users kaydıyla 1:1 ilişkili
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  max_link_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hızlı username lookup için index
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =============================================
-- 2. LINKS TABLOSU
-- Kullanıcıların oluşturduğu kısa linkler
-- =============================================
CREATE TABLE public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  target_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Aynı kullanıcı aynı slug'ı iki kez oluşturamaz
  UNIQUE(user_id, slug)
);

-- Yönlendirme sorgusu için composite index
CREATE INDEX idx_links_user_slug ON public.links(user_id, slug);
CREATE INDEX idx_links_is_active ON public.links(is_active);

-- =============================================
-- 3. ANALYTICS TABLOSU
-- Her tıklanmanın kaydı
-- =============================================
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  device TEXT,
  browser TEXT,
  referrer TEXT,
  country TEXT,
  ip_hash TEXT
);

CREATE INDEX idx_analytics_link_id ON public.analytics(link_id);
CREATE INDEX idx_analytics_clicked_at ON public.analytics(clicked_at);
CREATE INDEX idx_analytics_link_clicked ON public.analytics(link_id, clicked_at);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- =============================================

-- ---- PROFILES ----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profile lookup by username"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- ---- LINKS ----
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to active links"
  ON public.links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view own links"
  ON public.links FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create links"
  ON public.links FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own links"
  ON public.links FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own links"
  ON public.links FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ---- ANALYTICS ----
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own link analytics"
  ON public.analytics FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.links WHERE user_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- 5. FONKSİYONLAR
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, phone, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.resolve_redirect(p_username TEXT, p_slug TEXT)
RETURNS TABLE(link_id UUID, target_url TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.target_url
  FROM public.links l
  JOIN public.profiles p ON p.id = l.user_id
  WHERE p.username = p_username
    AND l.slug = p_slug
    AND l.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_click_count(link_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.links
  SET click_count = click_count + 1
  WHERE id = link_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 6. ADMIN FONKSİYONLARI
-- =============================================

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  phone TEXT,
  username TEXT,
  full_name TEXT,
  role TEXT,
  max_link_limit INTEGER,
  created_at TIMESTAMPTZ,
  link_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.phone,
    p.username,
    p.full_name,
    p.role,
    p.max_link_limit,
    p.created_at,
    COUNT(l.id) AS link_count
  FROM public.profiles p
  LEFT JOIN public.links l ON l.user_id = p.id
  GROUP BY p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_get_all_links()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  username TEXT,
  slug TEXT,
  target_url TEXT,
  is_active BOOLEAN,
  click_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    p.username,
    l.slug,
    l.target_url,
    l.is_active,
    l.click_count,
    l.created_at
  FROM public.links l
  JOIN public.profiles p ON p.id = l.user_id
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
