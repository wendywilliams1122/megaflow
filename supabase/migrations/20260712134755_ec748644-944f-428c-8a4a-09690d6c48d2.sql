
-- Streaks
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_on DATE;

CREATE OR REPLACE FUNCTION public.bump_streak()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid; today DATE := (now() at time zone 'UTC')::date; last DATE; cur INT;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN RETURN; END IF;
  SELECT last_active_on, current_streak INTO last, cur FROM public.profiles WHERE id = uid;
  IF last = today THEN RETURN; END IF;
  IF last = today - 1 THEN cur := COALESCE(cur,0) + 1;
  ELSE cur := 1; END IF;
  UPDATE public.profiles
    SET current_streak = cur,
        longest_streak = GREATEST(COALESCE(longest_streak,0), cur),
        last_active_on = today
    WHERE id = uid;
END $$;

-- Weekly snapshots
CREATE TABLE public.weekly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_earned INT NOT NULL DEFAULT 0,
  threads_created INT NOT NULL DEFAULT 0,
  posts_created INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (week_start, user_id)
);
CREATE INDEX ON public.weekly_snapshots (week_start);
GRANT SELECT ON public.weekly_snapshots TO anon, authenticated;
GRANT ALL ON public.weekly_snapshots TO service_role;
ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads weekly snapshots" ON public.weekly_snapshots FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.close_weekly_leaderboard()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ws DATE := date_trunc('week', now() - interval '1 week')::date; n INT;
BEGIN
  INSERT INTO public.weekly_snapshots (week_start, user_id, points_earned, threads_created, posts_created)
  SELECT ws, p.id,
    GREATEST(0, p.points),
    (SELECT count(*) FROM public.threads t WHERE t.author_id = p.id AND t.created_at >= ws AND t.created_at < ws + 7),
    (SELECT count(*) FROM public.posts po WHERE po.author_id = p.id AND po.created_at >= ws AND po.created_at < ws + 7)
  FROM public.profiles p
  WHERE EXISTS (SELECT 1 FROM public.threads t WHERE t.author_id = p.id AND t.created_at >= ws AND t.created_at < ws + 7)
     OR EXISTS (SELECT 1 FROM public.posts  po WHERE po.author_id = p.id AND po.created_at >= ws AND po.created_at < ws + 7)
  ON CONFLICT (week_start, user_id) DO UPDATE
    SET points_earned = EXCLUDED.points_earned,
        threads_created = EXCLUDED.threads_created,
        posts_created = EXCLUDED.posts_created;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Cron: run weekly on Monday 00:05
DO $$ BEGIN PERFORM cron.unschedule('megaflow_close_weekly'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('megaflow_close_weekly', '5 0 * * 1', $$ SELECT public.close_weekly_leaderboard(); $$);

-- Quests
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL CHECK (metric IN ('threads','posts','upvotes_received','points')),
  target INT NOT NULL CHECK (target > 0),
  reward_points INT NOT NULL DEFAULT 0,
  reward_badge_id TEXT REFERENCES public.badges(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quests TO authenticated;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads active quests" ON public.quests FOR SELECT USING (is_active = true);
CREATE POLICY "staff manage quests" ON public.quests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE TRIGGER quests_updated_at BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE (quest_id, user_id)
);
GRANT SELECT ON public.quest_progress TO authenticated;
GRANT INSERT, UPDATE ON public.quest_progress TO authenticated;
GRANT ALL ON public.quest_progress TO service_role;
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own quest progress" ON public.quest_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "staff can insert quest progress" ON public.quest_progress FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "staff update progress" ON public.quest_progress FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
