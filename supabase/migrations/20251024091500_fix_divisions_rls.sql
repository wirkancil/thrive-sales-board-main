-- Fix RLS for public.divisions: allow admins to manage divisions and clean up conflicting policies

-- Ensure RLS is enabled on divisions
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- Drop conflicting or outdated policies if they exist
DROP POLICY IF EXISTS "divisions_select_policy" ON public.divisions;
DROP POLICY IF EXISTS "Authenticated users can view divisions" ON public.divisions;
DROP POLICY IF EXISTS "divisions_admin_all" ON public.divisions;
DROP POLICY IF EXISTS "divisions_dept_head_insert" ON public.divisions;
DROP POLICY IF EXISTS "divisions_dept_head_update" ON public.divisions;
DROP POLICY IF EXISTS "divisions_dept_head_delete" ON public.divisions;
DROP POLICY IF EXISTS "divisions_head_manage" ON public.divisions;

-- Grant SELECT to authenticated users (for dropdowns/reads)
CREATE POLICY "divisions_select_authenticated"
ON public.divisions
FOR SELECT TO authenticated
USING (true);

-- Allow admins to INSERT/UPDATE/DELETE divisions
CREATE POLICY "divisions_admin_manage"
ON public.divisions
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- Refresh PostgREST cache
SELECT pg_notify('pgrst','reload schema');