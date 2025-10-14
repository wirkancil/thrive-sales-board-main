-- Fix user_profiles table structure
-- Add missing columns that should have been added before
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES public.divisions(id),
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update the get_users_with_profiles function to work with current schema
CREATE OR REPLACE FUNCTION public.get_users_with_profiles()
RETURNS TABLE(
  id uuid, 
  email text, 
  full_name text, 
  role text, 
  division_id uuid, 
  department_id uuid, 
  division_name text, 
  department_name text, 
  is_active boolean, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only admins can view all user profiles';
  END IF;
  
  RETURN QUERY
  SELECT 
    up.id,
    COALESCE(au.email::text, '') as email,
    up.full_name,
    up.role,
    up.division_id,
    up.department_id,
    COALESCE(d.name, '') as division_name,
    COALESCE(dept.name, '') as department_name,
    COALESCE(up.is_active, true) as is_active,
    up.created_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  LEFT JOIN public.divisions d ON d.id = up.division_id
  LEFT JOIN public.departments dept ON dept.id = up.department_id
  ORDER BY up.created_at DESC;
END; 
$function$;