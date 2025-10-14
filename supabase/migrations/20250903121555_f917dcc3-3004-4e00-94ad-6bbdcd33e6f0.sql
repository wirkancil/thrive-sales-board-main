-- Fix the function security issue by properly setting search_path
CREATE OR REPLACE FUNCTION public.create_opportunity_from_activity()
RETURNS TRIGGER AS $$
DECLARE
  default_pipeline_id uuid;
  first_stage_id uuid;
  customer_org_id uuid;
BEGIN
  -- Only trigger when new_opportunity_name is provided and status changes to 'done'
  IF NEW.new_opportunity_name IS NOT NULL AND NEW.status = 'done' AND 
     (OLD.status IS NULL OR OLD.status != 'done') THEN
    
    -- Get default pipeline
    SELECT id INTO default_pipeline_id 
    FROM public.pipelines 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Get first stage of pipeline
    SELECT id INTO first_stage_id
    FROM public.pipeline_stages 
    WHERE pipeline_id = default_pipeline_id 
      AND is_active = true
    ORDER BY sort_order 
    LIMIT 1;
    
    -- Create opportunity
    INSERT INTO public.opportunities (
      pipeline_id,
      stage_id,
      owner_id,
      customer_id,
      name,
      description,
      created_by,
      created_from_activity_id,
      status
    ) VALUES (
      default_pipeline_id,
      first_stage_id,
      NEW.created_by,
      NEW.customer_id,
      NEW.new_opportunity_name,
      COALESCE(NEW.notes, 'Created from ' || NEW.activity_type || ' activity'),
      NEW.created_by,
      NEW.id,
      'open'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER 
   STABLE
   SET search_path = 'public';