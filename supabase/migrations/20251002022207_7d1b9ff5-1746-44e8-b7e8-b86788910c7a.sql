-- Fix SECURITY DEFINER views by converting them to SECURITY INVOKER
-- This ensures RLS policies are enforced based on the querying user, not the view creator

-- Fix manager_global_search view
ALTER VIEW manager_global_search SET (security_invoker = true);

-- Fix manager_opportunities view
ALTER VIEW manager_opportunities SET (security_invoker = true);

-- Fix manager_team_members view
ALTER VIEW manager_team_members SET (security_invoker = true);

-- Fix v_opportunities_open view
ALTER VIEW v_opportunities_open SET (security_invoker = true);

-- Fix v_pipeline_progress view
ALTER VIEW v_pipeline_progress SET (security_invoker = true);

-- Fix v_user_role view
ALTER VIEW v_user_role SET (security_invoker = true);

-- Note: global_search_index is a materialized view and doesn't have security_invoker/definer
-- Materialized views store data and don't execute with elevated privileges like regular views
-- Access control is handled through RLS on the base tables and the materialized view itself