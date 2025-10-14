-- Consolidate contacts RLS to a single user identifier (user_id)
-- 1) Backfill user_id from owner_id to preserve access to older rows
UPDATE public.contacts
SET user_id = owner_id
WHERE user_id IS NULL AND owner_id IS NOT NULL;

-- 2) Drop conflicting/duplicate policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "User can read own contacts" ON public.contacts;
DROP POLICY IF EXISTS "User can insert own contacts" ON public.contacts;

-- 3) Ensure RLS is enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 4) Create unified, consistent policies using user_id only
CREATE POLICY "Contacts select by user_id"
ON public.contacts
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Contacts insert by user_id"
ON public.contacts
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Contacts update by user_id"
ON public.contacts
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Contacts delete by user_id"
ON public.contacts
FOR DELETE
USING (user_id = auth.uid());

-- 5) Performance: index for frequent filtering
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts(user_id);
