-- Phase 1: Drop all remaining policies that reference the role column
-- Drop system_settings policies
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Everyone can read system settings" ON public.system_settings;

-- Drop any other role-dependent policies I might have missed
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can write audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_log_v2;
DROP POLICY IF EXISTS "Heads can view their entity audit logs" ON public.audit_log_v2;
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_log_v2;

-- Check for any other user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Check for any other role-dependent policies across all tables
DROP POLICY IF EXISTS "Dept heads can view all opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Dept heads can update all opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Dept heads can view all opportunity history" ON public.opportunity_stage_history;
DROP POLICY IF EXISTS "Admins and dept heads can manage pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Admins and dept heads can manage pipeline stages" ON public.pipeline_stages;