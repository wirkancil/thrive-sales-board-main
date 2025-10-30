-- Check current status of staff2 opportunity and project

-- 1. Check opportunity status
SELECT 
  o.id,
  o.name,
  o.amount,
  o.stage,
  o.status,
  o.is_won,
  o.is_closed,
  o.expected_close_date,
  o.created_at,
  o.updated_at,
  up.full_name as owner_name
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2'
ORDER BY o.created_at DESC;

-- 2. Check if project exists
SELECT 
  p.id as project_id,
  p.name,
  p.po_amount,
  p.opportunity_id,
  o.name as opportunity_name,
  o.is_won,
  o.stage,
  o.expected_close_date
FROM projects p
JOIN opportunities o ON o.id = p.opportunity_id
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2';

-- 3. Check Q1 2026 date range
SELECT 
  o.id,
  o.name,
  o.expected_close_date,
  o.is_won,
  CASE 
    WHEN o.expected_close_date >= '2026-01-01' AND o.expected_close_date <= '2026-03-31' 
    THEN 'YES - IN Q1 2026 ✅'
    ELSE 'NO - NOT IN Q1 2026 ❌ (Current: ' || COALESCE(o.expected_close_date::text, 'NULL') || ')'
  END as in_q1_2026
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2'
  AND o.is_won = true;

-- 4. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_close_opportunity';
