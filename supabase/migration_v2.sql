-- =============================================
-- REFLY v2 — NFC + B2B/B2C MİGRASYON
-- Bu SQL'i Supabase Studio > SQL Editor'da çalıştırın
-- =============================================

-- =============================================
-- 1. PROFILES TABLOSU GÜNCELLEMELERİ
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'business')),
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS business_cooldown_hours INTEGER NOT NULL DEFAULT 12;

-- =============================================
-- 2. NFC_DEVICES TABLOSU (YENİ)
-- Fiziksel NFC ürünlerinin kaydı
-- =============================================
CREATE TABLE IF NOT EXISTS public.nfc_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_serial TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  link_id UUID REFERENCES public.links(id) ON DELETE SET NULL,
  device_label TEXT,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfc_devices_serial ON public.nfc_devices(device_serial);
CREATE INDEX IF NOT EXISTS idx_nfc_devices_user ON public.nfc_devices(user_id);

-- =============================================
-- 3. ANALYTICS TABLOSU GÜNCELLEMELERİ
-- =============================================
ALTER TABLE public.analytics
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS nfc_device_id UUID REFERENCES public.nfc_devices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_cooldown_blocked BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_analytics_ip_device ON public.analytics(ip_address, nfc_device_id);

-- =============================================
-- 4. LOYALTY_POINTS TABLOSU (YENİ)
-- İşletme sadakat puanları
-- =============================================
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_ip TEXT NOT NULL,
  business_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nfc_device_id UUID REFERENCES public.nfc_devices(id) ON DELETE SET NULL,
  points INTEGER NOT NULL DEFAULT 0,
  last_earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_ip, business_user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_business ON public.loyalty_points(business_user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_ip_business ON public.loyalty_points(customer_ip, business_user_id);

-- =============================================
-- 5. RLS POLİTİKALARI
-- =============================================

-- ---- NFC_DEVICES ----
ALTER TABLE public.nfc_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON public.nfc_devices FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Public can view device by serial"
  ON public.nfc_devices FOR SELECT
  USING (true);

CREATE POLICY "Users can update own devices"
  ON public.nfc_devices FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Anyone can claim unclaimed device"
  ON public.nfc_devices FOR UPDATE
  USING (is_claimed = false);

-- ---- LOYALTY_POINTS ----
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own loyalty data"
  ON public.loyalty_points FOR SELECT
  USING ((SELECT auth.uid()) = business_user_id);

CREATE POLICY "System can insert loyalty points"
  ON public.loyalty_points FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update loyalty points"
  ON public.loyalty_points FOR UPDATE
  USING (true);

-- =============================================
-- 6. FONKSİYONLAR
-- =============================================

-- NFC cihaz yönlendirme çözümleyici
CREATE OR REPLACE FUNCTION public.resolve_nfc_redirect(p_serial TEXT)
RETURNS TABLE(
  device_id UUID,
  link_id UUID,
  target_url TEXT,
  owner_id UUID,
  account_type TEXT,
  business_cooldown_hours INTEGER,
  is_claimed BOOLEAN,
  device_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS device_id,
    d.link_id,
    l.target_url,
    d.user_id AS owner_id,
    p.account_type,
    p.business_cooldown_hours,
    d.is_claimed,
    d.device_label
  FROM public.nfc_devices d
  LEFT JOIN public.links l ON l.id = d.link_id AND l.is_active = true
  LEFT JOIN public.profiles p ON p.id = d.user_id
  WHERE d.device_serial = p_serial
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cooldown kontrolü: Aynı IP + aynı cihaz, son N saat içinde?
CREATE OR REPLACE FUNCTION public.check_cooldown(
  p_ip TEXT,
  p_device_id UUID,
  p_hours INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM public.analytics
  WHERE ip_address = p_ip
    AND nfc_device_id = p_device_id
    AND is_cooldown_blocked = false
    AND clicked_at > (now() - (p_hours || ' hours')::INTERVAL);
  
  RETURN existing_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NFC cihaz sahiplenme
CREATE OR REPLACE FUNCTION public.claim_nfc_device(
  p_serial TEXT,
  p_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, device_id UUID) AS $$
DECLARE
  v_device_id UUID;
  v_is_claimed BOOLEAN;
BEGIN
  SELECT d.id, d.is_claimed INTO v_device_id, v_is_claimed
  FROM public.nfc_devices d
  WHERE d.device_serial = p_serial;

  IF v_device_id IS NULL THEN
    RETURN QUERY SELECT false, 'Cihaz bulunamadı. Seri numarasını kontrol edin.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_is_claimed THEN
    RETURN QUERY SELECT false, 'Bu cihaz zaten başka bir kullanıcıya bağlı.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  UPDATE public.nfc_devices
  SET user_id = p_user_id,
      is_claimed = true,
      claimed_at = now()
  WHERE id = v_device_id;

  RETURN QUERY SELECT true, 'Cihaz başarıyla bağlandı!'::TEXT, v_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sadakat puanı artırma
CREATE OR REPLACE FUNCTION public.increment_loyalty_point(
  p_ip TEXT,
  p_business_user_id UUID,
  p_device_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
BEGIN
  INSERT INTO public.loyalty_points (customer_ip, business_user_id, nfc_device_id, points, last_earned_at)
  VALUES (p_ip, p_business_user_id, p_device_id, 1, now())
  ON CONFLICT (customer_ip, business_user_id)
  DO UPDATE SET
    points = loyalty_points.points + 1,
    last_earned_at = now(),
    updated_at = now();

  SELECT points INTO v_points
  FROM public.loyalty_points
  WHERE customer_ip = p_ip AND business_user_id = p_business_user_id;

  RETURN v_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- handle_new_user trigger güncelleme (account_type + business_name desteği)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, phone, full_name, account_type, business_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual'),
    NEW.raw_user_meta_data ->> 'business_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin fonksiyonu güncelleme
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  phone TEXT,
  username TEXT,
  full_name TEXT,
  role TEXT,
  account_type TEXT,
  business_name TEXT,
  max_link_limit INTEGER,
  created_at TIMESTAMPTZ,
  link_count BIGINT,
  device_count BIGINT
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
    p.account_type,
    p.business_name,
    p.max_link_limit,
    p.created_at,
    COUNT(DISTINCT l.id) AS link_count,
    COUNT(DISTINCT d.id) AS device_count
  FROM public.profiles p
  LEFT JOIN public.links l ON l.user_id = p.id
  LEFT JOIN public.nfc_devices d ON d.user_id = p.id
  GROUP BY p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Loyalty points trigger: updated_at otomatik güncelleme
CREATE TRIGGER set_loyalty_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
