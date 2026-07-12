-- Threads: drop table-wide SELECT, re-grant on all columns except `body`
REVOKE SELECT ON public.threads FROM anon, authenticated;
GRANT SELECT (id, category_id, author_id, title, slug, is_pinned, is_locked, view_count, reply_count, vote_score, last_activity_at, created_at, updated_at, body_public) ON public.threads TO anon, authenticated;

-- Posts: same treatment
REVOKE SELECT ON public.posts FROM anon, authenticated;
GRANT SELECT (id, thread_id, author_id, vote_score, created_at, updated_at, body_public) ON public.posts TO anon, authenticated;