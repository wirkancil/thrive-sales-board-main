-- Create the missing foreign key constraint for sales_targets.assigned_to -> user_profiles.id
ALTER TABLE public.sales_targets 
ADD CONSTRAINT sales_targets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id);