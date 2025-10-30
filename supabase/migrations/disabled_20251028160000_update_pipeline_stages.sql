-- Update pipeline stages with correct probabilities and add missing stages
BEGIN;

-- First, update existing stages with correct probabilities
UPDATE public.pipeline_stages 
SET default_probability = 10
WHERE pipeline_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
AND name = 'Prospecting';

UPDATE public.pipeline_stages 
SET default_probability = 10
WHERE pipeline_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
AND name = 'Qualification';

-- Update Proposal to Negotiation and adjust probability
DO $$
DECLARE
  pl UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN
  -- Make the Negotiation stage idempotent and avoid unique conflicts
  IF EXISTS (
    SELECT 1 FROM public.pipeline_stages WHERE pipeline_id = pl AND name = 'Negotiation'
  ) THEN
    -- Update existing Negotiation to expected values
    UPDATE public.pipeline_stages 
    SET default_probability = 20, sort_order = 5
    WHERE pipeline_id = pl AND name = 'Negotiation';

    -- Remove Proposal if it still exists to prevent duplicates
    DELETE FROM public.pipeline_stages 
    WHERE pipeline_id = pl AND name = 'Proposal';
  ELSE
    -- If Negotiation doesn't exist, rename Proposal to Negotiation
    UPDATE public.pipeline_stages 
    SET name = 'Negotiation', default_probability = 20, sort_order = 5
    WHERE pipeline_id = pl AND name = 'Proposal';
  END IF;
END $$;

-- Insert new Discovery stage
INSERT INTO public.pipeline_stages (pipeline_id, name, sort_order, default_probability, is_active, is_won, is_lost)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Discovery', 3, 20, true, false, false)
ON CONFLICT (pipeline_id, name) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  default_probability = EXCLUDED.default_probability;

-- Insert new Presentation/POC stage
INSERT INTO public.pipeline_stages (pipeline_id, name, sort_order, default_probability, is_active, is_won, is_lost)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Presentation/POC', 4, 20, true, false, false)
ON CONFLICT (pipeline_id, name) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  default_probability = EXCLUDED.default_probability;

-- Delete the temporary negotiation stage
-- No longer needed; handled idempotently above

-- Update Closed Won and Closed Lost sort orders and probabilities
UPDATE public.pipeline_stages 
SET sort_order = 6, default_probability = 20
WHERE pipeline_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
AND name = 'Closed Won';

UPDATE public.pipeline_stages 
SET sort_order = 7, default_probability = 0
WHERE pipeline_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
AND name = 'Closed Lost';

COMMIT;