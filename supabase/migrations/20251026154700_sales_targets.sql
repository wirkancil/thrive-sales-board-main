-- Create sales_targets table to support targets fetching and RPCs
BEGIN;

CREATE TABLE IF NOT EXISTS public.sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  measure text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  division_id uuid REFERENCES public.divisions(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_targets_assigned_to_idx ON public.sales_targets(assigned_to);
CREATE INDEX IF NOT EXISTS sales_targets_division_id_idx ON public.sales_targets(division_id);
CREATE INDEX IF NOT EXISTS sales_targets_department_id_idx ON public.sales_targets(department_id);
CREATE INDEX IF NOT EXISTS sales_targets_period_idx ON public.sales_targets(period_start, period_end);

-- Enable RLS and add role-based SELECT policy aligned with frontend filters
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_targets_select_policy ON public.sales_targets;
CREATE POLICY sales_targets_select_policy ON public.sales_targets
  FOR SELECT
  TO authenticated
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
      WHERE up.user_id = auth.uid() AND up.role = 'manager' AND up.department_id = public.sales_targets.department_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'account_manager' AND up.id = public.sales_targets.assigned_to
    )
  );

GRANT SELECT ON TABLE public.sales_targets TO authenticated;

COMMIT;