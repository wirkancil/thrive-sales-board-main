-- Fix user_profiles role check constraint to include all valid roles
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role = ANY (ARRAY['account_manager'::text, 'division_head'::text, 'department_head'::text, 'admin'::text, 'sales_rep'::text, 'manager'::text]));