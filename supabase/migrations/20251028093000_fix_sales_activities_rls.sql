-- Strengthen RLS policies for sales_activities to allow authenticated inserts
-- Ensures Next Step activity creation works for logged-in users
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
  created_by uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing write policies to avoid conflicts
DROP POLICY IF EXISTS sales_activities_insert_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_update_policy ON public.sales_activities;
DROP POLICY IF EXISTS sales_activities_delete_policy ON public.sales_activities;

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

-- Explicit grants
GRANT INSERT, UPDATE, DELETE ON public.sales_activities TO authenticated;

COMMIT;