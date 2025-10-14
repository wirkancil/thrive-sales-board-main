-- Add RLS policy to allow users to read pipelines for creating opportunities
CREATE POLICY "Users can read pipelines for opportunities"
ON pipelines
FOR SELECT
USING (is_active = true);

-- Add RLS policy to allow users to read pipeline stages for creating opportunities  
CREATE POLICY "Users can read pipeline stages for opportunities"
ON pipeline_stages
FOR SELECT
USING (is_active = true);