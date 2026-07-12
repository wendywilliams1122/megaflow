
DROP POLICY IF EXISTS "Anyone can log searches" ON public.search_log;

CREATE POLICY "Log own searches"
ON public.search_log FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND length(query) BETWEEN 1 AND 200
  AND result_count >= 0
);
