-- Phase 1: Fix RLS policies for entities and system_settings tables

-- Create RLS policies for entities table
CREATE POLICY "Admins can manage all entities" 
ON public.entities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow all authenticated users to read entities (needed for dropdowns)
CREATE POLICY "All users can read entities" 
ON public.entities 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for system_settings table
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow all authenticated users to read system settings (needed for app functionality)
CREATE POLICY "All users can read system settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);