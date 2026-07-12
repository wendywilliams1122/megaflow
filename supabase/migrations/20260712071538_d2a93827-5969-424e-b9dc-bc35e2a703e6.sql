
-- Badges system
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges readable by all" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges readable by all" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Admins manage user_badges" ON public.user_badges FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);

-- Seed
INSERT INTO public.badges (id, name, description, icon, tier, criteria) VALUES
  ('welcome', 'Welcome', 'Joined the community', 'sparkles', 'bronze', '{"type":"signup"}'),
  ('first-thread', 'First Thread', 'Posted your first thread', 'message-square', 'bronze', '{"type":"threads","count":1}'),
  ('first-reply', 'First Reply', 'Posted your first reply', 'reply', 'bronze', '{"type":"posts","count":1}'),
  ('conversationalist', 'Conversationalist', '10 replies posted', 'messages-square', 'silver', '{"type":"posts","count":10}'),
  ('prolific', 'Prolific Poster', '50 replies posted', 'messages-square', 'gold', '{"type":"posts","count":50}'),
  ('thread-starter', 'Thread Starter', '5 threads created', 'plus-square', 'silver', '{"type":"threads","count":5}'),
  ('community-pillar', 'Community Pillar', '25 threads created', 'pillar', 'gold', '{"type":"threads","count":25}'),
  ('centurion', 'Centurion', 'Earned 100 points', 'star', 'silver', '{"type":"points","count":100}'),
  ('elite', 'Elite Member', 'Earned 500 points', 'crown', 'gold', '{"type":"points","count":500}'),
  ('legend', 'Legend', 'Earned 1000 points', 'trophy', 'platinum', '{"type":"points","count":1000}'),
  ('popular', 'Popular', 'Received 10 upvotes', 'thumbs-up', 'silver', '{"type":"upvotes","count":10}'),
  ('acclaimed', 'Acclaimed', 'Received 50 upvotes', 'flame', 'gold', '{"type":"upvotes","count":50}');

-- Level helper (public, safe)
CREATE OR REPLACE FUNCTION public.level_for_points(_pts int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(1, floor(sqrt(GREATEST(_pts,0)::numeric / 10))::int + 1)
$$;

-- Award engine
CREATE OR REPLACE FUNCTION public.check_and_award_badges(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  thr int; pst int; pts int; upv int;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  SELECT count(*) INTO thr FROM public.threads WHERE author_id = _user_id;
  SELECT count(*) INTO pst FROM public.posts WHERE author_id = _user_id;
  SELECT COALESCE(points,0) INTO pts FROM public.profiles WHERE id = _user_id;
  SELECT COALESCE(sum(v.value),0) INTO upv FROM public.votes v
    WHERE v.value = 1 AND (
      (v.target_type='thread' AND v.target_id IN (SELECT id FROM public.threads WHERE author_id=_user_id))
      OR (v.target_type='post' AND v.target_id IN (SELECT id FROM public.posts WHERE author_id=_user_id))
    );

  INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'welcome') ON CONFLICT DO NOTHING;
  IF thr >= 1 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'first-thread') ON CONFLICT DO NOTHING; END IF;
  IF thr >= 5 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'thread-starter') ON CONFLICT DO NOTHING; END IF;
  IF thr >= 25 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'community-pillar') ON CONFLICT DO NOTHING; END IF;
  IF pst >= 1 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'first-reply') ON CONFLICT DO NOTHING; END IF;
  IF pst >= 10 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'conversationalist') ON CONFLICT DO NOTHING; END IF;
  IF pst >= 50 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'prolific') ON CONFLICT DO NOTHING; END IF;
  IF pts >= 100 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'centurion') ON CONFLICT DO NOTHING; END IF;
  IF pts >= 500 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'elite') ON CONFLICT DO NOTHING; END IF;
  IF pts >= 1000 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'legend') ON CONFLICT DO NOTHING; END IF;
  IF upv >= 10 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'popular') ON CONFLICT DO NOTHING; END IF;
  IF upv >= 50 THEN INSERT INTO public.user_badges(user_id, badge_id) VALUES (_user_id,'acclaimed') ON CONFLICT DO NOTHING; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.check_and_award_badges(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_award_badges(uuid) TO authenticated, service_role;

-- Trigger wrappers
CREATE OR REPLACE FUNCTION public.award_badges_after_thread()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.check_and_award_badges(NEW.author_id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.award_badges_after_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM public.check_and_award_badges(NEW.author_id); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.award_badges_after_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target_author uuid;
BEGIN
  IF NEW.target_type='thread' THEN
    SELECT author_id INTO target_author FROM public.threads WHERE id=NEW.target_id;
  ELSE
    SELECT author_id INTO target_author FROM public.posts WHERE id=NEW.target_id;
  END IF;
  IF target_author IS NOT NULL THEN PERFORM public.check_and_award_badges(target_author); END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_award_badges_thread AFTER INSERT ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.award_badges_after_thread();
CREATE TRIGGER trg_award_badges_post AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.award_badges_after_post();
CREATE TRIGGER trg_award_badges_vote AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.award_badges_after_vote();

-- Backfill existing users
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.check_and_award_badges(r.id);
  END LOOP;
END $$;
