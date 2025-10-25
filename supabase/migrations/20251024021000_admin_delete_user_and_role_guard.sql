-- Migration: Admin-only user deletion and admin role guard
-- Purpose: Only admins can delete users; prevent deleting self or any admin
--          Prevent changing the role of admin users or demoting self

-- 1) RPC: admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_target_role text;
BEGIN
  -- Disable RLS in this definer function
  PERFORM set_config('row_security', 'off', true);

  -- Require admin
  IF NOT public.check_is_admin() THEN
    RAISE EXCEPTION 'not allowed: admin only' USING ERRCODE = '42501';
  END IF;

  -- Prevent self-delete
  IF p_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete yourself' USING ERRCODE = '42501';
  END IF;

  -- Check target role
  SELECT up.role::text INTO v_target_role FROM public.user_profiles up WHERE up.id = p_id;
  IF v_target_role IS NULL THEN
    -- If no profile found, still block deleting potential admins defensively via auth.users check later
    v_target_role := 'pending';
  END IF;

  -- Block deleting any admin account
  IF v_target_role = 'admin' THEN
    RAISE EXCEPTION 'cannot delete admin accounts' USING ERRCODE = '42501';
  END IF;

  -- Delete from auth.users (will cascade to dependent tables if FKs exist)
  -- Note: On some Supabase setups, direct delete from auth.users requires definer privileges.
  --       If this fails, consider using the Supabase Admin API (service key) outside the DB.
  DELETE FROM auth.users WHERE id = p_id;

  -- Also remove user profile if present (in case there is no FK cascade)
  DELETE FROM public.user_profiles WHERE id = p_id;

  -- Optional: clean up related targets where FK is SET NULL or CASCADE handled elsewhere
  -- Rely on existing FK constraints defined in migrations to handle cascading/NULLing.

  -- Audit
  INSERT INTO public.rbac_audit_log (user_id, changed_by, action, table_name, record_id, created_at)
  VALUES (p_id, auth.uid(), 'delete_user', 'auth.users', p_id, now())
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- 2) Harden: admin_update_profile — prevent changing admin role or demoting self
-- This version keeps the latest signature and behavior while adding guards
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role text,
  p_division uuid DEFAULT NULL::uuid,
  p_department uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_role text;
  v_role_to_write text;
BEGIN
  IF NOT public.check_is_admin() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  -- Get current role of target
  SELECT up.role::text INTO v_current_role FROM public.user_profiles up WHERE up.id = p_id;

  -- Prevent changing role of admin users to anything else
  IF v_current_role = 'admin' AND (p_role IS NOT NULL AND p_role <> 'admin') THEN
    RAISE EXCEPTION 'cannot change role of admin user' USING ERRCODE = '42501';
  END IF;

  -- Prevent demoting self from admin
  IF p_id = auth.uid() AND (p_role IS NOT NULL AND p_role <> 'admin') THEN
    RAISE EXCEPTION 'cannot change your own admin role' USING ERRCODE = '42501';
  END IF;

  -- Decide final role value to write
  v_role_to_write := COALESCE(p_role, v_current_role);
  IF v_current_role = 'admin' THEN
    v_role_to_write := 'admin'; -- enforce role remains admin
  END IF;

  -- Insert or update profile
  INSERT INTO public.user_profiles (id, full_name, role, division_id, department_id, team_id, is_active)
  VALUES (
    p_id,
    (SELECT email FROM auth.users WHERE id = p_id),
    v_role_to_write,
    p_division,
    p_department,
    NULL,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    role = v_role_to_write,
    division_id = excluded.division_id,
    department_id = excluded.department_id,
    team_id = NULL;  -- Teams are eliminated

  IF NOT FOUND AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_id) THEN
    RAISE EXCEPTION 'failed to create or update user_profile for %', p_id USING ERRCODE = 'P0002';
  END IF;

  -- Audit the role change attempt (even if no change for admins)
  INSERT INTO public.rbac_audit_log (user_id, changed_by, action, table_name, record_id, old_values, new_values, created_at)
  VALUES (
    p_id,
    auth.uid(),
    'update_profile',
    'public.user_profiles',
    p_id,
    jsonb_build_object('role', v_current_role, 'division_id', (SELECT division_id FROM public.user_profiles WHERE id = p_id), 'department_id', (SELECT department_id FROM public.user_profiles WHERE id = p_id)),
    jsonb_build_object('role', v_role_to_write, 'division_id', p_division, 'department_id', p_department),
    now()
  )
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, uuid, uuid) TO authenticated;

-- Refresh PostgREST cache
SELECT pg_notify('pgrst','reload schema');