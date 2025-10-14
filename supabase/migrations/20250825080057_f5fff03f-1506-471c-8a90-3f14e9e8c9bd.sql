-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'pending'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_dept_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_admin_or_dept_head.user_id 
    AND (role = 'department_head' OR role = 'admin')
  );
$$;

-- Create RLS policy for role management - only admin/department heads can update user roles
CREATE POLICY "Admin and dept heads can update user roles"
ON public.profiles
FOR UPDATE
USING (
  public.is_admin_or_dept_head(auth.uid()) 
  AND (role IN ('pending', 'sales_rep', 'division_head', 'department_head'))
)
WITH CHECK (
  public.is_admin_or_dept_head(auth.uid()) 
  AND (role IN ('pending', 'sales_rep', 'division_head', 'department_head'))
);

-- Allow admin/dept heads to view pending users for role assignment
CREATE POLICY "Admin and dept heads can view pending users"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  (public.is_admin_or_dept_head(auth.uid()) AND role = 'pending')
);