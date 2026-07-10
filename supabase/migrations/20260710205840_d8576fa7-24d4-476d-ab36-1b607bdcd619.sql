-- 1. is_banned on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- 2. admin can update any profile (ban/unban, edit)
DROP POLICY IF EXISTS "admins update any profile" ON public.profiles;
CREATE POLICY "admins update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. admins can insert/delete user_roles
DROP POLICY IF EXISTS "admins insert roles" ON public.user_roles;
CREATE POLICY "admins insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;
CREATE POLICY "admins delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Banned users cannot post (recreate insert policies with ban check)
DROP POLICY IF EXISTS "threads insert own" ON public.threads;
CREATE POLICY "threads insert own"
  ON public.threads FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

DROP POLICY IF EXISTS "posts insert own" ON public.posts;
CREATE POLICY "posts insert own"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );