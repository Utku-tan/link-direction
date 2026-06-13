-- =============================================
-- REFLY v5 — KASİYER ONAYLI (ZERO TRUST) SİSTEM
-- =============================================

-- 1. Veri Temizliği (Mevcut veriler silinir)
DROP TABLE IF EXISTS public.redeem_codes;
DROP TABLE IF EXISTS public.pending_transactions;

-- 2. Yeni Tablolar

-- Bekleyen İşlemler
CREATE TABLE public.pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_uuid TEXT NOT NULL,
  visitor_name TEXT,
  tag_type TEXT NOT NULL, -- 'point_1', 'point_2' vb.
  requested_stars INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pending_transactions_business ON public.pending_transactions(business_id);
CREATE INDEX idx_pending_transactions_status ON public.pending_transactions(status);

ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business view own pending" ON public.pending_transactions
  FOR SELECT USING ((SELECT auth.uid()) = business_id);
CREATE POLICY "System insert pending" ON public.pending_transactions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System update pending" ON public.pending_transactions
  FOR UPDATE USING (true);
CREATE POLICY "Public read pending by id" ON public.pending_transactions
  FOR SELECT USING (true); -- Müşterinin kendi işlemini dinlemesi için

-- Ödül Kodları (4 Haneli Dinamik Kod)
CREATE TABLE public.redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_uuid TEXT NOT NULL,
  visitor_name TEXT,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redeem_codes_business ON public.redeem_codes(business_id);
CREATE INDEX idx_redeem_codes_code ON public.redeem_codes(code);

ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business view own codes" ON public.redeem_codes
  FOR SELECT USING ((SELECT auth.uid()) = business_id);
CREATE POLICY "System insert codes" ON public.redeem_codes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System update codes" ON public.redeem_codes
  FOR UPDATE USING (true);
CREATE POLICY "Public read own codes" ON public.redeem_codes
  FOR SELECT USING (true);

-- 3. Fonksiyonlar

-- A. Bekleyen İşlem Yarat (Müşteri okuttuğunda çalışır)
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

  -- Kayıt yoksa oluştur (loyalty_stars)
  INSERT INTO public.loyalty_stars (business_id, visitor_uuid, current_stars, device_fingerprint)
  VALUES (p_business_id, p_visitor_uuid, 0, p_fingerprint)
  ON CONFLICT (business_id, visitor_uuid)
  DO UPDATE SET device_fingerprint = COALESCE(p_fingerprint, loyalty_stars.device_fingerprint);

  INSERT INTO public.pending_transactions (business_id, visitor_uuid, visitor_name, tag_type, requested_stars, status)
  VALUES (p_business_id, p_visitor_uuid, COALESCE(p_visitor_name, 'Anonim Müşteri'), p_tag_type, v_stars_to_add, 'pending')
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B. İşlem Onayla (Kasiyer panelinden onayladığında çalışır)
CREATE OR REPLACE FUNCTION public.approve_transaction(
  p_transaction_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tx public.pending_transactions%ROWTYPE;
  v_current_stars INTEGER;
  v_target_stars INTEGER;
BEGIN
  -- İşlemi kilitli al
  SELECT * INTO v_tx
  FROM public.pending_transactions
  WHERE id = p_transaction_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- İşletmenin hedef yıldız sayısını al
  SELECT target_stars_for_reward INTO v_target_stars
  FROM public.profiles
  WHERE id = v_tx.business_id;

  -- Yıldızları güncelle (Atomic)
  UPDATE public.loyalty_stars
  SET current_stars = current_stars + v_tx.requested_stars
  WHERE business_id = v_tx.business_id AND visitor_uuid = v_tx.visitor_uuid
  RETURNING current_stars INTO v_current_stars;

  -- İşlem durumunu güncelle
  UPDATE public.pending_transactions
  SET status = 'approved', updated_at = now()
  WHERE id = p_transaction_id;

  -- Eski canli akış tablosuna da log at
  INSERT INTO public.stamp_events (business_id, visitor_uuid, visitor_name, tag_type, stars_added, current_stars, target_stars, is_reward)
  VALUES (v_tx.business_id, v_tx.visitor_uuid, v_tx.visitor_name, v_tx.tag_type::public.tag_type_enum, v_tx.requested_stars, v_current_stars, COALESCE(v_target_stars, 8), false);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- C. İşlem Reddet
CREATE OR REPLACE FUNCTION public.reject_transaction(
  p_transaction_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.pending_transactions
  SET status = 'rejected', updated_at = now()
  WHERE id = p_transaction_id AND status = 'pending';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- D. Ödül Kodu Üret (Müşteri "Kullan" dediğinde çalışır)
CREATE OR REPLACE FUNCTION public.generate_redeem_code(
  p_business_id UUID,
  p_visitor_uuid TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  code TEXT,
  expires_at TIMESTAMPTZ,
  message TEXT
) AS $$
DECLARE
  v_current_stars INTEGER;
  v_target_stars INTEGER;
  v_visitor_name TEXT;
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_existing_code_id UUID;
BEGIN
  -- Kilitli oku (Atomic)
  SELECT ls.current_stars, ls.username INTO v_current_stars, v_visitor_name
  FROM public.loyalty_stars ls
  WHERE ls.business_id = p_business_id AND ls.visitor_uuid = p_visitor_uuid
  FOR UPDATE;

  SELECT target_stars_for_reward INTO v_target_stars
  FROM public.profiles
  WHERE id = p_business_id;

  IF v_current_stars < COALESCE(v_target_stars, 8) THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ, 'Yetersiz yıldız'::TEXT;
    RETURN;
  END IF;

  -- Zaten aktif bir kod var mı?
  SELECT id INTO v_existing_code_id
  FROM public.redeem_codes rc
  WHERE rc.business_id = p_business_id AND rc.visitor_uuid = p_visitor_uuid AND rc.status = 'active' AND rc.expires_at > now();

  IF v_existing_code_id IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ, 'Zaten aktif bir kodunuz var'::TEXT;
    RETURN;
  END IF;

  -- Rastgele 4 haneli kod üret (Örn: 0492)
  v_code := lpad(floor(random() * 10000)::text, 4, '0');
  v_expires_at := now() + interval '90 seconds';

  INSERT INTO public.redeem_codes (business_id, visitor_uuid, visitor_name, code, expires_at, status)
  VALUES (p_business_id, p_visitor_uuid, COALESCE(v_visitor_name, 'Anonim Müşteri'), v_code, v_expires_at, 'active');

  RETURN QUERY SELECT true, v_code, v_expires_at, 'Kod üretildi'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- E. Ödül Kodu Doğrula (Kasiyer panele kodu girdiğinde çalışır)
CREATE OR REPLACE FUNCTION public.validate_redeem_code(
  p_business_id UUID,
  p_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  visitor_name TEXT,
  message TEXT
) AS $$
DECLARE
  v_code_row public.redeem_codes%ROWTYPE;
  v_target_stars INTEGER;
  v_current_stars INTEGER;
BEGIN
  -- Süresi geçmemiş aktif kodu bul ve kilitle
  SELECT * INTO v_code_row
  FROM public.redeem_codes rc
  WHERE rc.business_id = p_business_id AND rc.code = p_code AND rc.status = 'active' AND rc.expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Geçersiz veya süresi dolmuş kod'::TEXT;
    RETURN;
  END IF;

  SELECT target_stars_for_reward INTO v_target_stars
  FROM public.profiles
  WHERE id = p_business_id;

  -- Yıldızları kontrol et ve kilitle
  SELECT current_stars INTO v_current_stars
  FROM public.loyalty_stars
  WHERE business_id = p_business_id AND visitor_uuid = v_code_row.visitor_uuid
  FOR UPDATE;

  IF v_current_stars < COALESCE(v_target_stars, 8) THEN
    -- Müşteri hileyle kodu üretmiş ama yıldızı eksik?
    UPDATE public.redeem_codes SET status = 'expired' WHERE id = v_code_row.id;
    RETURN QUERY SELECT false, NULL::TEXT, 'Müşterinin yıldızı yetersiz'::TEXT;
    RETURN;
  END IF;

  -- Bakiye düş
  UPDATE public.loyalty_stars
  SET current_stars = current_stars - COALESCE(v_target_stars, 8),
      total_claimed_rewards = total_claimed_rewards + 1
  WHERE business_id = p_business_id AND visitor_uuid = v_code_row.visitor_uuid;

  -- Kodu kullanıldı işaretle
  UPDATE public.redeem_codes SET status = 'used' WHERE id = v_code_row.id;

  -- Stamp events'e log at
  INSERT INTO public.stamp_events (business_id, visitor_uuid, visitor_name, tag_type, stars_added, current_stars, target_stars, is_reward)
  VALUES (p_business_id, v_code_row.visitor_uuid, v_code_row.visitor_name, 'redeem_tag', 0, v_current_stars - COALESCE(v_target_stars, 8), COALESCE(v_target_stars, 8), true);

  RETURN QUERY SELECT true, v_code_row.visitor_name, 'Ödül başarıyla onaylandı!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Publication eklemeleri
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.redeem_codes;
