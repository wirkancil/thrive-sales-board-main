-- Clean up orphaned sales_targets records (again, as new ones may have been created)
DELETE FROM public.sales_targets 
WHERE assigned_to NOT IN (
  SELECT id FROM public.user_profiles WHERE id IS NOT NULL
);

-- Also clean up any targets assigned to non-existent users in auth.users
DELETE FROM public.sales_targets 
WHERE assigned_to NOT IN (
  SELECT id FROM auth.users WHERE id IS NOT NULL
);