-- RLS patch: avoid recursion in user_profiles policy using a SECURITY DEFINER helper

-- Helper function to check if current user is admin or head
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

-- Update user_profiles policy to avoid self-referencing recursion
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
FOR SELECT
USING (
  user_id = auth.uid() OR public.is_admin_or_head()
);