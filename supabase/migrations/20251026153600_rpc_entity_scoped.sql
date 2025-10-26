-- RPC functions to provide entity-scoped data for opportunities and targets
-- These functions match frontend expectations in useEntityScopedData.ts
-- and types declared in src/integrations/supabase/types.ts

-- Helper: get effective user profile info
CREATE OR REPLACE FUNCTION public._get_effective_user_profile(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (user_id UUID, profile_id UUID, role role_enum, division_id UUID, department_id UUID)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT up.user_id,
         up.id AS profile_id,
         up.role,
         up.division_id,
         up.department_id
  FROM public.user_profiles up
  WHERE up.user_id = COALESCE(p_user_id, auth.uid())
  LIMIT 1;
$$;

-- Opportunities: no-arg variant (PostgREST calls without parameters)
CREATE OR REPLACE FUNCTION public.get_entity_scoped_opportunities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  amount NUMERIC,
  stage TEXT,
  owner_id UUID,
  customer_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_role role_enum;
  v_division UUID;
  v_department UUID;
BEGIN
  SELECT user_id, profile_id, role, division_id, department_id
    INTO v_user_id, v_profile_id, v_role, v_division, v_department
  FROM public._get_effective_user_profile(NULL);

  IF v_role = 'admin' OR v_role = 'head' THEN
    RETURN QUERY
    SELECT o.id, o.name, COALESCE(o.amount, 0), o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o;
  ELSIF v_role = 'manager' THEN
    RETURN QUERY
    SELECT o.id, o.name, COALESCE(o.amount, 0), o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    JOIN public.user_profiles owner ON owner.user_id = o.owner_id
    WHERE (owner.department_id = v_department OR owner.division_id = v_division)
       OR EXISTS (
         SELECT 1 FROM public.manager_team_members mtm
         JOIN public.user_profiles am ON am.id = mtm.account_manager_id
         WHERE mtm.manager_id = v_profile_id
           AND am.user_id = o.owner_id
       );
  ELSE
    -- account_manager or unknown: return own
    RETURN QUERY
    SELECT o.id, o.name, COALESCE(o.amount, 0), o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    WHERE o.owner_id = v_user_id;
  END IF;
END;
$$;

-- Opportunities: param variant with optional user override
CREATE OR REPLACE FUNCTION public.get_entity_scoped_opportunities(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  amount NUMERIC,
  stage TEXT,
  owner_id UUID,
  customer_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_role role_enum;
  v_division UUID;
  v_department UUID;
BEGIN
  SELECT user_id, profile_id, role, division_id, department_id
    INTO v_user_id, v_profile_id, v_role, v_division, v_department
  FROM public._get_effective_user_profile(p_user_id);

  IF v_role = 'admin' OR v_role = 'head' THEN
    RETURN QUERY
    SELECT o.id, o.name, COALESCE(o.amount, 0), o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o;
  ELSIF v_role = 'manager' THEN
    RETURN QUERY
    SELECT o.id, o.name, COALESCE(o.amount, 0), o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    JOIN public.user_profiles owner ON owner.user_id = o.owner_id
    WHERE (owner.department_id = v_department OR owner.division_id = v_division)
       OR EXISTS (
         SELECT 1 FROM public.manager_team_members mtm
         JOIN public.user_profiles am ON am.id = mtm.account_manager_id
         WHERE mtm.manager_id = v_profile_id
           AND am.user_id = o.owner_id
       );
  ELSE
    -- account_manager or unknown: return own
    RETURN QUERY
    SELECT o.id, o.name, COALESCE(o.amount, 0), o.stage::TEXT, o.owner_id, o.customer_id, o.created_at
    FROM public.opportunities o
    WHERE o.owner_id = v_user_id;
  END IF;
END;
$$;

-- Targets: no-arg variant (PostgREST calls without parameters)
CREATE OR REPLACE FUNCTION public.get_entity_scoped_targets()
RETURNS TABLE (
  id UUID,
  assigned_to UUID,
  amount NUMERIC,
  period_start DATE,
  period_end DATE,
  measure TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_role role_enum;
  v_division UUID;
  v_department UUID;
BEGIN
  SELECT user_id, profile_id, role, division_id, department_id
    INTO v_user_id, v_profile_id, v_role, v_division, v_department
  FROM public._get_effective_user_profile(NULL);

  IF v_role = 'admin' OR v_role = 'head' THEN
    RETURN QUERY
    SELECT st.id, st.assigned_to, COALESCE(st.amount, 0), st.period_start, st.period_end, st.measure
    FROM public.sales_targets st;
  ELSIF v_role = 'manager' THEN
    RETURN QUERY
    SELECT st.id, st.assigned_to, COALESCE(st.amount, 0), st.period_start, st.period_end, st.measure
    FROM public.sales_targets st
    WHERE st.department_id = v_department OR st.division_id = v_division
       OR EXISTS (
         SELECT 1 FROM public.manager_team_members mtm
         WHERE mtm.manager_id = v_profile_id AND mtm.account_manager_id = st.assigned_to
       );
  ELSE
    -- account_manager or unknown: return own targets
    RETURN QUERY
    SELECT st.id, st.assigned_to, COALESCE(st.amount, 0), st.period_start, st.period_end, st.measure
    FROM public.sales_targets st
    WHERE st.assigned_to = v_profile_id;
  END IF;
END;
$$;

-- Targets: param variant with optional user override
CREATE OR REPLACE FUNCTION public.get_entity_scoped_targets(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  assigned_to UUID,
  amount NUMERIC,
  period_start DATE,
  period_end DATE,
  measure TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_role role_enum;
  v_division UUID;
  v_department UUID;
BEGIN
  SELECT user_id, profile_id, role, division_id, department_id
    INTO v_user_id, v_profile_id, v_role, v_division, v_department
  FROM public._get_effective_user_profile(p_user_id);

  IF v_role = 'admin' OR v_role = 'head' THEN
    RETURN QUERY
    SELECT st.id, st.assigned_to, COALESCE(st.amount, 0), st.period_start, st.period_end, st.measure
    FROM public.sales_targets st;
  ELSIF v_role = 'manager' THEN
    RETURN QUERY
    SELECT st.id, st.assigned_to, COALESCE(st.amount, 0), st.period_start, st.period_end, st.measure
    FROM public.sales_targets st
    WHERE st.department_id = v_department OR st.division_id = v_division
       OR EXISTS (
         SELECT 1 FROM public.manager_team_members mtm
         WHERE mtm.manager_id = v_profile_id AND mtm.account_manager_id = st.assigned_to
       );
  ELSE
    -- account_manager or unknown: return own targets
    RETURN QUERY
    SELECT st.id, st.assigned_to, COALESCE(st.amount, 0), st.period_start, st.period_end, st.measure
    FROM public.sales_targets st
    WHERE st.assigned_to = v_profile_id;
  END IF;
END;
$$;

-- Permissions: allow authenticated users to execute these RPCs
GRANT EXECUTE ON FUNCTION public.get_entity_scoped_opportunities() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_scoped_opportunities(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_scoped_targets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_scoped_targets(UUID) TO authenticated;

-- Optional: allow calling helper function
GRANT EXECUTE ON FUNCTION public._get_effective_user_profile(UUID) TO authenticated;