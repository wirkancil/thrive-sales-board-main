-- Simple fix for admin_update_profile function
-- Run this in Supabase SQL Editor

-- Drop existing function versions
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, uuid, uuid, text);

-- Create the function with correct signature
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role text,
  p_division uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin (simplified check)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'head', 'manager', 'account_manager') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: admin, head, manager, account_manager';
  END IF;

  -- Update or insert user profile
  INSERT INTO public.user_profiles (
    id, 
    full_name, 
    role, 
    division_id, 
    department_id, 
    is_active
  )
  VALUES (
    p_id,
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = p_id),
    p_role::role_enum,
    p_division,
    p_department,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    division_id = EXCLUDED.division_id,
    department_id = EXCLUDED.department_id,
    is_active = EXCLUDED.is_active,
    updated_at = now();
    
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, uuid, uuid) TO authenticated;

-- Verify function was created
SELECT 
  proname as function_name,
  pronargs as arg_count,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'admin_update_profile' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');