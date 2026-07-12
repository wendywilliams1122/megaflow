
DROP POLICY IF EXISTS "anyone read active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code TEXT)
RETURNS TABLE(code TEXT, discount_type TEXT, discount_value NUMERIC, min_purchase_cents INTEGER, valid BOOLEAN, reason TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT _code, NULL::TEXT, NULL::NUMERIC, NULL::INTEGER, false, 'Sign in to use a coupon';
    RETURN;
  END IF;
  SELECT * INTO c FROM public.coupons WHERE upper(coupons.code) = upper(_code) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT _code, NULL::TEXT, NULL::NUMERIC, NULL::INTEGER, false, 'Invalid code';
    RETURN;
  END IF;
  IF NOT c.is_active THEN
    RETURN QUERY SELECT c.code, c.discount_type::TEXT, c.discount_value, c.min_purchase_cents, false, 'Coupon inactive';
    RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN QUERY SELECT c.code, c.discount_type::TEXT, c.discount_value, c.min_purchase_cents, false, 'Coupon expired';
    RETURN;
  END IF;
  IF c.max_uses IS NOT NULL AND COALESCE(c.times_used,0) >= c.max_uses THEN
    RETURN QUERY SELECT c.code, c.discount_type::TEXT, c.discount_value, c.min_purchase_cents, false, 'Coupon limit reached';
    RETURN;
  END IF;
  RETURN QUERY SELECT c.code, c.discount_type::TEXT, c.discount_value, c.min_purchase_cents, true, 'OK';
END $$;

REVOKE EXECUTE ON FUNCTION public.validate_coupon(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT) TO authenticated;
