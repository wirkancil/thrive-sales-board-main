-- Fix the duplicate sort_order issue
-- Update the Won stages to have higher sort_order values
UPDATE pipeline_stages SET sort_order = 6 WHERE name = 'Won' AND is_won = true;
UPDATE pipeline_stages SET sort_order = 7 WHERE name = 'Closed Won' AND is_won = true;
UPDATE pipeline_stages SET sort_order = 8 WHERE name = 'Lost' AND is_lost = true;
UPDATE pipeline_stages SET sort_order = 9 WHERE name = 'Closed Lost' AND is_lost = true;