-- Patch: make admin_update_profile accept either profile.id or user_profiles.user_id
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role role_enum,
  p_division uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Try resolve by profile primary key
  SELECT id INTO v_profile_id
  FROM public.user_profiles
  WHERE id = p_id
  LIMIT 1;

  -- If not found, resolve by user_id (auth.users id)
  IF v_profile_id IS NULL THEN
    SELECT id INTO v_profile_id
    FROM public.user_profiles
    WHERE user_id = p_id
    LIMIT 1;
  END IF;

  IF v_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_profiles
  SET 
    role = p_role,
    division_id = p_division,
    department_id = p_department,
    updated_at = now()
  WHERE id = v_profile_id;

  RETURN TRUE;
END;
$$;

-- Ensure execute permissions remain
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, role_enum, uuid, uuid) TO authenticated;