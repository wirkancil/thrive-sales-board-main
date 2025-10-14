-- Fix RLS policies for user_profiles table so managers can see account managers in their department

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can view profiles in their department" ON public.user_profiles;
DROP POLICY IF EXISTS "Managers can view team members" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Managers can view department account managers" ON public.user_profiles;
DROP POLICY IF EXISTS "Heads can view division users" ON public.user_profiles;

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (public.check_is_admin());

-- Managers can view account managers in their department
CREATE POLICY "Managers can view department account managers" 
ON public.user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles manager 
    WHERE manager.id = auth.uid() 
    AND manager.role = 'manager' 
    AND manager.department_id = user_profiles.department_id
    AND user_profiles.role = 'account_manager'
  )
);

-- Heads can view users in their division
CREATE POLICY "Heads can view division users" 
ON public.user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles head 
    WHERE head.id = auth.uid() 
    AND head.role = 'head' 
    AND head.division_id = user_profiles.division_id
  )
);

-- Fix the current user's division_id since it's null but should be inherited from department
UPDATE public.user_profiles 
SET division_id = (
  SELECT d.division_id 
  FROM departments d 
  WHERE d.id = user_profiles.department_id
)
WHERE id = '033b3121-747b-46bb-bc86-aee23e24e4d5' 
  AND division_id IS NULL 
  AND department_id IS NOT NULL;