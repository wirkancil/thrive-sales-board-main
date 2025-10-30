-- Add addresses column to organizations table
BEGIN;

-- Add addresses column as JSONB to store billing and shipping addresses
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS addresses JSONB;

-- Add some additional columns that are referenced in the frontend
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS market_size TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on addresses for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_addresses ON public.organizations USING GIN (addresses);

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;