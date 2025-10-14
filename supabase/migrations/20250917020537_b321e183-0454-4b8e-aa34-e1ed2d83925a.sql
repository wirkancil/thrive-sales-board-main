-- Fix org hierarchy - Step 2: Add remaining policies and update function
-- New RLS policies for correct hierarchy (Heads manage divisions)
CREATE POLICY "divisions_head_manage" ON public.divisions
FOR ALL TO authenticated
USING (current_user_role() = 'head' AND division_id = current_user_division_id())
WITH CHECK (current_user_role() = 'head' AND division_id = current_user_division_id());

-- Managers manage departments
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