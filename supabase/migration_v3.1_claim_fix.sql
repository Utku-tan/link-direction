-- =============================================
-- REFLY v3.1 — claim_nfc_device güncelleme
-- Cihaz yoksa otomatik oluştur ve sahiplen
-- Bu SQL'i Supabase Cloud SQL Editor'da çalıştırın
-- =============================================

-- Eski fonksiyonu kaldır
DROP FUNCTION IF EXISTS public.claim_nfc_device(TEXT, UUID);

-- Yeni: Cihaz yoksa oluştur, varsa ve sahiplenilmemişse sahiplen
CREATE OR REPLACE FUNCTION public.claim_nfc_device(
  p_serial TEXT,
  p_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, device_id UUID) AS $$
DECLARE
  v_device_id UUID;
  v_is_claimed BOOLEAN;
  v_owner_id UUID;
BEGIN
  -- Mevcut cihazı ara
  SELECT d.id, d.is_claimed, d.user_id 
  INTO v_device_id, v_is_claimed, v_owner_id
  FROM public.nfc_devices d
  WHERE d.device_serial = UPPER(p_serial);

  -- Cihaz yoksa → yeni oluştur ve doğrudan sahiplen
  IF v_device_id IS NULL THEN
    INSERT INTO public.nfc_devices (device_serial, user_id, is_claimed, claimed_at)
    VALUES (UPPER(p_serial), p_user_id, true, now())
    RETURNING id INTO v_device_id;

    RETURN QUERY SELECT true, 'Cihaz başarıyla oluşturuldu ve bağlandı!'::TEXT, v_device_id;
    RETURN;
  END IF;

  -- Cihaz var ve zaten bu kullanıcıya ait
  IF v_is_claimed AND v_owner_id = p_user_id THEN
    RETURN QUERY SELECT false, 'Bu cihaz zaten hesabınıza bağlı.'::TEXT, v_device_id;
    RETURN;
  END IF;

  -- Cihaz var ve başka birine ait
  IF v_is_claimed THEN
    RETURN QUERY SELECT false, 'Bu cihaz zaten başka bir kullanıcıya bağlı.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Cihaz var ama sahiplenilmemiş → sahiplen
  UPDATE public.nfc_devices
  SET user_id = p_user_id,
      is_claimed = true,
      claimed_at = now()
  WHERE id = v_device_id;

  RETURN QUERY SELECT true, 'Cihaz başarıyla bağlandı!'::TEXT, v_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
