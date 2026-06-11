-- =============================================
-- REFLY v3.2 — Yedekleme durumu kontrolü
-- Bu SQL'i Supabase Cloud SQL Editor'da çalıştırın
-- =============================================

DROP FUNCTION IF EXISTS public.earn_star(UUID, TEXT, TEXT, INTEGER, UUID);

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
  is_cooldown BOOLEAN,
  is_backed_up BOOLEAN
) AS $$
DECLARE
  v_cooldown_active BOOLEAN;
  v_current_stars INTEGER;
  v_is_backed_up BOOLEAN;
BEGIN
  -- Cooldown'u kontrol et: Aynı IP son N saatte bu cihaza dokunmuş mu?
  SELECT public.check_cooldown(p_ip, p_device_id, p_cooldown_hours) INTO v_cooldown_active;

  IF v_cooldown_active THEN
    -- Mevcut yıldızları ve yedekleme durumunu al
    SELECT current_stars, (phone_number IS NOT NULL) INTO v_current_stars, v_is_backed_up
    FROM public.loyalty_stars
    WHERE business_id = p_business_id AND visitor_uuid = p_visitor_uuid;

    RETURN QUERY SELECT false, COALESCE(v_current_stars, 0), true, COALESCE(v_is_backed_up, false);
    RETURN;
  END IF;

  -- Yıldız ekle veya yeni kayıt oluştur
  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, current_stars)
  VALUES (p_business_id, p_visitor_uuid, 1)
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET current_stars = loyalty_stars.current_stars + 1;

  -- Yeni yıldız sayısını ve yedekleme durumunu al
  SELECT current_stars, (phone_number IS NOT NULL) INTO v_current_stars, v_is_backed_up
  FROM public.loyalty_stars
  WHERE business_id = p_business_id AND visitor_uuid = p_visitor_uuid;

  RETURN QUERY SELECT true, v_current_stars, false, COALESCE(v_is_backed_up, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
