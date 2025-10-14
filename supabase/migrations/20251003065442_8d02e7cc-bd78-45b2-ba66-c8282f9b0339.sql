-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  po_number text,
  po_date date,
  po_amount numeric,
  payment_type text CHECK (payment_type IN ('CBD','TOP','Installments')),
  status text DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Payment details for different types
  cbd_percentage numeric,
  cbd_due_date date,
  top_days integer,
  top_due_date date,
  installments jsonb, -- Array of {percentage, due_date, amount, status}
  
  -- Additional metadata
  notes text,
  currency text DEFAULT 'USD',
  
  CONSTRAINT unique_opportunity_project UNIQUE (opportunity_id)
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.opportunities o 
    WHERE o.id = projects.opportunity_id 
    AND o.owner_id = auth.uid()
  )
);

-- Managers can view team projects
CREATE POLICY "Managers can view team projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities o
    JOIN public.manager_team_members mtm ON o.owner_id = mtm.account_manager_id
    WHERE o.id = projects.opportunity_id 
    AND mtm.manager_id = auth.uid()
  )
);

-- Users can create projects from their won opportunities
CREATE POLICY "Users can create projects from own opportunities"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.opportunities o 
    WHERE o.id = projects.opportunity_id 
    AND o.owner_id = auth.uid()
    AND o.is_won = true
  )
);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.opportunities o 
    WHERE o.id = projects.opportunity_id 
    AND o.owner_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_projects_opportunity_id ON public.projects(opportunity_id);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_status ON public.projects(status);