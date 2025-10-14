-- Fix admin user's new_role to match their actual role
UPDATE public.user_profiles 
SET new_role = 'admin' 
WHERE role = 'admin' AND new_role != 'admin';