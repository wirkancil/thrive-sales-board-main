-- Update RLS policy to include 'manager' role so they can view account managers in their department
DROP POLICY IF EXISTS "department_managers_can_view_department_users" ON user_profiles;

CREATE POLICY "department_managers_can_view_department_users" 
ON user_profiles 
FOR SELECT 
USING (
  (current_user_role() = 'department_manager'::text AND department_id = current_user_department_id()) OR
  (current_user_role() = 'manager'::text AND department_id = current_user_department_id()) OR
  (current_user_role() = 'division_head'::text AND division_id = current_user_division_id()) OR
  (current_user_role() = 'head'::text AND division_id = current_user_division_id()) OR
  (current_user_role() = 'admin'::text)
);