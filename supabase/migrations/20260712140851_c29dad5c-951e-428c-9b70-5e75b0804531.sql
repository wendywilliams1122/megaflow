-- Re-grant admin to super admin email and protect from removal
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'minusflowofficial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Protection trigger: prevent removing or altering admin role of super admin
CREATE OR REPLACE FUNCTION public.protect_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_id uuid;
  target_id uuid;
BEGIN
  target_id := COALESCE(OLD.user_id, NEW.user_id);
  SELECT id INTO super_id FROM auth.users WHERE lower(email) = 'minusflowofficial@gmail.com' LIMIT 1;
  IF super_id IS NULL OR target_id <> super_id THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' AND OLD.role = 'admin'::public.app_role THEN
    RAISE EXCEPTION 'Cannot remove admin role from the super administrator';
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'admin'::public.app_role AND NEW.role <> 'admin'::public.app_role THEN
    RAISE EXCEPTION 'Cannot change admin role of the super administrator';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_role_trg ON public.user_roles;
CREATE TRIGGER protect_super_admin_role_trg
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_role();