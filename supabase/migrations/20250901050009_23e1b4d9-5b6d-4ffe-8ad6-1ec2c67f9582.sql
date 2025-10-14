-- Harden contacts table security without breaking hierarchy access
-- 1) Ensure RLS is enabled (idempotent)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 2) Auto-set user_id on insert if not provided
CREATE OR REPLACE FUNCTION public.set_contact_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_contacts_user_id ON public.contacts;
CREATE TRIGGER set_contacts_user_id
BEFORE INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.set_contact_user_id();

-- 3) Recreate policies to limit to authenticated role explicitly
DROP POLICY IF EXISTS "Contacts hierarchical select" ON public.contacts;
DROP POLICY IF EXISTS "Contacts hierarchical update" ON public.contacts;
DROP POLICY IF EXISTS "Contacts hierarchical delete" ON public.contacts;
DROP POLICY IF EXISTS "Contacts hierarchical insert" ON public.contacts;

CREATE POLICY "Contacts hierarchical select"
ON public.contacts
FOR SELECT
TO authenticated
USING (public.can_access_contact(user_id));

CREATE POLICY "Contacts hierarchical update"
ON public.contacts
FOR UPDATE
TO authenticated
USING (public.can_access_contact(user_id))
WITH CHECK (public.can_access_contact(user_id));

CREATE POLICY "Contacts hierarchical delete"
ON public.contacts
FOR DELETE
TO authenticated
USING (public.can_access_contact(user_id));

CREATE POLICY "Contacts hierarchical insert"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_contact(user_id));