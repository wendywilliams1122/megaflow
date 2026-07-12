-- Revoke direct SELECT on raw body column; keep INSERT/UPDATE so authors can write.
REVOKE SELECT (body) ON public.threads FROM anon, authenticated;
REVOKE SELECT (body) ON public.posts   FROM anon, authenticated;