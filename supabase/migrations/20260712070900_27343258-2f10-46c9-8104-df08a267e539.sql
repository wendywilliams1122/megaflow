
REVOKE EXECUTE ON FUNCTION public.on_reaction_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_reaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_notification(UUID, UUID, public.notification_type, TEXT, TEXT, TEXT, UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
