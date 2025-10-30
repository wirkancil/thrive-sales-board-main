-- QUICK FIX: Link Manager to Account Manager (staff2)

-- Step 1: Check current profiles
SELECT 
  id,
  full_name,
  role,
  department_id,
  email
FROM user_profiles
WHERE full_name IN ('manager', 'staff2')
ORDER BY role;

-- Step 2: Create mapping in manager_team_members
-- This will allow Manager to see staff2's data
INSERT INTO manager_team_members (manager_id, account_manager_id)
SELECT 
  (SELECT id FROM user_profiles WHERE full_name = 'manager' AND role = 'manager' LIMIT 1) as manager_id,
  (SELECT id FROM user_profiles WHERE full_name = 'staff2' AND role = 'account_manager' LIMIT 1) as account_manager_id
WHERE NOT EXISTS (
  SELECT 1 FROM manager_team_members 
  WHERE manager_id = (SELECT id FROM user_profiles WHERE full_name = 'manager' AND role = 'manager' LIMIT 1)
    AND account_manager_id = (SELECT id FROM user_profiles WHERE full_name = 'staff2' AND role = 'account_manager' LIMIT 1)
);

-- Step 3: Verify the mapping
SELECT 
  m.full_name as manager_name,
  m.email as manager_email,
  am.full_name as am_name,
  am.email as am_email
FROM manager_team_members mtm
JOIN user_profiles m ON m.id = mtm.manager_id
JOIN user_profiles am ON am.id = mtm.account_manager_id
WHERE m.full_name = 'manager';
