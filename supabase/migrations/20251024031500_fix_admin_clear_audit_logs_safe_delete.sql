-- Migration: Fix admin_clear_audit_logs to satisfy safe DELETE guard
-- Reason: Some environments enforce a guard that disallows DELETE without WHERE
-- Solution: Use `WHERE TRUE` for full-table deletes when p_scope = 'all'

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_clear_audit_logs(p_scope text DEFAULT 'non_admin')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Disable RLS inside definer function
  PERFORM set_config('row_security', 'off', true);

  -- Ensure only admins can execute (cast enums to text to avoid 42804)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND COALESCE(up.new_role::text, up.role::text) = 'admin'
  ) THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  IF p_scope = 'all' THEN
    -- Use WHERE TRUE to satisfy environments that enforce safe DELETE
    DELETE FROM public.audit_log_v2 WHERE TRUE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    DELETE FROM public.rbac_audit_log WHERE TRUE;
    DELETE FROM public.security_audit_log WHERE TRUE;

  ELSE
    -- Default: clear non-admin audit logs (including unknown/null users)
    DELETE FROM public.audit_log_v2 
    WHERE user_id IS NULL OR user_id NOT IN (
      SELECT id FROM auth.users WHERE email IN ('admin@gmail.com','hidayat.suli@gmail.com')
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    DELETE FROM public.rbac_audit_log 
    WHERE user_id IS NULL OR user_id NOT IN (
      SELECT id FROM auth.users WHERE email IN ('admin@gmail.com','hidayat.suli@gmail.com')
    );

    DELETE FROM public.security_audit_log 
    WHERE user_id IS NULL OR user_id NOT IN (
      SELECT id FROM auth.users WHERE email IN ('admin@gmail.com','hidayat.suli@gmail.com')
    );
  END IF;

  RETURN json_build_object('deleted', deleted_count, 'scope', p_scope);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_clear_audit_logs(text) TO authenticated;

COMMIT;