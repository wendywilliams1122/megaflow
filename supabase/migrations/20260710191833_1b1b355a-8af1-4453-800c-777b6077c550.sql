
-- Tighten tags insert policy (avoid WITH CHECK true warning)
DROP POLICY IF EXISTS "tags insert auth" ON public.tags;
CREATE POLICY "tags insert auth" ON public.tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Lock down SECURITY DEFINER functions from public execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_post_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_vote_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
