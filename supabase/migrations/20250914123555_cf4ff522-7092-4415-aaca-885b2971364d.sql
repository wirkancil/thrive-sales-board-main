-- Create RPC function to get account managers by division
CREATE OR REPLACE FUNCTION public.get_account_managers_by_division(division_uuid uuid)
RETURNS TABLE(id uuid, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name
  FROM public.user_profiles up
  WHERE up.division_id = division_uuid
    AND up.role = 'account_manager'
    AND up.is_active = true
  ORDER BY up.full_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_account_managers_by_division(uuid) TO authenticated;