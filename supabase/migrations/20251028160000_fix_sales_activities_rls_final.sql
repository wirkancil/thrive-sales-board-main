-- Fix RLS policies for sales_activities table - Final version
BEGIN;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "sales_activities_select_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_insert_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_update_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_delete_policy" ON public.sales_activities;

-- Ensure RLS is enabled
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper auth.uid() handling
-- Allow authenticated users to select all activities
CREATE POLICY "sales_activities_select_policy" ON public.sales_activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert activities
-- The created_by field will be automatically set by trigger or application
CREATE POLICY "sales_activities_insert_policy" ON public.sales_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by IS NOT NULL AND 
    (created_by = auth.uid() OR created_by::text = (auth.jwt() ->> 'sub'))
  );

-- Allow users to update only their own activities
CREATE POLICY "sales_activities_update_policy" ON public.sales_activities
  FOR UPDATE
  TO authenticated
  USING (
    created_by IS NOT NULL AND 
    (created_by = auth.uid() OR created_by::text = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    created_by IS NOT NULL AND 
    (created_by = auth.uid() OR created_by::text = (auth.jwt() ->> 'sub'))
  );

-- Allow users to delete only their own activities
CREATE POLICY "sales_activities_delete_policy" ON public.sales_activities
  FOR DELETE
  TO authenticated
  USING (
    created_by IS NOT NULL AND 
    (created_by = auth.uid() OR created_by::text = (auth.jwt() ->> 'sub'))
  );

-- Update the activities view trigger function to ensure proper created_by handling
CREATE OR REPLACE FUNCTION public.activities_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set created_by to current authenticated user
  NEW.created_by := auth.uid();
  
  -- If auth.uid() is null, try to get from JWT
  IF NEW.created_by IS NULL THEN
    NEW.created_by := (auth.jwt() ->> 'sub')::uuid;
  END IF;
  
  -- If still null, raise an error
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create activities';
  END IF;
  
  INSERT INTO public.sales_activities (
    activity_type, subject, description, notes, status,
    scheduled_at, due_at, created_by, opportunity_id, customer_id
  ) VALUES (
    NEW.activity_type, NEW.subject, NEW.description, NEW.notes, NEW.status,
    NEW.scheduled_at, NEW.due_at, NEW.created_by, NEW.opportunity_id, NEW.customer_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;