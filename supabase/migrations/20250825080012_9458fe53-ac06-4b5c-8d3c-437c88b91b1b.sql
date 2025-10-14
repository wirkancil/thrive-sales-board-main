-- Update profiles table to have pending as default role and add division/department relationships
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'pending';

-- Add division_id and department_id to profiles table for organizational structure
ALTER TABLE public.profiles 
ADD COLUMN division_id uuid REFERENCES public.divisions(id),
ADD COLUMN department_id uuid REFERENCES public.departments(id);

-- Create admin role policy functions
CREATE OR REPLACE FUNCTION public.is_admin_or_dept_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_admin_or_dept_head.user_id 
    AND (role = 'department_head' OR role = 'admin')
  );
$$;