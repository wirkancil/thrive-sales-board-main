-- Comprehensive fix for sales_activities table and RLS policies
-- Run this in Supabase SQL Editor to resolve the 42501 RLS error

BEGIN;

-- First, check if the table exists and create it if needed
CREATE TABLE IF NOT EXISTS public.sales_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  subject text,
  description text,
  notes text,
  status text,
  scheduled_at timestamptz,
  due_at timestamptz, -- Added from later migration
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add due_at column if it doesn't exist (from 20251027224500 migration)
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS sales_activities_created_at_idx ON public.sales_activities(created_at);
CREATE INDEX IF NOT EXISTS sales_activities_scheduled_at_idx ON public.sales_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS sales_activities_due_at_idx ON public.sales_activities(due_at);
CREATE INDEX IF NOT EXISTS sales_activities_created_by_idx ON public.sales_activities(created_by);
CREATE INDEX IF NOT EXISTS sales_activities_customer_id_idx ON public.sales_activities(customer_id);
CREATE INDEX IF NOT EXISTS sales_activities_opportunity_id_idx ON public.sales_activities(opportunity_id);

-- Enable RLS
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS sales_activities_select_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_insert_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_update_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_delete_policy ON public.sales_activities;

-- CREATE comprehensive RLS policies

-- SELECT: allow authenticated users to see all activities (for now)
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

-- Create or replace the activities view (from 20251027223232 migration)
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

-- Create or replace sales_activity_v2 view
CREATE OR REPLACE VIEW public.sales_activity_v2 AS
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

-- Create or replace legacy sales_activity view
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

-- Verify the fix
SELECT 
  'Table exists: ' || CASE WHEN to_regclass('public.sales_activities') IS NOT NULL THEN 'YES' ELSE 'NO' END as table_status,
  'RLS enabled: ' || CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as rls_status
FROM pg_class 
WHERE relname = 'sales_activities' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Show RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'sales_activities'
ORDER BY policyname;