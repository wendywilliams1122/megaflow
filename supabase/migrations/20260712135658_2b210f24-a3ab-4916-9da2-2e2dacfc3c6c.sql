
-- Full-text search on threads
ALTER TABLE public.threads
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(left(body, 8000),'')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS threads_search_tsv_idx ON public.threads USING GIN (search_tsv);

-- Search log
CREATE TABLE IF NOT EXISTS public.search_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.search_log TO authenticated;
GRANT INSERT ON public.search_log TO anon;
GRANT ALL ON public.search_log TO service_role;
ALTER TABLE public.search_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log searches" ON public.search_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read search log" ON public.search_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS search_log_created_idx ON public.search_log (created_at DESC);
CREATE INDEX IF NOT EXISTS search_log_query_idx ON public.search_log (lower(query));

-- Saved searches
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  notify_on_new BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved searches" ON public.saved_searches FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trending threads (time-decayed score)
CREATE OR REPLACE FUNCTION public.trending_threads(_days INT DEFAULT 7, _limit INT DEFAULT 20)
RETURNS TABLE(id UUID, title TEXT, slug TEXT, vote_score INT, reply_count INT, created_at TIMESTAMPTZ, score REAL)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.title, t.slug, t.vote_score, t.reply_count, t.created_at,
    (
      (t.vote_score * 2 + t.reply_count * 3)::real
      / GREATEST(1, EXTRACT(EPOCH FROM (now() - t.created_at))/3600 + 2) ^ 1.5
    )::real AS score
  FROM public.threads t
  WHERE t.is_deleted = false
    AND t.created_at > now() - (_days || ' days')::interval
  ORDER BY score DESC
  LIMIT _limit;
$$;

-- Related threads (tag + category overlap)
CREATE OR REPLACE FUNCTION public.related_threads(_thread_id UUID, _limit INT DEFAULT 5)
RETURNS TABLE(id UUID, title TEXT, slug TEXT, overlap INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH src AS (SELECT category_id FROM public.threads WHERE id = _thread_id),
       src_tags AS (SELECT tag_id FROM public.thread_tags WHERE thread_id = _thread_id)
  SELECT t.id, t.title, t.slug,
    (
      (CASE WHEN t.category_id = (SELECT category_id FROM src) THEN 2 ELSE 0 END)
      + (SELECT COUNT(*)::int FROM public.thread_tags tt WHERE tt.thread_id = t.id AND tt.tag_id IN (SELECT tag_id FROM src_tags))
    ) AS overlap
  FROM public.threads t
  WHERE t.id <> _thread_id AND t.is_deleted = false
  ORDER BY overlap DESC, t.vote_score DESC
  LIMIT _limit;
$$;

-- Admin search analytics
CREATE OR REPLACE FUNCTION public.admin_search_analytics(_days INT DEFAULT 30)
RETURNS TABLE(total_searches BIGINT, unique_users BIGINT, zero_result_searches BIGINT, top_queries JSONB, zero_result_queries JSONB)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.search_log WHERE created_at > now() - (_days || ' days')::interval),
    (SELECT COUNT(DISTINCT user_id) FROM public.search_log WHERE created_at > now() - (_days || ' days')::interval AND user_id IS NOT NULL),
    (SELECT COUNT(*) FROM public.search_log WHERE created_at > now() - (_days || ' days')::interval AND result_count = 0),
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('query', q, 'count', c) ORDER BY c DESC), '[]'::jsonb)
       FROM (SELECT lower(query) AS q, COUNT(*) AS c FROM public.search_log
             WHERE created_at > now() - (_days || ' days')::interval
             GROUP BY lower(query) ORDER BY c DESC LIMIT 20) x),
    (SELECT COALESCE(jsonb_agg(jsonb_build_object('query', q, 'count', c) ORDER BY c DESC), '[]'::jsonb)
       FROM (SELECT lower(query) AS q, COUNT(*) AS c FROM public.search_log
             WHERE created_at > now() - (_days || ' days')::interval AND result_count = 0
             GROUP BY lower(query) ORDER BY c DESC LIMIT 20) y);
END $$;
