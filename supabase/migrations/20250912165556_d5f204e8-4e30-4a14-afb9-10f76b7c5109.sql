-- Phase 1: Critical Security Fixes

-- 1. Fix User Profile Access Control - Restrict broad access to user_profiles
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view divisions" ON public.divisions;
DROP POLICY IF EXISTS "Users can view pipeline stages" ON public.pipeline_stages;

-- 2. Create restrictive policies for departments (only show departments relevant to user's role)
CREATE POLICY "Users can view own department" 
ON public.departments 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT department_id FROM public.user_profiles 
    WHERE id = auth.uid() AND department_id IS NOT NULL
  )
);

CREATE POLICY "Division heads can view their department" 
ON public.departments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.divisions d ON up.division_id = d.id
    WHERE up.id = auth.uid() 
    AND up.role = 'division_head'
    AND d.department_id = departments.id
  )
);

CREATE POLICY "Dept heads and admins can view all departments" 
ON public.departments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('department_head', 'admin')
  )
);

-- 3. Create restrictive policies for divisions (only show divisions relevant to user's role)
CREATE POLICY "Users can view own division" 
ON public.divisions 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT division_id FROM public.user_profiles 
    WHERE id = auth.uid() AND division_id IS NOT NULL
  )
);

CREATE POLICY "Dept heads can view divisions in their department" 
ON public.divisions 
FOR SELECT 
TO authenticated
USING (
  department_id IN (
    SELECT department_id FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role = 'department_head'
    AND department_id IS NOT NULL
  )
);

CREATE POLICY "Admins can view all divisions" 
ON public.divisions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Create restrictive policies for pipeline_stages (only sales-related roles)
CREATE POLICY "Sales roles can view pipeline stages" 
ON public.pipeline_stages 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('account_manager', 'division_head', 'department_head', 'admin')
  )
);

-- 5. Create audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 6. Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger AS $$
BEGIN
  -- Only log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      created_at
    ) VALUES (
      auth.uid(),
      'ROLE_CHANGE',
      'user_profiles',
      NEW.id,
      json_build_object('role', OLD.role),
      json_build_object('role', NEW.role),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_user_role_changes ON public.user_profiles;
CREATE TRIGGER log_user_role_changes
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- 7. Strengthen user profile access - users can only see their own profile unless they're managers
DROP POLICY IF EXISTS "Users can view accessible pipeline items" ON public.user_profiles;

-- Create restrictive user profile policies
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Division heads can view their division members" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles manager
    WHERE manager.id = auth.uid()
    AND manager.role = 'division_head'
    AND manager.division_id = user_profiles.division_id
  )
);

CREATE POLICY "Dept heads can view their department members" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles manager
    WHERE manager.id = auth.uid()
    AND manager.role = 'department_head'
    AND (
      manager.department_id = user_profiles.department_id
      OR EXISTS (
        SELECT 1 FROM public.divisions d
        WHERE d.department_id = manager.department_id
        AND d.id = user_profiles.division_id
      )
    )
  )
);

CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles admin
    WHERE admin.id = auth.uid() AND admin.role = 'admin'
  )
);