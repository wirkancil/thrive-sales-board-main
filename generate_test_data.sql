-- ========================================
-- TEST DATA GENERATOR
-- Date: 2025-10-30
-- Purpose: Generate large test dataset for performance testing
-- WARNING: Only run in DEV/STAGING environment!
-- ========================================

-- ========================================
-- SAFETY CHECK
-- ========================================

-- Uncomment this line to enable test data generation
-- SET my.enable_test_data = 'true';

-- Safety check
DO $$
BEGIN
  IF current_setting('my.enable_test_data', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Test data generation is DISABLED. Set my.enable_test_data = ''true'' to enable.';
  END IF;
END $$;

-- ========================================
-- CLEANUP EXISTING TEST DATA (Optional)
-- ========================================

-- WARNING: This will delete ALL test data!
-- Uncomment to clean up before generating new data

/*
DELETE FROM sales_activity_v2 WHERE created_by IN (
  SELECT user_id FROM user_profiles WHERE email LIKE 'test%@test.com'
);

DELETE FROM pipeline_items WHERE opportunity_id IN (
  SELECT id FROM opportunities WHERE owner_id IN (
    SELECT user_id FROM user_profiles WHERE email LIKE 'test%@test.com'
  )
);

DELETE FROM projects WHERE opportunity_id IN (
  SELECT id FROM opportunities WHERE owner_id IN (
    SELECT user_id FROM user_profiles WHERE email LIKE 'test%@test.com'
  )
);

DELETE FROM opportunities WHERE owner_id IN (
  SELECT user_id FROM user_profiles WHERE email LIKE 'test%@test.com'
);

DELETE FROM sales_targets WHERE assigned_to IN (
  SELECT id FROM user_profiles WHERE email LIKE 'test%@test.com'
);

DELETE FROM manager_team_members WHERE manager_id IN (
  SELECT id FROM user_profiles WHERE email LIKE 'test%@test.com'
) OR account_manager_id IN (
  SELECT id FROM user_profiles WHERE email LIKE 'test%@test.com'
);

DELETE FROM user_profiles WHERE email LIKE 'test%@test.com';
*/

-- ========================================
-- SECTION 1: CREATE TEST ORGANIZATIONAL STRUCTURE
-- ========================================

-- Note: This assumes auth.users already exist
-- If not, you need to create them via Supabase Auth API first

-- Create test division
INSERT INTO divisions (id, name, code, is_active)
VALUES (
  gen_random_uuid(),
  'Test Division',
  'TEST',
  true
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Create test departments
INSERT INTO departments (id, name, code, division_id, is_active)
SELECT 
  gen_random_uuid(),
  'Test Department ' || i,
  'DEPT' || i,
  (SELECT id FROM divisions WHERE code = 'TEST' LIMIT 1),
  true
FROM generate_series(1, 3) i
ON CONFLICT DO NOTHING;

-- ========================================
-- SECTION 2: CREATE TEST USERS
-- ========================================

-- Create 1 Test Head
-- Note: Replace 'test-head-uuid' with actual auth.users UUID

/*
INSERT INTO user_profiles (
  id,
  user_id,
  email,
  full_name,
  role,
  division_id,
  is_active
)
VALUES (
  gen_random_uuid(),
  'test-head-uuid',  -- Replace with actual auth user UUID
  'test_head@test.com',
  'Test Head',
  'head',
  (SELECT id FROM divisions WHERE code = 'TEST'),
  true
);
*/

-- Create 3 Test Managers (one per department)
/*
WITH dept AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM departments
  WHERE division_id = (SELECT id FROM divisions WHERE code = 'TEST')
)
INSERT INTO user_profiles (
  id,
  user_id,
  email,
  full_name,
  role,
  division_id,
  department_id,
  is_active
)
SELECT 
  gen_random_uuid(),
  'test-manager-' || rn || '-uuid',  -- Replace with actual UUIDs
  'test_manager_' || rn || '@test.com',
  'Test Manager ' || rn,
  'manager',
  (SELECT id FROM divisions WHERE code = 'TEST'),
  dept.id,
  true
FROM dept;
*/

-- Create 20 Test Account Managers (distributed across departments)
/*
WITH dept AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as dept_num
  FROM departments
  WHERE division_id = (SELECT id FROM divisions WHERE code = 'TEST')
)
INSERT INTO user_profiles (
  id,
  user_id,
  email,
  full_name,
  role,
  division_id,
  department_id,
  is_active
)
SELECT 
  gen_random_uuid(),
  'test-am-' || i || '-uuid',  -- Replace with actual UUIDs
  'test_am_' || i || '@test.com',
  'Test AM ' || i,
  'account_manager',
  (SELECT id FROM divisions WHERE code = 'TEST'),
  (SELECT id FROM dept WHERE dept_num = ((i - 1) % 3 + 1)),
  true
FROM generate_series(1, 20) i;
*/

-- ========================================
-- SECTION 3: CREATE MANAGER-AM MAPPINGS
-- ========================================

/*
-- Map AMs to their managers
INSERT INTO manager_team_members (manager_id, account_manager_id)
SELECT 
  m.id as manager_id,
  am.id as account_manager_id
FROM user_profiles m
JOIN user_profiles am ON am.department_id = m.department_id
WHERE m.role = 'manager'
  AND am.role = 'account_manager'
  AND m.email LIKE 'test_manager%'
  AND am.email LIKE 'test_am%'
ON CONFLICT DO NOTHING;
*/

-- ========================================
-- SECTION 4: GENERATE TEST OPPORTUNITIES
-- ========================================

-- Create 100 opportunities per AM (2000 total)
/*
INSERT INTO opportunities (
  id,
  name,
  amount,
  currency,
  stage,
  status,
  is_won,
  is_closed,
  expected_close_date,
  owner_id,
  created_by,
  created_at
)
SELECT 
  gen_random_uuid(),
  'Test Opportunity ' || (am.rn * 100 + i),
  (RANDOM() * 1000000)::numeric,
  'IDR',
  CASE 
    WHEN RANDOM() < 0.2 THEN 'Closed Won'
    WHEN RANDOM() < 0.4 THEN 'Proposal'
    WHEN RANDOM() < 0.6 THEN 'Negotiation'
    WHEN RANDOM() < 0.8 THEN 'Qualified'
    ELSE 'Prospecting'
  END,
  CASE WHEN RANDOM() < 0.2 THEN 'won' ELSE 'open' END,
  RANDOM() < 0.2,
  RANDOM() < 0.3,
  CURRENT_DATE + (RANDOM() * 365)::int,
  am.user_id,
  am.user_id,
  CURRENT_TIMESTAMP - (RANDOM() * 180 || ' days')::interval
FROM (
  SELECT 
    user_id, 
    ROW_NUMBER() OVER (ORDER BY email) as rn
  FROM user_profiles
  WHERE email LIKE 'test_am%'
) am
CROSS JOIN generate_series(1, 100) i;
*/

-- ========================================
-- SECTION 5: GENERATE TEST ACTIVITIES
-- ========================================

-- Create 100 activities per AM (2000 total)
/*
INSERT INTO sales_activity_v2 (
  id,
  activity_type,
  customer_id,
  scheduled_at,
  status,
  notes,
  created_by,
  created_at
)
SELECT 
  gen_random_uuid(),
  (ARRAY['call', 'meeting_online', 'visit', 'go_show'])[floor(RANDOM() * 4 + 1)],
  (SELECT id FROM organizations LIMIT 1 OFFSET floor(RANDOM() * 10)),
  CURRENT_TIMESTAMP + (RANDOM() * 60 - 30 || ' days')::interval,
  (ARRAY['scheduled', 'done', 'canceled'])[floor(RANDOM() * 3 + 1)],
  'Test activity notes ' || i,
  am.user_id,
  CURRENT_TIMESTAMP - (RANDOM() * 90 || ' days')::interval
FROM (
  SELECT user_id
  FROM user_profiles
  WHERE email LIKE 'test_am%'
) am
CROSS JOIN generate_series(1, 100) i;
*/

-- ========================================
-- SECTION 6: GENERATE TEST PROJECTS
-- ========================================

-- Create projects for 20% of won opportunities
/*
INSERT INTO projects (
  id,
  project_name,
  po_number,
  po_amount,
  opportunity_id,
  created_at
)
SELECT 
  gen_random_uuid(),
  'Test Project ' || o.id,
  'PO-' || LPAD((ROW_NUMBER() OVER ())::text, 6, '0'),
  o.amount,
  o.id,
  o.created_at + interval '1 day'
FROM opportunities o
WHERE o.is_won = true
  AND o.owner_id IN (
    SELECT user_id FROM user_profiles WHERE email LIKE 'test_am%'
  )
  AND RANDOM() < 0.5;
*/

-- ========================================
-- SECTION 7: GENERATE SALES TARGETS
-- ========================================

-- Create quarterly targets for all AMs
/*
WITH quarters AS (
  SELECT 
    generate_series(
      DATE_TRUNC('quarter', CURRENT_DATE - interval '1 year'),
      DATE_TRUNC('quarter', CURRENT_DATE + interval '1 year'),
      interval '3 months'
    ) as quarter_start
)
INSERT INTO sales_targets (
  id,
  assigned_to,
  assigned_by,
  target_type,
  amount,
  period_start,
  period_end,
  created_at
)
SELECT 
  gen_random_uuid(),
  am.id,
  m.id,
  tt.target_type,
  CASE 
    WHEN tt.target_type = 'revenue' THEN 50000000 + (RANDOM() * 50000000)::numeric
    ELSE 5000000 + (RANDOM() * 5000000)::numeric
  END,
  q.quarter_start,
  q.quarter_start + interval '3 months' - interval '1 day',
  q.quarter_start
FROM user_profiles am
JOIN user_profiles m ON m.department_id = am.department_id AND m.role = 'manager'
CROSS JOIN quarters q
CROSS JOIN (VALUES ('revenue'), ('margin')) AS tt(target_type)
WHERE am.role = 'account_manager'
  AND am.email LIKE 'test_am%'
  AND m.email LIKE 'test_manager%';
*/

-- ========================================
-- SECTION 8: GENERATE PIPELINE ITEMS
-- ========================================

-- Create pipeline items for opportunities
/*
INSERT INTO pipeline_items (
  id,
  opportunity_id,
  pipeline_id,
  amount,
  cost_of_goods,
  service_costs,
  other_expenses,
  status,
  created_at
)
SELECT 
  gen_random_uuid(),
  o.id,
  (SELECT id FROM pipelines LIMIT 1),
  o.amount,
  (o.amount * (0.3 + RANDOM() * 0.2))::numeric,
  (o.amount * (0.1 + RANDOM() * 0.1))::numeric,
  (o.amount * (0.05 + RANDOM() * 0.05))::numeric,
  CASE WHEN o.is_won THEN 'won' ELSE 'open' END,
  o.created_at
FROM opportunities o
WHERE o.owner_id IN (
  SELECT user_id FROM user_profiles WHERE email LIKE 'test_am%'
);
*/

-- ========================================
-- SECTION 9: VERIFICATION
-- ========================================

-- Verify test data was created
SELECT 
  'Test Users' as category,
  COUNT(*) as count
FROM user_profiles
WHERE email LIKE 'test%@test.com'

UNION ALL

SELECT 
  'Test Opportunities',
  COUNT(*)
FROM opportunities
WHERE owner_id IN (
  SELECT user_id FROM user_profiles WHERE email LIKE 'test%@test.com'
)

UNION ALL

SELECT 
  'Test Activities',
  COUNT(*)
FROM sales_activity_v2
WHERE created_by IN (
  SELECT user_id FROM user_profiles WHERE email LIKE 'test%@test.com'
)

UNION ALL

SELECT 
  'Test Projects',
  COUNT(*)
FROM projects
WHERE opportunity_id IN (
  SELECT id FROM opportunities WHERE owner_id IN (
    SELECT user_id FROM user_profiles WHERE email LIKE 'test%@test.com'
  )
)

UNION ALL

SELECT 
  'Test Targets',
  COUNT(*)
FROM sales_targets
WHERE assigned_to IN (
  SELECT id FROM user_profiles WHERE email LIKE 'test%@test.com'
);

-- ========================================
-- IMPORTANT NOTES:
-- ========================================

/*
1. SAFETY:
   - Only run in DEV/STAGING
   - Never run in PRODUCTION
   - Enable safety check before running

2. PREREQUISITES:
   - Create auth.users first via Supabase Auth
   - Replace all UUID placeholders
   - Ensure organizations table has data

3. CUSTOMIZATION:
   - Adjust counts in generate_series()
   - Modify RANDOM() distributions
   - Change date ranges as needed

4. CLEANUP:
   - Uncomment cleanup section to remove test data
   - Run cleanup before re-generating

5. PERFORMANCE:
   - Generating 2000+ records may take 1-5 minutes
   - Run in batches if needed
   - Monitor database CPU/memory

6. TESTING FLOW:
   a. Create test org structure
   b. Create test users (via Supabase Auth + user_profiles)
   c. Create manager-AM mappings
   d. Generate opportunities (100 per AM)
   e. Generate activities (100 per AM)
   f. Generate projects (for won opps)
   g. Generate targets
   h. Verify counts
   i. Run performance tests
*/

