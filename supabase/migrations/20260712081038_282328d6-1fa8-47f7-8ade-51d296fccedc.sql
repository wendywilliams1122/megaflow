
REVOKE EXECUTE ON FUNCTION public.notify_staff_new_conversation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_conversation_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_message_limits() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Recipients and staff update messages" ON public.messages;
CREATE POLICY "Recipients and staff update messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    auth.uid() = recipient_id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')
  )
  WITH CHECK (
    auth.uid() = recipient_id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')
  );
