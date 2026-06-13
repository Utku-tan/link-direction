-- =============================================
-- REFLY v6 — PIN SECURITY FOR BACKUP/RECOVER
-- =============================================

-- 1. Enable pgcrypto if not already enabled (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add pin_hash column to loyalty_stars
ALTER TABLE public.loyalty_stars
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 3. Update backup_visitor to accept p_pin_code
CREATE OR REPLACE FUNCTION public.backup_visitor(
  p_visitor_uuid TEXT,
  p_business_id UUID,
  p_phone TEXT,
  p_username TEXT,
  p_pin_code TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.loyalty_stars
  SET phone_number = p_phone,
      username = p_username,
      pin_hash = crypt(p_pin_code, gen_salt('bf'))
  WHERE visitor_uuid = p_visitor_uuid AND business_id = p_business_id;

  UPDATE public.stamp_events
  SET visitor_name = p_username
  WHERE visitor_uuid = p_visitor_uuid AND business_id = p_business_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Update recover_by_phone to accept p_pin_code and verify hash
CREATE OR REPLACE FUNCTION public.recover_by_phone(
  p_phone TEXT,
  p_business_id UUID,
  p_new_visitor_uuid TEXT,
  p_pin_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  recovered_stars INTEGER,
  message TEXT
) AS $$
DECLARE
  v_old_id UUID;
  v_stars INTEGER;
  v_hash TEXT;
BEGIN
  -- Get the most recently updated record for this phone number at this business
  SELECT id, current_stars, pin_hash INTO v_old_id, v_stars, v_hash
  FROM public.loyalty_stars
  WHERE phone_number = p_phone AND business_id = p_business_id
  ORDER BY updated_at DESC LIMIT 1;

  IF v_old_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Kayıt bulunamadı'::TEXT;
    RETURN;
  END IF;

  -- Verify PIN Code
  -- If pin_hash is NULL (from older records), we might allow them to recover without a PIN,
  -- but to enforce security, we require the PIN to match. If they don't have a PIN set,
  -- they should not be able to recover until they back up again.
  -- Wait, for backward compatibility, if v_hash is NULL, let them in?
  -- No, let's say if v_hash IS NULL, it means they backed up before v6. We can either block or allow.
  -- Let's allow recovery if v_hash is NULL (legacy), but strongly recommend setting a PIN.
  IF v_hash IS NOT NULL THEN
    IF v_hash != crypt(p_pin_code, v_hash) THEN
      RETURN QUERY SELECT false, 0, 'Hatalı PIN kodu'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Transfer the record
  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, phone_number, current_stars, total_claimed_rewards, pin_hash)
  SELECT p_business_id, p_new_visitor_uuid, ls.phone_number, ls.current_stars, ls.total_claimed_rewards, ls.pin_hash
  FROM public.loyalty_stars ls WHERE ls.id = v_old_id
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET 
    current_stars = EXCLUDED.current_stars, 
    phone_number = EXCLUDED.phone_number, 
    total_claimed_rewards = EXCLUDED.total_claimed_rewards,
    pin_hash = EXCLUDED.pin_hash;

  -- Delete the old record
  DELETE FROM public.loyalty_stars WHERE id = v_old_id AND visitor_uuid != p_new_visitor_uuid;

  RETURN QUERY SELECT true, v_stars, 'Başarıyla geri yüklendi'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
