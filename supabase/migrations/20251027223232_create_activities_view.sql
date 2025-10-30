-- Create activities view as an alias for sales_activities table
-- This provides backward compatibility for frontend code expecting 'activities' table

BEGIN;

-- Create activities view that maps to sales_activities
CREATE OR REPLACE VIEW public.activities AS
SELECT 
  id,
  activity_type,
  subject,
  description,
  scheduled_at,
  status,
  notes,
  created_at,
  updated_at,
  created_by,
  opportunity_id,
  customer_id
FROM public.sales_activities;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;

-- Enable RLS on the view (inherits from base table)
ALTER VIEW public.activities SET (security_invoker = true);

COMMIT;