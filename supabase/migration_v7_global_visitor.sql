-- =============================================
-- REFLY v7 — GLOBAL VISITOR (Ortak Yedekleme Sistemi)
-- =============================================
-- Müşteri A kafesinde yıldızlarını yedeklediğinde (telefon & pin girdiğinde),
-- B kafesine ilk defa gidip okuttuğunda A kafesindeki kimlik bilgilerinin
-- B kafesindeki yeni hesabına otomatik kopyalanmasını sağlar.
-- =============================================

CREATE OR REPLACE FUNCTION public.create_pending_transaction(
  p_business_id UUID,
  p_visitor_uuid TEXT,
  p_tag_type TEXT,
  p_fingerprint TEXT,
  p_visitor_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_stars_to_add INTEGER;
  v_transaction_id UUID;
  v_duplicate_count INTEGER;
  
  -- Global kullanıcı bilgileri için değişkenler
  v_existing_phone TEXT;
  v_existing_username TEXT;
  v_existing_pin_hash TEXT;
BEGIN
  -- 60 saniyelik spam koruması
  SELECT COUNT(*) INTO v_duplicate_count
  FROM public.pending_transactions
  WHERE visitor_uuid = p_visitor_uuid
    AND business_id = p_business_id
    AND status = 'pending'
    AND created_at > (now() - interval '60 seconds');

  IF v_duplicate_count > 0 THEN
    RETURN NULL;
  END IF;

  CASE p_tag_type
    WHEN 'point_1' THEN v_stars_to_add := 1;
    WHEN 'point_2' THEN v_stars_to_add := 2;
    WHEN 'point_3' THEN v_stars_to_add := 3;
    WHEN 'point_4' THEN v_stars_to_add := 4;
    WHEN 'point_5' THEN v_stars_to_add := 5;
    ELSE v_stars_to_add := 0;
  END CASE;

  -- Aynı cihazdan (visitor_uuid) DAHA ÖNCE BAŞKA BİR İŞLETMEDE yedekleme (kayıt)
  -- yapılmışsa o bilgileri çekelim ki yeni işletmede de otomatik yedekli başlasın.
  SELECT phone_number, username, pin_hash 
  INTO v_existing_phone, v_existing_username, v_existing_pin_hash
  FROM public.loyalty_stars
  WHERE visitor_uuid = p_visitor_uuid AND phone_number IS NOT NULL
  LIMIT 1;

  -- Kayıt yoksa oluştur (loyalty_stars)
  -- Eğer daha önce başka işletmede yedeklenmişse, v_existing_* değişkenleri dolu gelir.
  INSERT INTO public.loyalty_stars (
    business_id, 
    visitor_uuid, 
    current_stars, 
    device_fingerprint,
    phone_number,
    username,
    pin_hash
  )
  VALUES (
    p_business_id, 
    p_visitor_uuid, 
    0, 
    p_fingerprint,
    v_existing_phone,
    v_existing_username,
    v_existing_pin_hash
  )
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET 
    device_fingerprint = COALESCE(p_fingerprint, loyalty_stars.device_fingerprint),
    -- Eğer bu işletmede boşsa ve başka işletmeden bulduysak doldur
    phone_number = COALESCE(loyalty_stars.phone_number, EXCLUDED.phone_number),
    username = COALESCE(loyalty_stars.username, EXCLUDED.username),
    pin_hash = COALESCE(loyalty_stars.pin_hash, EXCLUDED.pin_hash);

  -- İsmi boşsa veya anonimse kayıtlı ismi kullan
  IF p_visitor_name IS NULL OR p_visitor_name = 'Müşteri' OR p_visitor_name = 'Anonim Müşteri' THEN
    p_visitor_name := COALESCE(v_existing_username, 'Anonim Müşteri');
  END IF;

  INSERT INTO public.pending_transactions (business_id, visitor_uuid, visitor_name, tag_type, requested_stars, status)
  VALUES (p_business_id, p_visitor_uuid, p_visitor_name, p_tag_type, v_stars_to_add, 'pending')
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
