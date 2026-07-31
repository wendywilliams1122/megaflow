CREATE OR REPLACE FUNCTION public.on_post_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := COALESCE(NEW.thread_id, OLD.thread_id);
BEGIN
  UPDATE public.threads t
  SET reply_count = (
        SELECT count(*) FROM public.posts p
        WHERE p.thread_id = tid AND p.is_deleted = false
      ),
      last_activity_at = CASE WHEN TG_OP = 'INSERT' THEN now() ELSE t.last_activity_at END
  WHERE t.id = tid;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_count ON public.posts;
CREATE TRIGGER trg_posts_count
AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.on_post_change();

UPDATE public.threads t
SET reply_count = sub.c
FROM (
  SELECT th.id, (SELECT count(*) FROM public.posts p WHERE p.thread_id = th.id AND p.is_deleted = false) AS c
  FROM public.threads th
) sub
WHERE t.id = sub.id AND t.reply_count <> sub.c;