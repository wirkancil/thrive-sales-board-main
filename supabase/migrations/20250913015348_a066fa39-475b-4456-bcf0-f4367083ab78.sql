-- Fix infinite recursion in user_profiles RLS policies
-- First, drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.user_profiles;
DROP POLICY IF EXISTS "Division heads can view division members" ON public.user_profiles;
DROP POLICY IF EXISTS "Department heads can view department members" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins and dept heads can update roles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authorized users can view profiles" ON public.user_profiles;

-- Create simple, non-recursive policies
-- Users can view their own profile (simple, no role checks)
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile (but not role changes, handled by trigger)
CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid());

-- Allow inserts for new users (handled by trigger after signup)
CREATE POLICY "Allow profile creation" 
ON public.user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());