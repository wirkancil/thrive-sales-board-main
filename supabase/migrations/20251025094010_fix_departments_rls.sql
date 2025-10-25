-- Fix RLS policies for departments to allow creation by admins and division heads
-- Also preserve manager manage rights for their own department, but not creation

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Drop conflicting or outdated policies if present
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_update_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_admin_all" ON public.departments;
DROP POLICY IF EXISTS "departments_head_insert" ON public.departments;
DROP POLICY IF EXISTS "departments_head_update" ON public.departments;

-- Read access for all authenticated users (used by dropdowns and listings)
CREATE POLICY "departments_select_policy" ON public.departments
  FOR SELECT TO authenticated
  USING (true);

-- Admins can manage all departments (insert, update, delete)
CREATE POLICY "departments_admin_all" ON public.departments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Division heads can insert departments within their own division
CREATE POLICY "departments_head_insert" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'head'
        AND up.division_id IS NOT NULL
        AND up.division_id = departments.division_id
    )
  );

-- Division heads can update departments within their own division
CREATE POLICY "departments_head_update" ON public.departments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'head'
        AND up.division_id IS NOT NULL
        AND up.division_id = departments.division_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'head'
        AND up.division_id IS NOT NULL
        AND up.division_id = departments.division_id
    )
  );

-- Keep existing manager policy (if present) focused on managing their own department only
-- Note: managers cannot create new departments by design
-- (We intentionally do not recreate the manager FOR ALL policy here)

-- Prompt PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;