-- Fix role enum references in database functions
-- The role_enum only has: admin, head, manager, account_manager
-- But some functions incorrectly reference division_head, department_head, department_manager

-- Update is_division_head function to check for 'head' role
CREATE OR REPLACE FUNCTION public.is_division_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_division_head.user_id AND p.role = 'head'
  );
$$;

-- Update is_department_head function to check for 'manager' role
CREATE OR REPLACE FUNCTION public.is_department_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_department_head.user_id AND p.role = 'manager'
  );
$$;

-- Update is_department_manager function to check for 'manager' role
CREATE OR REPLACE FUNCTION public.is_department_manager(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = is_department_manager.user_id AND p.role = 'manager'
  );
$$;

-- Update is_manager_or_above function
CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('admin', 'head', 'manager') 
  FROM public.user_profiles 
  WHERE id = auth.uid();
$$;

-- Update is_head_or_above function  
CREATE OR REPLACE FUNCTION public.is_head_or_above()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('admin', 'head') 
  FROM public.user_profiles 
  WHERE id = auth.uid();
$$;