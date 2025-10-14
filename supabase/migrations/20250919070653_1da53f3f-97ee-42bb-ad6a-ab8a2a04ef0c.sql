-- Update pipeline stages to match the 6-stage sequential sales flow
-- First, let's clear existing stages and create the new structure

-- Remove existing stages (we'll recreate them with proper order)
DELETE FROM pipeline_stages WHERE pipeline_id IN (SELECT id FROM pipelines);

-- Update existing pipelines or create default one
INSERT INTO pipelines (name, description, is_active, created_by)
SELECT 'Default Sales Pipeline', 'Standard 6-stage sales process', true, auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE name = 'Default Sales Pipeline');

-- Get the default pipeline ID for stage creation
DO $$
DECLARE
    default_pipeline_id uuid;
BEGIN
    SELECT id INTO default_pipeline_id FROM pipelines WHERE name = 'Default Sales Pipeline' LIMIT 1;
    
    -- Create the 6 sequential stages with probability defaults
    INSERT INTO pipeline_stages (pipeline_id, name, sort_order, default_probability, is_won, is_lost, is_active) VALUES
    (default_pipeline_id, 'Prospecting', 1, 0.10, false, false, true),
    (default_pipeline_id, 'Qualification', 2, 0.25, false, false, true),
    (default_pipeline_id, 'Approach/Discovery', 3, 0.40, false, false, true),
    (default_pipeline_id, 'Presentation/POC', 4, 0.60, false, false, true),
    (default_pipeline_id, 'Proposal/Negotiation', 5, 0.80, false, false, true),
    (default_pipeline_id, 'Closed Won', 6, 1.00, true, false, true),
    (default_pipeline_id, 'Closed Lost', 7, 0.00, false, true, true);
END $$;

-- Create function to get the next stage in sequence
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
    -- Get current stage info
    SELECT sort_order, pipeline_id INTO current_sort_order, pipeline_id_val
    FROM pipeline_stages 
    WHERE id = current_stage_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid stage ID or stage is not active';
    END IF;
    
    -- Get next stage
    SELECT id INTO next_stage_id
    FROM pipeline_stages 
    WHERE pipeline_id = pipeline_id_val 
      AND sort_order = current_sort_order + 1 
      AND is_active = true;
    
    RETURN next_stage_id;
END $$;

-- Create function to advance opportunity to next stage
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
    -- Get current stage
    SELECT stage_id INTO current_stage_id
    FROM opportunities 
    WHERE id = opportunity_id AND owner_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Opportunity not found or access denied';
    END IF;
    
    -- Get next stage
    SELECT get_next_stage(current_stage_id) INTO next_stage_id;
    
    IF next_stage_id IS NULL THEN
        RETURN false; -- Already at final stage
    END IF;
    
    -- Get probability for next stage
    SELECT default_probability INTO next_probability
    FROM pipeline_stages 
    WHERE id = next_stage_id;
    
    -- Update opportunity
    UPDATE opportunities 
    SET stage_id = next_stage_id,
        probability = next_probability,
        updated_at = now()
    WHERE id = opportunity_id;
    
    RETURN true;
END $$;

-- Update existing opportunities to use first stage if they don't have a valid stage
DO $$
DECLARE
    default_pipeline_id uuid;
    first_stage_id uuid;
BEGIN
    SELECT id INTO default_pipeline_id FROM pipelines WHERE name = 'Default Sales Pipeline' LIMIT 1;
    SELECT id INTO first_stage_id FROM pipeline_stages WHERE pipeline_id = default_pipeline_id AND sort_order = 1;
    
    -- Update opportunities with invalid or missing stages
    UPDATE opportunities 
    SET stage_id = first_stage_id,
        pipeline_id = default_pipeline_id,
        probability = 0.10
    WHERE stage_id IS NULL 
       OR stage_id NOT IN (SELECT id FROM pipeline_stages WHERE is_active = true);
END $$;