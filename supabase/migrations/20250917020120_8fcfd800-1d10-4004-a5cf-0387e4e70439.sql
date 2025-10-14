-- Fix org hierarchy and role structure
-- First, let's fix the inverted hierarchy in divisions table
ALTER TABLE public.divisions DROP CONSTRAINT IF EXISTS divisions_department_id_fkey;
ALTER TABLE public.divisions DROP COLUMN IF EXISTS department_id;

-- Now departments should reference divisions (correct hierarchy)
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions(id);

-- Create teams table for the complete hierarchy: Organization → Division → Department → Team
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add team_id to user_profiles for account managers
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- Update RLS policies for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_admin_all" ON public.teams
FOR ALL TO authenticated 
USING (current_user_role() = 'admin')
WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "teams_manager_department" ON public.teams
FOR ALL TO authenticated
USING (
  current_user_role() = 'manager' AND 
  EXISTS (
    SELECT 1 FROM public.departments d 
    WHERE d.id = teams.department_id 
    AND d.id = current_user_department_id()
  )
)
WITH CHECK (
  current_user_role() = 'manager' AND 
  EXISTS (
    SELECT 1 FROM public.departments d 
    WHERE d.id = teams.department_id 
    AND d.id = current_user_department_id()
  )
);

CREATE POLICY "teams_select_policy" ON public.teams
FOR SELECT TO authenticated
USING (true);

-- Update divisions RLS to reflect correct hierarchy
DROP POLICY IF EXISTS "divisions_dept_head_insert" ON public.divisions;
DROP POLICY IF EXISTS "divisions_dept_head_update" ON public.divisions; 
DROP POLICY IF EXISTS "divisions_dept_head_delete" ON public.divisions;

-- Heads manage divisions (no department constraint needed)
CREATE POLICY "divisions_head_manage" ON public.divisions
FOR ALL TO authenticated
USING (current_user_role() = 'head' AND division_id = current_user_division_id())
WITH CHECK (current_user_role() = 'head' AND division_id = current_user_division_id());

-- Update departments RLS for managers
CREATE POLICY "departments_manager_manage" ON public.departments
FOR ALL TO authenticated
USING (current_user_role() = 'manager' AND id = current_user_department_id())
WITH CHECK (current_user_role() = 'manager' AND id = current_user_department_id());

-- Update admin_update_profile function to handle team assignments
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_id uuid,
  p_role text,
  p_division uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL,
  p_team uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
begin
  update public.user_profiles
  set role = p_role,
      division_id = p_division,
      department_id = p_department,
      team_id = p_team
  where id = p_id;

  if not found then
    raise exception 'user_profile % not found', p_id using errcode='P0002';
  end if;
end;
$function$;