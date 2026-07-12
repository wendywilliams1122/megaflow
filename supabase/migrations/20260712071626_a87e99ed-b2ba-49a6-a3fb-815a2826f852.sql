
REVOKE ALL ON FUNCTION public.check_and_award_badges(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_award_badges(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.level_for_points(_pts int)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT GREATEST(1, floor(sqrt(GREATEST(_pts,0)::numeric / 10))::int + 1)
$$;
