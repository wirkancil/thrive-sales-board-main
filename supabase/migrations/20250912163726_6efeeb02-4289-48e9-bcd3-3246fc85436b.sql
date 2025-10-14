-- Fix security issue: Restrict access to customer_contacts and customer_org_units tables
-- Remove public read access and implement need-to-know access controls

-- Drop overly permissive policies for customer_contacts
DROP POLICY IF EXISTS "Users can view customer contacts" ON public.customer_contacts;

-- Drop overly permissive policies for customer_org_units  
DROP POLICY IF EXISTS "Users can view customer org units" ON public.customer_org_units;

-- Create restrictive policies for customer_contacts based on business need-to-know

-- Users can view contacts they created
CREATE POLICY "Users can view own customer contacts" ON public.customer_contacts
FOR SELECT USING (created_by = auth.uid());

-- Users can view contacts for customers they have active opportunities with
CREATE POLICY "Users can view contacts for opportunity customers" ON public.customer_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE (o.customer_id = customer_contacts.customer_id OR o.end_user_id = customer_contacts.customer_id)
    AND o.owner_id = auth.uid()
    AND o.is_active = true
  )
);

-- Users can view contacts for customers they have activities with
CREATE POLICY "Users can view contacts for activity customers" ON public.customer_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales_activity_v2 sa
    WHERE sa.customer_id = customer_contacts.customer_id
    AND sa.created_by = auth.uid()
  )
);

-- Department heads can view contacts for customers within their department's scope
CREATE POLICY "Dept heads can view department customer contacts" ON public.customer_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid() 
    AND up_current.role = 'department_head'
    AND (
      -- Contacts created by users in their department
      customer_contacts.created_by IN (
        SELECT up_dept.id FROM public.user_profiles up_dept
        WHERE up_dept.department_id = up_current.department_id
      )
      OR
      -- Contacts for customers involved in opportunities owned by their department
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE (o.customer_id = customer_contacts.customer_id OR o.end_user_id = customer_contacts.customer_id)
        AND up_owner.department_id = up_current.department_id
      )
    )
  )
);

-- Division heads can view contacts for customers within their division's scope
CREATE POLICY "Division heads can view division customer contacts" ON public.customer_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid()
    AND up_current.role = 'division_head'
    AND (
      -- Contacts created by users in their division
      customer_contacts.created_by IN (
        SELECT up_div.id FROM public.user_profiles up_div
        WHERE up_div.division_id = up_current.division_id
      )
      OR
      -- Contacts for customers involved in opportunities owned by their division
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE (o.customer_id = customer_contacts.customer_id OR o.end_user_id = customer_contacts.customer_id)
        AND up_owner.division_id = up_current.division_id
      )
    )
  )
);

-- Admins can view all customer contacts
CREATE POLICY "Admins can view all customer contacts" ON public.customer_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Create restrictive policies for customer_org_units based on business need-to-know

-- Users can view org units they created
CREATE POLICY "Users can view own customer org units" ON public.customer_org_units
FOR SELECT USING (created_by = auth.uid());

-- Users can view org units for customers they have active opportunities with
CREATE POLICY "Users can view org units for opportunity customers" ON public.customer_org_units
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE (o.customer_id = customer_org_units.customer_id OR o.end_user_id = customer_org_units.customer_id)
    AND o.owner_id = auth.uid()
    AND o.is_active = true
  )
);

-- Users can view org units for customers they have activities with
CREATE POLICY "Users can view org units for activity customers" ON public.customer_org_units
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales_activity_v2 sa
    WHERE sa.customer_id = customer_org_units.customer_id
    AND sa.created_by = auth.uid()
  )
);

-- Department heads can view org units for customers within their department's scope
CREATE POLICY "Dept heads can view department customer org units" ON public.customer_org_units
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid() 
    AND up_current.role = 'department_head'
    AND (
      -- Org units created by users in their department
      customer_org_units.created_by IN (
        SELECT up_dept.id FROM public.user_profiles up_dept
        WHERE up_dept.department_id = up_current.department_id
      )
      OR
      -- Org units for customers involved in opportunities owned by their department
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE (o.customer_id = customer_org_units.customer_id OR o.end_user_id = customer_org_units.customer_id)
        AND up_owner.department_id = up_current.department_id
      )
    )
  )
);

-- Division heads can view org units for customers within their division's scope
CREATE POLICY "Division heads can view division customer org units" ON public.customer_org_units
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up_current
    WHERE up_current.id = auth.uid()
    AND up_current.role = 'division_head'
    AND (
      -- Org units created by users in their division
      customer_org_units.created_by IN (
        SELECT up_div.id FROM public.user_profiles up_div
        WHERE up_div.division_id = up_current.division_id
      )
      OR
      -- Org units for customers involved in opportunities owned by their division
      EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles up_owner ON o.owner_id = up_owner.id
        WHERE (o.customer_id = customer_org_units.customer_id OR o.end_user_id = customer_org_units.customer_id)
        AND up_owner.division_id = up_current.division_id
      )
    )
  )
);

-- Admins can view all customer org units
CREATE POLICY "Admins can view all customer org units" ON public.customer_org_units
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- Add audit comments
COMMENT ON TABLE public.customer_contacts IS 'Customer contact access restricted to need-to-know basis: only account managers with legitimate business relationships can view contact details';
COMMENT ON TABLE public.customer_org_units IS 'Customer org unit access restricted to need-to-know basis: only account managers with legitimate business relationships can view organizational structure';