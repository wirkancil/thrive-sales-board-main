-- Fix RLS policies for departments table
-- Allow authenticated users to manage departments

-- Drop existing policies if any
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_update_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON public.departments;

-- Allow all authenticated users to select departments
CREATE POLICY "departments_select_policy" ON public.departments
FOR SELECT TO authenticated
USING (true);

-- Allow admins and department heads to insert departments
CREATE POLICY "departments_insert_policy" ON public.departments
FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_role() IN ('admin', 'department_head')
);

-- Allow admins and department heads to update departments
CREATE POLICY "departments_update_policy" ON public.departments
FOR UPDATE TO authenticated
USING (
  public.current_user_role() IN ('admin', 'department_head')
)
WITH CHECK (
  public.current_user_role() IN ('admin', 'department_head')
);

-- Allow admins to delete departments
CREATE POLICY "departments_delete_policy" ON public.departments
FOR DELETE TO authenticated
USING (
  public.current_user_role() = 'admin'
);