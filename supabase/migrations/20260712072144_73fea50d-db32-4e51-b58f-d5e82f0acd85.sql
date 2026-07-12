
-- Direct Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users send messages as themselves" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients mark read" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE INDEX idx_messages_pair ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- DM rate limit + notification
CREATE OR REPLACE FUNCTION public.enforce_message_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cnt INT; recipient_banned BOOLEAN; sender_banned BOOLEAN; sender_name TEXT;
BEGIN
  SELECT is_banned INTO sender_banned FROM public.profiles WHERE id = NEW.sender_id;
  IF sender_banned THEN RAISE EXCEPTION 'You are banned from sending messages'; END IF;
  SELECT is_banned INTO recipient_banned FROM public.profiles WHERE id = NEW.recipient_id;
  IF recipient_banned THEN RAISE EXCEPTION 'This user cannot receive messages'; END IF;

  SELECT count(*) INTO cnt FROM public.messages
    WHERE sender_id = NEW.sender_id AND created_at > now() - interval '1 hour';
  IF cnt >= 60 THEN RAISE EXCEPTION 'Message rate limit reached. Try again later.'; END IF;

  SELECT COALESCE(display_name, username) INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  PERFORM public.create_notification(
    NEW.recipient_id, NEW.sender_id, 'reply'::public.notification_type,
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    left(NEW.body, 140), '/messages', NULL, NULL,
    jsonb_build_object('kind','dm')
  );
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_message_limits() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_enforce_message_limits BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_limits();

-- Reports
CREATE TYPE public.report_target AS ENUM ('thread','post','user');
CREATE TYPE public.report_status AS ENUM ('open','resolved','dismissed');

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 3 AND 1000),
  status public.report_status NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters see own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Signed-in users create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Mods update reports" ON public.reports
  FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE INDEX idx_reports_open ON public.reports(status, created_at DESC);
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
