-- Patch: add title_id to user_profiles for RPC compatibility
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS title_id UUID REFERENCES public.titles(id) ON DELETE SET NULL;