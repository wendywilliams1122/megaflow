
-- ============ site_settings: config knobs ============
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS points_thread INT NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS points_comment INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS points_upvote INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS points_referral INT NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS max_threads_per_day INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_comments_per_day INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS warnings_before_ban INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS downloads_min_points INT NOT NULL DEFAULT 0;

-- ============ profiles: points/trust/ip/referral/ban ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warnings INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signup_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_ip TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- backfill referral_code for existing profiles
UPDATE public.profiles
  SET referral_code = upper(substr(md5(id::text || random()::text), 1, 8))
  WHERE referral_code IS NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_signup_ip_idx ON public.profiles(signup_ip);
CREATE INDEX IF NOT EXISTS profiles_last_ip_idx ON public.profiles(last_ip);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles(referred_by);

-- ============ threads/posts: ip_address ============
ALTER TABLE public.threads ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.posts   ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- ============ blocked_email_domains ============
CREATE TABLE IF NOT EXISTS public.blocked_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blocked_email_domains TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blocked_email_domains TO authenticated;
GRANT ALL ON public.blocked_email_domains TO service_role;
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_domains public read" ON public.blocked_email_domains;
CREATE POLICY "blocked_domains public read" ON public.blocked_email_domains
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "blocked_domains staff manage" ON public.blocked_email_domains;
CREATE POLICY "blocked_domains staff manage" ON public.blocked_email_domains
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

INSERT INTO public.blocked_email_domains (domain) VALUES
  ('mailinator.com'), ('tempmail.com'), ('temp-mail.org'), ('temp-mail.io'),
  ('guerrillamail.com'), ('guerrillamail.info'), ('guerrillamail.net'),
  ('yopmail.com'), ('10minutemail.com'), ('trashmail.com'), ('trashmail.net'),
  ('sharklasers.com'), ('getnada.com'), ('fakeinbox.com'), ('dispostable.com'),
  ('mintemail.com'), ('mailnesia.com'), ('throwawaymail.com'), ('maildrop.cc'),
  ('mohmal.com'), ('spamgourmet.com'), ('inboxbear.com'), ('tempinbox.com'),
  ('emailondeck.com'), ('mailcatch.com'), ('mytemp.email'), ('tempail.com')
ON CONFLICT (domain) DO NOTHING;

-- ============ handle_new_user: referral + block temp mail ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  n INT := 0;
  domain TEXT;
  ref_code TEXT;
  referrer_id UUID;
  ref_points INT;
BEGIN
  -- block disposable email domains
  domain := lower(split_part(NEW.email, '@', 2));
  IF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE lower(domain) = domain) THEN
    RAISE EXCEPTION 'Signup blocked: disposable email addresses are not allowed';
  END IF;

  base_username := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'username',
             split_part(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), '@', 1),
             'user'),
    '[^a-z0-9_]', '', 'g'
  ));
  IF base_username = '' THEN base_username := 'user'; END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    n := n + 1;
    final_username := base_username || n::text;
  END LOOP;

  -- referral
  ref_code := upper(COALESCE(NEW.raw_user_meta_data->>'ref', ''));
  IF ref_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, signup_ip, last_ip, referred_by, referral_code)
  VALUES (
    NEW.id, final_username,
    COALESCE(NEW.raw_user_meta_data->>'name', final_username),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'signup_ip',
    NEW.raw_user_meta_data->>'signup_ip',
    referrer_id,
    upper(substr(md5(NEW.id::text || random()::text), 1, 8))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- award referral points
  IF referrer_id IS NOT NULL THEN
    SELECT points_referral INTO ref_points FROM public.site_settings WHERE id = true;
    UPDATE public.profiles SET points = points + COALESCE(ref_points, 25) WHERE id = referrer_id;
  END IF;

  RETURN NEW;
END; $$;

-- ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ rate-limit + points on threads ============
CREATE OR REPLACE FUNCTION public.enforce_thread_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt INT;
  max_per_day INT;
  warn_cap INT;
  pts INT;
  is_staff BOOLEAN;
BEGIN
  is_staff := public.has_role(NEW.author_id, 'admin') OR public.has_role(NEW.author_id, 'moderator');
  SELECT max_threads_per_day, warnings_before_ban, points_thread
    INTO max_per_day, warn_cap, pts
    FROM public.site_settings WHERE id = true;

  IF NOT is_staff THEN
    SELECT count(*) INTO cnt FROM public.threads
      WHERE author_id = NEW.author_id AND created_at > now() - interval '24 hours';
    IF cnt >= COALESCE(max_per_day, 5) THEN
      UPDATE public.profiles SET warnings = warnings + 1 WHERE id = NEW.author_id;
      IF (SELECT warnings FROM public.profiles WHERE id = NEW.author_id) >= COALESCE(warn_cap, 3) THEN
        UPDATE public.profiles SET is_banned = true, ban_reason = 'Auto-banned: exceeded daily thread limit repeatedly' WHERE id = NEW.author_id;
      END IF;
      RAISE EXCEPTION 'Daily thread limit reached (%). Try again tomorrow.', max_per_day;
    END IF;
  END IF;

  UPDATE public.profiles SET points = points + COALESCE(pts, 10), trust_score = trust_score + 1
    WHERE id = NEW.author_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS threads_limit_and_points ON public.threads;
CREATE TRIGGER threads_limit_and_points
  BEFORE INSERT ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_thread_limits();

-- ============ rate-limit + points on posts (comments) ============
CREATE OR REPLACE FUNCTION public.enforce_post_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt INT;
  max_per_day INT;
  warn_cap INT;
  pts INT;
  is_staff BOOLEAN;
BEGIN
  is_staff := public.has_role(NEW.author_id, 'admin') OR public.has_role(NEW.author_id, 'moderator');
  SELECT max_comments_per_day, warnings_before_ban, points_comment
    INTO max_per_day, warn_cap, pts
    FROM public.site_settings WHERE id = true;

  IF NOT is_staff THEN
    SELECT count(*) INTO cnt FROM public.posts
      WHERE author_id = NEW.author_id AND created_at > now() - interval '24 hours';
    IF cnt >= COALESCE(max_per_day, 30) THEN
      UPDATE public.profiles SET warnings = warnings + 1 WHERE id = NEW.author_id;
      IF (SELECT warnings FROM public.profiles WHERE id = NEW.author_id) >= COALESCE(warn_cap, 3) THEN
        UPDATE public.profiles SET is_banned = true, ban_reason = 'Auto-banned: exceeded daily comment limit repeatedly' WHERE id = NEW.author_id;
      END IF;
      RAISE EXCEPTION 'Daily comment limit reached (%). Try again tomorrow.', max_per_day;
    END IF;
  END IF;

  UPDATE public.profiles SET points = points + COALESCE(pts, 2)
    WHERE id = NEW.author_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS posts_limit_and_points ON public.posts;
CREATE TRIGGER posts_limit_and_points
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_post_limits();

-- ============ points on upvotes ============
CREATE OR REPLACE FUNCTION public.on_vote_award_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  author UUID;
  pts INT;
BEGIN
  IF TG_OP <> 'INSERT' OR NEW.value <> 1 THEN RETURN NEW; END IF;
  SELECT points_upvote INTO pts FROM public.site_settings WHERE id = true;
  IF NEW.target_type = 'thread' THEN
    SELECT author_id INTO author FROM public.threads WHERE id = NEW.target_id;
  ELSE
    SELECT author_id INTO author FROM public.posts WHERE id = NEW.target_id;
  END IF;
  IF author IS NOT NULL THEN
    UPDATE public.profiles SET points = points + COALESCE(pts, 1) WHERE id = author;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS votes_award_points ON public.votes;
CREATE TRIGGER votes_award_points
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.on_vote_award_points();

-- ============ can_view_downloads: staff bypass + points threshold ============
CREATE OR REPLACE FUNCTION public.can_view_downloads(_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  min_points INT;
  user_points INT;
  is_old_with_thread BOOLEAN;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF public.has_role(_user_id, 'admin') OR public.has_role(_user_id, 'moderator') THEN
    RETURN true;
  END IF;

  SELECT downloads_min_points INTO min_points FROM public.site_settings WHERE id = true;
  SELECT points INTO user_points FROM public.profiles WHERE id = _user_id;
  IF COALESCE(min_points, 0) > 0 AND COALESCE(user_points, 0) < min_points THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.created_at <= now() - interval '10 days'
      AND EXISTS (SELECT 1 FROM public.threads t WHERE t.author_id = _user_id)
  ) INTO is_old_with_thread;

  RETURN is_old_with_thread;
END; $$;

-- keep old function name working
CREATE OR REPLACE FUNCTION public.can_view_spoiler(_user_id UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.can_view_downloads(_user_id) $$;
