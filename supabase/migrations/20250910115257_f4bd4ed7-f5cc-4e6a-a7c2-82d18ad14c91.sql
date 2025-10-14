-- Fix the get_admin_users function to work with proper authentication context
CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(id uuid, full_name text, email text, role text, division_id uuid, department_id uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  current_user_role text;
BEGIN
  -- Get current user ID and role
  SELECT auth.uid() INTO current_user_id;
  
  -- If no authenticated user, return empty
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get user role from profiles table
  SELECT p.role INTO current_user_role
  FROM public.user_profiles p
  WHERE p.id = current_user_id;
  
  -- Check if user is admin or department head
  IF current_user_role NOT IN ('admin', 'department_head') THEN
    RAISE EXCEPTION 'Insufficient privileges to view user profiles' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
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
END;
$function$;