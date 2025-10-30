-- Assign Manager to same department as staff2

-- Step 1: Check current state
SELECT 
  full_name,
  role,
  department_id,
  division_id,
  email
FROM user_profiles
WHERE full_name IN ('manager', 'staff2')
ORDER BY role;

-- Step 2: Update Manager's department to match staff2
-- (Uncomment after verifying Step 1)
-- UPDATE user_profiles
-- SET 
--   department_id = (SELECT department_id FROM user_profiles WHERE full_name = 'staff2' LIMIT 1),
--   division_id = (SELECT division_id FROM user_profiles WHERE full_name = 'staff2' LIMIT 1)
-- WHERE full_name = 'manager' AND role = 'manager';

-- Step 3: Verify
-- SELECT 
--   full_name,
--   role,
--   department_id,
--   division_id
-- FROM user_profiles
-- WHERE full_name IN ('manager', 'staff2')
-- ORDER BY role;
