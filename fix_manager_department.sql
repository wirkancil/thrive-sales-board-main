-- Fix Manager department issue

-- Step 1: Check current state
SELECT 
  id,
  user_id,
  full_name,
  role,
  department_id,
  division_id,
  email
FROM user_profiles
WHERE role IN ('manager', 'account_manager')
ORDER BY role, full_name;

-- Step 2: Find staff2's department
-- (Replace this with actual department if you know it)

-- Step 3: Option A - Assign Manager to same department as staff2
-- UPDATE user_profiles
-- SET department_id = (
--   SELECT department_id FROM user_profiles WHERE full_name = 'staff2' AND role = 'account_manager' LIMIT 1
-- )
-- WHERE full_name = 'manager' AND role = 'manager';

-- Step 4: Option B - Create explicit mapping in manager_team_members
-- INSERT INTO manager_team_members (manager_id, account_manager_id)
-- SELECT 
--   (SELECT id FROM user_profiles WHERE full_name = 'manager' AND role = 'manager' LIMIT 1),
--   (SELECT id FROM user_profiles WHERE full_name = 'staff2' AND role = 'account_manager' LIMIT 1)
-- ON CONFLICT DO NOTHING;

-- Step 5: Verify the fix
-- SELECT 
--   m.full_name as manager_name,
--   m.department_id as manager_dept,
--   am.full_name as am_name,
--   am.department_id as am_dept
-- FROM user_profiles m
-- LEFT JOIN user_profiles am ON am.department_id = m.department_id AND am.role = 'account_manager'
-- WHERE m.role = 'manager' AND m.full_name = 'manager';
