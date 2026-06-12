-- =============================================
-- REFLY v4 — KASA TABANLI DAMGA SİSTEMİ
-- Bu SQL'i Supabase Cloud SQL Editor'da çalıştırın
-- =============================================

-- 1. Eski verileri temizle
DROP TABLE IF EXISTS public.stamp_events;
DROP TABLE IF EXISTS public.loyalty_stars;
DROP TABLE IF EXISTS public.loyalty_points;
DROP TYPE IF EXISTS public.tag_type_enum CASCADE;

-- Eski fonksiyonları temizle
DROP FUNCTION IF EXISTS public.earn_star(UUID, TEXT, TEXT, INTEGER, UUID);
DROP FUNCTION IF EXISTS public.backup_phone(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.recover_by_phone(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS public.check_cooldown(TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.increment_loyalty_point(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.claim_nfc_device(TEXT, UUID);
DROP FUNCTION IF EXISTS public.resolve_nfc_redirect(TEXT);

-- 2. Tag Type ENUM
CREATE TYPE public.tag_type_enum AS ENUM (
  'point_1', 'point_2', 'point_3', 'point_4', 'point_5', 'redeem_tag'
);

-- 3. Profiles tablosu güncellemeleri
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_stars_for_reward INTEGER NOT NULL DEFAULT 8;

-- 4. NFC Devices tablosunu yeniden yapılandır
DELETE FROM public.nfc_devices;

-- Önce bağımlı RLS politikalarını kaldır (sütunlardan ÖNCE!)
DROP POLICY IF EXISTS "Users can view own devices" ON public.nfc_devices;
DROP POLICY IF EXISTS "Public can view device by serial" ON public.nfc_devices;
DROP POLICY IF EXISTS "Users can update own devices" ON public.nfc_devices;
DROP POLICY IF EXISTS "Anyone can claim unclaimed device" ON public.nfc_devices;

-- Sonra eski sütunları kaldır
ALTER TABLE public.nfc_devices DROP COLUMN IF EXISTS link_id;
ALTER TABLE public.nfc_devices DROP COLUMN IF EXISTS is_claimed;
ALTER TABLE public.nfc_devices DROP COLUMN IF EXISTS claimed_at;
ALTER TABLE public.nfc_devices DROP COLUMN IF EXISTS device_label;

-- user_id -> business_id yeniden adlandır
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='nfc_devices' AND column_name='user_id') THEN
    ALTER TABLE public.nfc_devices RENAME COLUMN user_id TO business_id;
  END IF;
END $$;

-- Yeni sütunları ekle
ALTER TABLE public.nfc_devices
  ADD COLUMN IF NOT EXISTS tag_type public.tag_type_enum NOT NULL DEFAULT 'point_1',
  ADD COLUMN IF NOT EXISTS target_url TEXT;

-- 5. Loyalty Stars tablosunu oluştur
CREATE TABLE public.loyalty_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_uuid TEXT NOT NULL,
  username TEXT,
  phone_number TEXT,
  current_stars INTEGER NOT NULL DEFAULT 0,
  total_claimed_rewards INTEGER NOT NULL DEFAULT 0,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, visitor_uuid)
);

CREATE INDEX idx_loyalty_v4_business ON public.loyalty_stars(business_id);
CREATE INDEX idx_loyalty_v4_phone ON public.loyalty_stars(phone_number);
CREATE INDEX idx_loyalty_v4_visitor ON public.loyalty_stars(visitor_uuid);
CREATE INDEX idx_loyalty_v4_fingerprint ON public.loyalty_stars(device_fingerprint);

ALTER TABLE public.loyalty_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners view own stars" ON public.loyalty_stars
  FOR SELECT USING ((SELECT auth.uid()) = business_id);
CREATE POLICY "System insert stars" ON public.loyalty_stars
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System update stars" ON public.loyalty_stars
  FOR UPDATE USING (true);

DROP TRIGGER IF EXISTS set_loyalty_stars_updated_at ON public.loyalty_stars;
CREATE TRIGGER set_loyalty_stars_updated_at
  BEFORE UPDATE ON public.loyalty_stars
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Stamp Events tablosu (Realtime canlı akış için)
CREATE TABLE public.stamp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_uuid TEXT NOT NULL,
  visitor_name TEXT,
  tag_type public.tag_type_enum NOT NULL,
  stars_added INTEGER NOT NULL DEFAULT 0,
  current_stars INTEGER NOT NULL DEFAULT 0,
  target_stars INTEGER NOT NULL DEFAULT 8,
  is_reward BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stamp_events_business ON public.stamp_events(business_id);
CREATE INDEX idx_stamp_events_created ON public.stamp_events(created_at DESC);

ALTER TABLE public.stamp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners see own events" ON public.stamp_events
  FOR SELECT USING ((SELECT auth.uid()) = business_id);
CREATE POLICY "System insert events" ON public.stamp_events
  FOR INSERT WITH CHECK (true);

-- 7. RLS güncellemeleri: nfc_devices
DROP POLICY IF EXISTS "Users can view own devices" ON public.nfc_devices;
DROP POLICY IF EXISTS "Public can view device by serial" ON public.nfc_devices;
DROP POLICY IF EXISTS "Users can update own devices" ON public.nfc_devices;
DROP POLICY IF EXISTS "Anyone can claim unclaimed device" ON public.nfc_devices;

CREATE POLICY "Anyone can view devices" ON public.nfc_devices
  FOR SELECT USING (true);
CREATE POLICY "Only admin can insert devices" ON public.nfc_devices
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admin can update devices" ON public.nfc_devices
  FOR UPDATE USING (true);
CREATE POLICY "Only admin can delete devices" ON public.nfc_devices
  FOR DELETE USING (true);

-- =============================================
-- 8. FONKSİYONLAR
-- =============================================

-- Damga cihazı bilgisini çöz
CREATE OR REPLACE FUNCTION public.resolve_stamp_device(p_serial TEXT)
RETURNS TABLE(
  device_id UUID,
  device_serial TEXT,
  business_id UUID,
  tag_type public.tag_type_enum,
  target_url TEXT,
  business_name TEXT,
  target_stars_for_reward INTEGER,
  account_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS device_id,
    d.device_serial,
    d.business_id,
    d.tag_type,
    d.target_url,
    p.business_name,
    p.target_stars_for_reward,
    p.account_type
  FROM public.nfc_devices d
  LEFT JOIN public.profiles p ON p.id = d.business_id
  WHERE d.device_serial = UPPER(p_serial)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Ana damga işleme fonksiyonu
CREATE OR REPLACE FUNCTION public.process_stamp(
  p_business_id UUID,
  p_visitor_uuid TEXT,
  p_tag_type public.tag_type_enum,
  p_device_id UUID,
  p_fingerprint TEXT,
  p_target_stars INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  stars_after INTEGER,
  stars_added INTEGER,
  is_reward BOOLEAN,
  is_duplicate BOOLEAN,
  total_rewards INTEGER,
  visitor_name TEXT,
  is_backed_up BOOLEAN
) AS $$
DECLARE
  v_current_stars INTEGER;
  v_stars_to_add INTEGER;
  v_is_reward BOOLEAN := false;
  v_total_rewards INTEGER := 0;
  v_visitor_name TEXT;
  v_is_backed_up BOOLEAN := false;
  v_duplicate_count INTEGER;
BEGIN
  -- Mükerrer okuma kontrolü: aynı visitor + aynı işletme, son 60 saniye
  SELECT COUNT(*) INTO v_duplicate_count
  FROM public.stamp_events
  WHERE visitor_uuid = p_visitor_uuid
    AND business_id = p_business_id
    AND created_at > (now() - interval '60 seconds');

  IF v_duplicate_count > 0 THEN
    SELECT ls.current_stars, ls.total_claimed_rewards, ls.username, (ls.phone_number IS NOT NULL)
    INTO v_current_stars, v_total_rewards, v_visitor_name, v_is_backed_up
    FROM public.loyalty_stars ls
    WHERE ls.business_id = p_business_id AND ls.visitor_uuid = p_visitor_uuid;

    RETURN QUERY SELECT false, COALESCE(v_current_stars, 0), 0, false, true, COALESCE(v_total_rewards, 0), v_visitor_name, v_is_backed_up;
    RETURN;
  END IF;

  -- tag_type'a göre yıldız değerini belirle
  CASE p_tag_type
    WHEN 'point_1' THEN v_stars_to_add := 1;
    WHEN 'point_2' THEN v_stars_to_add := 2;
    WHEN 'point_3' THEN v_stars_to_add := 3;
    WHEN 'point_4' THEN v_stars_to_add := 4;
    WHEN 'point_5' THEN v_stars_to_add := 5;
    WHEN 'redeem_tag' THEN v_stars_to_add := 0;
  END CASE;

  -- Loyalty kaydını oluştur veya güncelle
  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, current_stars, device_fingerprint)
  VALUES (p_business_id, p_visitor_uuid, 0, p_fingerprint)
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET device_fingerprint = COALESCE(p_fingerprint, loyalty_stars.device_fingerprint);

  -- Mevcut bilgileri kilitli olarak al (Race condition / Atomicity koruması)
  -- FOR UPDATE sayesinde aynı anda gelen 2 istek birbirini bekler, eksi bakiyeye düşmeyi engeller.
  SELECT ls.current_stars, ls.total_claimed_rewards, ls.username, (ls.phone_number IS NOT NULL)
  INTO v_current_stars, v_total_rewards, v_visitor_name, v_is_backed_up
  FROM public.loyalty_stars ls
  WHERE ls.business_id = p_business_id AND ls.visitor_uuid = p_visitor_uuid
  FOR UPDATE;

  -- ÖDÜL HARCAMA (redeem_tag)
  IF p_tag_type = 'redeem_tag' THEN
    IF v_current_stars >= p_target_stars THEN
      UPDATE public.loyalty_stars
      SET current_stars = current_stars - p_target_stars,
          total_claimed_rewards = total_claimed_rewards + 1
      WHERE business_id = p_business_id AND visitor_uuid = p_visitor_uuid;

      v_current_stars := v_current_stars - p_target_stars;
      v_total_rewards := v_total_rewards + 1;
      v_is_reward := true;

      INSERT INTO public.stamp_events (business_id, visitor_uuid, visitor_name, tag_type, stars_added, current_stars, target_stars, is_reward)
      VALUES (p_business_id, p_visitor_uuid, COALESCE(v_visitor_name, 'Anonim Müşteri'), 'redeem_tag', 0, v_current_stars, p_target_stars, true);

      RETURN QUERY SELECT true, v_current_stars, 0, true, false, v_total_rewards, v_visitor_name, v_is_backed_up;
      RETURN;
    ELSE
      -- Yetersiz yıldız
      RETURN QUERY SELECT false, v_current_stars, 0, false, false, v_total_rewards, v_visitor_name, v_is_backed_up;
      RETURN;
    END IF;
  END IF;

  -- YILDIZ EKLEME (point_1..point_5)
  UPDATE public.loyalty_stars
  SET current_stars = current_stars + v_stars_to_add
  WHERE business_id = p_business_id AND visitor_uuid = p_visitor_uuid;

  v_current_stars := v_current_stars + v_stars_to_add;

  INSERT INTO public.stamp_events (business_id, visitor_uuid, visitor_name, tag_type, stars_added, current_stars, target_stars, is_reward)
  VALUES (p_business_id, p_visitor_uuid, COALESCE(v_visitor_name, 'Anonim Müşteri'), p_tag_type, v_stars_to_add, v_current_stars, p_target_stars, false);

  RETURN QUERY SELECT true, v_current_stars, v_stars_to_add, false, false, v_total_rewards, v_visitor_name, v_is_backed_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Yedekleme: İsim + Telefon
CREATE OR REPLACE FUNCTION public.backup_visitor(
  p_visitor_uuid TEXT,
  p_business_id UUID,
  p_phone TEXT,
  p_username TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.loyalty_stars
  SET phone_number = p_phone,
      username = p_username
  WHERE visitor_uuid = p_visitor_uuid AND business_id = p_business_id;

  UPDATE public.stamp_events
  SET visitor_name = p_username
  WHERE visitor_uuid = p_visitor_uuid AND business_id = p_business_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Fingerprint ile otomatik geri yükleme
CREATE OR REPLACE FUNCTION public.restore_by_fingerprint(
  p_fingerprint TEXT,
  p_business_id UUID,
  p_new_visitor_uuid TEXT
)
RETURNS TABLE(
  found BOOLEAN,
  restored_stars INTEGER,
  restored_name TEXT
) AS $$
DECLARE
  v_old_id UUID;
  v_stars INTEGER;
  v_name TEXT;
BEGIN
  SELECT ls.id, ls.current_stars, ls.username
  INTO v_old_id, v_stars, v_name
  FROM public.loyalty_stars ls
  WHERE ls.device_fingerprint = p_fingerprint
    AND ls.business_id = p_business_id
    AND ls.visitor_uuid != p_new_visitor_uuid
  ORDER BY ls.updated_at DESC
  LIMIT 1;

  IF v_old_id IS NULL THEN
    RETURN QUERY SELECT false, 0, NULL::TEXT;
    RETURN;
  END IF;

  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, username, phone_number, current_stars, total_claimed_rewards, device_fingerprint)
  SELECT p_business_id, p_new_visitor_uuid, ls.username, ls.phone_number, ls.current_stars, ls.total_claimed_rewards, p_fingerprint
  FROM public.loyalty_stars ls WHERE ls.id = v_old_id
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET
    current_stars = EXCLUDED.current_stars,
    total_claimed_rewards = EXCLUDED.total_claimed_rewards,
    username = EXCLUDED.username,
    phone_number = EXCLUDED.phone_number,
    device_fingerprint = p_fingerprint;

  DELETE FROM public.loyalty_stars WHERE id = v_old_id;

  RETURN QUERY SELECT true, v_stars, v_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Telefon ile kurtarma
CREATE OR REPLACE FUNCTION public.recover_by_phone(
  p_phone TEXT,
  p_business_id UUID,
  p_new_visitor_uuid TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  recovered_stars INTEGER
) AS $$
DECLARE
  v_old_id UUID;
  v_stars INTEGER;
BEGIN
  SELECT id, current_stars INTO v_old_id, v_stars
  FROM public.loyalty_stars
  WHERE phone_number = p_phone AND business_id = p_business_id
  ORDER BY updated_at DESC LIMIT 1;

  IF v_old_id IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, phone_number, current_stars, total_claimed_rewards)
  SELECT p_business_id, p_new_visitor_uuid, ls.phone_number, ls.current_stars, ls.total_claimed_rewards
  FROM public.loyalty_stars ls WHERE ls.id = v_old_id
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET current_stars = EXCLUDED.current_stars, phone_number = EXCLUDED.phone_number, total_claimed_rewards = EXCLUDED.total_claimed_rewards;

  DELETE FROM public.loyalty_stars WHERE id = v_old_id AND visitor_uuid != p_new_visitor_uuid;

  RETURN QUERY SELECT true, v_stars;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Admin: Tüm cihazları listele
CREATE OR REPLACE FUNCTION public.admin_get_all_devices()
RETURNS TABLE(
  id UUID,
  device_serial TEXT,
  business_id UUID,
  tag_type public.tag_type_enum,
  target_url TEXT,
  created_at TIMESTAMPTZ,
  business_name TEXT,
  business_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id, d.device_serial, d.business_id, d.tag_type, d.target_url, d.created_at,
    p.business_name, p.email AS business_email
  FROM public.nfc_devices d
  LEFT JOIN public.profiles p ON p.id = d.business_id
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Supabase Realtime: stamp_events tablosu için publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.stamp_events;
