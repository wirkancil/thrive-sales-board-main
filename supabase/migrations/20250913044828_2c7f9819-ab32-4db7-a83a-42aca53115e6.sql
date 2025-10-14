-- Fix recursion in Supabase RLS policies for user_profiles
-- Drop all existing policies that may cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Dept heads can view department profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Division heads can view division profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Dept heads can update department profiles" ON public.user_profiles;

-- Drop existing functions that might cause issues
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_department_head(uuid);
DROP FUNCTION IF EXISTS public.is_admin_or_dept_head(uuid);
DROP FUNCTION IF EXISTS public.dept_head_can_update_profile(uuid);

-- Create SECURITY DEFINER helper functions to avoid recursion
-- These functions will be owned by postgres and have proper privileges

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Function to get current user's division_id
CREATE OR REPLACE FUNCTION public.current_user_division_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT division_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Function to get current user's department_id
CREATE OR REPLACE FUNCTION public.current_user_department_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT department_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Function to check if current user is admin or head
CREATE OR REPLACE FUNCTION public.is_admin_or_head()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'department_head', 'division_head')
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_division_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_department_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_head() TO authenticated;

-- Change ownership to postgres
ALTER FUNCTION public.current_user_role() OWNER TO postgres;
ALTER FUNCTION public.current_user_division_id() OWNER TO postgres;
ALTER FUNCTION public.current_user_department_id() OWNER TO postgres;
ALTER FUNCTION public.is_admin_or_head() OWNER TO postgres;

-- Create clean, non-recursive RLS policies

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