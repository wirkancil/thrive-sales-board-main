-- AUTO-CLOSE OPPORTUNITY WHEN PROJECT IS CREATED
-- This ensures data consistency between projects and opportunities

-- Function: Auto-update opportunity when project is created
CREATE OR REPLACE FUNCTION auto_close_opportunity_on_project()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new project is created, mark the related opportunity as WON
  UPDATE opportunities
  SET 
    is_won = true,
    is_closed = true,
    stage = 'Closed Won',
    status = 'won',
    expected_close_date = COALESCE(expected_close_date, NEW.created_at::date),
    updated_at = NOW()
  WHERE id = NEW.opportunity_id
    AND (is_won = false OR stage != 'Closed Won');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_close_opportunity ON projects;

-- Create trigger: Run after INSERT on projects table
CREATE TRIGGER trigger_auto_close_opportunity
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_close_opportunity_on_project();

-- Test: Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_close_opportunity';

COMMENT ON FUNCTION auto_close_opportunity_on_project() IS 
  'Automatically marks opportunity as Closed Won when a project is created';
