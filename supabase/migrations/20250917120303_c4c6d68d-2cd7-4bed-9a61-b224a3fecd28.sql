-- Add foreign key constraints between sales_targets and user_profiles
ALTER TABLE public.sales_targets 
ADD CONSTRAINT fk_sales_targets_assigned_to_user_profiles 
FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.sales_targets 
ADD CONSTRAINT fk_sales_targets_created_by_user_profiles 
FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;