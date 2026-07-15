DROP POLICY IF EXISTS "anyone reads weekly snapshots" ON public.weekly_snapshots;
REVOKE SELECT ON public.weekly_snapshots FROM anon;
GRANT SELECT ON public.weekly_snapshots TO authenticated;
CREATE POLICY "owner or staff reads weekly snapshots"
  ON public.weekly_snapshots
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );