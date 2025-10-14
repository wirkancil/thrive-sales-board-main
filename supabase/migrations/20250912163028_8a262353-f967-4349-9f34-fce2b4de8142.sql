-- Fix security issue: Restrict access to sensitive organization data
-- Remove overly permissive policies and implement need-to-know access controls

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view approved or own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins and dept heads can view all organizations" ON public.organizations;

-- Create more restrictive policies based on business need-to-know

-- Users can view organizations they created (own organizations)
CREATE POLICY "Users can view own organizations" ON public.organizations
FOR SELECT USING (created_by = auth.uid());

-- Users can view organizations they have active opportunities with
CREATE POLICY "Users can view organizations with active opportunities" ON public.organizations  
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE (o.customer_id = organizations.id OR o.end_user_id = organizations.id)
    AND o.owner_id = auth.uid()
    AND o.is_active = true
  )
);

-- Users can view organizations they have activities with
CREATE POLICY "Users can view organizations with activities" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales_activity_v2 sa
    WHERE sa.customer_id = organizations.id
    AND sa.created_by = auth.uid()
  )
);

-- Department heads can view organizations within their department's scope
CREATE POLICY "Dept heads can view department organizations" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid() 
    AND up_current.role = 'department_head'
    AND (
      -- Organizations created by users in their department
      organizations.created_by IN (
        SELECT up_dept.id FROM public.user_profiles up_dept
        WHERE up_dept.department_id = up_current.department_id
      )
      OR
      -- Organizations involved in opportunities owned by their department
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE (o.customer_id = organizations.id OR o.end_user_id = organizations.id)
        AND up_owner.department_id = up_current.department_id
      )
    )
  )
);

-- Division heads can view organizations within their division's scope  
CREATE POLICY "Division heads can view division organizations" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid()
    AND up_current.role = 'division_head' 
    AND (
      -- Organizations created by users in their division
      organizations.created_by IN (
        SELECT up_div.id FROM public.user_profiles up_div  
        WHERE up_div.division_id = up_current.division_id
      )
      OR
      -- Organizations involved in opportunities owned by their division
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE (o.customer_id = organizations.id OR o.end_user_id = organizations.id)
        AND up_owner.division_id = up_current.division_id
      )
    )
  )
);

-- Admins maintain full access (but this is now explicit and auditable)
CREATE POLICY "Admins can view all organizations" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Add comment for audit trail
COMMENT ON TABLE public.organizations IS 'Access restricted to need-to-know basis: users can only view organizations they created, have business relationships with, or manage within their organizational hierarchy';