-- First, update any foreign key references to point to the stages we want to keep
-- Update opportunity_stage_history references from duplicate Qualification to the original
UPDATE opportunity_stage_history 
SET from_stage_id = '90f2cb14-9439-48fb-947b-ee728f912529' 
WHERE from_stage_id = '1d6587a0-315f-4302-ad6f-04429ef52334';

UPDATE opportunity_stage_history 
SET to_stage_id = '90f2cb14-9439-48fb-947b-ee728f912529' 
WHERE to_stage_id = '1d6587a0-315f-4302-ad6f-04429ef52334';

-- Update any opportunities using duplicate stages to use the original stages
UPDATE opportunities 
SET stage_id = '6788a58a-faee-4a4a-b3fc-90ea575290ed' 
WHERE stage_id = '0d2199dc-ea09-4c95-bceb-297cb9429c5a';

UPDATE opportunities 
SET stage_id = '90f2cb14-9439-48fb-947b-ee728f912529' 
WHERE stage_id = '1d6587a0-315f-4302-ad6f-04429ef52334';

UPDATE opportunities 
SET stage_id = '707a7677-0c15-4f9f-ad04-071d17fe64a2' 
WHERE stage_id = '88962e11-2723-4ec8-8130-c8f28d2d08cf';

UPDATE opportunities 
SET stage_id = 'f38f7b31-f2c8-47de-b8a3-846bdad5c1cc' 
WHERE stage_id = '30cc2602-ab80-4abd-9c4c-cf7aa6773924';

-- Now remove the duplicate pipeline stages
DELETE FROM pipeline_stages WHERE id = '0d2199dc-ea09-4c95-bceb-297cb9429c5a';
DELETE FROM pipeline_stages WHERE id = '1d6587a0-315f-4302-ad6f-04429ef52334';
DELETE FROM pipeline_stages WHERE id = '88962e11-2723-4ec8-8130-c8f28d2d08cf';
DELETE FROM pipeline_stages WHERE id = '30cc2602-ab80-4abd-9c4c-cf7aa6773924';