-- Create sales activities base table and compatibility views for frontend
BEGIN;

-- Base table that our views will read from
CREATE TABLE IF NOT EXISTS public.sales_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  subject text,
  description text,
  notes text,
  status text,
  scheduled_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS sales_activities_created_at_idx ON public.sales_activities(created_at);
CREATE INDEX IF NOT EXISTS sales_activities_scheduled_at_idx ON public.sales_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS sales_activities_created_by_idx ON public.sales_activities(created_by);
CREATE INDEX IF NOT EXISTS sales_activities_customer_id_idx ON public.sales_activities(customer_id);
CREATE INDEX IF NOT EXISTS sales_activities_opportunity_id_idx ON public.sales_activities(opportunity_id);

-- RLS (minimal) so views can read; tighten later if needed
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sales_activities_select_policy ON public.sales_activities;
CREATE POLICY sales_activities_select_policy ON public.sales_activities
  FOR SELECT TO authenticated
  USING (true);
GRANT SELECT ON public.sales_activities TO authenticated;

-- View aligned with v2 queries used by most components
CREATE OR REPLACE VIEW public.sales_activity_v2 AS
SELECT
  sa.id,
  sa.activity_type,
  sa.subject,
  sa.description,
  sa.scheduled_at,
  sa.status,
  sa.notes,
  sa.created_by,
  sa.created_at,
  sa.updated_at,
  sa.opportunity_id,
  sa.customer_id,
  org.name AS customer_name
FROM public.sales_activities sa
LEFT JOIN public.organizations org ON org.id = sa.customer_id
ORDER BY sa.created_at DESC;
GRANT SELECT ON public.sales_activity_v2 TO authenticated;

-- Legacy view for older queries expecting user_id/date/time/customer_name/opportunity_name
CREATE OR REPLACE VIEW public.sales_activity AS
SELECT
  sa.id,
  sa.activity_type,
  sa.notes,
  (COALESCE(sa.scheduled_at, sa.created_at))::date AS date,
  (COALESCE(sa.scheduled_at, sa.created_at))::time AS time,
  sa.created_at,
  sa.updated_at,
  sa.customer_id,
  org.name AS customer_name,
  sa.opportunity_id,
  opp.name AS opportunity_name,
  sa.created_by AS user_id
FROM public.sales_activities sa
LEFT JOIN public.organizations org ON org.id = sa.customer_id
LEFT JOIN public.opportunities opp ON opp.id = sa.opportunity_id
ORDER BY sa.created_at DESC;
GRANT SELECT ON public.sales_activity TO authenticated;

COMMIT;