-- Add foreign key constraint for sales_targets.assigned_to -> user_profiles.id
ALTER TABLE public.sales_targets 
ADD CONSTRAINT fk_sales_targets_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id);