-- Test opportunities with proper names
-- This will help verify if the issue is with the data or the code

-- First, let's check if there are any opportunities
SELECT id, name, stage, status, owner_id FROM opportunities LIMIT 5;

-- Insert some test opportunities with proper names
INSERT INTO opportunities (name, description, amount, currency, stage, status, owner_id)
SELECT 
  'Test Opportunity ' || generate_series(1, 3),
  'Test description for opportunity ' || generate_series(1, 3),
  500000 + (generate_series(1, 3) * 100000),
  'IDR',
  'Prospecting',
  'open',
  (SELECT user_id FROM user_profiles WHERE role = 'account_manager' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM user_profiles WHERE role = 'account_manager');

-- Check the inserted opportunities
SELECT id, name, stage, status, owner_id FROM opportunities WHERE name LIKE 'Test Opportunity%';