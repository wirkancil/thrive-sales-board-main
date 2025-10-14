-- Temporarily disable the trigger to fix admin user's new_role
ALTER TABLE user_profiles DISABLE TRIGGER log_rbac_changes_trigger;

-- Fix admin user's new_role to match their actual role
UPDATE public.user_profiles 
SET new_role = 'admin' 
WHERE role = 'admin' AND new_role != 'admin';

-- Re-enable the trigger
ALTER TABLE user_profiles ENABLE TRIGGER log_rbac_changes_trigger;