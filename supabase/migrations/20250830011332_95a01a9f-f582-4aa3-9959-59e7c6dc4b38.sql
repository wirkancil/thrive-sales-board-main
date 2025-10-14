-- Fix user_profiles role CHECK constraint to include division_head and department_head
-- Keep existing value 'manager' temporarily for backward compatibility

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (
    role = ANY (ARRAY[
      'sales_rep'::text,
      'division_head'::text,
      'department_head'::text,
      'admin'::text,
      'manager'::text
    ])
  );