-- Add 'staff' role to role_enum
-- This fixes the error where users with 'staff' role cannot access the system

BEGIN;

-- Add 'staff' to the role_enum type
ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'staff';

-- Update RLS policies to include 'staff' role where appropriate
-- Staff should have similar permissions to account_manager for basic operations

-- Update user_profiles INSERT policy to allow staff to create their own profile
DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
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

-- Update opportunities INSERT policy to allow staff to create opportunities
DROP POLICY IF EXISTS opportunities_insert_policy ON public.opportunities;
CREATE POLICY opportunities_insert_policy ON public.opportunities
FOR INSERT TO authenticated
WITH CHECK (
  -- User can create opportunities where they are the owner
  owner_id = auth.uid()
  -- Or user can create opportunities if they have admin/head/manager role
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head', 'manager')
  )
);

-- Update opportunities SELECT policy to include staff
DROP POLICY IF EXISTS opportunities_select_policy ON public.opportunities;
CREATE POLICY opportunities_select_policy ON public.opportunities
FOR SELECT TO authenticated
USING (
  -- Own opportunities (for account_manager and staff)
  owner_id = auth.uid()
  -- Or admin/head can see all
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  -- Or manager can see team opportunities
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.user_profiles owner
        WHERE owner.user_id = public.opportunities.owner_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
  -- Or manager can see explicit team member opportunities
  OR EXISTS (
    SELECT 1
    FROM public.manager_team_members mtm
    CROSS JOIN public.user_profiles me
    WHERE me.user_id = auth.uid() AND me.role = 'manager' 
      AND mtm.manager_id = me.id 
      AND EXISTS (
        SELECT 1 FROM public.user_profiles owner
        WHERE owner.id = mtm.account_manager_id AND owner.user_id = public.opportunities.owner_id
      )
  )
);

COMMIT;