-- Add fields to store stage-specific details for progressive advancement

ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS qualification_details TEXT,
ADD COLUMN IF NOT EXISTS approach_discovery_details TEXT,
ADD COLUMN IF NOT EXISTS presentation_poc_details TEXT;