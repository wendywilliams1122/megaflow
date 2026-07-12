
-- ============ REACTION TYPES ENUM ============
CREATE TYPE public.reaction_type AS ENUM ('like','love','haha','insightful','thanks');
CREATE TYPE public.notification_type AS ENUM ('reply','mention','reaction','bookmark','badge','system','moderation');
CREATE TYPE public.reaction_target AS ENUM ('thread','post');

-- ============ REACTIONS ============
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.reaction_target NOT NULL,
  target_id UUID NOT NULL,
  reaction public.reaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_reactions_target ON public.reactions(target_type, target_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

GRANT SELECT ON public.reactions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_public_read" ON public.reactions
  FOR SELECT USING (true);
CREATE POLICY "reactions_insert_own" ON public.reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_update_own" ON public.reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON public.reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Denormalized reaction counts on threads/posts (JSONB: {"like":5,"love":2,...})
ALTER TABLE public.threads ADD COLUMN IF NOT EXISTS reaction_counts JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.posts   ADD COLUMN IF NOT EXISTS reaction_counts JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ============ BOOKMARKS ============
CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, thread_id)
);

CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_thread ON public.bookmarks(thread_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_owner_all" ON public.bookmarks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notif_user_created ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_owner_read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_owner_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_owner_delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- No INSERT policy: only server (service_role / SECURITY DEFINER triggers) creates notifications.

-- ============ REACTION COUNT TRIGGER ============
CREATE OR REPLACE FUNCTION public.on_reaction_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ttype public.reaction_target;
  tid UUID;
  counts JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    ttype := OLD.target_type; tid := OLD.target_id;
  ELSE
    ttype := NEW.target_type; tid := NEW.target_id;
  END IF;

  -- Recompute the entire counts JSONB for the target (safe and simple)
  SELECT COALESCE(jsonb_object_agg(reaction::text, cnt), '{}'::jsonb)
    INTO counts
    FROM (
      SELECT reaction, count(*)::int AS cnt
        FROM public.reactions
        WHERE target_type = ttype AND target_id = tid
        GROUP BY reaction
    ) s;

  IF ttype = 'thread' THEN
    UPDATE public.threads SET reaction_counts = counts WHERE id = tid;
  ELSE
    UPDATE public.posts SET reaction_counts = counts WHERE id = tid;
  END IF;

  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_reactions_change
AFTER INSERT OR UPDATE OR DELETE ON public.reactions
FOR EACH ROW EXECUTE FUNCTION public.on_reaction_change();

-- ============ NOTIFICATION HELPER ============
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _actor_id UUID,
  _type public.notification_type,
  _title TEXT,
  _body TEXT,
  _link TEXT,
  _thread_id UUID,
  _post_id UUID,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Don't notify a user about their own action
  IF _user_id IS NULL OR _user_id = _actor_id THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, thread_id, post_id, metadata)
  VALUES (_user_id, _actor_id, _type, _title, _body, _link, _thread_id, _post_id, _metadata)
  RETURNING id INTO new_id;
  RETURN new_id;
END; $$;

-- ============ AUTO-NOTIFY ON REPLY ============
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  thread_author UUID;
  thread_title TEXT;
  thread_slug TEXT;
  actor_name TEXT;
BEGIN
  SELECT author_id, title, slug INTO thread_author, thread_title, thread_slug
    FROM public.threads WHERE id = NEW.thread_id;

  SELECT COALESCE(display_name, username) INTO actor_name
    FROM public.profiles WHERE id = NEW.author_id;

  PERFORM public.create_notification(
    thread_author,
    NEW.author_id,
    'reply'::public.notification_type,
    COALESCE(actor_name, 'Someone') || ' replied to your thread',
    left(regexp_replace(NEW.body, '\[[^\]]+\]', '', 'g'), 140),
    '/t/' || thread_slug,
    NEW.thread_id,
    NEW.id,
    '{}'::jsonb
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_reply
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.notify_on_reply();

-- ============ AUTO-NOTIFY ON REACTION ============
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_author UUID;
  thread_slug TEXT;
  thread_id_ref UUID;
  actor_name TEXT;
  reaction_label TEXT;
BEGIN
  IF NEW.target_type = 'thread' THEN
    SELECT author_id, slug, id INTO target_author, thread_slug, thread_id_ref
      FROM public.threads WHERE id = NEW.target_id;
  ELSE
    SELECT p.author_id, t.slug, t.id INTO target_author, thread_slug, thread_id_ref
      FROM public.posts p JOIN public.threads t ON t.id = p.thread_id
      WHERE p.id = NEW.target_id;
  END IF;

  SELECT COALESCE(display_name, username) INTO actor_name
    FROM public.profiles WHERE id = NEW.user_id;

  reaction_label := CASE NEW.reaction
    WHEN 'like' THEN 'liked'
    WHEN 'love' THEN 'loved'
    WHEN 'haha' THEN 'reacted haha to'
    WHEN 'insightful' THEN 'marked insightful'
    WHEN 'thanks' THEN 'thanked you for'
    ELSE 'reacted to' END;

  PERFORM public.create_notification(
    target_author,
    NEW.user_id,
    'reaction'::public.notification_type,
    COALESCE(actor_name, 'Someone') || ' ' || reaction_label || ' your ' || NEW.target_type::text,
    NULL,
    CASE WHEN thread_slug IS NOT NULL THEN '/t/' || thread_slug ELSE NULL END,
    thread_id_ref,
    CASE WHEN NEW.target_type = 'post' THEN NEW.target_id ELSE NULL END,
    jsonb_build_object('reaction', NEW.reaction)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_on_reaction
AFTER INSERT ON public.reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_reaction();

-- ============ ENABLE REALTIME FOR NOTIFICATIONS ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
