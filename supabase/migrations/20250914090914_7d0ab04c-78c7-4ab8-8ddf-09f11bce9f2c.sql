-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_with_profiles() TO authenticated;

-- Also grant execute permission on other admin functions
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, uuid, uuid) TO authenticated;

-- Make sure the current_user_role function has proper permissions
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- Update RLS policies for user_profiles to allow admins to see all profiles
DROP POLICY IF EXISTS "up_admin_select_all" ON public.user_profiles;
CREATE POLICY "up_admin_select_all" ON public.user_profiles
FOR SELECT USING (current_user_role() = 'admin');

-- Ensure admins can update any user profile
DROP POLICY IF EXISTS "up_admin_update_all" ON public.user_profiles;
CREATE POLICY "up_admin_update_all" ON public.user_profiles
FOR UPDATE USING (current_user_role() = 'admin')
WITH CHECK (current_user_role() = 'admin');