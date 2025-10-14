-- Add COGS fields to pipeline_items table
ALTER TABLE public.pipeline_items 
ADD COLUMN cost_of_goods NUMERIC DEFAULT 0,
ADD COLUMN service_costs NUMERIC DEFAULT 0,
ADD COLUMN other_expenses NUMERIC DEFAULT 0;