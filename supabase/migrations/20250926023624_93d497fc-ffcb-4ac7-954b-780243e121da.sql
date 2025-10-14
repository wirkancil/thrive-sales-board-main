-- Enable RLS on sales_targets table and create basic policies
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

-- Policy for users to see targets assigned to them
CREATE POLICY "Users can view their assigned targets" 
ON public.sales_targets 
FOR SELECT 
USING (assigned_to = auth.uid());

-- Policy for admins to view all targets
CREATE POLICY "Admins can view all targets" 
ON public.sales_targets 
FOR SELECT 
USING (public.check_is_admin());

-- Policy for managers to view targets in their department
CREATE POLICY "Managers can view department targets" 
ON public.sales_targets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'manager' 
    AND up.department_id = sales_targets.department_id
  )
);

-- Policy for heads to view targets in their division
CREATE POLICY "Heads can view division targets" 
ON public.sales_targets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'head' 
    AND up.division_id = sales_targets.division_id
  )
);

-- Policy for creating targets (admins, managers, heads)
CREATE POLICY "Authorized users can create targets" 
ON public.sales_targets 
FOR INSERT 
WITH CHECK (
  public.check_is_admin() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('manager', 'head')
  )
);

-- Policy for updating targets (admins, managers, heads)
CREATE POLICY "Authorized users can update targets" 
ON public.sales_targets 
FOR UPDATE 
USING (
  public.check_is_admin() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('manager', 'head')
  )
);

-- Policy for deleting targets (admins only)
CREATE POLICY "Admins can delete targets" 
ON public.sales_targets 
FOR DELETE 
USING (public.check_is_admin());