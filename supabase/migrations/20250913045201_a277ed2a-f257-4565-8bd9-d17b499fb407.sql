-- Fix recursion in user_profiles RLS policies while maintaining compatibility
-- Drop all existing user_profiles policies that may cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Dept heads can view department profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Division heads can view division profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Dept heads can update department profiles" ON public.user_profiles;

-- Recreate existing functions but fix any recursion issues
-- Keep the same signatures to maintain compatibility with other tables

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_admin.user_id AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_department_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_department_head.user_id AND p.role = 'department_head'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_dept_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_admin_or_dept_head.user_id
      AND (p.role = 'department_head' OR p.role = 'admin')
  );
$$;

-- Create new helper functions for current user without parameters
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_division_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT division_id FROM public.user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_department_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT department_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_department_head(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_dept_head(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_division_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_department_id() TO authenticated;

-- Change ownership to postgres
ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;
ALTER FUNCTION public.is_department_head(uuid) OWNER TO postgres;
ALTER FUNCTION public.is_admin_or_dept_head(uuid) OWNER TO postgres;
ALTER FUNCTION public.current_user_role() OWNER TO postgres;
ALTER FUNCTION public.current_user_division_id() OWNER TO postgres;
ALTER FUNCTION public.current_user_department_id() OWNER TO postgres;

-- Create clean, non-recursive RLS policies for user_profiles

-- 1. Users can view, update, and insert only their own profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 2. Admins can select and update all profiles
CREATE POLICY "Admins can select all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.current_user_role() = 'admin');

-- 3. Division Heads can select and update only profiles in their own division
CREATE POLICY "Division heads can select division profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'division_head' 
  AND division_id = public.current_user_division_id()
  AND public.current_user_division_id() IS NOT NULL
);

CREATE POLICY "Division heads can update division profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  public.current_user_role() = 'division_head' 
  AND division_id = public.current_user_division_id()
  AND public.current_user_division_id() IS NOT NULL
);

-- 4. Department Heads can select and update only profiles in their own department
CREATE POLICY "Department heads can select department profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'department_head' 
  AND department_id = public.current_user_department_id()
  AND public.current_user_department_id() IS NOT NULL
);

CREATE POLICY "Department heads can update department profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  public.current_user_role() = 'department_head' 
  AND department_id = public.current_user_department_id()
  AND public.current_user_department_id() IS NOT NULL
);