
-- Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value INT NOT NULL CHECK (discount_value > 0),
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "anyone read active coupons" ON public.coupons FOR SELECT TO authenticated
  USING (is_active = true);
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Scheduled broadcasts
CREATE TABLE public.scheduled_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT NOT NULL DEFAULT '/',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','cancelled')),
  recipients INT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_broadcasts TO authenticated;
GRANT ALL ON public.scheduled_broadcasts TO service_role;
ALTER TABLE public.scheduled_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage scheduled broadcasts" ON public.scheduled_broadcasts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE TRIGGER scheduled_broadcasts_updated_at BEFORE UPDATE ON public.scheduled_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Allow 'refunded' order status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new','contacted','completed','cancelled','refunded'));

-- Run due broadcasts (call from client to flush)
CREATE OR REPLACE FUNCTION public.run_due_broadcasts()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; n INT; total INT := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'staff only';
  END IF;
  FOR r IN SELECT * FROM public.scheduled_broadcasts
           WHERE status='pending' AND scheduled_for <= now()
           ORDER BY scheduled_for ASC LIMIT 20 LOOP
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, metadata)
    SELECT p.id, r.created_by, 'reply'::public.notification_type, r.title, r.body, r.link,
           jsonb_build_object('kind','broadcast','scheduled_id',r.id)
      FROM public.profiles p WHERE COALESCE(p.is_banned,false)=false;
    GET DIAGNOSTICS n = ROW_COUNT;
    UPDATE public.scheduled_broadcasts
      SET status='sent', sent_at=now(), recipients=n, updated_at=now()
      WHERE id=r.id;
    total := total + 1;
  END LOOP;
  RETURN total;
END $$;
