-- Fix infinite recursion in user_profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Dept heads can view department profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Division heads can view division profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = is_admin.user_id and p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_department_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = is_department_head.user_id and p.role = 'department_head'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_dept_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = is_admin_or_dept_head.user_id
      and (p.role = 'department_head' or p.role = 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.dept_head_can_update_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select exists (
    select 1
    from public.user_profiles curr
    join public.user_profiles target on target.id = dept_head_can_update_profile.target_user_id
    where curr.id = auth.uid()
      and curr.role = 'department_head'
      and curr.department_id is not null
      and curr.department_id = target.department_id
  );
$$;

-- Create new policies using security definer functions
CREATE POLICY "Users can view own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles 
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Dept heads can view department profiles" 
  ON public.user_profiles 
  FOR SELECT 
  USING (
    public.is_department_head(auth.uid()) AND
    department_id IN (
      SELECT department_id FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'department_head'
    )
  );

CREATE POLICY "Division heads can view division profiles" 
  ON public.user_profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles curr
      WHERE curr.id = auth.uid() 
        AND curr.role = 'division_head'
        AND curr.division_id = user_profiles.division_id
    )
  );

CREATE POLICY "Users can update own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update all profiles" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Dept heads can update department profiles" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (public.dept_head_can_update_profile(id));

CREATE POLICY "Users can insert own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Add role change enforcement trigger
CREATE OR REPLACE FUNCTION public.enforce_user_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Admins can set any role
    IF public.is_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;

    -- Department heads can only set roles within their department and limited to account_manager/division_head
    IF public.dept_head_can_update_profile(NEW.id) AND NEW.role IN ('account_manager','division_head') THEN
      RETURN NEW;
    END IF;

    -- Everyone else cannot change roles
    RAISE EXCEPTION 'Insufficient privileges to change role';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for role change enforcement
DROP TRIGGER IF EXISTS enforce_role_change ON public.user_profiles;
CREATE TRIGGER enforce_role_change
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.enforce_user_profile_role_change();