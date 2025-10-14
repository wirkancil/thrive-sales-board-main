-- Fix function search path security warnings by setting search_path for all functions
ALTER FUNCTION public.get_activity_icon(text) SET search_path = 'public';
ALTER FUNCTION public.validate_opportunity_relationships() SET search_path = 'public';