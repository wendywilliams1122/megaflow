
CREATE OR REPLACE FUNCTION public.validate_download_shortcodes(_body text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
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
    IF length(u) < 8 OR length(u) > 2048 THEN
      RETURN false;
    END IF;
    IF u !~* '^https?://[^\s<>"'']+$' THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$function$;
