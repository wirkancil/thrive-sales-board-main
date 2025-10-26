-- Patch user_profiles SELECT RLS to allow managers/heads to see scoped members
BEGIN;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Replace existing policy with scoped read rules
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
FOR SELECT TO authenticated
USING (
  -- Read own profile
  public.user_profiles.user_id = auth.uid()
  OR
  -- Admin read all
  EXISTS (
    SELECT 1 FROM public.user_profiles me
    WHERE me.user_id = auth.uid() AND me.role = 'admin'
  )
  OR
  -- Head read within their division
  EXISTS (
    SELECT 1 FROM public.user_profiles me
    WHERE me.user_id = auth.uid() AND me.role = 'head' AND me.division_id = public.user_profiles.division_id
  )
  OR
  -- Manager read within their division or department
  EXISTS (
    SELECT 1 FROM public.user_profiles me
    WHERE me.user_id = auth.uid() AND me.role = 'manager'
      AND (me.division_id = public.user_profiles.division_id OR me.department_id = public.user_profiles.department_id)
  )
  OR
  -- Manager read explicit team members via manager_team_members mapping
  EXISTS (
    SELECT 1
    FROM public.manager_team_members mtm
    JOIN public.user_profiles me ON me.user_id = auth.uid() AND me.role = 'manager'
    WHERE mtm.manager_id = me.id AND mtm.account_manager_id = public.user_profiles.id
  )
);

COMMIT;