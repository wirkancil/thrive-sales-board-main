-- Relax user_profiles.role check constraint to include legacy 'sales_rep' values
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_role_check
CHECK (role IN ('sales_rep','account_manager','division_head','department_head','admin'));

-- Keep policy change allowing dept heads to set 'account_manager' or 'division_head'
ALTER POLICY "Dept heads can update department profiles with limited roles"
ON public.user_profiles
WITH CHECK (dept_head_can_update_profile(id) AND (role IN ('account_manager','division_head')));
