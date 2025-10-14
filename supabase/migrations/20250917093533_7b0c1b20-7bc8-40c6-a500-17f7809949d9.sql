-- Add foreign key constraint from sales_targets.assigned_to to user_profiles.id
ALTER TABLE public.sales_targets 
ADD CONSTRAINT sales_targets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id) ON DELETE SET NULL;