-- Create basic sales_activities table structure first
-- This will be pushed before adding RLS policies
BEGIN;

-- Create the basic sales_activities table
CREATE TABLE IF NOT EXISTS public.sales_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  subject text,
  description text,
  notes text,
  status text,
  scheduled_at timestamptz,
  due_at timestamptz,
  created_by uuid,
  opportunity_id uuid,
  customer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS sales_activities_created_at_idx ON public.sales_activities(created_at);
CREATE INDEX IF NOT EXISTS sales_activities_scheduled_at_idx ON public.sales_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS sales_activities_due_at_idx ON public.sales_activities(due_at);
CREATE INDEX IF NOT EXISTS sales_activities_created_by_idx ON public.sales_activities(created_by);
CREATE INDEX IF NOT EXISTS sales_activities_customer_id_idx ON public.sales_activities(customer_id);
CREATE INDEX IF NOT EXISTS sales_activities_opportunity_id_idx ON public.sales_activities(opportunity_id);

-- Grant basic permissions (no RLS yet)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_activities TO authenticated;

COMMIT;