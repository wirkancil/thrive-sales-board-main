-- Verify Manager and staff2 are in the same department

SELECT 
  up.id,
  up.user_id,
  up.full_name,
  up.email,
  up.role,
  up.department_id,
  up.division_id,
  d.name as department_name,
  div.name as division_name
FROM user_profiles up
LEFT JOIN departments d ON d.id = up.department_id
LEFT JOIN divisions div ON div.id = up.division_id
WHERE up.full_name IN ('manager', 'staff2')
ORDER BY up.role;

-- Check if there's explicit mapping in manager_team_members
SELECT 
  mtm.id,
  m.full_name as manager_name,
  m.department_id as manager_dept,
  am.full_name as am_name,
  am.department_id as am_dept,
  (m.department_id = am.department_id) as same_department
FROM manager_team_members mtm
JOIN user_profiles m ON m.id = mtm.manager_id
JOIN user_profiles am ON am.id = mtm.account_manager_id
WHERE m.full_name = 'manager' OR am.full_name = 'staff2';

-- Check staff2's opportunities
SELECT 
  o.id,
  o.name,
  o.amount,
  o.stage,
  o.status,
  o.is_won,
  o.owner_id,
  up.full_name as owner_name,
  up.role
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2'
ORDER BY o.created_at DESC;
