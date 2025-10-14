-- Fix trigger function and complete migration in one go

-- Step 1: Fix the trigger function to handle null auth.uid()
CREATE OR REPLACE FUNCTION public.track_opportunity_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Only track if stage actually changed
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    -- Get current auth user, use system placeholder if null (during migrations)
    current_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
    
    INSERT INTO public.opportunity_stage_history (
      opportunity_id,
      from_stage_id,
      to_stage_id,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.stage_id,
      NEW.stage_id,
      current_user_id
    );
  END IF;
  RETURN NEW;
END $$;

-- Step 2: Clear existing stage history to avoid FK violations
TRUNCATE opportunity_stage_history;

-- Step 3: Create new pipeline and stages
DO $$
DECLARE
    default_pipeline_id uuid;
    prospecting_stage_id uuid;
BEGIN
    -- Get or create default pipeline
    INSERT INTO pipelines (name, description, is_active, created_by)
    SELECT 'Default Sales Pipeline', 'Standard 6-stage sales process', true, '00000000-0000-0000-0000-000000000000'::uuid
    WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE name = 'Default Sales Pipeline')
    RETURNING id INTO default_pipeline_id;
    
    -- If it already exists, get the ID
    IF default_pipeline_id IS NULL THEN
        SELECT id INTO default_pipeline_id FROM pipelines WHERE name = 'Default Sales Pipeline' LIMIT 1;
    END IF;
    
    -- Delete existing stages for this pipeline
    DELETE FROM pipeline_stages WHERE pipeline_id = default_pipeline_id;
    
    -- Create new stages
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) VALUES
    (default_pipeline_id, 'Prospecting', 1, 0.10, false, false, true),
    (default_pipeline_id, 'Qualification', 2, 0.25, false, false, true),
    (default_pipeline_id, 'Approach/Discovery', 3, 0.40, false, false, true),
    (default_pipeline_id, 'Presentation/POC', 4, 0.60, false, false, true),
    (default_pipeline_id, 'Proposal/Negotiation', 5, 0.80, false, false, true),
    (default_pipeline_id, 'Closed Won', 6, 1.00, true, false, true),
    (default_pipeline_id, 'Closed Lost', 7, 0.00, false, true, true);
    
    -- Get the prospecting stage ID
    SELECT id INTO prospecting_stage_id FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id AND name = 'Prospecting';
    
    -- Reset all opportunities to Prospecting stage
    UPDATE opportunities SET 
        stage_id = prospecting_stage_id,
        pipeline_id = default_pipeline_id,
        probability = 0.10;
        
END $$;

-- Step 4: Add helper functions
CREATE OR REPLACE FUNCTION get_next_stage(current_stage_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_sort_order integer;
    pipeline_id_val uuid;
    next_stage_id uuid;
BEGIN
    SELECT sort_order, pipeline_id INTO current_sort_order, pipeline_id_val
    FROM pipeline_stages 
    WHERE id = current_stage_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    SELECT id INTO next_stage_id
    FROM pipeline_stages 
    WHERE pipeline_id = pipeline_id_val 
      AND sort_order = current_sort_order + 1 
      AND is_active = true;
    
    RETURN next_stage_id;
END $$;

CREATE OR REPLACE FUNCTION advance_opportunity_stage(opportunity_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_stage_id uuid;
    next_stage_id uuid;
    next_probability numeric;
BEGIN
    SELECT stage_id INTO current_stage_id
    FROM opportunities 
    WHERE id = opportunity_id AND owner_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Opportunity not found or access denied';
    END IF;
    
    SELECT get_next_stage(current_stage_id) INTO next_stage_id;
    
    IF next_stage_id IS NULL THEN
        RETURN false;
    END IF;
    
    SELECT default_probability INTO next_probability
    FROM pipeline_stages 
    WHERE id = next_stage_id;
    
    UPDATE opportunities 
    SET stage_id = next_stage_id,
        probability = next_probability,
        updated_at = now()
    WHERE id = opportunity_id;
    
    RETURN true;
END $$;