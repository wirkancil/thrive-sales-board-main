-- Harden RPC: restrict get_admin_users to admins and department heads only
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  role text,
  division_id uuid,
  department_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce server-side authorization to prevent data exposure
  IF NOT public.is_admin_or_dept_head(auth.uid()) THEN
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
$$;