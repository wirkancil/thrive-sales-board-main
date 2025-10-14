-- Add UPDATE and DELETE policies for events table to allow users to manage their own events

-- Add policy to allow users to update their own events
CREATE POLICY "Users can update their own events"
ON public.events
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add policy to allow users to delete their own events  
CREATE POLICY "Users can delete their own events"
ON public.events
FOR DELETE
USING (user_id = auth.uid());