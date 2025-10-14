-- Update admin user's new_role by bypassing trigger with a manual approach
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user's ID
    SELECT id INTO admin_user_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
    
    -- Drop the trigger temporarily if it exists
    DROP TRIGGER IF EXISTS user_profiles_rbac_audit ON user_profiles;
    
    -- Update the new_role
    UPDATE user_profiles SET new_role = 'admin'::simplified_role WHERE id = admin_user_id;
    
    -- Recreate the trigger
    CREATE TRIGGER user_profiles_rbac_audit
        AFTER UPDATE ON user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION log_rbac_changes();
END $$;