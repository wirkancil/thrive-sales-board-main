-- Fix the function to properly set search_path
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  division_id uuid,
  department_id uuid,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    au.email,
    p.role,
    p.division_id,
    p.department_id,
    p.created_at
  FROM public.user_profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
$$;