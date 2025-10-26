-- Minimal RLS policies aligned with role hierarchy

-- Enable RLS on key tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- user_profiles: read own profile, admins & heads read all
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin','head')
  )
);

-- opportunities: admins & heads read all; managers by division/department; AM by ownership
DROP POLICY IF EXISTS opportunities_select ON public.opportunities;
CREATE POLICY opportunities_select ON public.opportunities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin','head')
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
  OR public.opportunities.owner_id = auth.uid()
);

-- pipeline_items: admins & heads read all; managers by linked opportunity division/department; AM by linked opportunity ownership
DROP POLICY IF EXISTS pipeline_items_select ON public.pipeline_items;
CREATE POLICY pipeline_items_select ON public.pipeline_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin','head')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.opportunities o
        JOIN public.user_profiles owner ON owner.user_id = o.owner_id
        WHERE o.id = public.pipeline_items.opportunity_id
          AND (owner.division_id = up.division_id OR owner.department_id = up.department_id)
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = public.pipeline_items.opportunity_id AND o.owner_id = auth.uid()
  )
);

-- organizations: allow read for all authenticated users
DROP POLICY IF EXISTS organizations_select ON public.organizations;
CREATE POLICY organizations_select ON public.organizations
FOR SELECT TO authenticated
USING (true);

-- audit_logs: allow insert own logs; read only by admins & heads
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin','head')
  )
);