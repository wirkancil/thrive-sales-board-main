-- Fix infinite recursion in user_profiles SELECT RLS policy
-- Replace self-referencing policy with helper SECURITY DEFINER functions

BEGIN;

-- Helper: get current viewer profile ignoring RLS
CREATE OR REPLACE FUNCTION public.get_current_profile()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role role_enum,
  division_id uuid,
  department_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.id,
         up.user_id,
         up.role,
         up.division_id,
         up.department_id
  FROM public.user_profiles up
  WHERE up.user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_profile() TO authenticated;

-- Ensure minimal admin/head detection helper exists
CREATE OR REPLACE FUNCTION public.is_admin_or_head()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT role FROM public.get_current_profile()) IN ('admin','head');
$$;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop problematic self-referencing policy
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;

-- Safe, scoped SELECT policy using helper functions (no direct self-reference)
CREATE POLICY user_profiles_select ON public.user_profiles
FOR SELECT TO authenticated
USING (
  -- Read own profile
  public.user_profiles.user_id = auth.uid()
  OR
  -- Admin read all
  (SELECT role FROM public.get_current_profile()) = 'admin'
  OR
  -- Head read within their division
  ((SELECT role FROM public.get_current_profile()) = 'head'
    AND (SELECT division_id FROM public.get_current_profile()) = public.user_profiles.division_id)
  OR
  -- Manager read within their division or department
  ((SELECT role FROM public.get_current_profile()) = 'manager'
    AND (
      (SELECT division_id FROM public.get_current_profile()) = public.user_profiles.division_id
      OR (SELECT department_id FROM public.get_current_profile()) = public.user_profiles.department_id
    ))
  OR
  -- Manager read explicit team members via manager_team_members mapping
  EXISTS (
    SELECT 1
    FROM public.manager_team_members mtm
    CROSS JOIN public.get_current_profile() me
    WHERE me.role = 'manager' AND mtm.manager_id = me.id AND mtm.account_manager_id = public.user_profiles.id
  )
);

COMMIT;