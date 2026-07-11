
-- 1) Drop unused ip_address columns from public-readable content tables
ALTER TABLE public.posts DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.threads DROP COLUMN IF EXISTS ip_address;

-- 2) Staff-only sidecar for signup/last IP
CREATE TABLE IF NOT EXISTS public.profile_ips (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  signup_ip TEXT,
  last_ip TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_ips TO authenticated;
GRANT ALL ON public.profile_ips TO service_role;
ALTER TABLE public.profile_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read profile ips" ON public.profile_ips
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 3) Moderation sidecar (owner + staff read)
CREATE TABLE IF NOT EXISTS public.profile_moderation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ban_reason TEXT,
  warnings INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_moderation TO authenticated;
GRANT ALL ON public.profile_moderation TO service_role;
ALTER TABLE public.profile_moderation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or staff read moderation" ON public.profile_moderation
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

-- 4) Backfill from profiles
INSERT INTO public.profile_ips (user_id, signup_ip, last_ip)
  SELECT id, signup_ip, last_ip FROM public.profiles
  WHERE signup_ip IS NOT NULL OR last_ip IS NOT NULL
  ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.profile_moderation (user_id, ban_reason, warnings)
  SELECT id, ban_reason, COALESCE(warnings, 0) FROM public.profiles
  WHERE ban_reason IS NOT NULL OR COALESCE(warnings, 0) > 0
  ON CONFLICT (user_id) DO NOTHING;

-- 5) Update triggers/functions to write to the sidecars, then drop columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  n INT := 0;
  domain TEXT;
  ref_code TEXT;
  referrer_id UUID;
  ref_points INT;
BEGIN
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

  ref_code := upper(COALESCE(NEW.raw_user_meta_data->>'ref', ''));
  IF ref_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, referred_by, referral_code)
  VALUES (
    NEW.id, final_username,
    COALESCE(NEW.raw_user_meta_data->>'name', final_username),
    NEW.raw_user_meta_data->>'avatar_url',
    referrer_id,
    upper(substr(md5(NEW.id::text || random()::text), 1, 8))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF NEW.raw_user_meta_data->>'signup_ip' IS NOT NULL THEN
    INSERT INTO public.profile_ips (user_id, signup_ip, last_ip)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'signup_ip', NEW.raw_user_meta_data->>'signup_ip')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  IF referrer_id IS NOT NULL THEN
    SELECT points_referral INTO ref_points FROM public.site_settings WHERE id = true;
    UPDATE public.profiles SET points = points + COALESCE(ref_points, 25) WHERE id = referrer_id;
  END IF;

  RETURN NEW;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_thread_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cnt INT;
  max_per_day INT;
  warn_cap INT;
  pts INT;
  is_staff BOOLEAN;
  cur_warn INT;
BEGIN
  is_staff := public.has_role(NEW.author_id, 'admin') OR public.has_role(NEW.author_id, 'moderator');
  SELECT max_threads_per_day, warnings_before_ban, points_thread
    INTO max_per_day, warn_cap, pts
    FROM public.site_settings WHERE id = true;

  IF NOT is_staff THEN
    SELECT count(*) INTO cnt FROM public.threads
      WHERE author_id = NEW.author_id AND created_at > now() - interval '24 hours';
    IF cnt >= COALESCE(max_per_day, 5) THEN
      INSERT INTO public.profile_moderation (user_id, warnings)
      VALUES (NEW.author_id, 1)
      ON CONFLICT (user_id) DO UPDATE SET warnings = public.profile_moderation.warnings + 1, updated_at = now()
      RETURNING warnings INTO cur_warn;
      IF cur_warn >= COALESCE(warn_cap, 3) THEN
        UPDATE public.profiles SET is_banned = true WHERE id = NEW.author_id;
        UPDATE public.profile_moderation SET ban_reason = 'Auto-banned: exceeded daily thread limit repeatedly', updated_at = now() WHERE user_id = NEW.author_id;
      END IF;
      RAISE EXCEPTION 'Daily thread limit reached (%). Try again tomorrow.', max_per_day;
    END IF;
  END IF;

  UPDATE public.profiles SET points = points + COALESCE(pts, 10), trust_score = trust_score + 1
    WHERE id = NEW.author_id;
  RETURN NEW;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.enforce_thread_limits() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_post_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cnt INT;
  max_per_day INT;
  warn_cap INT;
  pts INT;
  is_staff BOOLEAN;
  cur_warn INT;
BEGIN
  is_staff := public.has_role(NEW.author_id, 'admin') OR public.has_role(NEW.author_id, 'moderator');
  SELECT max_comments_per_day, warnings_before_ban, points_comment
    INTO max_per_day, warn_cap, pts
    FROM public.site_settings WHERE id = true;

  IF NOT is_staff THEN
    SELECT count(*) INTO cnt FROM public.posts
      WHERE author_id = NEW.author_id AND created_at > now() - interval '24 hours';
    IF cnt >= COALESCE(max_per_day, 30) THEN
      INSERT INTO public.profile_moderation (user_id, warnings)
      VALUES (NEW.author_id, 1)
      ON CONFLICT (user_id) DO UPDATE SET warnings = public.profile_moderation.warnings + 1, updated_at = now()
      RETURNING warnings INTO cur_warn;
      IF cur_warn >= COALESCE(warn_cap, 3) THEN
        UPDATE public.profiles SET is_banned = true WHERE id = NEW.author_id;
        UPDATE public.profile_moderation SET ban_reason = 'Auto-banned: exceeded daily comment limit repeatedly', updated_at = now() WHERE user_id = NEW.author_id;
      END IF;
      RAISE EXCEPTION 'Daily comment limit reached (%). Try again tomorrow.', max_per_day;
    END IF;
  END IF;

  UPDATE public.profiles SET points = points + COALESCE(pts, 2)
    WHERE id = NEW.author_id;
  RETURN NEW;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.enforce_post_limits() FROM PUBLIC, anon, authenticated;

-- 6) Drop sensitive columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS signup_ip;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_ip;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ban_reason;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS warnings;
