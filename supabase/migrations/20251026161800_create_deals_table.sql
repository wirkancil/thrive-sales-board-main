-- Create deals table for analytics dashboard
-- This table is used by SalesAnalyticsDashboard.tsx

BEGIN;

-- Create deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  deal_value NUMERIC(18,2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for deals table
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- SELECT policy: users can see their own deals
DROP POLICY IF EXISTS deals_select_policy ON public.deals;
CREATE POLICY deals_select_policy ON public.deals
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head', 'manager')
  )
);

-- INSERT policy: users can create their own deals
DROP POLICY IF EXISTS deals_insert_policy ON public.deals;
CREATE POLICY deals_insert_policy ON public.deals
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head', 'manager')
  )
);

-- UPDATE policy: users can update their own deals
DROP POLICY IF EXISTS deals_update_policy ON public.deals;
CREATE POLICY deals_update_policy ON public.deals
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head', 'manager')
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head', 'manager')
  )
);

-- DELETE policy: users can delete their own deals
DROP POLICY IF EXISTS deals_delete_policy ON public.deals;
CREATE POLICY deals_delete_policy ON public.deals
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'head', 'manager')
  )
);

-- Grant permissions
GRANT ALL ON public.deals TO authenticated;

COMMIT;