-- Update pipeline stage names as requested
UPDATE pipeline_stages 
SET name = 'Approach/Discovery', updated_at = now()
WHERE name = 'Proposal';

UPDATE pipeline_stages 
SET name = 'Presentation / POC', updated_at = now()
WHERE name = 'Negotiation';