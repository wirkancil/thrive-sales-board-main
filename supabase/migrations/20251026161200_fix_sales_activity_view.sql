-- Fix sales_activity view to include missing activity_time column
BEGIN;

-- Drop the existing view first to avoid column order conflicts
DROP VIEW IF EXISTS public.sales_activity;

-- Create the legacy view with activity_time column for backward compatibility
CREATE VIEW public.sales_activity AS
SELECT
  sa.id,
  sa.activity_type,
  sa.notes,
  (COALESCE(sa.scheduled_at, sa.created_at))::date AS date,
  (COALESCE(sa.scheduled_at, sa.created_at))::time AS time,
  COALESCE(sa.scheduled_at, sa.created_at) AS activity_time,  -- Add missing activity_time column
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