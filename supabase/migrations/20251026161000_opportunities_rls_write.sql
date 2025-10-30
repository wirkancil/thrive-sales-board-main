-- RLS write policies for opportunities (INSERT/UPDATE/DELETE)
-- This fixes the issue where staff level users cannot create new opportunities

-- Ensure table exists and RLS enabled
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- INSERT policy: allow authenticated users to create opportunities they will own
DROP POLICY IF EXISTS opportunities_insert_policy ON public.opportunities;
CREATE POLICY opportunities_insert_policy ON public.opportunities
FOR INSERT TO authenticated
WITH CHECK (
  -- User can create opportunities where they are the owner
  owner_id = auth.uid()
  -- Or user can create opportunities if they have admin/head/manager role
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head', 'manager')
  )
);

-- UPDATE policy: allow updating opportunities they own or manage
DROP POLICY IF EXISTS opportunities_update_policy ON public.opportunities;
CREATE POLICY opportunities_update_policy ON public.opportunities
FOR UPDATE TO authenticated
USING (
  -- Own opportunities
  owner_id = auth.uid()
  -- Or admin/head can update all
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  -- Or manager can update team opportunities
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.user_profiles owner
        WHERE owner.user_id = public.opportunities.owner_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
)
WITH CHECK (
  -- Same conditions for what they can update
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.user_profiles owner
        WHERE owner.user_id = public.opportunities.owner_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
);

-- DELETE policy: allow deleting opportunities they own or manage
DROP POLICY IF EXISTS opportunities_delete_policy ON public.opportunities;
CREATE POLICY opportunities_delete_policy ON public.opportunities
FOR DELETE TO authenticated
USING (
  -- Own opportunities
  owner_id = auth.uid()
  -- Or admin/head can delete all
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head')
  )
  -- Or manager can delete team opportunities
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.user_profiles owner
        WHERE owner.user_id = public.opportunities.owner_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
);