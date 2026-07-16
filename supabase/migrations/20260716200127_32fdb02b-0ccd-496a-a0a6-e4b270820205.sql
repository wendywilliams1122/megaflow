CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_staff boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  is_staff := public.has_role(auth.uid(), 'admin')
           OR public.has_role(auth.uid(), 'moderator');

  IF is_staff THEN
    RETURN NEW;
  END IF;

  NEW.points          := OLD.points;
  NEW.reputation      := OLD.reputation;
  NEW.trust_score     := OLD.trust_score;
  NEW.is_banned       := OLD.is_banned;
  NEW.staff_badge     := OLD.staff_badge;
  NEW.current_streak  := OLD.current_streak;
  NEW.longest_streak  := OLD.longest_streak;
  NEW.totp_enabled    := OLD.totp_enabled;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_columns();