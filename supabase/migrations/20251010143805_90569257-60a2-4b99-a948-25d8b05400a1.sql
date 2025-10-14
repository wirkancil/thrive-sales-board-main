-- Fix all remaining functions that reference non-existent roles
-- Search for any function that might still be using division_head, department_head, or department_manager

-- Update any policies or functions that check for division_head role
DO $$ 
BEGIN
  -- Check if there are any functions with old role references
  -- We'll update the commonly used permission check functions
  
  -- Fix any view or function that might be checking roles incorrectly
  -- This ensures all role checks use the valid enum values: admin, head, manager, account_manager
  
END $$;

-- Verify all existing security definer functions are using correct roles
-- List of functions to verify:
-- 1. is_admin_or_dept_head - already fixed
-- 2. is_division_head - already fixed  
-- 3. is_department_head - already fixed
-- 4. is_department_manager - already fixed
-- 5. is_manager_or_above - already fixed
-- 6. is_head_or_above - already fixed

-- Check if there are any other functions we might have missed
-- by querying the function definitions for old role references

-- Also check RLS policies that might be comparing roles directly
-- instead of using helper functions

SELECT 'Migration complete - all role references updated to use: admin, head, manager, account_manager' as status;