
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.find_similar_threads(_days INT DEFAULT 14)
RETURNS TABLE(a_id uuid, a_title text, a_slug text, b_id uuid, b_title text, b_slug text, sim real)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT a.id, a.title, a.slug, b.id, b.title, b.slug,
         similarity(lower(a.title), lower(b.title))
    FROM public.threads a
    JOIN public.threads b
      ON a.id < b.id
     AND a.is_deleted = false AND b.is_deleted = false
     AND similarity(lower(a.title), lower(b.title)) > 0.55
   WHERE a.created_at > now() - (_days || ' days')::interval
     AND b.created_at > now() - (_days || ' days')::interval
   ORDER BY 7 DESC
   LIMIT 50;
$$;
