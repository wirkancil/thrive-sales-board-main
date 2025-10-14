-- Add RLS policies for divisions table

-- Allow everyone to select divisions (needed for dropdowns)
CREATE POLICY "divisions_select_policy" ON public.divisions
FOR SELECT 
USING (true);

-- Allow admins to manage all divisions  
CREATE POLICY "divisions_admin_all" ON public.divisions
FOR ALL
USING (current_user_role() = 'admin')
WITH CHECK (current_user_role() = 'admin');

-- Allow department heads to manage divisions in their department
CREATE POLICY "divisions_dept_head_insert" ON public.divisions
FOR INSERT
WITH CHECK (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
);

CREATE POLICY "divisions_dept_head_update" ON public.divisions
FOR UPDATE
USING (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
)
WITH CHECK (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
);

CREATE POLICY "divisions_dept_head_delete" ON public.divisions
FOR DELETE
USING (
  current_user_role() = 'department_head' 
  AND department_id = current_user_department_id()
);