CREATE OR REPLACE FUNCTION public.increment_thread_view(_thread_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.threads SET view_count = view_count + 1 WHERE id = _thread_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_thread_view(uuid) TO anon, authenticated;