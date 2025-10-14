-- Update existing stages in place to avoid FK constraint violations

-- Step 1: Get or create the default pipeline
DO $$
DECLARE
    default_pipeline_id uuid;
    stage_ids uuid[];
    stage_names text[] := ARRAY['Prospecting', 'Qualification', 'Approach/Discovery', 'Presentation/POC', 'Proposal/Negotiation', 'Closed Won', 'Closed Lost'];
    stage_probabilities numeric[] := ARRAY[0.10, 0.25, 0.40, 0.60, 0.80, 1.00, 0.00];
    stage_won boolean[] := ARRAY[false, false, false, false, false, true, false];
    stage_lost boolean[] := ARRAY[false, false, false, false, false, false, true];
    i integer;
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
    
    -- Get existing stage IDs for this pipeline
    SELECT array_agg(id ORDER BY sort_order) INTO stage_ids 
    FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id;
    
    -- Update or create stages
    FOR i IN 1..7 LOOP
        IF stage_ids IS NOT NULL AND array_length(stage_ids, 1) >= i THEN
            -- Update existing stage
            UPDATE pipeline_stages SET
                name = stage_names[i],
                sort_order = i,
                default_probability = stage_probabilities[i],
                is_won = stage_won[i],
                is_lost = stage_lost[i],
                is_active = true
            WHERE id = stage_ids[i];
        ELSE
            -- Create new stage
            INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active)
            VALUES (default_pipeline_id, stage_names[i], i, stage_probabilities[i], stage_won[i], stage_lost[i], true);
        END IF;
    END LOOP;
    
    -- Deactivate any extra stages beyond our 7
    UPDATE pipeline_stages SET is_active = false 
    WHERE pipeline_id = default_pipeline_id AND sort_order > 7;
    
    -- Get the prospecting stage ID and reset all opportunities
    SELECT id INTO prospecting_stage_id 
    FROM pipeline_stages 
    WHERE pipeline_id = default_pipeline_id AND name = 'Prospecting';
    
    -- Update all opportunities to use prospecting stage
    UPDATE opportunities SET 
        stage_id = prospecting_stage_id,
        pipeline_id = default_pipeline_id,
        probability = 0.10;
END $$;

-- Step 2: Create helper functions for sequential progression
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