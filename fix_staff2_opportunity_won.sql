-- Fix staff2 opportunity to mark as WON

-- Step 1: Check current status
SELECT 
  id,
  name,
  amount,
  stage,
  status,
  is_won,
  is_closed,
  expected_close_date
FROM opportunities
WHERE id = '78265c41-96ba-4cae-9bd5-49a1f129e214';

-- Step 2: Update to mark as WON and set date to Q1 2026
UPDATE opportunities
SET 
  is_won = true,
  is_closed = true,
  stage = 'Closed Won',
  status = 'won',
  expected_close_date = '2026-01-15'  -- Set to Q1 2026 (Jan-Mar 2026)
WHERE id = '78265c41-96ba-4cae-9bd5-49a1f129e214';

-- Step 3: Verify the update
SELECT 
  id,
  name,
  amount,
  stage,
  status,
  is_won,
  is_closed,
  expected_close_date
FROM opportunities
WHERE id = '78265c41-96ba-4cae-9bd5-49a1f129e214';
