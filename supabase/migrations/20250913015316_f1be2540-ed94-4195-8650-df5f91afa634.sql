-- Fix infinite recursion in user_profiles RLS policies
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Division heads can view division members" ON public.user_profiles;
DROP POLICY IF EXISTS "Department heads can view department members" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins and dept heads can update roles" ON public.user_profiles;

-- Create simple, non-recursive policies
-- Users can view their own profile (simple, no role checks)
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile (but not role changes, handled by trigger)
CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid());

-- Allow inserts for new users (handled by trigger after signup)
CREATE POLICY "Allow profile creation" 
ON public.user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Create a security definer function to check if user can view other profiles
CREATE OR REPLACE FUNCTION public.can_view_user_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User can view their own profile
    SELECT 1 WHERE target_user_id = auth.uid()
    
    UNION
    
    -- Admins can view all profiles
    SELECT 1 
    FROM public.user_profiles curr_user
    WHERE curr_user.id = auth.uid()
      AND curr_user.role = 'admin'
    
    UNION
    
    -- Division heads can view profiles in their division
    SELECT 1 
    FROM public.user_profiles curr_user, public.user_profiles target_user
    WHERE curr_user.id = auth.uid()
      AND target_user.id = target_user_id
      AND curr_user.role = 'division_head'
      AND curr_user.division_id = target_user.division_id
      AND curr_user.division_id IS NOT NULL
    
    UNION
    
    -- Department heads can view profiles in their department
    SELECT 1 
    FROM public.user_profiles curr_user, public.user_profiles target_user
    WHERE curr_user.id = auth.uid()
      AND target_user.id = target_user_id
      AND curr_user.role = 'department_head'
      AND curr_user.department_id = target_user.department_id
      AND curr_user.department_id IS NOT NULL
    
    UNION
    
    -- Department heads can view profiles in divisions under their department
    SELECT 1 
    FROM public.user_profiles curr_user, public.user_profiles target_user, public.divisions div
    WHERE curr_user.id = auth.uid()
      AND target_user.id = target_user_id
      AND curr_user.role = 'department_head'
      AND target_user.division_id = div.id
      AND div.department_id = curr_user.department_id
      AND curr_user.department_id IS NOT NULL
  );
$$;

-- Create policy for admins to view all profiles using the function
CREATE POLICY "Authorized users can view profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (public.can_view_user_profile(id));