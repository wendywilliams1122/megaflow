
CREATE OR REPLACE FUNCTION public.is_email_domain_blocked(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_email_domains
    WHERE lower(domain) = lower(split_part(_email, '@', 2))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_email_domain_blocked(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_domain_blocked(text) TO anon, authenticated;
