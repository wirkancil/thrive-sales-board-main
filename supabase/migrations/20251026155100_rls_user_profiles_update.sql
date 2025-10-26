-- RLS: allow admin/head to update user_profiles

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Ensure helper exists
CREATE OR REPLACE FUNCTION public.is_admin_or_head()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin','head')
  );
$$;

-- Drop prior update policy if exists
DROP POLICY IF EXISTS user_profiles_update_admin_head ON public.user_profiles;

-- Admin/head can update any user_profiles (for role/division/department assignments)
CREATE POLICY user_profiles_update_admin_head ON public.user_profiles
FOR UPDATE
USING (public.is_admin_or_head())
WITH CHECK (true);

-- Optional: users can update their own profile (basic fields)
DROP POLICY IF EXISTS user_profiles_update_self ON public.user_profiles;
CREATE POLICY user_profiles_update_self ON public.user_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant execute on RPC used by admin panel
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, role_enum, uuid, uuid) TO authenticated;