-- =============================================
-- REFLY v3 — SIFIR SÜRTÜNME SADAKAT SİSTEMİ
-- Bu SQL'i Supabase Studio > SQL Editor'da çalıştırın
-- =============================================

-- 1. Eski loyalty_points tablosunu sil
DROP TABLE IF EXISTS public.loyalty_points;
DROP FUNCTION IF EXISTS public.increment_loyalty_point(TEXT, UUID, UUID);

-- 2. Yeni loyalty_stars tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.loyalty_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_uuid TEXT NOT NULL,
  phone_number TEXT,
  current_stars INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, visitor_uuid)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_stars_business ON public.loyalty_stars(business_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_stars_phone ON public.loyalty_stars(phone_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_stars_visitor ON public.loyalty_stars(visitor_uuid);

-- 3. RLS Politikaları
ALTER TABLE public.loyalty_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own loyalty stars"
  ON public.loyalty_stars FOR SELECT
  USING ((SELECT auth.uid()) = business_id);

CREATE POLICY "System can insert loyalty stars"
  ON public.loyalty_stars FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update loyalty stars"
  ON public.loyalty_stars FOR UPDATE
  USING (true);

-- 4. Trigger for updated_at
DROP TRIGGER IF EXISTS set_loyalty_stars_updated_at ON public.loyalty_stars;
CREATE TRIGGER set_loyalty_stars_updated_at
  BEFORE UPDATE ON public.loyalty_stars
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Fonksiyonlar

-- earn_star: Cooldown kontrolü ve yıldız kazanma
CREATE OR REPLACE FUNCTION public.earn_star(
  p_business_id UUID,
  p_visitor_uuid TEXT,
  p_ip TEXT,
  p_cooldown_hours INTEGER,
  p_device_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  stars INTEGER,
  is_cooldown BOOLEAN
) AS $$
DECLARE
  v_cooldown_active BOOLEAN;
  v_current_stars INTEGER;
BEGIN
  -- Cooldown'u kontrol et: Aynı IP son N saatte bu cihaza dokunmuş mu?
  SELECT public.check_cooldown(p_ip, p_device_id, p_cooldown_hours) INTO v_cooldown_active;

  IF v_cooldown_active THEN
    -- Mevcut yıldızları al (varsa)
    SELECT current_stars INTO v_current_stars
    FROM public.loyalty_stars
    WHERE business_id = p_business_id AND visitor_uuid = p_visitor_uuid;

    RETURN QUERY SELECT false, COALESCE(v_current_stars, 0), true;
    RETURN;
  END IF;

  -- Yıldız ekle veya yeni kayıt oluştur
  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, current_stars)
  VALUES (p_business_id, p_visitor_uuid, 1)
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET current_stars = loyalty_stars.current_stars + 1;

  -- Yeni yıldız sayısını al
  SELECT current_stars INTO v_current_stars
  FROM public.loyalty_stars
  WHERE business_id = p_business_id AND visitor_uuid = p_visitor_uuid;

  RETURN QUERY SELECT true, v_current_stars, false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- backup_phone: Ziyaretçi UUID'sine telefon numarası bağlar
CREATE OR REPLACE FUNCTION public.backup_phone(
  p_visitor_uuid TEXT,
  p_business_id UUID,
  p_phone TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.loyalty_stars
  SET phone_number = p_phone
  WHERE visitor_uuid = p_visitor_uuid AND business_id = p_business_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- recover_by_phone: Eski yıldızları yeni UUID'ye taşır
CREATE OR REPLACE FUNCTION public.recover_by_phone(
  p_phone TEXT,
  p_business_id UUID,
  p_new_visitor_uuid TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  recovered_stars INTEGER
) AS $$
DECLARE
  v_old_id UUID;
  v_stars INTEGER;
BEGIN
  -- Eski kaydı bul
  SELECT id, current_stars INTO v_old_id, v_stars
  FROM public.loyalty_stars
  WHERE phone_number = p_phone AND business_id = p_business_id
  ORDER BY updated_at DESC LIMIT 1;

  IF v_old_id IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Yeni kaydı güncelle veya oluştur (eski yıldızlarla)
  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, phone_number, current_stars)
  VALUES (p_business_id, p_new_visitor_uuid, p_phone, v_stars)
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET current_stars = v_stars, phone_number = p_phone;

  -- Eski UUID'li kaydı sil (çakışma olmasın diye)
  DELETE FROM public.loyalty_stars WHERE id = v_old_id AND visitor_uuid != p_new_visitor_uuid;

  RETURN QUERY SELECT true, v_stars;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. resolve_nfc_redirect Güncellemesi (business_name eklenmesi)
DROP FUNCTION IF EXISTS public.resolve_nfc_redirect(TEXT);
CREATE OR REPLACE FUNCTION public.resolve_nfc_redirect(p_serial TEXT)
RETURNS TABLE(
  device_id UUID,
  link_id UUID,
  target_url TEXT,
  owner_id UUID,
  account_type TEXT,
  business_cooldown_hours INTEGER,
  is_claimed BOOLEAN,
  device_label TEXT,
  business_name TEXT
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
    d.device_label,
    p.business_name
  FROM public.nfc_devices d
  LEFT JOIN public.links l ON l.id = d.link_id AND l.is_active = true
  LEFT JOIN public.profiles p ON p.id = d.user_id
  WHERE d.device_serial = p_serial
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
