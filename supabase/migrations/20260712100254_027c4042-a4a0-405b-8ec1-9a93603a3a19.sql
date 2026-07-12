DROP POLICY IF EXISTS "Anyone can view active ads" ON public.advertisements;

CREATE POLICY "Public can view active ads"
ON public.advertisements
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Staff can view all ads"
ON public.advertisements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'moderator'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;