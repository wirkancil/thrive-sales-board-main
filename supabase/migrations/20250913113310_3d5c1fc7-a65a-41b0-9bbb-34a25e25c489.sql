-- Update existing sales targets to have proper division_id and department_id
UPDATE sales_targets 
SET 
  division_id = (
    SELECT division_id 
    FROM user_profiles 
    WHERE user_profiles.id = sales_targets.assigned_to
  ),
  department_id = (
    SELECT department_id 
    FROM user_profiles 
    WHERE user_profiles.id = sales_targets.assigned_to
  )
WHERE division_id IS NULL AND department_id IS NULL;