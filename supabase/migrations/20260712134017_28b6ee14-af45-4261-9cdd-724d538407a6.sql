
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add settings toggle for auto-lock
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS auto_lock_stale_days INT NOT NULL DEFAULT 90;

-- Spam score helper (pure)
CREATE OR REPLACE FUNCTION public.spam_score(_body text)
RETURNS INT LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  s INT := 0; len INT; caps INT; links INT; repeats INT;
BEGIN
  IF _body IS NULL THEN RETURN 0; END IF;
  len := greatest(length(_body), 1);
  caps := length(regexp_replace(_body, '[^A-Z]', '', 'g'));
  links := (length(_body) - length(regexp_replace(_body, 'https?://', '', 'gi'))) / 8;
  repeats := (length(_body) - length(regexp_replace(_body, '(.)\1{4,}', '', 'g')));
  IF caps::float / len > 0.5 AND len > 20 THEN s := s + 30; END IF;
  IF links > 3 THEN s := s + 20 + (links - 3) * 10; END IF;
  IF repeats > 0 THEN s := s + 15; END IF;
  IF len < 8 THEN s := s + 10; END IF;
  RETURN least(s, 100);
END $$;

-- Auto-lock stale threads job
CREATE OR REPLACE FUNCTION public.auto_lock_stale_threads()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE days INT; n INT;
BEGIN
  SELECT auto_lock_stale_days INTO days FROM public.site_settings WHERE id = true;
  days := COALESCE(days, 90);
  IF days <= 0 THEN RETURN 0; END IF;
  UPDATE public.threads
     SET is_locked = true
   WHERE is_locked = false
     AND is_deleted = false
     AND last_activity_at < now() - (days || ' days')::interval;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Helper to list our jobs
CREATE OR REPLACE FUNCTION public.admin_list_cron_jobs()
RETURNS TABLE(jobname text, schedule text, active boolean, last_run timestamptz, last_status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY
  SELECT j.jobname::text, j.schedule::text, j.active,
         (SELECT max(r.start_time) FROM cron.job_run_details r WHERE r.jobid = j.jobid),
         (SELECT r.status::text FROM cron.job_run_details r WHERE r.jobid = j.jobid ORDER BY r.start_time DESC LIMIT 1)
    FROM cron.job j
   WHERE j.jobname LIKE 'megaflow_%'
   ORDER BY j.jobname;
END $$;

-- Schedule jobs (idempotent: unschedule if exists, then schedule)
DO $$ BEGIN
  PERFORM cron.unschedule('megaflow_auto_lock_stale');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.unschedule('megaflow_expire_temp_bans');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  PERFORM cron.unschedule('megaflow_flush_broadcasts');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule('megaflow_auto_lock_stale', '0 3 * * *',
  $$ SELECT public.auto_lock_stale_threads(); $$);

SELECT cron.schedule('megaflow_expire_temp_bans', '*/5 * * * *',
  $$ SELECT public.expire_temp_bans(); $$);

SELECT cron.schedule('megaflow_flush_broadcasts', '* * * * *',
  $$ INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, metadata)
     SELECT p.id, r.created_by, 'reply'::public.notification_type, r.title, r.body, r.link,
            jsonb_build_object('kind','broadcast','scheduled_id',r.id)
       FROM public.scheduled_broadcasts r
       CROSS JOIN public.profiles p
      WHERE r.status='pending' AND r.scheduled_for <= now()
        AND COALESCE(p.is_banned,false)=false;
     UPDATE public.scheduled_broadcasts
        SET status='sent', sent_at=now(),
            recipients=(SELECT count(*) FROM public.profiles WHERE COALESCE(is_banned,false)=false)
      WHERE status='pending' AND scheduled_for <= now();
  $$);
