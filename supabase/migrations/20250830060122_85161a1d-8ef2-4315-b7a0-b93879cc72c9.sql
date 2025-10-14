-- Create security definer function to check hierarchical contact access
CREATE OR REPLACE FUNCTION public.can_access_contact(contact_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- User can access their own contacts
    SELECT 1 WHERE contact_user_id = auth.uid()
    
    UNION
    
    -- Division heads can access contacts from users in their division
    SELECT 1 
    FROM user_profiles current_user, user_profiles contact_owner
    WHERE current_user.id = auth.uid()
      AND contact_owner.id = contact_user_id
      AND current_user.role = 'division_head'
      AND current_user.division_id = contact_owner.division_id
    
    UNION
    
    -- Department heads can access contacts from users in their department
    SELECT 1 
    FROM user_profiles current_user, user_profiles contact_owner
    WHERE current_user.id = auth.uid()
      AND contact_owner.id = contact_user_id
      AND current_user.role = 'department_head'
      AND current_user.department_id = contact_owner.department_id
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Contacts select by user_id" ON public.contacts;
DROP POLICY IF EXISTS "Contacts insert by user_id" ON public.contacts;
DROP POLICY IF EXISTS "Contacts update by user_id" ON public.contacts;
DROP POLICY IF EXISTS "Contacts delete by user_id" ON public.contacts;

-- Create new hierarchical policies
CREATE POLICY "Contacts hierarchical select"
ON public.contacts
FOR SELECT
USING (public.can_access_contact(user_id));

CREATE POLICY "Contacts hierarchical insert"
ON public.contacts
FOR INSERT
WITH CHECK (
  -- Users can only insert contacts for themselves
  user_id = auth.uid()
);

CREATE POLICY "Contacts hierarchical update"
ON public.contacts
FOR UPDATE
USING (public.can_access_contact(user_id))
WITH CHECK (public.can_access_contact(user_id));

CREATE POLICY "Contacts hierarchical delete"
ON public.contacts
FOR DELETE
USING (public.can_access_contact(user_id));