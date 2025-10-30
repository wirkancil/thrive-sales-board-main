-- Debug staff2 opportunities

-- 1. Check staff2 user profile
SELECT 
  id as profile_id,
  user_id,
  full_name,
  email,
  role,
  department_id,
  division_id
FROM user_profiles
WHERE full_name = 'staff2';

-- 2. Check ALL opportunities owned by staff2 (any status)
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
  o.owner_id,
  up.full_name as owner_name
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2'
ORDER BY o.created_at DESC;

-- 3. Check WON opportunities by staff2
SELECT 
  o.id,
  o.name,
  o.amount,
  o.stage,
  o.status,
  o.is_won,
  o.expected_close_date,
  o.created_at
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2'
  AND o.is_won = true
  AND o.status != 'archived'
ORDER BY o.created_at DESC;

-- 4. Check if expected_close_date is in Q1 2026 (2026-01-01 to 2026-03-31)
SELECT 
  o.id,
  o.name,
  o.amount,
  o.expected_close_date,
  o.is_won,
  CASE 
    WHEN o.expected_close_date >= '2026-01-01' AND o.expected_close_date <= '2026-03-31' THEN 'IN Q1 2026'
    ELSE 'NOT IN Q1 2026'
  END as period_match
FROM opportunities o
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2'
  AND o.is_won = true
ORDER BY o.created_at DESC;

-- 5. Check projects for staff2's opportunities
SELECT 
  p.id as project_id,
  p.opportunity_id,
  p.po_amount,
  o.amount as opp_amount,
  o.name as opp_name,
  o.is_won
FROM projects p
JOIN opportunities o ON o.id = p.opportunity_id
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2';

-- 6. Check pipeline_items for staff2's opportunities
SELECT 
  pi.id,
  pi.opportunity_id,
  pi.cost_of_goods,
  pi.service_costs,
  pi.other_expenses,
  (COALESCE(pi.cost_of_goods, 0) + COALESCE(pi.service_costs, 0) + COALESCE(pi.other_expenses, 0)) as total_cost,
  o.amount,
  (o.amount - (COALESCE(pi.cost_of_goods, 0) + COALESCE(pi.service_costs, 0) + COALESCE(pi.other_expenses, 0))) as margin
FROM pipeline_items pi
JOIN opportunities o ON o.id = pi.opportunity_id
JOIN user_profiles up ON up.user_id = o.owner_id
WHERE up.full_name = 'staff2'
  AND o.is_won = true;
