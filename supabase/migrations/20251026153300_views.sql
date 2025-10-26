-- Views for frontend compatibility and analytics

-- Customers view
CREATE OR REPLACE VIEW public.v_master_customer AS
SELECT o.id,
       o.name,
       o.industry,
       o.is_active,
       o.created_at,
       o.updated_at
FROM public.organizations o
WHERE o.org_type = 'customer' AND o.is_active = true;

-- End users view
CREATE OR REPLACE VIEW public.v_master_end_user AS
SELECT o.id,
       o.name,
       o.industry,
       o.is_active,
       o.created_at,
       o.updated_at
FROM public.organizations o
WHERE o.org_type = 'end_user' AND o.is_active = true;

-- Simple user-role view (used by some relations)
CREATE OR REPLACE VIEW public.v_user_role AS
SELECT up.user_id,
       up.id AS profile_id,
       up.full_name,
       up.role,
       up.division_id,
       up.department_id
FROM public.user_profiles up;

-- Master pipeline view (id mapping)
CREATE OR REPLACE VIEW public.v_master_pipeline AS
SELECT p.id AS pipeline_id,
       p.name AS pipeline_name,
       p.is_active,
       p.created_at,
       p.updated_at
FROM public.pipelines p;

-- Opportunities open view
CREATE OR REPLACE VIEW public.v_opportunities_open AS
SELECT o.*
FROM public.opportunities o
WHERE COALESCE(o.is_closed, false) = false;

-- Pipeline progress view (join pipeline items with opportunities)
CREATE OR REPLACE VIEW public.v_pipeline_progress AS
SELECT 
  pi.opportunity_id AS id,
  pi.pipeline_id,
  pi.amount,
  pi.status,
  o.stage,
  o.owner_id,
  o.customer_id,
  o.end_user_id,
  o.expected_close_date,
  o.next_step_title,
  o.next_step_due_date
FROM public.pipeline_items pi
JOIN public.opportunities o ON o.id = pi.opportunity_id;