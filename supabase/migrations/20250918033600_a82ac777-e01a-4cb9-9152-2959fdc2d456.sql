-- Add RLS policy to allow users to read pipeline items for their opportunities
CREATE POLICY "Users can read pipeline items for their opportunities"
ON pipeline_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id = pipeline_items.opportunity_id 
    AND o.owner_id = auth.uid()
  )
  OR created_by = auth.uid()
);