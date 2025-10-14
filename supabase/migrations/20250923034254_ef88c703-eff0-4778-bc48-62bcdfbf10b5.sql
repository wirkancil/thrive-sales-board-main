-- Fix search_path security issue in the function we just created
CREATE OR REPLACE FUNCTION public.update_opportunity_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.opportunities 
  SET last_activity_at = COALESCE(NEW.updated_at, NEW.created_at)
  WHERE id = COALESCE(NEW.opportunity_id, OLD.opportunity_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;