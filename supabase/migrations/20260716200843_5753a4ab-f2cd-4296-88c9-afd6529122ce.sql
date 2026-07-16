REVOKE EXECUTE ON FUNCTION public.guard_download_shortcodes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_download_shortcodes(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_download_shortcodes() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_download_shortcodes(text) TO service_role;