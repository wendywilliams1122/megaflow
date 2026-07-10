
DELETE FROM public.categories;
INSERT INTO public.categories (slug, name, description, icon, color, sort_order) VALUES
  ('give-away-freebies', 'Give-Away & Freebies', 'Free stuff for the community', 'Gift', '#f59e0b', 1),
  ('tutorials-methods', 'Tutorials & Methods', 'Step-by-step guides and methods', 'BookOpen', '#3b82f6', 2),
  ('courses', 'Courses', 'Full courses and learning paths', 'GraduationCap', '#10b981', 3),
  ('resources', 'Resources', 'Useful tools and references', 'Package', '#0ea5e9', 4),
  ('hq-leaks', 'HQ Leaks', 'High-quality leaks', 'Gem', '#06b6d4', 5),
  ('tools-scripts', 'Tools & Scripts', 'Handy tools and automation scripts', 'Wrench', '#8b5cf6', 6),
  ('software-plugins', 'Software & Plugins', 'Applications and plugins', 'Monitor', '#6366f1', 7),
  ('cracked', 'Cracked', 'Cracked software discussions', 'Unlock', '#ef4444', 8),
  ('free-coupons', 'Free Coupons', 'Working coupons and deals', 'Ticket', '#f59e0b', 9),
  ('ebooks', 'eBooks', 'Books and reading material', 'Library', '#a855f7', 10),
  ('articles-news', 'Articles or News', 'Latest articles and news', 'Newspaper', '#0ea5e9', 11),
  ('discussion-solutions', 'Discussion & Solutions', 'Ask, discuss, solve', 'MessageCircle', '#10b981', 12),
  ('request', 'Request', 'Request resources from the community', 'ClipboardList', '#64748b', 13),
  ('forum-rules', 'Forum Rules', 'Read before posting', 'ScrollText', '#6b7280', 14),
  ('marketplace', 'Marketplace', 'Buy, sell, trade', 'ShoppingCart', '#0ea5e9', 15),
  ('expired-not-working', 'Expired/Not Working', 'Report expired items', 'XCircle', '#ef4444', 16);
