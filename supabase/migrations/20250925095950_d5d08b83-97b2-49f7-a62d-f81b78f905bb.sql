-- Phase 1: Disable trigger, then migrate role column
-- First, disable the enforce_user_hierarchy trigger temporarily
DROP TRIGGER IF EXISTS enforce_user_hierarchy_trigger ON public.user_profiles;

-- Rename existing role column temporarily
ALTER TABLE public.user_profiles RENAME COLUMN role TO role_old;

-- Add new role column with enum type
ALTER TABLE public.user_profiles ADD COLUMN role role_enum DEFAULT 'account_manager'::role_enum;

-- Migrate data from old column to new column
UPDATE public.user_profiles 
SET role = CASE role_old
  WHEN 'admin' THEN 'admin'::role_enum
  WHEN 'division_head' THEN 'head'::role_enum  
  WHEN 'department_manager' THEN 'manager'::role_enum
  WHEN 'account_manager' THEN 'account_manager'::role_enum
  ELSE 'account_manager'::role_enum
END;

-- Make the new role column NOT NULL
ALTER TABLE public.user_profiles ALTER COLUMN role SET NOT NULL;

-- Drop the old role column
ALTER TABLE public.user_profiles DROP COLUMN role_old;