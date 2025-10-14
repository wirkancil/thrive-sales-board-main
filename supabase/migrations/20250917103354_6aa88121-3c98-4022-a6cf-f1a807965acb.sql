-- Fix RLS policies for user_profiles to allow department managers and division heads to see account managers

-- Add policy for department managers to see account managers in their department
CREATE POLICY "department_managers_can_view_department_users" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Department managers can see users in their department
  (current_user_role() = 'department_manager' AND department_id = current_user_department_id())
  OR
  -- Division heads can see users in their division  
  (current_user_role() = 'division_head' AND division_id = current_user_division_id())
  OR
  -- Admins can see all users
  (current_user_role() = 'admin')
);

-- Add policy for admins to manage all user profiles
CREATE POLICY "admins_can_manage_all_users"
ON public.user_profiles
FOR ALL
USING (current_user_role() = 'admin')
WITH CHECK (current_user_role() = 'admin');