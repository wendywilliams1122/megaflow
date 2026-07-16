CREATE OR REPLACE FUNCTION public.validate_download_shortcodes(_body text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  m text[];
  u text;
BEGIN
  IF _body IS NULL OR _body !~* '\[download\s+' THEN
    RETURN true;
  END IF;

  FOR m IN
    SELECT regexp_matches(_body, '\[download\s+url=["'']([^"'']+)["''](?:\s+label=["''][^"'']*["''])?\s*\]', 'gi')
  LOOP
    u := btrim(m[1]);
    IF u !~* '^https?://[^\s<>"'']{3,2048}$' THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_download_shortcodes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.validate_download_shortcodes(NEW.body) THEN
    RAISE EXCEPTION 'Download links must be valid http or https URLs.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_thread_download_shortcodes ON public.threads;
CREATE TRIGGER trg_guard_thread_download_shortcodes
BEFORE INSERT OR UPDATE OF body ON public.threads
FOR EACH ROW
EXECUTE FUNCTION public.guard_download_shortcodes();

DROP TRIGGER IF EXISTS trg_guard_post_download_shortcodes ON public.posts;
CREATE TRIGGER trg_guard_post_download_shortcodes
BEFORE INSERT OR UPDATE OF body ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.guard_download_shortcodes();