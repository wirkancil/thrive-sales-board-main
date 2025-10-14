-- Complete pipeline stages migration with proper cleanup

-- Step 1: Create the new pipeline
INSERT INTO pipelines (name, description, is_active, created_by)
SELECT 'Default Sales Pipeline', 'Standard 6-stage sales process', true, (
  SELECT id FROM auth.users LIMIT 1
)
WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE name = 'Default Sales Pipeline');

-- Step 2: Create new stages and migrate opportunities
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
    old_stage_ids uuid[];
BEGIN
    SELECT id INTO default_pipeline_id FROM pipelines WHERE name = 'Default Sales Pipeline' LIMIT 1;
    
    -- Store old stage IDs for cleanup
    SELECT array_agg(id) INTO old_stage_ids 
    FROM pipeline_stages 
    WHERE pipeline_id != default_pipeline_id OR pipeline_id IS NULL;
    
    -- Create new stages
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'Prospecting', 1, 0.10, false, false, true) RETURNING id INTO prospecting_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'Qualification', 2, 0.25, false, false, true) RETURNING id INTO qualification_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'Approach/Discovery', 3, 0.40, false, false, true) RETURNING id INTO discovery_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'Presentation/POC', 4, 0.60, false, false, true) RETURNING id INTO presentation_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'Proposal/Negotiation', 5, 0.80, false, false, true) RETURNING id INTO negotiation_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'Closed Won', 6, 1.00, true, false, true) RETURNING id INTO won_stage_id;
    
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) 
    VALUES 
    (default_pipeline_id, 'Closed Lost', 7, 0.00, false, true, true) RETURNING id INTO lost_stage_id;
    
    -- Step 3: Clean up opportunity_stage_history that references old stages
    DELETE FROM opportunity_stage_history 
    WHERE from_stage_id = ANY(old_stage_ids) OR to_stage_id = ANY(old_stage_ids);
    
    -- Step 4: Update all opportunities to start at Prospecting stage
    UPDATE opportunities SET 
        stage_id = prospecting_stage_id,
        pipeline_id = default_pipeline_id,
        probability = 0.10;
    
    -- Step 5: Now we can safely delete old stages
    DELETE FROM pipeline_stages WHERE id = ANY(old_stage_ids);
    
END $$;

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