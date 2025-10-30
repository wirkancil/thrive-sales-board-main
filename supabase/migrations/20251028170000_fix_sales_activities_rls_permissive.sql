-- Fix RLS policies for sales_activities with more permissive approach
-- Drop all existing policies first
DROP POLICY IF EXISTS "sales_activities_select_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_insert_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_update_policy" ON public.sales_activities;
DROP POLICY IF EXISTS "sales_activities_delete_policy" ON public.sales_activities;

-- Create more permissive policies that allow authenticated users to perform operations
CREATE POLICY "sales_activities_select_policy" ON public.sales_activities
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "sales_activities_insert_policy" ON public.sales_activities
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "sales_activities_update_policy" ON public.sales_activities
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "sales_activities_delete_policy" ON public.sales_activities
    FOR DELETE TO authenticated
    USING (true);

-- Update the activities view trigger to be more robust
CREATE OR REPLACE FUNCTION public.activities_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_by to current user if not provided or null
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    
    -- If auth.uid() is still null, try to get from JWT
    IF NEW.created_by IS NULL THEN
        NEW.created_by = (auth.jwt() ->> 'sub')::uuid;
    END IF;
    
    -- Set created_at if not provided
    IF NEW.created_at IS NULL THEN
        NEW.created_at = NOW();
    END IF;
    
    -- Set updated_at
    NEW.updated_at = NOW();
    
    INSERT INTO public.sales_activities (
        opportunity_id,
        subject,
        description,
        status,
        due_at,
        scheduled_at,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        NEW.opportunity_id,
        NEW.subject,
        NEW.description,
        NEW.status,
        NEW.due_at,
        NEW.scheduled_at,
        NEW.created_by,
        NEW.created_at,
        NEW.updated_at
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS is enabled
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_activities TO authenticated;