
-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_min UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_max UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','stopped','ended')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES auth.users(id),
  status_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  CONSTRAINT conversations_user_order CHECK (user_min < user_max),
  UNIQUE (user_min, user_max)
);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and staff can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    auth.uid() = user_min OR auth.uid() = user_max
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')
  );

CREATE POLICY "Staff can update conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX conversations_users_idx ON public.conversations(user_min, user_max);
CREATE INDEX conversations_status_idx ON public.conversations(status);

-- Add columns to messages
ALTER TABLE public.messages
  ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN is_staff_intervention BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at);

-- Update messages RLS: staff can view all
DROP POLICY IF EXISTS "Users read their messages" ON public.messages;
CREATE POLICY "Users and staff read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')
  );

DROP POLICY IF EXISTS "Users send messages as themselves" ON public.messages;
CREATE POLICY "Users and staff send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')
  );

DROP POLICY IF EXISTS "Recipients mark read" ON public.messages;
CREATE POLICY "Recipients and staff update messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    auth.uid() = recipient_id
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')
  )
  WITH CHECK (true);

-- Replace enforce_message_limits to add conversation gating
CREATE OR REPLACE FUNCTION public.enforce_message_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cnt INT;
  recipient_banned BOOLEAN;
  sender_banned BOOLEAN;
  sender_name TEXT;
  is_staff BOOLEAN;
  umin UUID;
  umax UUID;
  conv RECORD;
  msg_count INT;
BEGIN
  is_staff := public.has_role(NEW.sender_id,'admin') OR public.has_role(NEW.sender_id,'moderator');

  IF NOT is_staff THEN
    SELECT is_banned INTO sender_banned FROM public.profiles WHERE id = NEW.sender_id;
    IF sender_banned THEN RAISE EXCEPTION 'You are banned from sending messages'; END IF;
    SELECT is_banned INTO recipient_banned FROM public.profiles WHERE id = NEW.recipient_id;
    IF recipient_banned THEN RAISE EXCEPTION 'This user cannot receive messages'; END IF;

    SELECT count(*) INTO cnt FROM public.messages
      WHERE sender_id = NEW.sender_id AND created_at > now() - interval '1 hour';
    IF cnt >= 60 THEN RAISE EXCEPTION 'Message rate limit reached. Try again later.'; END IF;
  END IF;

  -- Find or create the conversation for this user pair
  IF NEW.sender_id < NEW.recipient_id THEN
    umin := NEW.sender_id; umax := NEW.recipient_id;
  ELSE
    umin := NEW.recipient_id; umax := NEW.sender_id;
  END IF;

  SELECT * INTO conv FROM public.conversations WHERE user_min = umin AND user_max = umax;

  IF conv.id IS NULL THEN
    INSERT INTO public.conversations (user_min, user_max, status, approved_by, approved_at, last_message_at)
    VALUES (
      umin, umax,
      CASE WHEN is_staff THEN 'active' ELSE 'pending' END,
      CASE WHEN is_staff THEN NEW.sender_id ELSE NULL END,
      CASE WHEN is_staff THEN now() ELSE NULL END,
      now()
    )
    RETURNING * INTO conv;
  ELSE
    -- Gate based on status
    IF NOT is_staff THEN
      IF conv.status = 'pending' THEN
        SELECT count(*) INTO msg_count FROM public.messages WHERE conversation_id = conv.id;
        IF msg_count >= 1 THEN
          RAISE EXCEPTION 'This conversation is awaiting staff approval. Please wait.';
        END IF;
      ELSIF conv.status = 'stopped' THEN
        RAISE EXCEPTION 'This conversation has been paused by staff.';
      ELSIF conv.status = 'ended' THEN
        RAISE EXCEPTION 'This conversation has been ended by staff.';
      END IF;
    END IF;
    UPDATE public.conversations SET last_message_at = now(), updated_at = now() WHERE id = conv.id;
  END IF;

  NEW.conversation_id := conv.id;
  NEW.is_staff_intervention := is_staff AND NEW.sender_id NOT IN (conv.user_min, conv.user_max);

  -- Notify recipient (only when conversation is active or sender is staff)
  IF is_staff OR conv.status = 'active' THEN
    SELECT COALESCE(display_name, username) INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
    PERFORM public.create_notification(
      NEW.recipient_id, NEW.sender_id, 'reply'::public.notification_type,
      COALESCE(sender_name,'Someone') || ' sent you a message',
      left(NEW.body, 140), '/messages', NULL, NULL,
      jsonb_build_object('kind','dm')
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Notify staff on new pending conversation
CREATE OR REPLACE FUNCTION public.notify_staff_new_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_id UUID;
BEGIN
  IF NEW.status = 'pending' THEN
    FOR staff_id IN SELECT user_id FROM public.user_roles WHERE role IN ('admin','moderator') LOOP
      PERFORM public.create_notification(
        staff_id, NULL, 'reply'::public.notification_type,
        'New conversation awaiting approval',
        NULL, '/mod', NULL, NULL,
        jsonb_build_object('kind','conversation_pending','conversation_id',NEW.id)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER conversations_notify_staff
  AFTER INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.notify_staff_new_conversation();

-- Notify participants on status change
CREATE OR REPLACE FUNCTION public.notify_conversation_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  label TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    label := CASE NEW.status
      WHEN 'active' THEN 'approved and is now active'
      WHEN 'stopped' THEN 'paused by staff'
      WHEN 'ended' THEN 'ended by staff'
      ELSE NEW.status
    END;
    PERFORM public.create_notification(NEW.user_min, NEW.status_changed_by, 'reply'::public.notification_type,
      'Your conversation was ' || label, NEW.status_note, '/messages', NULL, NULL,
      jsonb_build_object('kind','conversation_status','status',NEW.status));
    PERFORM public.create_notification(NEW.user_max, NEW.status_changed_by, 'reply'::public.notification_type,
      'Your conversation was ' || label, NEW.status_note, '/messages', NULL, NULL,
      jsonb_build_object('kind','conversation_status','status',NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER conversations_notify_status
  AFTER UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.notify_conversation_status_change();

-- Backfill conversations for existing messages
DO $$
DECLARE
  m RECORD;
  umin UUID; umax UUID;
  conv_id UUID;
BEGIN
  FOR m IN SELECT * FROM public.messages WHERE conversation_id IS NULL ORDER BY created_at LOOP
    IF m.sender_id < m.recipient_id THEN umin := m.sender_id; umax := m.recipient_id;
    ELSE umin := m.recipient_id; umax := m.sender_id; END IF;

    SELECT id INTO conv_id FROM public.conversations WHERE user_min = umin AND user_max = umax;
    IF conv_id IS NULL THEN
      INSERT INTO public.conversations (user_min, user_max, status, approved_by, approved_at, last_message_at)
      VALUES (umin, umax, 'active', umin, m.created_at, m.created_at)
      RETURNING id INTO conv_id;
    END IF;
    UPDATE public.messages SET conversation_id = conv_id WHERE id = m.id;
  END LOOP;
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
