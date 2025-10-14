-- Fix security issue: Restrict access to companies table business intelligence
-- Remove public read access and implement need-to-know access controls

-- Drop the overly permissive policy that allows all users to view active companies
DROP POLICY IF EXISTS "Users can view active companies" ON public.companies;

-- Create restrictive policies based on business need-to-know principles

-- Users can view companies they created
CREATE POLICY "Users can view own companies" ON public.companies
FOR SELECT USING (created_by = auth.uid());

-- Users can view companies they have active opportunities with
CREATE POLICY "Users can view companies with opportunities" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    JOIN public.organizations org ON (o.customer_id = org.id OR o.end_user_id = org.id)
    WHERE org.name = companies.name  -- Link companies to organizations by name
    AND o.owner_id = auth.uid()
    AND o.is_active = true
  )
);

-- Users can view companies they have sales activities with
CREATE POLICY "Users can view companies with activities" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales_activity_v2 sa
    JOIN public.organizations org ON sa.customer_id = org.id
    WHERE org.name = companies.name  -- Link companies to organizations by name
    AND sa.created_by = auth.uid()
  )
);

-- Users can view companies they have deals with
CREATE POLICY "Users can view companies with deals" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.company_name = companies.name
    AND d.user_id = auth.uid()
  )
);

-- Department heads can view companies within their department's business scope
CREATE POLICY "Dept heads can view department companies" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid() 
    AND up_current.role = 'department_head'
    AND (
      -- Companies created by users in their department
      companies.created_by IN (
        SELECT up_dept.id FROM public.user_profiles up_dept
        WHERE up_dept.department_id = up_current.department_id
      )
      OR
      -- Companies involved in opportunities owned by their department
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.organizations org ON (o.customer_id = org.id OR o.end_user_id = org.id)
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE org.name = companies.name
        AND up_owner.department_id = up_current.department_id
      )
      OR
      -- Companies with deals by their department users
      EXISTS (
        SELECT 1 FROM public.deals d
        JOIN public.user_profiles up_owner ON d.user_id = up_owner.id
        WHERE d.company_name = companies.name
        AND up_owner.department_id = up_current.department_id
      )
    )
  )
);

-- Division heads can view companies within their division's business scope
CREATE POLICY "Division heads can view division companies" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid()
    AND up_current.role = 'division_head'
    AND (
      -- Companies created by users in their division
      companies.created_by IN (
        SELECT up_div.id FROM public.user_profiles up_div
        WHERE up_div.division_id = up_current.division_id
      )
      OR
      -- Companies involved in opportunities owned by their division
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.organizations org ON (o.customer_id = org.id OR o.end_user_id = org.id)
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE org.name = companies.name
        AND up_owner.division_id = up_current.division_id
      )
      OR
      -- Companies with deals by their division users
      EXISTS (
        SELECT 1 FROM public.deals d
        JOIN public.user_profiles up_owner ON d.user_id = up_owner.id
        WHERE d.company_name = companies.name
        AND up_owner.division_id = up_current.division_id
      )
    )
  )
);

-- Admins maintain full access (explicit and auditable)
CREATE POLICY "Admins can view all companies" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Add comment for audit trail
COMMENT ON TABLE public.companies IS 'Company access restricted to need-to-know basis: users can only view companies they have legitimate business relationships with to protect business intelligence';