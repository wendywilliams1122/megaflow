
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS staff_badge text;

-- Backfill from user_roles
UPDATE public.profiles p SET staff_badge = 'admin'
  WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin');
UPDATE public.profiles p SET staff_badge = 'moderator'
  WHERE staff_badge IS NULL
    AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'moderator');

CREATE OR REPLACE FUNCTION public.sync_staff_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid := COALESCE(NEW.user_id, OLD.user_id);
  new_badge text;
BEGIN
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'moderator') THEN 'moderator'
    ELSE NULL
  END INTO new_badge;
  UPDATE public.profiles SET staff_badge = new_badge WHERE id = target;
  RETURN COALESCE(NEW, OLD);
END; $$;

REVOKE EXECUTE ON FUNCTION public.sync_staff_badge() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_staff_badge_aiud ON public.user_roles;
CREATE TRIGGER sync_staff_badge_aiud
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_staff_badge();
