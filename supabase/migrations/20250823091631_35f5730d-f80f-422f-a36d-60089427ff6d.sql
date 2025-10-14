-- Add UPDATE and DELETE policies for contacts table to allow users to manage their own contacts

-- Add policy to allow users to update their own contacts
CREATE POLICY "Users can update their own contacts"
ON public.contacts
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add policy to allow users to delete their own contacts  
CREATE POLICY "Users can delete their own contacts"
ON public.contacts
FOR DELETE
USING (user_id = auth.uid());