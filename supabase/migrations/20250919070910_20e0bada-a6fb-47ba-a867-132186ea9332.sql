-- Safe pipeline stages migration: Update existing data first, then restructure

-- Step 1: Create the new pipeline if it doesn't exist
INSERT INTO pipelines (name, description, is_active, created_by)
SELECT 'Default Sales Pipeline', 'Standard 6-stage sales process', true, (
  SELECT id FROM auth.users LIMIT 1
)
WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE name = 'Default Sales Pipeline');

-- Step 2: Create the new stages with temporary names to avoid conflicts
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
    
    -- Step 3: Update existing opportunities to map to new stages
    -- Map old stages to new ones based on name similarity
    UPDATE opportunities SET 
        stage_id = prospecting_stage_id,
        pipeline_id = default_pipeline_id,
        probability = 0.10
    WHERE stage_id IN (
        SELECT id FROM pipeline_stages 
        WHERE name ILIKE '%prospect%' OR name ILIKE '%lead%' OR name = 'Prospecting'
    );
    
    UPDATE opportunities SET 
        stage_id = qualification_stage_id,
        probability = 0.25
    WHERE stage_id IN (
        SELECT id FROM pipeline_stages 
        WHERE name ILIKE '%qual%' OR name = 'Qualification'
    );
    
    UPDATE opportunities SET 
        stage_id = discovery_stage_id,
        probability = 0.40
    WHERE stage_id IN (
        SELECT id FROM pipeline_stages 
        WHERE name ILIKE '%discovery%' OR name ILIKE '%approach%' OR name = 'Approach/Discovery'
    );
    
    UPDATE opportunities SET 
        stage_id = presentation_stage_id,
        probability = 0.60
    WHERE stage_id IN (
        SELECT id FROM pipeline_stages 
        WHERE name ILIKE '%presentation%' OR name ILIKE '%poc%' OR name = 'Presentation / POC'
    );
    
    UPDATE opportunities SET 
        stage_id = negotiation_stage_id,
        probability = 0.80
    WHERE stage_id IN (
        SELECT id FROM pipeline_stages 
        WHERE name ILIKE '%proposal%' OR name ILIKE '%negotiat%' OR name = 'Proposal / Negotiation'
    );
    
    UPDATE opportunities SET 
        stage_id = won_stage_id,
        probability = 1.00
    WHERE stage_id IN (
        SELECT id FROM pipeline_stages 
        WHERE name ILIKE '%won%' OR name ILIKE '%closed won%'
    );
    
    UPDATE opportunities SET 
        stage_id = lost_stage_id,
        probability = 0.00
    WHERE stage_id IN (
        SELECT id FROM pipeline_stages 
        WHERE name ILIKE '%lost%' OR name ILIKE '%closed lost%'
    );
    
    -- Set any remaining opportunities to prospecting stage
    UPDATE opportunities SET 
        stage_id = prospecting_stage_id,
        pipeline_id = default_pipeline_id,
        probability = 0.10
    WHERE stage_id NOT IN (
        SELECT id FROM pipeline_stages WHERE name LIKE 'NEW_%'
    );
    
END $$;

-- Step 4: Now we can safely delete old stages
DELETE FROM pipeline_stages WHERE name NOT LIKE 'NEW_%';

-- Step 5: Rename the new stages to remove the NEW_ prefix
UPDATE pipeline_stages SET name = 'Prospecting' WHERE name = 'NEW_Prospecting';
UPDATE pipeline_stages SET name = 'Qualification' WHERE name = 'NEW_Qualification';
UPDATE pipeline_stages SET name = 'Approach/Discovery' WHERE name = 'NEW_Approach/Discovery';
UPDATE pipeline_stages SET name = 'Presentation/POC' WHERE name = 'NEW_Presentation/POC';
UPDATE pipeline_stages SET name = 'Proposal/Negotiation' WHERE name = 'NEW_Proposal/Negotiation';
UPDATE pipeline_stages SET name = 'Closed Won' WHERE name = 'NEW_Closed Won';
UPDATE pipeline_stages SET name = 'Closed Lost' WHERE name = 'NEW_Closed Lost';