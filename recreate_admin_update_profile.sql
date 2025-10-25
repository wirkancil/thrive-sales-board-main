-- Recreate admin_update_profile function to fix schema cache issue
-- This should match the latest migration file

-- First, drop any existing versions of the function
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_update_profile(uuid, uuid, uuid, text);

-- Recreate the function with the correct signature
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role text,
  p_division uuid DEFAULT NULL::uuid,
  p_department uuid DEFAULT NULL::uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_role text;
  v_role_to_write text;
  v_dept_division uuid;
  v_division_final uuid;
  v_department_final uuid;
BEGIN
  PERFORM set_config('row_security','off', true);

  IF NOT public.check_is_admin() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT up.role::text INTO v_current_role FROM public.user_profiles up WHERE up.id = p_id;

  IF v_current_role = 'admin' AND (p_role IS NOT NULL AND p_role <> 'admin') THEN
    RAISE EXCEPTION 'cannot change role of admin user' USING ERRCODE = '42501';
  END IF;

  IF p_id = auth.uid() AND (p_role IS NOT NULL AND p_role <> 'admin') THEN
    RAISE EXCEPTION 'cannot change your own admin role' USING ERRCODE = '42501';
  END IF;

  IF p_role IS NOT NULL AND p_role NOT IN ('admin','head','manager','account_manager') THEN
    RAISE EXCEPTION 'Invalid role. Must be one of: admin, head, manager, account_manager' USING ERRCODE = '22P02';
  END IF;

  v_role_to_write := COALESCE(p_role, v_current_role);
  IF v_current_role = 'admin' THEN
    v_role_to_write := 'admin';
  END IF;

  -- Normalize division/department for consistency with departments.division_id FK
  v_department_final := p_department;
  v_dept_division := NULL;
  IF p_department IS NOT NULL THEN
    SELECT d.division_id INTO v_dept_division
    FROM public.departments d
    WHERE d.id = p_department;
  END IF;

  IF p_division IS NOT NULL AND v_dept_division IS NOT NULL AND p_division <> v_dept_division THEN
    v_division_final := v_dept_division; -- prefer department's division
  ELSE
    v_division_final := COALESCE(p_division, v_dept_division);
  END IF;

  INSERT INTO public.user_profiles (id, full_name, role, division_id, department_id, is_active)
  VALUES (
    p_id,
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = p_id),
    v_role_to_write::role_enum,
    v_division_final,
    v_department_final,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    division_id = EXCLUDED.division_id,
    department_id = EXCLUDED.department_id,
    is_active = EXCLUDED.is_active;

  -- Try to log the audit, but don't fail if table doesn't exist
  BEGIN
    INSERT INTO public.rbac_audit_log (user_id, changed_by, action, table_name, record_id, old_values, new_values, created_at)
    VALUES (
      p_id,
      auth.uid(),
      'update_profile',
      'public.user_profiles',
      p_id,
      jsonb_build_object('role', v_current_role),
      jsonb_build_object('role', v_role_to_write, 'division_id', v_division_final, 'department_id', v_department_final),
      now()
    );
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, uuid, uuid) TO authenticated;

-- Test the function exists
SELECT proname, pronargs, proargtypes 
FROM pg_proc 
WHERE proname = 'admin_update_profile' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Test calling the function (this will show if it works)
-- SELECT public.admin_update_profile('00000000-0000-0000-0000-000000000000'::uuid, 'account_manager', null, null);