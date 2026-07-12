
REVOKE SELECT (body) ON public.threads FROM anon, authenticated;
REVOKE SELECT (body) ON public.posts   FROM anon, authenticated;

GRANT SELECT (id, category_id, author_id, title, slug, is_pinned, is_locked, view_count, reply_count, vote_score, last_activity_at, created_at, updated_at, body_public, reaction_counts)
  ON public.threads TO anon, authenticated;
GRANT SELECT (id, thread_id, author_id, body_public, vote_score, reaction_counts, created_at, updated_at)
  ON public.posts TO anon, authenticated;
