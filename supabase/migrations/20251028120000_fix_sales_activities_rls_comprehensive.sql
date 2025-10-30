-- Comprehensive fix for sales_activities table and RLS policies
-- Resolves the 42501 RLS error by properly configuring policies
BEGIN;

-- First ensure the table exists (in case there was an issue with the initial migration)
CREATE TABLE IF NOT EXISTS public.sales_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  subject text,
  description text,
  notes text,
  status text,
  scheduled_at timestamptz,
  due_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure the table structure is correct
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales_activities' 
        AND column_name = 'due_at'
    ) THEN
        ALTER TABLE public.sales_activities ADD COLUMN due_at timestamptz;
    END IF;
END $$;

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS sales_activities_created_at_idx ON public.sales_activities(created_at);
CREATE INDEX IF NOT EXISTS sales_activities_scheduled_at_idx ON public.sales_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS sales_activities_due_at_idx ON public.sales_activities(due_at);
CREATE INDEX IF NOT EXISTS sales_activities_created_by_idx ON public.sales_activities(created_by);
CREATE INDEX IF NOT EXISTS sales_activities_customer_id_idx ON public.sales_activities(customer_id);
CREATE INDEX IF NOT EXISTS sales_activities_opportunity_id_idx ON public.sales_activities(opportunity_id);

-- Enable RLS
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS sales_activities_select_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_insert_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_update_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_delete_policy ON public.sales_activities;

-- CREATE comprehensive RLS policies

-- SELECT: allow authenticated users to see all activities
CREATE POLICY sales_activities_select_policy ON public.sales_activities
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: allow authenticated users to insert when they are the creator
CREATE POLICY sales_activities_insert_policy ON public.sales_activities
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE: allow creators to update their own rows
CREATE POLICY sales_activities_update_policy ON public.sales_activities
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: allow creators to delete their own rows
CREATE POLICY sales_activities_delete_policy ON public.sales_activities
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_activities TO authenticated;

-- Update the activities view to include all necessary joins
DROP VIEW IF EXISTS public.activities;
CREATE OR REPLACE VIEW public.activities AS
SELECT
  sa.id,
  sa.activity_type,
  sa.subject,
  sa.description,
  sa.notes,
  sa.status,
  sa.scheduled_at,
  sa.due_at,
  sa.created_by,
  sa.opportunity_id,
  sa.customer_id,
  sa.created_at,
  sa.updated_at,
  org.name AS customer_name,
  opp.name AS opportunity_name,
  up.full_name AS created_by_name
FROM public.sales_activities sa
LEFT JOIN public.organizations org ON org.id = sa.customer_id
LEFT JOIN public.opportunities opp ON opp.id = sa.opportunity_id
LEFT JOIN public.user_profiles up ON up.user_id = sa.created_by
ORDER BY sa.created_at DESC;

GRANT SELECT ON public.activities TO authenticated;

-- Update sales_activity_v2 view (drop and recreate to avoid column conflicts)
DROP VIEW IF EXISTS public.sales_activity_v2;
CREATE VIEW public.sales_activity_v2 AS
SELECT
  sa.id,
  sa.activity_type,
  sa.subject,
  sa.description,
  sa.scheduled_at,
  sa.due_at,
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

-- Update legacy sales_activity view (drop and recreate to avoid column conflicts)
DROP VIEW IF EXISTS public.sales_activity;
CREATE VIEW public.sales_activity AS
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