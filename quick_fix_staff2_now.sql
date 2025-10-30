-- QUICK FIX: Update staff2 opportunity to Won with Q1 2026 date

-- Step 1: Find and update ALL opportunities that have projects
UPDATE opportunities o
SET 
  is_won = true,
  is_closed = true,
  stage = 'Closed Won',
  status = 'won',
  expected_close_date = '2026-01-15', -- Set to Q1 2026
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM projects p WHERE p.opportunity_id = o.id
)
AND o.status != 'archived';

-- Step 2: Verify the update
SELECT 
  o.id,
  o.name,
  o.amount,
  o.is_won,
  o.stage,
  o.expected_close_date,
  p.po_amount,
  up.full_name as owner
FROM opportunities o
JOIN projects p ON p.opportunity_id = o.id
LEFT JOIN user_profiles up ON up.user_id = o.owner_id
WHERE o.is_won = true
ORDER BY o.updated_at DESC;

-- Step 3: Install trigger for future (jika belum ada)
CREATE OR REPLACE FUNCTION auto_close_opportunity_on_project()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE opportunities
  SET 
    is_won = true,
    is_closed = true,
    stage = 'Closed Won',
    status = 'won',
    expected_close_date = COALESCE(expected_close_date, NEW.created_at::date, CURRENT_DATE),
    updated_at = NOW()
  WHERE id = NEW.opportunity_id
    AND (is_won = false OR stage != 'Closed Won');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_close_opportunity ON projects;

CREATE TRIGGER trigger_auto_close_opportunity
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_close_opportunity_on_project();

-- Step 4: Verify trigger installed
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_close_opportunity';
