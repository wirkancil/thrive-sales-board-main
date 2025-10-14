-- Fix infinite recursion in user_profiles RLS policies

-- Drop all existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Managers can view department account managers" ON public.user_profiles;
DROP POLICY IF EXISTS "Heads can view division users" ON public.user_profiles;

-- Create security definer functions to safely access user profile data
CREATE OR REPLACE FUNCTION public.get_current_user_role_info()
RETURNS TABLE(user_role text, department_id uuid, division_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text, department_id, division_id 
  FROM user_profiles 
  WHERE id = auth.uid();
$$;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Now create safe RLS policies using the security definer functions

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (public.is_current_user_admin());

-- Managers can view account managers in their department
CREATE POLICY "Managers can view department account managers" 
ON public.user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_current_user_role_info() AS current_user_info
    WHERE current_user_info.user_role = 'manager' 
    AND current_user_info.department_id = user_profiles.department_id
    AND user_profiles.role = 'account_manager'
  )
);

-- Heads can view users in their division
CREATE POLICY "Heads can view division users" 
ON public.user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_current_user_role_info() AS current_user_info
    WHERE current_user_info.user_role = 'head' 
    AND current_user_info.division_id = user_profiles.division_id
  )
);

-- Grant execute permissions on the security definer functions
GRANT EXECUTE ON FUNCTION public.get_current_user_role_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;