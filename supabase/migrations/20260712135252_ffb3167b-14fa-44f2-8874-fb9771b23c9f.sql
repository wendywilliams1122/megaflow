
-- Phase 8: Notifications & Preferences
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_digest TEXT NOT NULL DEFAULT 'daily' CHECK (email_digest IN ('off','daily','weekly')),
  mute_replies BOOLEAN NOT NULL DEFAULT false,
  mute_mentions BOOLEAN NOT NULL DEFAULT false,
  mute_reactions BOOLEAN NOT NULL DEFAULT false,
  mute_follows BOOLEAN NOT NULL DEFAULT false,
  mute_system BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start SMALLINT,
  quiet_hours_end SMALLINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs"
ON public.notification_prefs FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all notification prefs"
ON public.notification_prefs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Digest queue table for tracking sent digests
CREATE TABLE IF NOT EXISTS public.notification_digest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL,
  notification_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_digest_log TO authenticated;
GRANT ALL ON public.notification_digest_log TO service_role;

ALTER TABLE public.notification_digest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view digest log"
ON public.notification_digest_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Helper: check if a notification type should be delivered to user
CREATE OR REPLACE FUNCTION public.should_notify(_user_id UUID, _type TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p RECORD; hr INT;
BEGIN
  SELECT * INTO p FROM public.notification_prefs WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN true; END IF;
  IF _type ILIKE '%reply%' AND p.mute_replies THEN RETURN false; END IF;
  IF _type ILIKE '%mention%' AND p.mute_mentions THEN RETURN false; END IF;
  IF _type ILIKE '%reaction%' AND p.mute_reactions THEN RETURN false; END IF;
  IF _type ILIKE '%follow%' AND p.mute_follows THEN RETURN false; END IF;
  IF _type ILIKE '%system%' AND p.mute_system THEN RETURN false; END IF;
  IF p.quiet_hours_start IS NOT NULL AND p.quiet_hours_end IS NOT NULL THEN
    hr := EXTRACT(HOUR FROM now())::INT;
    IF p.quiet_hours_start < p.quiet_hours_end THEN
      IF hr >= p.quiet_hours_start AND hr < p.quiet_hours_end THEN RETURN false; END IF;
    ELSE
      IF hr >= p.quiet_hours_start OR hr < p.quiet_hours_end THEN RETURN false; END IF;
    END IF;
  END IF;
  RETURN true;
END $$;

-- Admin digest run function: logs users with unread notifications
CREATE OR REPLACE FUNCTION public.run_notification_digests(_digest_type TEXT DEFAULT 'daily')
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt INT := 0; r RECORD;
BEGIN
  FOR r IN
    SELECT n.user_id, COUNT(*) AS c
    FROM public.notifications n
    LEFT JOIN public.notification_prefs p ON p.user_id = n.user_id
    WHERE n.is_read = false
      AND n.created_at > now() - CASE WHEN _digest_type = 'weekly' THEN INTERVAL '7 days' ELSE INTERVAL '1 day' END
      AND COALESCE(p.email_digest, 'daily') = _digest_type
    GROUP BY n.user_id
  LOOP
    INSERT INTO public.notification_digest_log(user_id, digest_type, notification_count)
    VALUES (r.user_id, _digest_type, r.c);
    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END $$;

-- Schedule daily digest 08:00 UTC and weekly Monday 08:15 UTC
DO $$ BEGIN
  PERFORM cron.unschedule('megaflow_daily_digest');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.unschedule('megaflow_weekly_digest');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule('megaflow_daily_digest', '0 8 * * *',
  $$ SELECT public.run_notification_digests('daily'); $$);
SELECT cron.schedule('megaflow_weekly_digest', '15 8 * * 1',
  $$ SELECT public.run_notification_digests('weekly'); $$);

-- Admin stats function
CREATE OR REPLACE FUNCTION public.admin_notification_stats()
RETURNS TABLE(total_notifications BIGINT, unread_notifications BIGINT, digests_sent_7d BIGINT, users_with_prefs BIGINT, users_muting_all BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*) FROM public.notifications),
    (SELECT COUNT(*) FROM public.notifications WHERE is_read = false),
    (SELECT COUNT(*) FROM public.notification_digest_log WHERE sent_at > now() - INTERVAL '7 days'),
    (SELECT COUNT(*) FROM public.notification_prefs),
    (SELECT COUNT(*) FROM public.notification_prefs WHERE mute_replies AND mute_mentions AND mute_reactions AND mute_follows AND mute_system)
$$;
