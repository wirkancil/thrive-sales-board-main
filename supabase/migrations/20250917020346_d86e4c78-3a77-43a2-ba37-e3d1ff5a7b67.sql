-- Fix org hierarchy and role structure - Step 1: Drop dependent policies first
DROP POLICY IF EXISTS "divisions_dept_head_insert" ON public.divisions;
DROP POLICY IF EXISTS "divisions_dept_head_update" ON public.divisions; 
DROP POLICY IF EXISTS "divisions_dept_head_delete" ON public.divisions;

-- Now we can safely drop the constraint and column
ALTER TABLE public.divisions DROP CONSTRAINT IF EXISTS divisions_department_id_fkey;
ALTER TABLE public.divisions DROP COLUMN IF EXISTS department_id;

-- Fix the hierarchy: departments should reference divisions (Organization → Division → Department → Team)
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES public.divisions(id);

-- Create teams table for the complete hierarchy
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add team_id to user_profiles for account managers
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- Enable RLS for teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
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