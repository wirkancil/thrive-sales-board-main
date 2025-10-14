-- Phase 1: Database Foundation for Pipeline Management

-- Create loss_reasons table for tracking why deals are lost
CREATE TABLE IF NOT EXISTS public.loss_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing fields to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
ADD COLUMN IF NOT EXISTS close_date date,
ADD COLUMN IF NOT EXISTS lost_reason_id uuid REFERENCES public.loss_reasons(id);

-- Create activities table for next step tracking
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  due_at timestamptz,
  status text DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default loss reasons
INSERT INTO public.loss_reasons (label, active) VALUES
  ('Price too high', true),
  ('Competitor chosen', true),
  ('Budget constraints', true),
  ('Timeline mismatch', true),
  ('No decision made', true),
  ('Requirements changed', true),
  ('Project cancelled', true),
  ('Other', true)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_last_activity ON public.opportunities(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_close_date ON public.opportunities(close_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_lost_reason ON public.opportunities(lost_reason_id);
CREATE INDEX IF NOT EXISTS idx_activities_opportunity ON public.activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_at ON public.activities(due_at);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);

-- Add RLS policies for loss_reasons
ALTER TABLE public.loss_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active loss reasons" ON public.loss_reasons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage loss reasons" ON public.loss_reasons
  FOR ALL USING (is_admin(auth.uid()));

-- Add RLS policies for activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage activities for their opportunities" ON public.activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o 
      WHERE o.id = activities.opportunity_id 
      AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view team activities" ON public.activities
  FOR SELECT USING (
    is_admin_or_dept_head(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.opportunities o 
      WHERE o.id = activities.opportunity_id 
      AND o.owner_id = auth.uid()
    )
  );

-- Add trigger to update opportunities.last_activity_at when activities are created/updated
CREATE OR REPLACE FUNCTION public.update_opportunity_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.opportunities 
  SET last_activity_at = COALESCE(NEW.updated_at, NEW.created_at)
  WHERE id = COALESCE(NEW.opportunity_id, OLD.opportunity_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_opportunity_last_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_opportunity_last_activity();

-- Add trigger to update updated_at timestamp
CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();