-- Remove the old unused admin_update_profile functions to resolve function overloading
DROP FUNCTION IF EXISTS public.admin_update_profile(p_department uuid, p_division uuid, p_id uuid);
DROP FUNCTION IF EXISTS public.admin_update_profile(p_id uuid, p_role text, p_division uuid, p_department uuid);

-- Keep only the main function that handles all parameters including team_id
-- The function admin_update_profile(p_id uuid, p_role text, p_division uuid, p_department uuid, p_team uuid) will remain