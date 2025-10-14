-- Strengthen RLS and add security triggers for deals table
-- 1) Function to auto-set user_id from auth context on insert
CREATE OR REPLACE FUNCTION public.set_deal_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Attach trigger to deals table to ensure user_id is always set
DROP TRIGGER IF EXISTS set_deals_user_id ON public.deals;
CREATE TRIGGER set_deals_user_id
BEFORE INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.set_deal_user_id();

-- 3) Ensure updated_at is maintained automatically on updates
DROP TRIGGER IF EXISTS set_deals_updated_at ON public.deals;
CREATE TRIGGER set_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_deals_updated_at();

-- 4) Harden RLS policies: restrict to authenticated role explicitly
-- Drop existing policies if present
DROP POLICY IF EXISTS "User can read their own deals" ON public.deals;
DROP POLICY IF EXISTS "User can insert own deals" ON public.deals;
DROP POLICY IF EXISTS "User can update their own deals" ON public.deals;

-- Create strict policies for authenticated users only
CREATE POLICY "Users (auth) can read their own deals"
ON public.deals
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users (auth) can insert own deals"
ON public.deals
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users (auth) can update their own deals"
ON public.deals
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());