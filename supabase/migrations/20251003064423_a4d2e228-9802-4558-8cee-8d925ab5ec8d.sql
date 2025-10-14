-- Create stage_settings table for SLA and points configuration
CREATE TABLE public.stage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key text NOT NULL CHECK (stage_key IN ('prospecting','qualification','discovery','presentation','proposal','closed')),
  default_due_days int NOT NULL DEFAULT 7,
  points int NOT NULL DEFAULT 10,
  org_id uuid REFERENCES public.entities(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(stage_key, org_id)
);

-- Enable RLS on stage_settings
ALTER TABLE public.stage_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for stage_settings
CREATE POLICY "Users can view stage settings" ON public.stage_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can manage stage settings" ON public.stage_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'head', 'manager')
    )
  );

-- Add stage tracking columns to opportunities
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS stage_completed_at timestamptz;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS overridden_due_days int;

-- Create trigger to auto-set stage_entered_at on stage change
CREATE OR REPLACE FUNCTION public.update_stage_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Set stage_entered_at when stage changes
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_entered_at := now();
    NEW.stage_completed_at := NULL;
    
    -- Mark previous stage as completed
    IF OLD.stage IS NOT NULL AND OLD.stage IN ('Closed Won', 'Closed Lost') THEN
      NEW.stage_completed_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER track_stage_changes
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stage_tracking();

-- Insert default stage settings
INSERT INTO public.stage_settings (stage_key, default_due_days, points, org_id, created_by) VALUES
  ('prospecting', 7, 5, NULL, NULL),
  ('qualification', 7, 10, NULL, NULL),
  ('discovery', 14, 15, NULL, NULL),
  ('presentation', 14, 20, NULL, NULL),
  ('proposal', 7, 25, NULL, NULL),
  ('closed', 0, 30, NULL, NULL)
ON CONFLICT (stage_key, org_id) DO NOTHING;

-- Create view for stage metrics
CREATE OR REPLACE VIEW public.opportunity_stage_metrics AS
SELECT 
  o.id,
  o.owner_id,
  o.stage,
  o.stage_entered_at,
  o.stage_completed_at,
  ss.default_due_days,
  COALESCE(o.overridden_due_days, ss.default_due_days) as effective_due_days,
  ss.points,
  CASE 
    WHEN o.stage_entered_at IS NULL THEN 0
    ELSE EXTRACT(DAY FROM (now() - o.stage_entered_at))
  END as days_in_stage,
  CASE 
    WHEN o.stage_entered_at IS NULL THEN false
    ELSE EXTRACT(DAY FROM (now() - o.stage_entered_at)) > COALESCE(o.overridden_due_days, ss.default_due_days)
  END as is_overdue,
  up.full_name as owner_name
FROM public.opportunities o
LEFT JOIN public.stage_settings ss ON ss.stage_key = LOWER(REPLACE(o.stage::text, ' ', ''))
LEFT JOIN public.user_profiles up ON up.id = o.owner_id
WHERE o.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.opportunity_stage_metrics TO authenticated;