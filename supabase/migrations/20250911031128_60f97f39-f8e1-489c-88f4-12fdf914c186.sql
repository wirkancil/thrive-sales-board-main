-- Create sales_targets table
CREATE TABLE public.sales_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_manager_id UUID NOT NULL,
  measure TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  fiscal_year TEXT NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  quarterly_amount NUMERIC NOT NULL DEFAULT 0,
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

-- Create policies for sales targets
CREATE POLICY "Users can create sales targets" 
ON public.sales_targets 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view accessible sales targets" 
ON public.sales_targets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM user_profiles up_creator
    JOIN user_profiles up_current ON up_current.id = auth.uid()
    WHERE up_creator.id = created_by
      AND (
        -- Own targets
        created_by = auth.uid() 
        OR account_manager_id = auth.uid()
        -- Division heads can view targets in their division
        OR (up_current.role = 'division_head' AND up_current.division_id = up_creator.division_id)
        -- Department heads can view targets in their department
        OR (up_current.role = 'department_head' AND up_current.department_id = up_creator.department_id)
        -- Admins can view all targets
        OR up_current.role = 'admin'
      )
  )
);

CREATE POLICY "Users can update their sales targets" 
ON public.sales_targets 
FOR UPDATE 
USING (created_by = auth.uid() OR is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_targets_updated_at
BEFORE UPDATE ON public.sales_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();