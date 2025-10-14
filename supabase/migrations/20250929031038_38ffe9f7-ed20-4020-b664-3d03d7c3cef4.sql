-- Create manager team members view
CREATE OR REPLACE VIEW manager_team_members AS
SELECT 
  m.id AS manager_id,
  am.id AS account_manager_id,
  am.full_name
FROM user_profiles am
JOIN user_profiles m ON am.department_id = m.id  -- AMs report to managers via department_id
WHERE am.role = 'account_manager' 
  AND am.is_active = true 
  AND m.role = 'manager';

-- Create manager opportunities view
CREATE OR REPLACE VIEW manager_opportunities AS
SELECT o.*
FROM opportunities o
JOIN manager_team_members t ON t.account_manager_id = o.owner_id;

-- Update RLS policy for opportunities to include manager access
DROP POLICY IF EXISTS "Managers can view team opportunities" ON opportunities;
CREATE POLICY "Managers can view team opportunities" ON opportunities 
FOR SELECT USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM manager_team_members 
    WHERE manager_id = auth.uid() 
      AND account_manager_id = owner_id
  )
);