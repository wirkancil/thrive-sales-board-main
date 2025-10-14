-- Phase 1 Security Hardening Migration
-- 1) Helper functions for role checks
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = is_admin.user_id and p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_department_head(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = is_department_head.user_id and p.role = 'department_head'
  );
$$;

CREATE OR REPLACE FUNCTION public.dept_head_can_update_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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

-- 2) Trigger to enforce safe role changes on user_profiles
CREATE OR REPLACE FUNCTION public.enforce_user_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only enforce when role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Admins can set any role
    IF public.is_admin(auth.uid()) THEN
      RETURN NEW;
    END IF;

    -- Department heads can only set roles within their department and limited to sales_rep/division_head
    IF public.dept_head_can_update_profile(NEW.id) AND NEW.role IN ('sales_rep','division_head') THEN
      RETURN NEW;
    END IF;

    -- Everyone else cannot change roles
    RAISE EXCEPTION 'Insufficient privileges to change role';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_user_profile_role_change ON public.user_profiles;
CREATE TRIGGER enforce_user_profile_role_change
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_profile_role_change();

-- 3) Replace dangerous user_profiles update policy with granular policies
DROP POLICY IF EXISTS "Admins and dept heads can update profiles" ON public.user_profiles;

CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Dept heads can update department profiles with limited roles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.dept_head_can_update_profile(id))
WITH CHECK (public.dept_head_can_update_profile(id) AND role IN ('sales_rep','division_head'));

-- 4) Add missing RLS policies for analytics (UPDATE, DELETE)
DROP POLICY IF EXISTS "User can update own analytics" ON public.analytics;
DROP POLICY IF EXISTS "User can delete own analytics" ON public.analytics;

CREATE POLICY "User can update own analytics"
ON public.analytics
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can delete own analytics"
ON public.analytics
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5) Add missing RLS policies for events (UPDATE, DELETE)
DROP POLICY IF EXISTS "User can update own events" ON public.events;
DROP POLICY IF EXISTS "User can delete own events" ON public.events;

CREATE POLICY "User can update own events"
ON public.events
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can delete own events"
ON public.events
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 6) Add missing RLS policies for reports (UPDATE, DELETE)
DROP POLICY IF EXISTS "User can update own reports" ON public.reports;
DROP POLICY IF EXISTS "User can delete own reports" ON public.reports;

CREATE POLICY "User can update own reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can delete own reports"
ON public.reports
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 7) Add missing RLS policy for sales_activity (DELETE)
DROP POLICY IF EXISTS "User can delete own activities" ON public.sales_activity;

CREATE POLICY "User can delete own activities"
ON public.sales_activity
FOR DELETE
TO authenticated
USING (user_id = auth.uid());