-- Fix missing INSERT/UPDATE/DELETE policies for user_profiles table
-- This resolves role-based access issues for non-admin users

BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete ON public.user_profiles;

-- INSERT policy: Allow users to create their own profile, admins can create any profile
CREATE POLICY user_profiles_insert ON public.user_profiles
FOR INSERT
WITH CHECK (
  -- Users can create their own profile
  user_id = auth.uid()
  OR
  -- Admins can create any profile
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
);

-- UPDATE policy: Users can update their own profile, admins/heads can update any profile, managers can update their team members
CREATE POLICY user_profiles_update ON public.user_profiles
FOR UPDATE
USING (
  -- Users can update their own profile
  user_id = auth.uid()
  OR
  -- Admins and heads can update any profile
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  OR
  -- Managers can update profiles in their division or department
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND (
        up.division_id = public.user_profiles.division_id
        OR up.department_id = public.user_profiles.department_id
      )
  )
  OR
  -- Managers can update their explicit team members
  EXISTS (
    SELECT 1
    FROM public.manager_team_members mtm
    CROSS JOIN public.user_profiles me
    WHERE me.user_id = auth.uid() AND me.role = 'manager' 
      AND mtm.manager_id = me.id AND mtm.account_manager_id = public.user_profiles.id
  )
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND (
        up.division_id = public.user_profiles.division_id
        OR up.department_id = public.user_profiles.department_id
      )
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.manager_team_members mtm
    CROSS JOIN public.user_profiles me
    WHERE me.user_id = auth.uid() AND me.role = 'manager' 
      AND mtm.manager_id = me.id AND mtm.account_manager_id = public.user_profiles.id
  )
);

-- DELETE policy: Only admins can delete profiles
CREATE POLICY user_profiles_delete ON public.user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
);

COMMIT;