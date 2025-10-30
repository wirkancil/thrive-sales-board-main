-- Add additional stage detail columns for complete Stage History coverage

BEGIN;

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS prospecting_details TEXT,
ADD COLUMN IF NOT EXISTS negotiation_details TEXT;

COMMENT ON COLUMN public.opportunities.prospecting_details IS 'Details and notes for the Prospecting stage';
COMMENT ON COLUMN public.opportunities.negotiation_details IS 'Details and notes for the Negotiation stage';

COMMIT;