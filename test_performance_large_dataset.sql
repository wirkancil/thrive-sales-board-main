-- ========================================
-- PERFORMANCE TESTING SCRIPTS
-- Date: 2025-10-30
-- Purpose: Test system performance with large datasets
-- ========================================

-- ========================================
-- SECTION 1: CHECK CURRENT DATA VOLUME
-- ========================================

-- Overall data summary
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN role = 'head' THEN 1 END) as heads,
  COUNT(CASE WHEN role = 'manager' THEN 1 END) as managers,
  COUNT(CASE WHEN role = 'account_manager' THEN 1 END) as account_managers,
  COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff
FROM user_profiles

UNION ALL

SELECT 
  'opportunities',
  COUNT(*),
  COUNT(CASE WHEN is_won = true THEN 1 END),
  COUNT(CASE WHEN is_closed = true THEN 1 END),
  COUNT(CASE WHEN status = 'open' THEN 1 END),
  NULL
FROM opportunities

UNION ALL

SELECT 
  'sales_activity_v2',
  COUNT(*),
  COUNT(CASE WHEN status = 'done' THEN 1 END),
  COUNT(CASE WHEN status = 'scheduled' THEN 1 END),
  COUNT(CASE WHEN status = 'canceled' THEN 1 END),
  NULL
FROM sales_activity_v2

UNION ALL

SELECT 
  'projects',
  COUNT(*),
  SUM(po_amount::numeric),
  NULL,
  NULL,
  NULL
FROM projects

UNION ALL

SELECT 
  'sales_targets',
  COUNT(*),
  COUNT(CASE WHEN target_type = 'revenue' THEN 1 END),
  COUNT(CASE WHEN target_type = 'margin' THEN 1 END),
  NULL,
  NULL
FROM sales_targets;

-- ========================================
-- SECTION 2: PERFORMANCE BENCHMARKS
-- ========================================

-- Test 1: Strategic Dashboard Query (Head Level)
-- Fetch all managers in division

EXPLAIN ANALYZE
SELECT 
  up.id,
  up.full_name,
  up.department_id,
  COUNT(DISTINCT o.id) as opportunity_count,
  SUM(o.amount) as total_revenue
FROM user_profiles up
LEFT JOIN opportunities o ON o.owner_id = up.user_id
WHERE up.role = 'manager'
  AND up.division_id = (
    SELECT division_id 
    FROM user_profiles 
    WHERE role = 'head' 
    LIMIT 1
  )
  AND up.is_active = true
GROUP BY up.id, up.full_name, up.department_id
ORDER BY up.full_name;

-- Test 2: Activities Query (Manager Level)
-- Fetch all team activities

EXPLAIN ANALYZE
SELECT 
  sa.id,
  sa.activity_type,
  sa.scheduled_at,
  sa.status,
  sa.created_by,
  up.full_name
FROM sales_activity_v2 sa
JOIN user_profiles up ON up.user_id = sa.created_by
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE role = 'manager' 
  LIMIT 1
)
ORDER BY sa.scheduled_at DESC
LIMIT 100;

-- Test 3: Calendar Query (Manager Level)
-- Fetch team calendar for current month

EXPLAIN ANALYZE
SELECT 
  sa.id,
  sa.activity_type,
  sa.scheduled_at,
  sa.created_by,
  up.full_name
FROM sales_activity_v2 sa
JOIN user_profiles up ON up.user_id = sa.created_by
WHERE up.department_id = (
  SELECT department_id 
  FROM user_profiles 
  WHERE role = 'manager' 
  LIMIT 1
)
  AND sa.scheduled_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND sa.scheduled_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND sa.scheduled_at IS NOT NULL
ORDER BY sa.scheduled_at ASC;

-- Test 4: Sales Summary Query (Head Level)
-- Aggregate revenue from all division

EXPLAIN ANALYZE
SELECT 
  SUM(COALESCE(p.po_amount, o.amount)) as total_revenue,
  COUNT(DISTINCT o.id) as deals_closed,
  COUNT(DISTINCT o.owner_id) as unique_owners,
  AVG(COALESCE(p.po_amount, o.amount)) as avg_deal_size
FROM opportunities o
LEFT JOIN projects p ON p.opportunity_id = o.id
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE o.is_won = true
  AND up.division_id = (
    SELECT division_id 
    FROM user_profiles 
    WHERE role = 'head' 
    LIMIT 1
  );

-- Test 5: Team Dashboard Query (Manager Level)
-- Fetch team performance

EXPLAIN ANALYZE
WITH team_members AS (
  SELECT user_id, id, full_name
  FROM user_profiles
  WHERE department_id = (
    SELECT department_id 
    FROM user_profiles 
    WHERE role = 'manager' 
    LIMIT 1
  )
  AND role IN ('account_manager', 'staff')
)
SELECT 
  tm.id,
  tm.full_name,
  COUNT(DISTINCT o.id) as opportunity_count,
  SUM(COALESCE(p.po_amount, o.amount)) as revenue,
  SUM(
    COALESCE(pi.cost_of_goods, 0) + 
    COALESCE(pi.service_costs, 0) + 
    COALESCE(pi.other_expenses, 0)
  ) as total_costs
FROM team_members tm
LEFT JOIN opportunities o ON o.owner_id = tm.user_id AND o.is_won = true
LEFT JOIN projects p ON p.opportunity_id = o.id
LEFT JOIN pipeline_items pi ON pi.opportunity_id = o.id AND pi.status = 'won'
GROUP BY tm.id, tm.full_name
ORDER BY revenue DESC NULLS LAST;

-- ========================================
-- SECTION 3: INDEX RECOMMENDATIONS
-- ========================================

-- Check existing indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'opportunities',
    'sales_activity_v2',
    'sales_targets',
    'projects',
    'pipeline_items'
  )
ORDER BY tablename, indexname;

-- Recommended indexes for performance
-- (Run these if not already created)

-- Index for manager filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_division_role 
ON user_profiles(division_id, role) 
WHERE is_active = true;

-- Index for department filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_department_role 
ON user_profiles(department_id, role) 
WHERE is_active = true;

-- Index for activities by user
CREATE INDEX IF NOT EXISTS idx_sales_activity_created_by_scheduled 
ON sales_activity_v2(created_by, scheduled_at DESC);

-- Index for opportunities by owner
CREATE INDEX IF NOT EXISTS idx_opportunities_owner_won 
ON opportunities(owner_id, is_won);

-- Index for projects by opportunity
CREATE INDEX IF NOT EXISTS idx_projects_opportunity 
ON projects(opportunity_id);

-- Index for pipeline items
CREATE INDEX IF NOT EXISTS idx_pipeline_items_opportunity_status 
ON pipeline_items(opportunity_id, status);

-- ========================================
-- SECTION 4: SLOW QUERY DETECTION
-- ========================================

-- Find slow queries (requires pg_stat_statements extension)
-- Enable first: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%sales_activity%'
   OR query LIKE '%opportunities%'
   OR query LIKE '%user_profiles%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ========================================
-- SECTION 5: TABLE STATISTICS
-- ========================================

-- Analyze table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
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
ORDER BY size_bytes DESC;

-- ========================================
-- SECTION 6: STRESS TEST QUERIES
-- ========================================

-- Stress Test 1: Large team activities (simulate 20 AMs)
WITH large_team AS (
  SELECT user_id
  FROM user_profiles
  WHERE role IN ('account_manager', 'staff')
  LIMIT 20
)
SELECT 
  COUNT(*) as total_activities,
  COUNT(DISTINCT sa.created_by) as unique_users,
  MIN(sa.scheduled_at) as earliest,
  MAX(sa.scheduled_at) as latest,
  pg_size_pretty(pg_total_relation_size('sales_activity_v2')) as table_size
FROM sales_activity_v2 sa
WHERE sa.created_by IN (SELECT user_id FROM large_team);

-- Stress Test 2: Large opportunities dataset
WITH large_team AS (
  SELECT user_id
  FROM user_profiles
  WHERE role IN ('account_manager', 'staff')
  LIMIT 20
)
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(CASE WHEN is_won THEN 1 END) as won_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(DISTINCT owner_id) as unique_owners
FROM opportunities
WHERE owner_id IN (SELECT user_id FROM large_team);

-- Stress Test 3: Calendar month view (750 events simulation)
SELECT 
  DATE_TRUNC('month', scheduled_at) as month,
  COUNT(*) as event_count,
  COUNT(DISTINCT created_by) as unique_users
FROM sales_activity_v2
WHERE scheduled_at >= CURRENT_DATE - INTERVAL '6 months'
  AND scheduled_at < CURRENT_DATE + INTERVAL '6 months'
  AND scheduled_at IS NOT NULL
GROUP BY DATE_TRUNC('month', scheduled_at)
ORDER BY month DESC;

-- ========================================
-- SECTION 7: CACHE PERFORMANCE
-- ========================================

-- Check cache hit ratios
SELECT 
  'index hit rate' as metric,
  (sum(idx_blks_hit)) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) * 100 as hit_rate
FROM pg_statio_user_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'table hit rate',
  (sum(heap_blks_hit)) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0) * 100
FROM pg_statio_user_tables
WHERE schemaname = 'public';

-- ========================================
-- SECTION 8: PERFORMANCE RECOMMENDATIONS
-- ========================================

/*
PERFORMANCE TARGETS:
- Strategic Dashboard: < 4 seconds
- Activities Page: < 3 seconds  
- Calendar Page: < 3 seconds
- Sales Summary: < 5 seconds
- Team Dashboard: < 4 seconds

OPTIMIZATION STRATEGIES:

1. If queries > target:
   - Add recommended indexes
   - Implement pagination (limit 50-100 records)
   - Add date range filters
   - Cache frequent queries

2. For Activities/Calendar:
   - Default to last 30 days
   - Lazy load older data
   - Implement infinite scroll

3. For Strategic Dashboard:
   - Cache manager list (5 min TTL)
   - Debounce filter changes
   - Pre-aggregate metrics

4. For Sales Summary:
   - Use materialized views for aggregations
   - Refresh every 15 minutes
   - Cache top performers

5. Database Optimization:
   - Run VACUUM ANALYZE monthly
   - Monitor and kill long-running queries
   - Set appropriate connection pooling
   - Consider read replicas for reports

6. Application Level:
   - Implement React Query with caching
   - Use SWR for data fetching
   - Debounce user inputs
   - Lazy load components
*/

-- ========================================
-- EXECUTION CHECKLIST:
-- ========================================

/*
[ ] 1. Run Section 1 - Check current data volume
[ ] 2. Run Section 2 - Performance benchmarks (note execution times)
[ ] 3. Run Section 3 - Check indexes (create missing ones)
[ ] 4. Run Section 5 - Analyze table sizes
[ ] 6. Run Section 6 - Stress tests
[ ] 7. Run Section 7 - Cache performance
[ ] 8. Document all results
[ ] 9. Compare against targets
[ ] 10. Implement optimizations if needed

PASS CRITERIA:
✅ All queries execute in < 5 seconds
✅ Cache hit rate > 95%
✅ No missing indexes
✅ Table sizes reasonable

FAIL CRITERIA:
❌ Any query > 10 seconds
❌ Cache hit rate < 80%
❌ Missing critical indexes
*/

