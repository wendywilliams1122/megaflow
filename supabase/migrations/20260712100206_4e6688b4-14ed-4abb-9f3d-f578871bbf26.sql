GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

GRANT SELECT ON public.threads TO anon, authenticated;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.advertisements TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advertisements TO authenticated;

GRANT ALL ON public.threads TO service_role;
GRANT ALL ON public.posts TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.advertisements TO service_role;