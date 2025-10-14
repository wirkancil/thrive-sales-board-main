-- Phase 1: Database Foundation & Entity Mode

-- Create entities table
CREATE TABLE public.entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on entities
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Create policies for entities
CREATE POLICY "Admins can manage entities" 
ON public.entities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Everyone can read active entities" 
ON public.entities 
FOR SELECT 
USING (is_active = true);

-- Add entity_id and head_id to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN entity_id UUID REFERENCES public.entities(id),
ADD COLUMN head_id UUID REFERENCES public.user_profiles(id);

-- Create system settings table for Entity Mode and Currency Mode
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can read system settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES 
('entity_mode', '{"mode": "single"}'),
('currency_mode', '{"mode": "single", "home_currency": "IDR"}');

-- Create function to enforce hierarchy rules
CREATE OR REPLACE FUNCTION public.enforce_user_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Role-based hierarchy validation
  IF NEW.role = 'account_manager' THEN
    -- AM must have a manager assigned
    IF NEW.department_id IS NULL THEN
      RAISE EXCEPTION 'Account Manager must be assigned to a Manager';
    END IF;
    
    -- Auto-inherit head_id and entity_id from manager
    SELECT head_id, entity_id INTO NEW.head_id, NEW.entity_id
    FROM public.user_profiles
    WHERE id = NEW.department_id AND role = 'manager';
    
  ELSIF NEW.role = 'manager' THEN
    -- Manager must have a head assigned  
    IF NEW.head_id IS NULL THEN
      RAISE EXCEPTION 'Manager must be assigned to a Head';
    END IF;
    
    -- Auto-inherit entity_id from head
    SELECT entity_id INTO NEW.entity_id
    FROM public.user_profiles
    WHERE id = NEW.head_id AND role = 'head';
    
  ELSIF NEW.role = 'head' THEN
    -- Head must have entity_id in multi-entity mode
    -- Check entity mode setting
    DECLARE
      entity_mode JSONB;
    BEGIN
      SELECT setting_value INTO entity_mode
      FROM public.system_settings
      WHERE setting_key = 'entity_mode';
      
      IF entity_mode->>'mode' = 'multi' AND NEW.entity_id IS NULL THEN
        RAISE EXCEPTION 'Head must be assigned to an Entity in multi-entity mode';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for hierarchy enforcement
CREATE TRIGGER enforce_user_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_hierarchy();

-- Create updated_at trigger for entities
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for system_settings  
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();