REVOKE SELECT ON public.threads FROM anon;
REVOKE SELECT ON public.posts FROM anon;

GRANT SELECT (
  id,
  slug,
  title,
  body_public,
  vote_score,
  reply_count,
  reaction_counts,
  is_pinned,
  is_locked,
  category_id,
  original_category_id,
  created_at,
  updated_at,
  last_activity_at,
  author_id,
  view_count
) ON public.threads TO anon;

GRANT SELECT (
  id,
  thread_id,
  author_id,
  body_public,
  vote_score,
  reaction_counts,
  created_at,
  updated_at
) ON public.posts TO anon;