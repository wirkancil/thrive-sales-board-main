-- Create admin profile for admin@gmail.com if missing
INSERT INTO public.user_profiles (
  id, 
  full_name, 
  role, 
  is_active,
  created_at
) 
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  'admin'::role_enum,
  true,
  now()
FROM auth.users u 
WHERE u.email = 'admin@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = u.id);