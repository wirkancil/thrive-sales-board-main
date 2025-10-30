-- Add due_at column to sales_activities table and update activities view
BEGIN;

-- Add due_at column to sales_activities table
ALTER TABLE public.sales_activities 
ADD COLUMN IF NOT EXISTS due_at timestamptz;

-- Create index for due_at column for better performance
CREATE INDEX IF NOT EXISTS sales_activities_due_at_idx ON public.sales_activities(due_at);

-- Update the activities view to include due_at column
DROP VIEW IF EXISTS public.activities;

CREATE OR REPLACE VIEW public.activities AS
SELECT 
  id,
  activity_type,
  subject,
  description,
  scheduled_at,
  due_at,
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

-- Add INSERT/UPDATE/DELETE policies for sales_activities table to support activities view operations
DROP POLICY IF EXISTS sales_activities_insert_policy ON public.sales_activities;
CREATE POLICY sales_activities_insert_policy ON public.sales_activities
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS sales_activities_update_policy ON public.sales_activities;
CREATE POLICY sales_activities_update_policy ON public.sales_activities
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS sales_activities_delete_policy ON public.sales_activities;
CREATE POLICY sales_activities_delete_policy ON public.sales_activities
  FOR DELETE TO authenticated
  USING (true);

-- Grant INSERT, UPDATE, DELETE permissions on sales_activities table
GRANT INSERT, UPDATE, DELETE ON public.sales_activities TO authenticated;

COMMIT;