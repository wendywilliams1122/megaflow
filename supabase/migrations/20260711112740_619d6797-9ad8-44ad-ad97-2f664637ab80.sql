
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL DEFAULT 'home',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.advertisements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.advertisements TO authenticated;
GRANT ALL ON public.advertisements TO service_role;

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads" ON public.advertisements
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff can insert ads" ON public.advertisements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff can update ads" ON public.advertisements
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Staff can delete ads" ON public.advertisements
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER trg_ads_updated_at BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to check spoiler unlock: user 10+ days old AND has >= 1 thread
CREATE OR REPLACE FUNCTION public.can_view_spoiler(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.created_at <= now() - interval '10 days'
      AND EXISTS (SELECT 1 FROM public.threads t WHERE t.author_id = _user_id)
  );
$$;
