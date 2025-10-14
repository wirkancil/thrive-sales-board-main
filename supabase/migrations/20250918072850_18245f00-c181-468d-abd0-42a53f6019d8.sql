-- Add Prospecting stage before Qualification
INSERT INTO pipeline_stages (
  id,
  pipeline_id, 
  name, 
  sort_order, 
  default_probability, 
  is_won, 
  is_lost, 
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b6525dea-16a9-4dd5-92a6-f6c56698c09c',
  'Prospecting',
  0,
  5.00,
  false,
  false,
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;