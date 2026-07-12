ALTER TABLE public.threads
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

DROP POLICY IF EXISTS "threads public read" ON public.threads;
CREATE POLICY "threads public read" ON public.threads FOR SELECT
  USING (
    COALESCE(is_deleted, false) = false
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

DROP POLICY IF EXISTS "posts public read" ON public.posts;
CREATE POLICY "posts public read" ON public.posts FOR SELECT
  USING (
    COALESCE(is_deleted, false) = false
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS force_reauth_at timestamptz,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.admin_soft_delete_thread(_thread_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.threads
     SET is_deleted = true, deleted_at = now(), deleted_by = auth.uid(), deleted_reason = _reason
   WHERE id = _thread_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_restore_thread(_thread_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.threads
     SET is_deleted = false, deleted_at = NULL, deleted_by = NULL, deleted_reason = NULL
   WHERE id = _thread_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_purge_thread(_thread_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  DELETE FROM public.threads WHERE id = _thread_id;
END $$;

CREATE OR REPLACE FUNCTION public.admin_force_signout(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  UPDATE public.profiles SET force_reauth_at = now() WHERE id = _user_id;
  INSERT INTO public.audit_log(actor_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'user.force_signout', 'user', _user_id::text, '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_export_user_data(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT jsonb_build_object(
    'exported_at', now(),
    'exported_by', auth.uid(),
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = _user_id),
    'roles',   (SELECT COALESCE(jsonb_agg(role), '[]'::jsonb) FROM public.user_roles WHERE user_id = _user_id),
    'threads', (SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM public.threads t WHERE author_id = _user_id),
    'posts',   (SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM public.posts   x WHERE author_id = _user_id),
    'orders',  (SELECT COALESCE(jsonb_agg(to_jsonb(o)), '[]'::jsonb) FROM public.orders  o WHERE buyer_id  = _user_id),
    'badges',  (SELECT COALESCE(jsonb_agg(to_jsonb(b)), '[]'::jsonb) FROM public.user_badges b WHERE user_id = _user_id)
  ) INTO result;
  INSERT INTO public.audit_log(actor_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'user.gdpr_export', 'user', _user_id::text, '{}'::jsonb);
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.admin_log_impersonate(_user_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  INSERT INTO public.audit_log(actor_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'user.impersonate_view', 'user', _user_id::text,
            jsonb_build_object('reason', COALESCE(_reason, '')));
END $$;

REVOKE ALL ON FUNCTION public.admin_soft_delete_thread(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_restore_thread(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_purge_thread(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_force_signout(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_export_user_data(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_log_impersonate(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_soft_delete_thread(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_thread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_purge_thread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_force_signout(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_export_user_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_log_impersonate(uuid, text) TO authenticated;