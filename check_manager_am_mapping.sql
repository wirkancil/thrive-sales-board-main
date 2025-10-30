-- Check Manager and Account Manager relationship
-- Replace 'manager@example.com' and 'staff2@example.com' with actual emails

-- 1. Check Manager and staff2 profiles
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

-- 2. Check manager_team_members mapping
SELECT 
  mtm.id,
  m.full_name as manager_name,
  m.email as manager_email,
  am.full_name as am_name,
  am.email as am_email,
  m.department_id as mgr_dept,
  am.department_id as am_dept
FROM manager_team_members mtm
JOIN user_profiles m ON m.id = mtm.manager_id
JOIN user_profiles am ON am.id = mtm.account_manager_id;

-- 3. Check opportunities owned by staff2
SELECT 
  o.id,
  o.name,
  o.amount,
  o.stage,
  o.status,
  o.is_won,
  o.owner_id,
  up.full_name as owner_name,
  up.role as owner_role
FROM opportunities o
LEFT JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.role = 'account_manager' AND up.full_name LIKE '%staff2%'
ORDER BY o.created_at DESC
LIMIT 10;
