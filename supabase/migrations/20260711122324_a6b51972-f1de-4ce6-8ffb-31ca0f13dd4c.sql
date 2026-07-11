
-- 1) Orders: require authenticated buyer = self
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Users create own orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- 2) Hide poster IP from public/authenticated on posts & threads
REVOKE SELECT (ip_address) ON public.posts FROM anon, authenticated;
REVOKE SELECT (ip_address) ON public.threads FROM anon, authenticated;

-- 3) Hide sensitive profile columns from anonymous visitors
REVOKE SELECT (signup_ip, last_ip, ban_reason, warnings, trust_score) ON public.profiles FROM anon;

-- 4) Lock down SECURITY DEFINER helper/trigger functions from being called via the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_post_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_vote_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_vote_award_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_thread_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_post_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
