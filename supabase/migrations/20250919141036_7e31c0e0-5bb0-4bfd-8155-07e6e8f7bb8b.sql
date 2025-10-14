-- Remove duplicate pipeline stages, keeping only one of each stage
-- Remove duplicate Prospecting stage (keep the first one)
DELETE FROM pipeline_stages WHERE id = '0d2199dc-ea09-4c95-bceb-297cb9429c5a';

-- Remove duplicate Qualification stage (keep the first one)  
DELETE FROM pipeline_stages WHERE id = '1d6587a0-315f-4302-ad6f-04429ef52334';

-- Remove duplicate Approach/Discovery stage (keep the first one)
DELETE FROM pipeline_stages WHERE id = '88962e11-2723-4ec8-8130-c8f28d2d08cf';

-- Remove duplicate Presentation/POC stage (keep the one without extra space)
DELETE FROM pipeline_stages WHERE id = '30cc2602-ab80-4abd-9c4c-cf7aa6773924';

-- Standardize the remaining Presentation/POC name (remove extra space)
UPDATE pipeline_stages SET name = 'Presentation/POC' WHERE name = 'Presentation / POC';