-- Security fixes migration
-- 1) Allow users to insert and update their own user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can insert own user_profiles"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can update own user_profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 2) Restrict departments and divisions visibility to authenticated users only
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view departments" ON public.departments;
CREATE POLICY "Authenticated users can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can view divisions" ON public.divisions;
CREATE POLICY "Authenticated users can view divisions"
ON public.divisions
FOR SELECT
TO authenticated
USING (true);
