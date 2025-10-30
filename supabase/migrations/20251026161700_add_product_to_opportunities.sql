-- Add product column to opportunities table
-- This column is used to track the product associated with the opportunity

BEGIN;

-- Add product column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS product TEXT;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN public.opportunities.product IS 'Product associated with the opportunity';

COMMIT;