-- Add RLS policies to sales_activities table
BEGIN;

-- Enable RLS on sales_activities table
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "sales_activities_select_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_insert_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_update_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_delete_policy" ON public.sales_activities;

-- Create comprehensive RLS policies
-- Allow authenticated users to select all activities
CREATE POLICY "sales_activities_select_policy" ON public.sales_activities
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert activities (created_by will be set to auth.uid())
CREATE POLICY "sales_activities_insert_policy" ON public.sales_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow users to update only their own activities
CREATE POLICY "sales_activities_update_policy" ON public.sales_activities
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete only their own activities
CREATE POLICY "sales_activities_delete_policy" ON public.sales_activities
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Create or replace the activities view with proper handling (drop and recreate)
DROP VIEW IF EXISTS public.activities;
CREATE VIEW public.activities AS
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
  sa.updated_at
FROM public.sales_activities sa;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;

-- Create trigger functions for the activities view
CREATE OR REPLACE FUNCTION public.activities_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Set created_by to current user
  NEW.created_by := auth.uid();
  
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

CREATE OR REPLACE FUNCTION public.activities_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user can only update their own activities
  IF OLD.created_by != auth.uid() THEN
    RAISE EXCEPTION 'You can only update your own activities';
  END IF;
  
  UPDATE public.sales_activities SET
    activity_type = NEW.activity_type,
    subject = NEW.subject,
    description = NEW.description,
    notes = NEW.notes,
    status = NEW.status,
    scheduled_at = NEW.scheduled_at,
    due_at = NEW.due_at,
    opportunity_id = NEW.opportunity_id,
    customer_id = NEW.customer_id,
    updated_at = now()
  WHERE id = OLD.id AND created_by = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.activities_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user can only delete their own activities
  IF OLD.created_by != auth.uid() THEN
    RAISE EXCEPTION 'You can only delete your own activities';
  END IF;
  
  DELETE FROM public.sales_activities 
  WHERE id = OLD.id AND created_by = auth.uid();
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on the activities view
DROP TRIGGER IF EXISTS activities_insert_trigger ON public.activities;
DROP TRIGGER IF EXISTS activities_update_trigger ON public.activities;
DROP TRIGGER IF EXISTS activities_delete_trigger ON public.activities;

CREATE TRIGGER activities_insert_trigger
  INSTEAD OF INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.activities_insert_trigger();

CREATE TRIGGER activities_update_trigger
  INSTEAD OF UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.activities_update_trigger();

CREATE TRIGGER activities_delete_trigger
  INSTEAD OF DELETE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.activities_delete_trigger();

COMMIT;