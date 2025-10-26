-- RPCs and supporting tables

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.user_profiles(user_id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  changes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- get_users_with_profiles RPC
CREATE OR REPLACE FUNCTION public.get_users_with_profiles(
  p_division_id uuid DEFAULT NULL,
  p_department_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  profile_id uuid,
  full_name text,
  role role_enum,
  division_id uuid,
  division_name text,
  department_id uuid,
  department_name text,
  title_id uuid,
  title_name text,
  status user_status_enum
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    up.user_id,
    up.id AS profile_id,
    up.full_name,
    up.role,
    up.division_id,
    d.name AS division_name,
    up.department_id,
    dep.name AS department_name,
    up.title_id,
    t.name AS title_name,
    up.status
  FROM public.user_profiles up
  LEFT JOIN public.divisions d ON d.id = up.division_id
  LEFT JOIN public.departments dep ON dep.id = up.department_id
  LEFT JOIN public.titles t ON t.id = up.title_id
  WHERE (p_division_id IS NULL OR up.division_id = p_division_id)
    AND (p_department_id IS NULL OR up.department_id = p_department_id);
$$;

-- log_audit_event RPC
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_changes jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.audit_logs(id, user_id, action, table_name, record_id, changes)
  VALUES (v_id, auth.uid(), p_action, p_table_name, p_record_id, COALESCE(p_changes, '{}'::jsonb));
  RETURN v_id;
END;
$$;