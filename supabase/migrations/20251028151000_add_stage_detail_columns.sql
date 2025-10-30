-- Add stage detail columns to opportunities table
-- These columns are used by NextStepModal to store stage-specific details

BEGIN;

-- Add stage detail columns to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS qualification_details TEXT,
ADD COLUMN IF NOT EXISTS approach_discovery_details TEXT,
ADD COLUMN IF NOT EXISTS presentation_poc_details TEXT;

-- Add comments to explain the column purposes
COMMENT ON COLUMN public.opportunities.qualification_details IS 'Details and notes for the Qualification stage';
COMMENT ON COLUMN public.opportunities.approach_discovery_details IS 'Details and notes for the Approach/Discovery stage';
COMMENT ON COLUMN public.opportunities.presentation_poc_details IS 'Details and notes for the Presentation/POC stage';

COMMIT;