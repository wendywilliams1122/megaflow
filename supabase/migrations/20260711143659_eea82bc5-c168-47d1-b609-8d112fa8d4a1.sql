
-- Restrict SELECT on the raw body column so gated content (download links, spoilers)
-- can't be read directly via the Data API. Owners/staff/eligible members still get
-- the full body through public.get_full_body() which enforces eligibility.

REVOKE SELECT (body) ON public.threads FROM anon, authenticated;
REVOKE SELECT (body) ON public.posts   FROM anon, authenticated;

-- Explicitly grant SELECT on every safe column (needed because column-level grants
-- override table-level grants once any column-level grant exists).
GRANT SELECT (
  id, category_id, author_id, title, slug, body_public,
  is_pinned, is_locked, view_count, reply_count, vote_score,
  last_activity_at, created_at, updated_at
) ON public.threads TO anon, authenticated;

GRANT SELECT (
  id, thread_id, author_id, body_public, vote_score, created_at, updated_at
) ON public.posts TO anon, authenticated;

-- Keep writes working for authors/staff (already gated by RLS policies).
GRANT INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts   TO authenticated;
GRANT ALL ON public.threads TO service_role;
GRANT ALL ON public.posts   TO service_role;
