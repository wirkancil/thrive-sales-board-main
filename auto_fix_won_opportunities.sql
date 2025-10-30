-- Auto-fix: Mark opportunities as WON if they have a project

-- Step 1: Check opportunities that have projects but not marked as won
SELECT 
  o.id,
  o.name,
  o.amount,
  o.stage,
  o.status,
  o.is_won,
  o.is_closed,
  o.expected_close_date,
  p.po_amount,
  up.full_name as owner_name
FROM opportunities o
JOIN projects p ON p.opportunity_id = o.id
LEFT JOIN user_profiles up ON up.user_id = o.owner_id
WHERE o.is_won = false OR o.stage != 'Closed Won'
ORDER BY o.created_at DESC;

-- Step 2: Update ALL opportunities that have projects to mark as WON
UPDATE opportunities o
SET 
  is_won = true,
  is_closed = true,
  stage = 'Closed Won',
  status = 'won',
  expected_close_date = COALESCE(
    o.expected_close_date, 
    (SELECT created_at::date FROM projects WHERE opportunity_id = o.id LIMIT 1),
    CURRENT_DATE
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM projects p WHERE p.opportunity_id = o.id
)
AND (o.is_won = false OR o.stage != 'Closed Won');

-- Step 3: Verify the update
SELECT 
  o.id,
  o.name,
  o.amount,
  o.stage,
  o.status,
  o.is_won,
  o.is_closed,
  o.expected_close_date,
  p.po_amount,
  up.full_name as owner_name
FROM opportunities o
JOIN projects p ON p.opportunity_id = o.id
LEFT JOIN user_profiles up ON up.user_id = o.owner_id
WHERE o.is_won = true
ORDER BY o.updated_at DESC;
