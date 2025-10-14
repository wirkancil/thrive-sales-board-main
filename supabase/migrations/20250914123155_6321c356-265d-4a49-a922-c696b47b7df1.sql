-- Update the get_users_with_profiles function to accept search and role filter parameters
DROP FUNCTION IF EXISTS public.get_users_with_profiles();

CREATE OR REPLACE FUNCTION public.get_users_with_profiles(search text DEFAULT NULL, role_filter text DEFAULT NULL)
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
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the current user's role
  SELECT up.role INTO user_role 
  FROM public.user_profiles up 
  WHERE up.id = auth.uid();
  
  -- Only allow admins to view all user profiles
  IF user_role <> 'admin' THEN
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
  WHERE 
    (search IS NULL OR 
     up.full_name ILIKE '%' || search || '%' OR 
     au.email ILIKE '%' || search || '%')
    AND 
    (role_filter IS NULL OR up.role = role_filter)
  ORDER BY up.created_at DESC;
END; 
$function$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.get_users_with_profiles(text, text) TO authenticated;