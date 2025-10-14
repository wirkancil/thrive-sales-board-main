-- Add quotation_no field to pipeline_items table
ALTER TABLE public.pipeline_items 
ADD COLUMN quotation_no TEXT;