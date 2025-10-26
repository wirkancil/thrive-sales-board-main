-- RLS write policies for sales_targets (INSERT/UPDATE/DELETE)
BEGIN;

-- Ensure table exists and RLS enabled
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

-- Grant write privileges to PostgREST role
GRANT INSERT, UPDATE, DELETE ON TABLE public.sales_targets TO authenticated;

-- INSERT policy: allow based on role and scope
DROP POLICY IF EXISTS sales_targets_insert_policy ON public.sales_targets;
CREATE POLICY sales_targets_insert_policy ON public.sales_targets
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Admin can insert any
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
    OR
    -- Head can insert within their division
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'head'
        AND up.division_id = public.sales_targets.division_id
    )
    OR
    -- Manager can insert within their department/division or for team members
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'manager'
        AND (
          up.department_id = public.sales_targets.department_id
          OR up.division_id = public.sales_targets.division_id
          OR EXISTS (
            SELECT 1 FROM public.manager_team_members mtm
            WHERE mtm.manager_id = up.id
              AND mtm.account_manager_id = public.sales_targets.assigned_to
          )
        )
    )
    OR
    -- Account manager can insert only for self
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'account_manager'
        AND up.id = public.sales_targets.assigned_to
    )
  );

-- UPDATE policy: allow updating rows they can see and within same scope
DROP POLICY IF EXISTS sales_targets_update_policy ON public.sales_targets;
CREATE POLICY sales_targets_update_policy ON public.sales_targets
  FOR UPDATE TO authenticated
  USING (
    -- Reuse SELECT visibility
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'head' AND up.division_id = public.sales_targets.division_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'manager' AND (
        up.department_id = public.sales_targets.department_id OR up.division_id = public.sales_targets.division_id
        OR EXISTS (
          SELECT 1 FROM public.manager_team_members mtm
          WHERE mtm.manager_id = up.id AND mtm.account_manager_id = public.sales_targets.assigned_to
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'account_manager' AND up.id = public.sales_targets.assigned_to
    )
  )
  WITH CHECK (
    -- Ensure updated row remains within scope
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'head' AND up.division_id = public.sales_targets.division_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'manager' AND (
        up.department_id = public.sales_targets.department_id OR up.division_id = public.sales_targets.division_id
        OR EXISTS (
          SELECT 1 FROM public.manager_team_members mtm
          WHERE mtm.manager_id = up.id AND mtm.account_manager_id = public.sales_targets.assigned_to
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'account_manager' AND up.id = public.sales_targets.assigned_to
    )
  );

-- DELETE policy: allow deleting rows they can see
DROP POLICY IF EXISTS sales_targets_delete_policy ON public.sales_targets;
CREATE POLICY sales_targets_delete_policy ON public.sales_targets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'head' AND up.division_id = public.sales_targets.division_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'manager' AND (
        up.department_id = public.sales_targets.department_id OR up.division_id = public.sales_targets.division_id
        OR EXISTS (
          SELECT 1 FROM public.manager_team_members mtm
          WHERE mtm.manager_id = up.id AND mtm.account_manager_id = public.sales_targets.assigned_to
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'account_manager' AND up.id = public.sales_targets.assigned_to
    )
  );

COMMIT;