-- Fix Security Definer Views - Make them respect RLS policies
-- Views should run with the permissions of the querying user, not the creator

-- Drop and recreate views with SECURITY INVOKER to respect RLS policies
DROP VIEW IF EXISTS public.v_master_customer CASCADE;
DROP VIEW IF EXISTS public.v_master_end_user CASCADE;
DROP VIEW IF EXISTS public.v_account_managers CASCADE;
DROP VIEW IF EXISTS public.v_master_pipeline CASCADE;
DROP VIEW IF EXISTS public.v_master_opportunity CASCADE;

-- 1. Master Customer View - SECURITY INVOKER respects user's RLS policies
CREATE VIEW public.v_master_customer WITH (security_invoker = true) AS
SELECT 
  o.*,
  array_agg(
    CASE WHEN oc.is_active THEN
      json_build_object(
        'id', oc.id,
        'full_name', oc.full_name,
        'title', oc.title,
        'email', oc.email,
        'phone', oc.phone,
        'mobile', oc.mobile,
        'is_primary', oc.is_primary
      )
    END
  ) FILTER (WHERE oc.id IS NOT NULL) as contacts
FROM public.organizations o
LEFT JOIN public.organization_contacts oc ON o.id = oc.organization_id AND oc.is_active = true
WHERE o.type = 'customer' AND o.is_active = true
GROUP BY o.id, o.org_id, o.name, o.type, o.tax_id, o.website, o.phone, o.email, o.industry, o.addresses, o.is_active, o.created_by, o.created_at, o.updated_at;

-- 2. Master End User View - SECURITY INVOKER respects user's RLS policies
CREATE VIEW public.v_master_end_user WITH (security_invoker = true) AS
SELECT 
  o.*,
  array_agg(
    CASE WHEN oc.is_active THEN
      json_build_object(
        'id', oc.id,
        'full_name', oc.full_name,
        'title', oc.title,
        'email', oc.email,
        'phone', oc.phone,
        'mobile', oc.mobile,
        'is_primary', oc.is_primary
      )
    END
  ) FILTER (WHERE oc.id IS NOT NULL) as contacts
FROM public.organizations o
LEFT JOIN public.organization_contacts oc ON o.id = oc.organization_id AND oc.is_active = true
WHERE o.type = 'end_user' AND o.is_active = true
GROUP BY o.id, o.org_id, o.name, o.type, o.tax_id, o.website, o.phone, o.email, o.industry, o.addresses, o.is_active, o.created_by, o.created_at, o.updated_at;

-- 3. Account Managers View - SECURITY INVOKER respects user's RLS policies
CREATE VIEW public.v_account_managers WITH (security_invoker = true) AS
SELECT 
  up.id,
  up.full_name,
  up.role,
  up.division_id,
  up.department_id,
  d.name as division_name,
  dept.name as department_name,
  up.created_at
FROM public.user_profiles up
LEFT JOIN public.divisions d ON up.division_id = d.id
LEFT JOIN public.departments dept ON up.department_id = dept.id
WHERE up.role IN ('sales_rep', 'division_head', 'department_head', 'admin');

-- 4. Master Pipeline View - SECURITY INVOKER respects user's RLS policies
CREATE VIEW public.v_master_pipeline WITH (security_invoker = true) AS
SELECT 
  p.id as pipeline_id,
  p.org_id,
  p.name as pipeline_name,
  p.description as pipeline_description,
  p.is_active as pipeline_active,
  p.created_at as pipeline_created_at,
  array_agg(
    json_build_object(
      'stage_id', ps.id,
      'stage_name', ps.name,
      'sort_order', ps.sort_order,
      'default_probability', ps.default_probability,
      'is_won', ps.is_won,
      'is_lost', ps.is_lost,
      'is_active', ps.is_active
    ) ORDER BY ps.sort_order
  ) as stages
FROM public.pipelines p
LEFT JOIN public.pipeline_stages ps ON p.id = ps.pipeline_id AND ps.is_active = true
WHERE p.is_active = true
GROUP BY p.id, p.org_id, p.name, p.description, p.is_active, p.created_at;

-- 5. Master Opportunity View - SECURITY INVOKER respects user's RLS policies
CREATE VIEW public.v_master_opportunity WITH (security_invoker = true) AS
SELECT 
  opp.*,
  p.name as pipeline_name,
  ps.name as stage_name,
  ps.sort_order as stage_sort_order,
  ps.default_probability as stage_default_probability,
  ps.is_won as stage_is_won,
  ps.is_lost as stage_is_lost,
  cust.name as customer_name,
  cust.type as customer_type,
  cust.industry as customer_industry,
  eu.name as end_user_name,
  am.full_name as account_manager_name,
  am.role as account_manager_role,
  creator.full_name as created_by_name
FROM public.opportunities opp
JOIN public.pipelines p ON opp.pipeline_id = p.id
JOIN public.pipeline_stages ps ON opp.stage_id = ps.id
JOIN public.organizations cust ON opp.customer_id = cust.id
LEFT JOIN public.organizations eu ON opp.end_user_id = eu.id
JOIN public.user_profiles am ON opp.owner_id = am.id
JOIN public.user_profiles creator ON opp.created_by = creator.id;