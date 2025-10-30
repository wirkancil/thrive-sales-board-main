-- Add INSERT policy for organizations table
-- This allows authenticated users to create new organizations/customers

DROP POLICY IF EXISTS organizations_insert ON public.organizations;
CREATE POLICY organizations_insert ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (true);

-- Also add UPDATE policy for completeness
DROP POLICY IF EXISTS organizations_update ON public.organizations;
CREATE POLICY organizations_update ON public.organizations
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Add DELETE policy for completeness (restricted to admins)
DROP POLICY IF EXISTS organizations_delete ON public.organizations;
CREATE POLICY organizations_delete ON public.organizations
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.role IN ('admin', 'head')
  )
);