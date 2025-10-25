-- Fix role constraint and harden admin_update_profile against RLS issues
BEGIN;

-- 1) Normalize legacy role values to the new set
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'role' 
      AND udt_name = 'role_enum'
  ) THEN
    UPDATE public.user_profiles
    SET role = CASE 
      WHEN role::text IN ('sales_rep', 'staff') THEN 'account_manager'::role_enum
      WHEN role::text = 'division_head' THEN 'head'::role_enum
      WHEN role::text IN ('department_head', 'department_manager') THEN 'manager'::role_enum
      ELSE role
    END;
  ELSE
    UPDATE public.user_profiles
    SET role = CASE 
      WHEN role IN ('sales_rep', 'staff') THEN 'account_manager'
      WHEN role = 'division_head' THEN 'head'
      WHEN role IN ('department_head', 'department_manager') THEN 'manager'
      ELSE role
    END;
  END IF;
END $$;

-- 2) Ensure role check constraint only allows valid roles
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_role_check
CHECK (role IN ('admin','head','manager','account_manager'));

-- 3) Recreate admin_update_profile to disable RLS within the definer function
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

  -- Normalisasi divisi/departemen agar konsisten dengan FK departments.division_id
  v_department_final := p_department;
  v_dept_division := NULL;
  IF p_department IS NOT NULL THEN
    SELECT d.division_id INTO v_dept_division
    FROM public.departments d
    WHERE d.id = p_department;
    -- Jika departemen tidak punya divisi, biarkan NULL atau gunakan p_division jika ada
  END IF;

  IF p_division IS NOT NULL AND v_dept_division IS NOT NULL AND p_division <> v_dept_division THEN
    -- Utamakan divisi milik departemen agar lolos constraint
    v_division_final := v_dept_division;
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

GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, uuid, uuid) TO authenticated;

-- Refresh PostgREST cache so RPC signature is recognized
SELECT pg_notify('pgrst','reload schema');

COMMIT;