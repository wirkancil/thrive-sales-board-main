-- 1. Backfill user_profiles with auth.users (ensure every user has a profile)
INSERT INTO public.user_profiles (id, full_name, role, division_id, department_id, preferences, is_active)
SELECT 
  u.id, 
  COALESCE(u.raw_user_meta_data->>'full_name', u.email), 
  'sales_rep', 
  NULL, 
  NULL, 
  '{}'::jsonb,
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = u.id);

-- 2. For testing purposes, create some sample divisions and assign users
-- Insert test divisions if they don't exist
INSERT INTO public.divisions (id, name, department_id) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Sales Division A', (SELECT id FROM public.departments LIMIT 1)),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Sales Division B', (SELECT id FROM public.departments LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- 3. Assign some users as Division Heads and Account Managers in the same division for testing
-- Update first user to be a division head
UPDATE public.user_profiles 
SET role = 'division_head', division_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
WHERE id = (SELECT id FROM public.user_profiles ORDER BY created_at LIMIT 1);

-- Update second user to be an account manager in the same division
UPDATE public.user_profiles 
SET role = 'account_manager', division_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
WHERE id = (SELECT id FROM public.user_profiles ORDER BY created_at LIMIT 1 OFFSET 1);

-- Update third user to be an account manager in the same division
UPDATE public.user_profiles 
SET role = 'account_manager', division_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
WHERE id = (SELECT id FROM public.user_profiles ORDER BY created_at LIMIT 1 OFFSET 2);

-- 4. Add trigger for sales_targets to auto-fill created_by and division_id
CREATE OR REPLACE FUNCTION public.sales_targets_autofill_scope()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-fill created_by if not provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  -- Auto-fill division_id from the creator's division if not provided
  IF NEW.division_id IS NULL THEN
    SELECT division_id INTO NEW.division_id
    FROM public.user_profiles
    WHERE id = NEW.created_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_sales_targets_autofill_scope ON public.sales_targets;
CREATE TRIGGER trigger_sales_targets_autofill_scope
  BEFORE INSERT ON public.sales_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.sales_targets_autofill_scope();

-- 5. Update RLS policies for sales_targets to handle Division Head scope properly
DROP POLICY IF EXISTS "st_vh_insert" ON public.sales_targets;
CREATE POLICY "st_vh_insert" ON public.sales_targets
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    current_user_role() = 'division_head' 
    AND division_id = current_user_division_id()
    AND role_of(assigned_to) IN ('account_manager', 'sales_rep')
    AND EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = assigned_to 
      AND up.division_id = current_user_division_id()
    )
  );

-- Update the select policy for division heads to include targets they created or manage
DROP POLICY IF EXISTS "st_vh_select" ON public.sales_targets;
CREATE POLICY "st_vh_select" ON public.sales_targets
  FOR SELECT 
  TO authenticated
  USING (
    current_user_role() = 'division_head' 
    AND division_id = current_user_division_id()
  );

-- Update the update policy for division heads
DROP POLICY IF EXISTS "st_vh_update" ON public.sales_targets;
CREATE POLICY "st_vh_update" ON public.sales_targets
  FOR UPDATE 
  TO authenticated
  USING (
    current_user_role() = 'division_head' 
    AND division_id = current_user_division_id() 
    AND created_by = auth.uid()
  )
  WITH CHECK (division_id = current_user_division_id());

-- Ensure proper delete policy for division heads
DROP POLICY IF EXISTS "st_vh_delete" ON public.sales_targets;
CREATE POLICY "st_vh_delete" ON public.sales_targets
  FOR DELETE 
  TO authenticated
  USING (
    current_user_role() = 'division_head' 
    AND division_id = current_user_division_id() 
    AND created_by = auth.uid()
  );