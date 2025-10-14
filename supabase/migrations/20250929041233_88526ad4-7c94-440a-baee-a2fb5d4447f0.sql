-- Fix the materialized view security issue by creating a secure search function
-- Drop the problematic materialized view and recreate as needed

-- Keep the materialized view but don't enable RLS (it's protected by the function)
-- Remove any grants to public
REVOKE ALL ON global_search_index FROM PUBLIC;

-- Only grant access to the service role for the search function
GRANT SELECT ON global_search_index TO service_role;

-- Ensure the search function is the only way to access the data
-- The function already has proper role checking and scope limiting

-- Create a hook for refreshing the materialized view (admin only)
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can refresh the search index
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required to refresh search index';
  END IF;
  
  REFRESH MATERIALIZED VIEW CONCURRENTLY global_search_index;
END;
$$;