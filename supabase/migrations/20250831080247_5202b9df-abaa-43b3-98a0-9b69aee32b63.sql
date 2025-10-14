-- Fix the can_access_contact function to handle department heads accessing contacts from users in their department's divisions
CREATE OR REPLACE FUNCTION public.can_access_contact(contact_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    -- User can access their own contacts
    SELECT 1 WHERE contact_user_id = auth.uid()
    
    UNION
    
    -- Division heads can access contacts from users in their division
    SELECT 1 
    FROM user_profiles curr_user, user_profiles contact_owner
    WHERE curr_user.id = auth.uid()
      AND contact_owner.id = contact_user_id
      AND curr_user.role = 'division_head'
      AND curr_user.division_id = contact_owner.division_id
    
    UNION
    
    -- Department heads can access contacts from users directly in their department
    SELECT 1 
    FROM user_profiles curr_user, user_profiles contact_owner
    WHERE curr_user.id = auth.uid()
      AND contact_owner.id = contact_user_id
      AND curr_user.role = 'department_head'
      AND curr_user.department_id = contact_owner.department_id
      
    UNION
    
    -- Department heads can access contacts from users in divisions that belong to their department
    SELECT 1 
    FROM user_profiles curr_user, user_profiles contact_owner, divisions div
    WHERE curr_user.id = auth.uid()
      AND contact_owner.id = contact_user_id
      AND curr_user.role = 'department_head'
      AND contact_owner.division_id = div.id
      AND div.department_id = curr_user.department_id
  );
$function$