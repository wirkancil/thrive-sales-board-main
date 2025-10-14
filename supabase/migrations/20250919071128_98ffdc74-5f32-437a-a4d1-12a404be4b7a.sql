-- Check existing triggers and fix the stage change tracking
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'opportunities';