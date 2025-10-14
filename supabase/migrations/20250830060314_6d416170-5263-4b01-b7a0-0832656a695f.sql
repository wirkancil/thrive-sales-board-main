-- Update insert policy to allow heads to add contacts for their teams
DROP POLICY IF EXISTS "Contacts hierarchical insert" ON public.contacts;
CREATE POLICY "Contacts hierarchical insert"
ON public.contacts
FOR INSERT
WITH CHECK (public.can_access_contact(user_id));