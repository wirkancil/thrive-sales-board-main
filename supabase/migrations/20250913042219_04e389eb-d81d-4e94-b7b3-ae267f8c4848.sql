-- Ensure admin@gmail.com can login without approval
-- Update the admin user to ensure they have proper access
UPDATE public.user_profiles 
SET 
  role = 'admin',
  is_active = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@gmail.com'
);

-- If admin user doesn't exist in profiles, create it
-- This handles the case where the trigger might not have fired
INSERT INTO public.user_profiles (id, full_name, role, is_active, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'),
  'admin',
  true,
  now()
FROM auth.users au
WHERE au.email = 'admin@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = au.id);