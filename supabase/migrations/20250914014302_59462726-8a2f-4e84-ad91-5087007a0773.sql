-- Update existing sales targets to assign them to account managers
UPDATE sales_targets 
SET assigned_to = 'cced6e5e-de02-4718-97ec-f706f1fe5f76'
WHERE assigned_to IS NULL 
AND id IN (
  SELECT id FROM sales_targets 
  WHERE assigned_to IS NULL 
  LIMIT 2
);

UPDATE sales_targets 
SET assigned_to = '5175b868-4346-480e-8318-c6feceb28a8c'
WHERE assigned_to IS NULL 
AND id IN (
  SELECT id FROM sales_targets 
  WHERE assigned_to IS NULL 
  LIMIT 2
);