-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS division_id uuid REFERENCES public.divisions(id),
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update the user_profiles table to have proper RLS policies
DROP POLICY IF EXISTS "up_self_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "up_self_select" ON public.user_profiles;
DROP POLICY IF EXISTS "up_self_update" ON public.user_profiles;

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "user_profiles_select_admin" ON public.user_profiles  
FOR SELECT
USING (current_user_role() = 'admin');

CREATE POLICY "user_profiles_select_dept_head" ON public.user_profiles
FOR SELECT  
USING (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
);

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "user_profiles_update_admin" ON public.user_profiles
FOR UPDATE
USING (current_user_role() = 'admin')
WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "user_profiles_update_dept_head" ON public.user_profiles
FOR UPDATE
USING (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
)
WITH CHECK (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
);