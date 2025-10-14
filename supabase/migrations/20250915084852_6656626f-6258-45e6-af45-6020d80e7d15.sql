-- Fix admin_update_profile function
CREATE OR REPLACE FUNCTION public.admin_update_profile(p_id uuid, p_role text, p_division uuid, p_department uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if current user is admin
  IF public.current_user_new_role() <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only admins can update user profiles';
  END IF;
  
  -- Update the user profile
  UPDATE public.user_profiles
  SET 
    new_role = p_role::simplified_role,
    division_id = p_division,
    department_id = p_department,
    updated_at = now()
  WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
END; 
$function$;