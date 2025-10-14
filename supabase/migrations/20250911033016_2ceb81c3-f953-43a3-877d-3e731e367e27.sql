-- Add foreign key constraint between sales_targets and user_profiles
ALTER TABLE public.sales_targets 
ADD CONSTRAINT fk_sales_targets_account_manager 
FOREIGN KEY (account_manager_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;