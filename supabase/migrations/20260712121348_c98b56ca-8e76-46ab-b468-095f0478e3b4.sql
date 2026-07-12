-- Report categorization: add category + optional link_url for broken-link reports
DO $$ BEGIN
  CREATE TYPE public.report_category AS ENUM ('spam','harassment','broken_link','inappropriate','misinformation','copyright','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS category public.report_category NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS link_url text;

CREATE INDEX IF NOT EXISTS reports_category_idx ON public.reports(category);
CREATE INDEX IF NOT EXISTS reports_status_created_idx ON public.reports(status, created_at DESC);