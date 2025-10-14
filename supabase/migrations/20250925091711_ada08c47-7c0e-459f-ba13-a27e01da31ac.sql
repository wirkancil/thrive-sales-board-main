-- Phase 1: Drop all remaining role-dependent policies
-- Drop audit_log policies
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_log;

-- Drop organizations policies
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;

-- Drop rbac_audit_log policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.rbac_audit_log;

-- Drop sales_targets policies
DROP POLICY IF EXISTS "st_admin_all_access" ON public.sales_targets;
DROP POLICY IF EXISTS "st_dh_delete" ON public.sales_targets;
DROP POLICY IF EXISTS "st_dh_insert" ON public.sales_targets;
DROP POLICY IF EXISTS "st_dh_select" ON public.sales_targets;
DROP POLICY IF EXISTS "st_dh_update" ON public.sales_targets;
DROP POLICY IF EXISTS "st_self_select" ON public.sales_targets;
DROP POLICY IF EXISTS "st_self_update_progress" ON public.sales_targets;
DROP POLICY IF EXISTS "st_vh_delete" ON public.sales_targets;
DROP POLICY IF EXISTS "st_vh_insert" ON public.sales_targets;
DROP POLICY IF EXISTS "st_vh_select" ON public.sales_targets;
DROP POLICY IF EXISTS "st_vh_update" ON public.sales_targets;

-- Drop target_cascades policies
DROP POLICY IF EXISTS "tc_admin_all_access" ON public.target_cascades;
DROP POLICY IF EXISTS "tc_dept_manager_select" ON public.target_cascades;
DROP POLICY IF EXISTS "tc_division_head_access" ON public.target_cascades;

-- Drop teams policies
DROP POLICY IF EXISTS "teams_admin_all" ON public.teams;
DROP POLICY IF EXISTS "teams_department_manager" ON public.teams;

-- Drop user_profiles policies
DROP POLICY IF EXISTS "admins_can_manage_all_users" ON public.user_profiles;