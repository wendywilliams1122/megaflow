
ALTER TABLE public.threads DROP COLUMN IF EXISTS body_public;
ALTER TABLE public.posts DROP COLUMN IF EXISTS body_public;

ALTER TABLE public.threads
  ADD COLUMN body_public text GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(COALESCE(body,''), '\[download[^\]]*\]', '[download-locked]', 'gi'),
      '\[spoiler\][\s\S]*?\[/spoiler\]', '[spoiler-locked]', 'gi'
    )
  ) STORED;

ALTER TABLE public.posts
  ADD COLUMN body_public text GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(COALESCE(body,''), '\[download[^\]]*\]', '[download-locked]', 'gi'),
      '\[spoiler\][\s\S]*?\[/spoiler\]', '[spoiler-locked]', 'gi'
    )
  ) STORED;

GRANT SELECT (id, slug, title, body_public, vote_score, reply_count, is_pinned, is_locked, created_at, updated_at, author_id, category_id, last_activity_at, view_count)
  ON public.threads TO anon, authenticated;
GRANT SELECT (id, thread_id, author_id, body_public, vote_score, created_at, updated_at)
  ON public.posts TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_full_body(_target_type text, _target_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b text;
  author uuid;
  eligible boolean;
BEGIN
  IF _target_type = 'thread' THEN
    SELECT body, author_id INTO b, author FROM public.threads WHERE id = _target_id;
  ELSIF _target_type = 'post' THEN
    SELECT body, author_id INTO b, author FROM public.posts WHERE id = _target_id;
  ELSE
    RETURN NULL;
  END IF;
  IF b IS NULL THEN RETURN NULL; END IF;

  eligible := auth.uid() IS NOT NULL AND (
    auth.uid() = author
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'moderator')
    OR public.can_view_downloads(auth.uid())
  );

  IF eligible THEN
    RETURN b;
  ELSE
    RETURN regexp_replace(
      regexp_replace(b, '\[download[^\]]*\]', '[download-locked]', 'gi'),
      '\[spoiler\][\s\S]*?\[/spoiler\]', '[spoiler-locked]', 'gi'
    );
  END IF;
END; $$;
