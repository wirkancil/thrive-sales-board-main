-- Fix sort_order conflicts properly by updating stages for the specific pipeline
-- First, let's update the stages with conflicts for the main pipeline
UPDATE pipeline_stages 
SET sort_order = 6 
WHERE name = 'Won' AND is_won = true AND sort_order = 5;

UPDATE pipeline_stages 
SET sort_order = 7 
WHERE name = 'Closed Won' AND is_won = true AND sort_order = 6;

UPDATE pipeline_stages 
SET sort_order = 8 
WHERE name = 'Lost' AND is_lost = true AND sort_order = 6;

UPDATE pipeline_stages 
SET sort_order = 9 
WHERE name = 'Closed Lost' AND is_lost = true AND sort_order = 7;