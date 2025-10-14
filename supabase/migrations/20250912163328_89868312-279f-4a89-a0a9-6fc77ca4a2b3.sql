-- Fix security issue: Restrict access to organization_contacts table
-- Remove public read access and implement need-to-know access controls

-- Drop the overly permissive policy that allows anyone to view all contacts
DROP POLICY IF EXISTS "Users can view organization contacts" ON public.organization_contacts;

-- Create restrictive policies based on business need-to-know principles

-- Users can view contacts for organizations they created
CREATE POLICY "Users can view contacts for own organizations" ON public.organization_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_contacts.organization_id
    AND o.created_by = auth.uid()
  )
);

-- Users can view contacts for organizations they have active opportunities with
CREATE POLICY "Users can view contacts for opportunity organizations" ON public.organization_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.opportunities opp
    JOIN public.organizations o ON (opp.customer_id = o.id OR opp.end_user_id = o.id)
    WHERE o.id = organization_contacts.organization_id
    AND opp.owner_id = auth.uid()
    AND opp.is_active = true
  )
);

-- Users can view contacts for organizations they have activities with
CREATE POLICY "Users can view contacts for activity organizations" ON public.organization_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales_activity_v2 sa
    JOIN public.organizations o ON sa.customer_id = o.id
    WHERE o.id = organization_contacts.organization_id
    AND sa.created_by = auth.uid()
  )
);

-- Users can view contacts they created themselves
CREATE POLICY "Users can view contacts they created" ON public.organization_contacts
FOR SELECT USING (created_by = auth.uid());

-- Department heads can view contacts for organizations within their department's scope
CREATE POLICY "Dept heads can view department contacts" ON public.organization_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid() 
    AND up_current.role = 'department_head'
    AND (
      -- Contacts for organizations created by users in their department
      organization_contacts.organization_id IN (
        SELECT o.id FROM public.organizations o
        JOIN public.user_profiles up_dept ON o.created_by = up_dept.id
        WHERE up_dept.department_id = up_current.department_id
      )
      OR
      -- Contacts for organizations involved in opportunities owned by their department
      EXISTS (
        SELECT 1 FROM public.opportunities opp
        JOIN public.user_profiles up_owner ON opp.owner_id = up_owner.id
        WHERE (opp.customer_id = organization_contacts.organization_id OR opp.end_user_id = organization_contacts.organization_id)
        AND up_owner.department_id = up_current.department_id
      )
    )
  )
);

-- Division heads can view contacts for organizations within their division's scope
CREATE POLICY "Division heads can view division contacts" ON public.organization_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid()
    AND up_current.role = 'division_head'
    AND (
      -- Contacts for organizations created by users in their division
      organization_contacts.organization_id IN (
        SELECT o.id FROM public.organizations o
        JOIN public.user_profiles up_div ON o.created_by = up_div.id
        WHERE up_div.division_id = up_current.division_id
      )
      OR
      -- Contacts for organizations involved in opportunities owned by their division
      EXISTS (
        SELECT 1 FROM public.opportunities opp
        JOIN public.user_profiles up_owner ON opp.owner_id = up_owner.id
        WHERE (opp.customer_id = organization_contacts.organization_id OR opp.end_user_id = organization_contacts.organization_id)
        AND up_owner.division_id = up_current.division_id
      )
    )
  )
);

-- Admins maintain full access (explicit and auditable)
CREATE POLICY "Admins can view all contacts" ON public.organization_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Add comment for audit trail
COMMENT ON TABLE public.organization_contacts IS 'Contact access restricted to need-to-know basis: users can only view contacts for organizations they have legitimate business relationships with';