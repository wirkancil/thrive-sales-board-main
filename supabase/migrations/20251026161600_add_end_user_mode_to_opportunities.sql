-- Add end_user_mode column to opportunities table
-- This column is used to track whether the end user is the same as the customer or different

BEGIN;

-- Add end_user_mode column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS end_user_mode TEXT;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN public.opportunities.end_user_mode IS 'Indicates if end user is same as customer or different. Values: "same_as_customer" or null';

COMMIT;