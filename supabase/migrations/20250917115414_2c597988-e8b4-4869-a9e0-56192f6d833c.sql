-- Add INSERT policy for department managers to create sales targets
CREATE POLICY "st_dh_insert" 
ON public.sales_targets
FOR INSERT
TO authenticated
WITH CHECK (
  (current_user_role() = 'department_manager'::text) 
  AND (department_id = current_user_department_id())
  AND (created_by = auth.uid())
);

-- Add INSERT policy for division heads to create sales targets  
CREATE POLICY "st_vh_insert"
ON public.sales_targets
FOR INSERT
TO authenticated
WITH CHECK (
  (current_user_role() = 'division_head'::text)
  AND (division_id = current_user_division_id()) 
  AND (created_by = auth.uid())
);