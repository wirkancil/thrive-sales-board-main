-- Secure RLS configuration for public.sales_activity
-- 1) Enable Row Level Security
ALTER TABLE public.sales_activity ENABLE ROW LEVEL SECURITY;

-- 2) Replace policies with least-privilege, user-scoped access
DROP POLICY IF EXISTS "Users can view their assigned activities" ON public.sales_activity;
DROP POLICY IF EXISTS "Users can create activities assigned to themselves" ON public.sales_activity;
DROP POLICY IF EXISTS "Users can update their assigned activities" ON public.sales_activity;
DROP POLICY IF EXISTS "Users can delete their assigned activities" ON public.sales_activity;

-- Allow only authenticated users to access rows where they are the assignee
CREATE POLICY "Users can view their assigned activities"
ON public.sales_activity
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

CREATE POLICY "Users can create activities assigned to themselves"
ON public.sales_activity
FOR INSERT
TO authenticated
WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can update their assigned activities"
ON public.sales_activity
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can delete their assigned activities"
ON public.sales_activity
FOR DELETE
TO authenticated
USING (assigned_to = auth.uid());