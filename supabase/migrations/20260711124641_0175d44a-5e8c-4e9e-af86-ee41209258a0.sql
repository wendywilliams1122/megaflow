
-- 1) Sanitized body columns on threads/posts
ALTER TABLE public.threads
  ADD COLUMN IF NOT EXISTS body_public text GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(COALESCE(body,''), '\[download[^\]]*\]', '', 'gi'),
      '\[spoiler\][\s\S]*?\[/spoiler\]', '[Members-only content]', 'gi'
    )
  ) STORED;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS body_public text GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(COALESCE(body,''), '\[download[^\]]*\]', '', 'gi'),
      '\[spoiler\][\s\S]*?\[/spoiler\]', '[Members-only content]', 'gi'
    )
  ) STORED;

-- Revoke raw body from public roles
REVOKE SELECT (body) ON public.threads FROM anon, authenticated;
REVOKE SELECT (body) ON public.posts FROM anon, authenticated;

-- Ensure other columns and body_public remain selectable
GRANT SELECT (id, slug, title, body_public, vote_score, reply_count, is_pinned, is_locked, created_at, updated_at, author_id, category_id, last_activity_at, view_count)
  ON public.threads TO anon, authenticated;
GRANT SELECT (id, thread_id, author_id, body_public, vote_score, created_at, updated_at)
  ON public.posts TO anon, authenticated;

-- Secure RPC to fetch the full body for eligible users
CREATE OR REPLACE FUNCTION public.get_full_body(_target_type text, _target_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b text;
  author uuid;
  eligible boolean;
BEGIN
  IF _target_type = 'thread' THEN
    SELECT body, author_id INTO b, author FROM public.threads WHERE id = _target_id;
  ELSIF _target_type = 'post' THEN
    SELECT body, author_id INTO b, author FROM public.posts WHERE id = _target_id;
  ELSE
    RETURN NULL;
  END IF;
  IF b IS NULL THEN RETURN NULL; END IF;

  eligible := auth.uid() IS NOT NULL AND (
    auth.uid() = author
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'moderator')
    OR public.can_view_downloads(auth.uid())
  );

  IF eligible THEN
    RETURN b;
  ELSE
    RETURN regexp_replace(
      regexp_replace(b, '\[download[^\]]*\]', '', 'gi'),
      '\[spoiler\][\s\S]*?\[/spoiler\]', '[Members-only content]', 'gi'
    );
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.get_full_body(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_full_body(text, uuid) TO authenticated;

-- 2) Blocked email domains: restrict SELECT to staff
DROP POLICY IF EXISTS "blocked_domains public read" ON public.blocked_email_domains;
CREATE POLICY "blocked_domains staff read"
  ON public.blocked_email_domains FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
REVOKE SELECT ON public.blocked_email_domains FROM anon;

-- 3) Votes: restrict SELECT to owner or staff
DROP POLICY IF EXISTS "votes public read" ON public.votes;
CREATE POLICY "votes read own or staff"
  ON public.votes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'moderator')
  );
REVOKE SELECT ON public.votes FROM anon;

-- 4) Orders price/product validation trigger
CREATE OR REPLACE FUNCTION public.orders_enforce_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
BEGIN
  IF NEW.product_id IS NULL THEN
    RAISE EXCEPTION 'Order must reference a product';
  END IF;
  SELECT id, title, slug, price_cents, currency, is_active
    INTO p FROM public.products WHERE id = NEW.product_id;
  IF p.id IS NULL THEN
    RAISE EXCEPTION 'Unknown product';
  END IF;
  IF p.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;
  NEW.unit_price_cents := p.price_cents;
  NEW.currency         := p.currency;
  NEW.product_title    := p.title;
  NEW.product_slug     := p.slug;
  IF NEW.quantity IS NULL OR NEW.quantity < 1 THEN
    NEW.quantity := 1;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.orders_enforce_catalog() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_enforce_catalog_biu ON public.orders;
CREATE TRIGGER orders_enforce_catalog_biu
  BEFORE INSERT OR UPDATE OF product_id, unit_price_cents, product_title, product_slug, currency, quantity
  ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_enforce_catalog();

-- 5) Profiles: hide referred_by and trust_score from anon
REVOKE SELECT (referred_by, trust_score, referral_code) ON public.profiles FROM anon;
