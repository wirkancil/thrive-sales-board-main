-- Fix is_admin_or_dept_head function to use correct role_enum values
-- Just replace the function without dropping it since it's referenced by RLS policies

CREATE OR REPLACE FUNCTION public.is_admin_or_dept_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = user_id 
    AND p.role IN ('admin', 'head', 'manager')
  );
$$;