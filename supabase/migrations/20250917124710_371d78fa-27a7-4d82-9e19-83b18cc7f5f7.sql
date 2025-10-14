-- Create department_targets table for department-level goals
CREATE TABLE public.department_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  division_id uuid REFERENCES public.divisions(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  measure text NOT NULL DEFAULT 'revenue',
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  approval_status approval_status_enum NOT NULL DEFAULT 'draft',
  approved_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  approval_note text,
  notes text,
  currency text NOT NULL DEFAULT 'IDR'
);

-- Create target_cascades table to track division → department connections
CREATE TABLE public.target_cascades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type text NOT NULL CHECK (source_type IN ('division', 'department')),
  source_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('department', 'account_manager')),
  target_id uuid NOT NULL,
  cascade_percentage numeric CHECK (cascade_percentage >= 0 AND cascade_percentage <= 100),
  cascade_amount numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  notes text
);

-- Enable RLS on both tables
ALTER TABLE public.department_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_cascades ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_department_targets_department_id ON public.department_targets(department_id);
CREATE INDEX idx_department_targets_division_id ON public.department_targets(division_id);
CREATE INDEX idx_department_targets_period ON public.department_targets(period_start, period_end);
CREATE INDEX idx_department_targets_created_by ON public.department_targets(created_by);

CREATE INDEX idx_target_cascades_source ON public.target_cascades(source_type, source_id);
CREATE INDEX idx_target_cascades_target ON public.target_cascades(target_type, target_id);
CREATE INDEX idx_target_cascades_period ON public.target_cascades(period_start, period_end);

-- RLS Policies for department_targets

-- Admins can manage all department targets
CREATE POLICY "dt_admin_all_access" 
ON public.department_targets 
FOR ALL 
TO authenticated 
USING (current_user_role() = 'admin') 
WITH CHECK (current_user_role() = 'admin');

-- Division heads can manage department targets in their division
CREATE POLICY "dt_division_head_access" 
ON public.department_targets 
FOR ALL 
TO authenticated 
USING (
  current_user_role() = 'division_head' 
  AND division_id = current_user_division_id()
) 
WITH CHECK (
  current_user_role() = 'division_head' 
  AND division_id = current_user_division_id()
);

-- Department managers can view and update their department targets
CREATE POLICY "dt_dept_manager_select" 
ON public.department_targets 
FOR SELECT 
TO authenticated 
USING (
  current_user_role() = 'department_manager' 
  AND department_id = current_user_department_id()
);

CREATE POLICY "dt_dept_manager_update" 
ON public.department_targets 
FOR UPDATE 
TO authenticated 
USING (
  current_user_role() = 'department_manager' 
  AND department_id = current_user_department_id()
) 
WITH CHECK (
  current_user_role() = 'department_manager' 
  AND department_id = current_user_department_id()
);

-- Users can view department targets they created
CREATE POLICY "dt_creator_select" 
ON public.department_targets 
FOR SELECT 
TO authenticated 
USING (created_by = auth.uid());

-- RLS Policies for target_cascades

-- Admins can manage all target cascades
CREATE POLICY "tc_admin_all_access" 
ON public.target_cascades 
FOR ALL 
TO authenticated 
USING (current_user_role() = 'admin') 
WITH CHECK (current_user_role() = 'admin');

-- Division heads can manage cascades from their division
CREATE POLICY "tc_division_head_access" 
ON public.target_cascades 
FOR ALL 
TO authenticated 
USING (
  current_user_role() = 'division_head' 
  AND source_type = 'division'
  AND source_id = current_user_division_id()
) 
WITH CHECK (
  current_user_role() = 'division_head' 
  AND source_type = 'division'
  AND source_id = current_user_division_id()
);

-- Department managers can view cascades to their department
CREATE POLICY "tc_dept_manager_select" 
ON public.target_cascades 
FOR SELECT 
TO authenticated 
USING (
  current_user_role() = 'department_manager' 
  AND target_type = 'department'
  AND target_id = current_user_department_id()
);

-- Users can view cascades they created
CREATE POLICY "tc_creator_select" 
ON public.target_cascades 
FOR SELECT 
TO authenticated 
USING (created_by = auth.uid());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_department_targets_updated_at
  BEFORE UPDATE ON public.department_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_target_cascades_updated_at
  BEFORE UPDATE ON public.target_cascades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-fill division_id based on department
CREATE OR REPLACE FUNCTION public.department_targets_autofill_division()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-fill division_id from department if not provided
  IF NEW.division_id IS NULL THEN
    SELECT d.division_id INTO NEW.division_id
    FROM public.departments d
    WHERE d.id = NEW.department_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-fill division_id
CREATE TRIGGER department_targets_autofill_division_trigger
  BEFORE INSERT ON public.department_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.department_targets_autofill_division();