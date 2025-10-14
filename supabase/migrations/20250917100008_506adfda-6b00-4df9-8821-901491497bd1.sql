-- First, let's check if the constraint already exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_targets_assigned_to_fkey' 
        AND table_name = 'sales_targets'
    ) THEN
        ALTER TABLE public.sales_targets DROP CONSTRAINT sales_targets_assigned_to_fkey;
    END IF;
END $$;

-- Add the foreign key constraint properly
ALTER TABLE public.sales_targets 
ADD CONSTRAINT sales_targets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='sales_targets';