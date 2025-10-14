-- Add loss_reason field to pipeline_items table
ALTER TABLE public.pipeline_items 
ADD COLUMN loss_reason TEXT;