-- Clean up orphaned sales_targets records that reference non-existent users
DELETE FROM public.sales_targets 
WHERE assigned_to NOT IN (
    SELECT id FROM public.user_profiles
);

-- Now add the foreign key constraint
ALTER TABLE public.sales_targets 
ADD CONSTRAINT sales_targets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id) ON DELETE SET NULL;