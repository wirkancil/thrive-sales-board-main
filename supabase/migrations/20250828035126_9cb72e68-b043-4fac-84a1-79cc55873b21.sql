-- Ensure RLS is enabled
alter table public.user_profiles enable row level security;

-- Drop and recreate UPDATE policies to ensure admins/department heads can update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and dept heads can update profiles" ON public.user_profiles;

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins and dept heads can update profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_or_dept_head(auth.uid()))
WITH CHECK (true);

-- Recreate SELECT policies explicitly (no-op if already present)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and dept heads can view all profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins and dept heads can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_or_dept_head(auth.uid()));