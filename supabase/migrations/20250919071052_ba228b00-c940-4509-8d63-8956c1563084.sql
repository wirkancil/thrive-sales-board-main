-- Fix the trigger function to handle null auth.uid() during migrations

-- Step 1: Update the trigger function to handle null changed_by
CREATE OR REPLACE FUNCTION public.track_opportunity_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only track if stage actually changed
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO public.opportunity_stage_history (
      opportunity_id,
      from_stage_id,
      to_stage_id,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.stage_id,
      NEW.stage_id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) -- Use placeholder during migrations
    );
  END IF;
  RETURN NEW;
END $$;

-- Step 2: Now run the actual migration
-- Create the new pipeline if it doesn't exist
INSERT INTO pipelines (name, description, is_active, created_by)
SELECT 'Default Sales Pipeline', 'Standard 6-stage sales process', true, (
  SELECT id FROM auth.users LIMIT 1
)
WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE name = 'Default Sales Pipeline');

-- Step 3: Create the new stages and migrate data
DO $$
DECLARE
    default_pipeline_id uuid;
    prospecting_stage_id uuid;
    qualification_stage_id uuid;
    discovery_stage_id uuid;
    presentation_stage_id uuid;
    negotiation_stage_id uuid;
    won_stage_id uuid;
    lost_stage_id uuid;
BEGIN
    SELECT id INTO default_pipeline_id FROM pipelines WHERE name = 'Default Sales Pipeline' LIMIT 1;
    
    -- Create new stages
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'NEW_Prospecting', 1, 0.10, false, false, true) RETURNING id INTO prospecting_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'NEW_Qualification', 2, 0.25, false, false, true) RETURNING id INTO qualification_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'NEW_Approach/Discovery', 3, 0.40, false, false, true) RETURNING id INTO discovery_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'NEW_Presentation/POC', 4, 0.60, false, false, true) RETURNING id INTO presentation_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'NEW_Proposal/Negotiation', 5, 0.80, false, false, true) RETURNING id INTO negotiation_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'NEW_Closed Won', 6, 1.00, true, false, true) RETURNING id INTO won_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'NEW_Closed Lost', 7, 0.00, false, true, true) RETURNING id INTO lost_stage_id;
    
    -- Update existing opportunities to use the first stage (Prospecting) for all
    UPDATE opportunities SET 
        stage_id = prospecting_stage_id,
        pipeline_id = default_pipeline_id,
        probability = 0.10;
    
END $$;

-- Step 4: Clean up old stages
DELETE FROM pipeline_stages WHERE name NOT LIKE 'NEW_%';

-- Step 5: Rename new stages
UPDATE pipeline_stages SET name = 'Prospecting' WHERE name = 'NEW_Prospecting';
UPDATE pipeline_stages SET name = 'Qualification' WHERE name = 'NEW_Qualification';
UPDATE pipeline_stages SET name = 'Approach/Discovery' WHERE name = 'NEW_Approach/Discovery';
UPDATE pipeline_stages SET name = 'Presentation/POC' WHERE name = 'NEW_Presentation/POC';
UPDATE pipeline_stages SET name = 'Proposal/Negotiation' WHERE name = 'NEW_Proposal/Negotiation';
UPDATE pipeline_stages SET name = 'Closed Won' WHERE name = 'NEW_Closed Won';
UPDATE pipeline_stages SET name = 'Closed Lost' WHERE name = 'NEW_Closed Lost';

-- Step 6: Add helper functions for sequential progression
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