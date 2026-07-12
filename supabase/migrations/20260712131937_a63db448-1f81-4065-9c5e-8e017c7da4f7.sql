
-- Extend profiles for temp + shadow ban
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN NOT NULL DEFAULT false;

-- Mod actions audit
CREATE TABLE IF NOT EXISTS public.mod_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  action TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mod_actions TO authenticated;
GRANT ALL ON public.mod_actions TO service_role;
ALTER TABLE public.mod_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view mod actions" ON public.mod_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Staff insert mod actions" ON public.mod_actions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE INDEX IF NOT EXISTS idx_mod_actions_created ON public.mod_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mod_actions_target ON public.mod_actions (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_actor ON public.mod_actions (actor_id);

-- User notes (staff-only)
CREATE TABLE IF NOT EXISTS public.user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;
GRANT ALL ON public.user_notes TO service_role;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view notes" ON public.user_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Staff insert notes" ON public.user_notes FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) AND author_id = auth.uid());
CREATE POLICY "Staff update own notes" ON public.user_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff delete own notes" ON public.user_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_user_notes_user ON public.user_notes(user_id);
CREATE TRIGGER trg_user_notes_updated BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automod rules
CREATE TABLE IF NOT EXISTS public.automod_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  is_regex BOOLEAN NOT NULL DEFAULT false,
  action TEXT NOT NULL DEFAULT 'flag',
  target_scope TEXT NOT NULL DEFAULT 'both',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  hits INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automod_rules TO authenticated;
GRANT ALL ON public.automod_rules TO service_role;
ALTER TABLE public.automod_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view automod" ON public.automod_rules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Admin manage automod" ON public.automod_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_automod_updated BEFORE UPDATE ON public.automod_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: log any mod action
CREATE OR REPLACE FUNCTION public.admin_log_mod_action(
  _target_type TEXT, _target_id TEXT, _action TEXT, _reason TEXT DEFAULT NULL, _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_id UUID;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'staff only';
  END IF;
  INSERT INTO public.mod_actions(actor_id, target_type, target_id, action, reason, metadata)
  VALUES (auth.uid(), _target_type, _target_id, _action, _reason, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

-- Temp ban
CREATE OR REPLACE FUNCTION public.admin_temp_ban(_user_id UUID, _until TIMESTAMPTZ, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'staff only';
  END IF;
  UPDATE public.profiles SET is_banned = true, banned_until = _until WHERE id = _user_id;
  INSERT INTO public.profile_moderation(user_id, ban_reason, warnings)
    VALUES (_user_id, _reason, 0)
    ON CONFLICT (user_id) DO UPDATE SET ban_reason = COALESCE(EXCLUDED.ban_reason, public.profile_moderation.ban_reason), updated_at = now();
  PERFORM public.admin_log_mod_action('user', _user_id::text, 'user.temp_ban', _reason,
    jsonb_build_object('until', _until));
END $$;

-- Unban
CREATE OR REPLACE FUNCTION public.admin_unban(_user_id UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'staff only';
  END IF;
  UPDATE public.profiles SET is_banned = false, banned_until = NULL WHERE id = _user_id;
  UPDATE public.profile_moderation SET ban_reason = NULL, warnings = 0, updated_at = now() WHERE user_id = _user_id;
  PERFORM public.admin_log_mod_action('user', _user_id::text, 'user.unban', _reason, '{}'::jsonb);
END $$;

-- Shadow ban
CREATE OR REPLACE FUNCTION public.admin_shadow_ban(_user_id UUID, _enabled BOOLEAN, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN
    RAISE EXCEPTION 'staff only';
  END IF;
  UPDATE public.profiles SET is_shadow_banned = _enabled WHERE id = _user_id;
  PERFORM public.admin_log_mod_action('user', _user_id::text,
    CASE WHEN _enabled THEN 'user.shadow_ban' ELSE 'user.shadow_unban' END, _reason, '{}'::jsonb);
END $$;

-- Auto expire temp bans (called opportunistically; also usable in a cron)
CREATE OR REPLACE FUNCTION public.expire_temp_bans() RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n INT;
BEGIN
  UPDATE public.profiles SET is_banned = false, banned_until = NULL
    WHERE is_banned = true AND banned_until IS NOT NULL AND banned_until <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
