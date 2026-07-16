ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_customized boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET username_customized = true WHERE username_customized = false;
ALTER TABLE public.profiles ALTER COLUMN username_customized SET DEFAULT false;