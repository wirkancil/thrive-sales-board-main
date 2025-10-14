-- Phase 2: Fix data consistency issues

-- First, update departments to have proper division_id foreign keys based on their managers
UPDATE public.departments 
SET division_id = (
  SELECT up.division_id 
  FROM public.user_profiles up 
  WHERE up.department_id = departments.id 
    AND up.role = 'department_manager' 
  LIMIT 1
)
WHERE division_id IS NULL;

-- Update account managers to inherit division_id from their department
UPDATE public.user_profiles 
SET division_id = (
  SELECT d.division_id 
  FROM public.departments d 
  WHERE d.id = user_profiles.department_id
)
WHERE role = 'account_manager' 
  AND division_id IS NULL 
  AND department_id IS NOT NULL;

-- Verify the changes by checking account managers
-- This is just a comment for verification after migration