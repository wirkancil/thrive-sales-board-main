-- Fix remaining pipeline security issue
DROP POLICY IF EXISTS "Users can view all pipelines" ON public.pipelines;

-- Create restrictive policy for pipelines (only sales-related roles can view relevant pipelines)
CREATE POLICY "Sales roles can view pipelines" 
ON public.pipelines 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('account_manager', 'division_head', 'department_head', 'admin')
  )
);