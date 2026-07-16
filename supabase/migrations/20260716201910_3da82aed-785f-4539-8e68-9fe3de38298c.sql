
DROP POLICY IF EXISTS "staff can insert quest progress" ON public.quest_progress;
CREATE POLICY "staff can insert quest progress"
  ON public.quest_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin'::public.app_role)
     OR public.has_role(auth.uid(), 'moderator'::public.app_role))
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id)
  );
