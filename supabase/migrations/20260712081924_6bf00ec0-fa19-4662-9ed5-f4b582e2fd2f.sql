
-- Add closed threads support: seed a "Closed Threads" category and store original category for restore
INSERT INTO public.categories (slug, name, description, color, icon, sort_order)
VALUES ('closed-threads', 'Closed Threads', 'Threads closed by staff. No new replies allowed.', '#6b7280', 'lock', 999)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.threads
  ADD COLUMN IF NOT EXISTS original_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
