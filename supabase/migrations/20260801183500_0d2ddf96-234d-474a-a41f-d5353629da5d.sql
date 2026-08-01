-- 1) Privileged admin/staff routines: not callable by signed-out visitors
REVOKE EXECUTE ON FUNCTION public.admin_award_badge(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_broadcast(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_export_user_data(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_force_signout(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_cron_jobs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_log_impersonate(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_log_mod_action(text, text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_merge_tags(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_notification_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_purge_thread(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_restore_thread(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_badge(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_search_analytics(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_shadow_ban(uuid, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_soft_delete_thread(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_temp_ban(uuid, timestamptz, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_unban(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.run_due_broadcasts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_similar_threads(integer) FROM anon;

-- 2) Unauthenticated maintenance jobs: backend/scheduler only
REVOKE EXECUTE ON FUNCTION public.auto_lock_stale_threads() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_temp_bans() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_weekly_leaderboard() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.run_notification_digests(text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_lock_stale_threads() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_temp_bans() TO service_role;
GRANT EXECUTE ON FUNCTION public.close_weekly_leaderboard() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_notification_digests(text) TO service_role;

-- 3) Internal-only helpers (used by triggers, which run as the definer)
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, uuid, public.notification_type, text, text, text, uuid, uuid, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_award_badges(uuid) FROM anon, authenticated, PUBLIC;

-- 4) Session/streak helpers require a signed-in user anyway
REVOKE EXECUTE ON FUNCTION public.log_session_device(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bump_streak() FROM anon;