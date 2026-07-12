
-- Add maintenance mode fields
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS maintenance_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message text;

-- Admin broadcast: send a notification to every non-banned user
CREATE OR REPLACE FUNCTION public.admin_broadcast(_title text, _body text, _link text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'Only staff can broadcast';
  END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, metadata)
  SELECT p.id, auth.uid(), 'reply'::public.notification_type, _title, _body, _link,
         jsonb_build_object('kind','broadcast')
    FROM public.profiles p
    WHERE COALESCE(p.is_banned, false) = false;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.audit_log (actor_id, actor_email, action, target_type, details)
  VALUES (auth.uid(), NULL, 'broadcast', 'notification',
          jsonb_build_object('recipients', n, 'title', _title));
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_broadcast(text, text, text) TO authenticated;

-- Admin: manually award/revoke a badge
CREATE OR REPLACE FUNCTION public.admin_award_badge(_user_id uuid, _badge_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO public.user_badges (user_id, badge_id) VALUES (_user_id, _badge_id)
    ON CONFLICT DO NOTHING;
  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'badge.award', 'user', _user_id, jsonb_build_object('badge_id', _badge_id));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_badge(_user_id uuid, _badge_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  DELETE FROM public.user_badges WHERE user_id = _user_id AND badge_id = _badge_id;
  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'badge.revoke', 'user', _user_id, jsonb_build_object('badge_id', _badge_id));
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_award_badge(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_badge(uuid, text) TO authenticated;

-- Admin: merge tag_from into tag_to and delete tag_from
CREATE OR REPLACE FUNCTION public.admin_merge_tags(_from uuid, _to uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _from = _to THEN RETURN; END IF;
  INSERT INTO public.thread_tags (thread_id, tag_id)
    SELECT thread_id, _to FROM public.thread_tags WHERE tag_id = _from
    ON CONFLICT DO NOTHING;
  DELETE FROM public.thread_tags WHERE tag_id = _from;
  DELETE FROM public.tags WHERE id = _from;
  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'tag.merge', 'tag', _to, jsonb_build_object('merged_from', _from));
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_merge_tags(uuid, uuid) TO authenticated;
