-- Phase 1: Drop all policies that reference the role column first
-- Drop policies on entities table
DROP POLICY IF EXISTS "Admins can manage entities" ON public.entities;
DROP POLICY IF EXISTS "Everyone can read active entities" ON public.entities;

-- Drop policies on other tables that reference role
DROP POLICY IF EXISTS "Admins can manage titles" ON public.titles;
DROP POLICY IF EXISTS "Everyone can read active titles" ON public.titles;
DROP POLICY IF EXISTS "Admins can manage regions" ON public.regions;  
DROP POLICY IF EXISTS "Everyone can read active regions" ON public.regions;
DROP POLICY IF EXISTS "Admins can manage FX rates" ON public.fx_rates;
DROP POLICY IF EXISTS "Users can read active FX rates" ON public.fx_rates;
DROP POLICY IF EXISTS "Admins can manage fiscal calendars" ON public.fiscal_calendars;
DROP POLICY IF EXISTS "Everyone can read active fiscal calendars" ON public.fiscal_calendars;
DROP POLICY IF EXISTS "Admins can manage loss reasons" ON public.loss_reasons;
DROP POLICY IF EXISTS "Everyone can read active loss reasons" ON public.loss_reasons;

-- Drop user_profiles policies
DROP POLICY IF EXISTS "department_managers_can_view_department_users" ON public.user_profiles;
DROP POLICY IF EXISTS "Role based user access" ON public.user_profiles;
DROP POLICY IF EXISTS "Role assignment policy" ON public.user_profiles;
DROP POLICY IF EXISTS "User profiles insert policy" ON public.user_profiles;

-- Drop any other policies that might reference role
DROP POLICY IF EXISTS "dt_admin_all_access" ON public.department_targets;
DROP POLICY IF EXISTS "dt_division_head_access" ON public.department_targets;
DROP POLICY IF EXISTS "dt_dept_manager_select" ON public.department_targets; 
DROP POLICY IF EXISTS "dt_dept_manager_update" ON public.department_targets;
DROP POLICY IF EXISTS "divisions_admin_all" ON public.divisions;
DROP POLICY IF EXISTS "departments_insert_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_update_policy" ON public.departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON public.departments;