-- ========================================
-- RLS POLICY VERIFICATION TESTS
-- Date: 2025-10-30
-- Purpose: Verify Row Level Security is working correctly
-- ========================================

-- ========================================
-- TEST 1: VERIFY MANAGER ISOLATION
-- Manager should ONLY see their department
-- ========================================

-- Step 1: Get all departments
SELECT 
  department_id,
  COUNT(*) as user_count,
  STRING_AGG(full_name, ', ') as users
FROM user_profiles
WHERE department_id IS NOT NULL
GROUP BY department_id
ORDER BY user_count DESC;

-- Step 2: Verify Manager A cannot see Manager B's data
-- Replace [MANAGER_A_USER_ID] and [MANAGER_B_USER_ID] with actual IDs

-- Get Manager A's department
SELECT 
  id,
  full_name,
  role,
  department_id,
  division_id
FROM user_profiles
WHERE user_id = '[MANAGER_A_USER_ID]';

-- Get all users in Manager A's department
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.department_id,
  COUNT(o.id) as opportunity_count,
  COUNT(sa.id) as activity_count
FROM user_profiles up
LEFT JOIN opportunities o ON o.owner_id = up.user_id
LEFT JOIN sales_activity_v2 sa ON sa.created_by = up.user_id
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE user_id = '[MANAGER_A_USER_ID]'
)
GROUP BY up.id, up.full_name, up.role, up.department_id
ORDER BY up.role, up.full_name;

-- Verify Manager B's data is NOT included
-- This should return 0 rows if RLS is working
SELECT 
  o.id,
  o.name,
  o.owner_id,
  up.full_name,
  up.department_id
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE user_id = '[MANAGER_B_USER_ID]'
)
  AND o.owner_id NOT IN (
    SELECT user_id 
    FROM user_profiles 
    WHERE department_id = (
      SELECT department_id 
      FROM user_profiles 
      WHERE user_id = '[MANAGER_A_USER_ID]'
    )
  );

-- ========================================
-- TEST 2: VERIFY ACCOUNT MANAGER ISOLATION
-- AM should ONLY see their own data
-- ========================================

-- Step 1: Get AM's own data
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.user_id,
  COUNT(o.id) as my_opportunities,
  COUNT(sa.id) as my_activities
FROM user_profiles up
LEFT JOIN opportunities o ON o.owner_id = up.user_id
LEFT JOIN sales_activity_v2 sa ON sa.created_by = up.user_id
WHERE up.user_id = '[AM1_USER_ID]'
GROUP BY up.id, up.full_name, up.role, up.user_id;

-- Step 2: Verify AM cannot see other AMs' data in same department
-- This should return ONLY AM1's opportunities
SELECT 
  o.id,
  o.name,
  o.amount,
  o.owner_id,
  up.full_name,
  up.department_id
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE user_id = '[AM1_USER_ID]'
)
  AND o.owner_id = '[AM1_USER_ID]'
ORDER BY o.created_at DESC;

-- Step 3: Count opportunities in department
-- AM should see fewer than this count
SELECT 
  up.department_id,
  COUNT(o.id) as total_dept_opportunities,
  COUNT(DISTINCT o.owner_id) as unique_owners
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE user_id = '[AM1_USER_ID]'
)
GROUP BY up.department_id;

-- ========================================
-- TEST 3: VERIFY HEAD DIVISION ISOLATION
-- Head should ONLY see their division
-- ========================================

-- Step 1: Get Head's division
SELECT 
  id,
  full_name,
  role,
  division_id,
  entity_id
FROM user_profiles
WHERE user_id = '[HEAD1_USER_ID]';

-- Step 2: Get all managers in Head's division
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.division_id,
  up.department_id,
  COUNT(o.id) as opportunity_count
FROM user_profiles up
LEFT JOIN opportunities o ON o.owner_id = up.user_id
WHERE up.role = 'manager'
  AND up.division_id = (
    SELECT division_id 
    FROM user_profiles 
    WHERE user_id = '[HEAD1_USER_ID]'
  )
GROUP BY up.id, up.full_name, up.role, up.division_id, up.department_id
ORDER BY up.full_name;

-- Step 3: Verify other divisions are NOT visible
-- This should return 0 rows if RLS is working
SELECT 
  up.id,
  up.full_name,
  up.division_id
FROM user_profiles up
WHERE up.role = 'manager'
  AND up.division_id != (
    SELECT division_id 
    FROM user_profiles 
    WHERE user_id = '[HEAD1_USER_ID]'
  )
  AND up.division_id IS NOT NULL;

-- ========================================
-- TEST 4: VERIFY ACTIVITIES RLS
-- ========================================

-- Manager should see team activities
SELECT 
  sa.id,
  sa.activity_type,
  sa.created_by,
  up.full_name,
  up.role,
  up.department_id,
  sa.scheduled_at
FROM sales_activity_v2 sa
JOIN user_profiles up ON up.user_id = sa.created_by
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE user_id = '[MANAGER_USER_ID]'
)
ORDER BY sa.scheduled_at DESC
LIMIT 20;

-- AM should only see own activities
SELECT 
  sa.id,
  sa.activity_type,
  sa.created_by,
  up.full_name,
  sa.scheduled_at
FROM sales_activity_v2 sa
JOIN user_profiles up ON up.user_id = sa.created_by
WHERE sa.created_by = '[AM_USER_ID]'
ORDER BY sa.scheduled_at DESC
LIMIT 20;

-- ========================================
-- TEST 5: VERIFY SALES TARGETS RLS
-- ========================================

-- Manager should see own targets + assigned AM targets
SELECT 
  st.id,
  st.assigned_to,
  up.full_name,
  up.role,
  st.target_type,
  st.amount,
  st.period_start,
  st.period_end
FROM sales_targets st
JOIN user_profiles up ON up.id = st.assigned_to
WHERE st.assigned_by = (
  SELECT id 
  FROM user_profiles 
  WHERE user_id = '[MANAGER_USER_ID]'
)
  OR st.assigned_to = (
    SELECT id 
    FROM user_profiles 
    WHERE user_id = '[MANAGER_USER_ID]'
  )
ORDER BY st.created_at DESC;

-- AM should only see own targets
SELECT 
  st.id,
  st.target_type,
  st.amount,
  st.period_start,
  st.period_end,
  st.assigned_by,
  up.full_name as assigned_by_name
FROM sales_targets st
JOIN user_profiles up ON up.id = st.assigned_by
WHERE st.assigned_to = (
  SELECT id 
  FROM user_profiles 
  WHERE user_id = '[AM_USER_ID]'
)
ORDER BY st.period_start DESC;

-- ========================================
-- TEST 6: VERIFY PROJECTS RLS
-- ========================================

-- Manager should see team projects
SELECT 
  p.id,
  p.project_name,
  p.po_amount,
  p.opportunity_id,
  o.owner_id,
  up.full_name as owner_name,
  up.department_id
FROM projects p
JOIN opportunities o ON o.id = p.opportunity_id
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE user_id = '[MANAGER_USER_ID]'
)
ORDER BY p.created_at DESC
LIMIT 20;

-- AM should only see own projects
SELECT 
  p.id,
  p.project_name,
  p.po_amount,
  p.opportunity_id,
  o.owner_id
FROM projects p
JOIN opportunities o ON o.id = p.opportunity_id
WHERE o.owner_id = '[AM_USER_ID]'
ORDER BY p.created_at DESC;

-- ========================================
-- SUMMARY REPORT: RLS COMPLIANCE
-- ========================================

-- Check all RLS policies are enabled
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'opportunities',
    'sales_activity_v2',
    'sales_targets',
    'projects',
    'pipeline_items'
  )
ORDER BY tablename, policyname;

-- Check RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'opportunities',
    'sales_activity_v2',
    'sales_targets',
    'projects',
    'pipeline_items'
  )
ORDER BY tablename;

-- ========================================
-- PERFORMANCE CHECK: Count records per role
-- ========================================

-- Count visible records for each role
WITH role_counts AS (
  SELECT 
    up.role,
    COUNT(DISTINCT up.id) as user_count,
    COUNT(DISTINCT o.id) as opportunity_count,
    COUNT(DISTINCT sa.id) as activity_count,
    COUNT(DISTINCT st.id) as target_count,
    COUNT(DISTINCT p.id) as project_count
  FROM user_profiles up
  LEFT JOIN opportunities o ON o.owner_id = up.user_id
  LEFT JOIN sales_activity_v2 sa ON sa.created_by = up.user_id
  LEFT JOIN sales_targets st ON st.assigned_to = up.id
  LEFT JOIN projects p ON p.opportunity_id = o.id
  GROUP BY up.role
)
SELECT 
  role,
  user_count,
  opportunity_count,
  activity_count,
  target_count,
  project_count,
  (opportunity_count + activity_count + target_count + project_count) as total_records
FROM role_counts
ORDER BY total_records DESC;

-- ========================================
-- INSTRUCTIONS FOR USE:
-- ========================================

/*
1. Replace all [PLACEHOLDER] values with actual user_ids/profile_ids:
   - [MANAGER_A_USER_ID]
   - [MANAGER_B_USER_ID]
   - [AM1_USER_ID]
   - [HEAD1_USER_ID]
   - [MANAGER_USER_ID]
   - [AM_USER_ID]

2. Run each test section sequentially

3. Document results:
   ✅ PASS: Expected isolation confirmed
   ❌ FAIL: Data leakage detected

4. If any test FAILS:
   - Review RLS policies in Supabase
   - Check user_profiles department_id/division_id assignments
   - Verify manager_team_members mappings

5. Expected Results:
   - Manager sees: Own + Team (5-10 users)
   - AM sees: Only own data (1 user)
   - Head sees: All division (10-100 users)
*/

