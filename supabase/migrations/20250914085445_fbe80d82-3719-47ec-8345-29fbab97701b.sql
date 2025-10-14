-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS division_id uuid,
ADD COLUMN IF NOT EXISTS department_id uuid,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update role constraint to include all required roles
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
CHECK (role IN ('admin', 'department_head', 'division_head', 'account_manager', 'sales_rep'));

-- Add foreign key constraints for divisions and departments
ALTER TABLE public.user_profiles 
ADD CONSTRAINT fk_user_profiles_division 
FOREIGN KEY (division_id) REFERENCES public.divisions(id),
ADD CONSTRAINT fk_user_profiles_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Update RLS policies for hierarchical access
DROP POLICY IF EXISTS "up_admin_all_access" ON public.user_profiles;
DROP POLICY IF EXISTS "up_dept_head_select" ON public.user_profiles;
DROP POLICY IF EXISTS "up_dept_head_update" ON public.user_profiles;

-- Admin can access all profiles
CREATE POLICY "up_admin_all_access" ON public.user_profiles
FOR ALL USING (current_user_role() = 'admin');

-- Department heads can view users in their department
CREATE POLICY "up_dept_head_select" ON public.user_profiles
FOR SELECT USING (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
);

-- Department heads can update users in their department (except other dept heads and admins)  
CREATE POLICY "up_dept_head_update" ON public.user_profiles
FOR UPDATE USING (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
  AND role NOT IN ('department_head', 'admin')
);

-- Update get_users_with_profiles function to handle missing columns gracefully
CREATE OR REPLACE FUNCTION public.get_users_with_profiles()
RETURNS TABLE(id uuid, email text, full_name text, role text, division_id uuid, department_id uuid, division_name text, department_name text, is_active boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Only admins can view all user profiles';
  END IF;
  
  RETURN QUERY
  SELECT 
    up.id,
    COALESCE(au.email::text, '') as email,
    up.full_name,
    up.role,
    up.division_id,
    up.department_id,
    COALESCE(d.name, '') as division_name,
    COALESCE(dept.name, '') as department_name,
    COALESCE(up.is_active, true) as is_active,
    up.created_at
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.id
  LEFT JOIN public.divisions d ON d.id = up.division_id
  LEFT JOIN public.departments dept ON dept.id = up.department_id
  ORDER BY up.created_at DESC;
END; 
$function$;