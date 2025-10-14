-- Allow admin to manage departments and divisions (INSERT/UPDATE/DELETE)
-- Departments policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'departments' AND policyname = 'Admins can insert departments'
  ) THEN
    CREATE POLICY "Admins can insert departments"
    ON public.departments
    FOR INSERT
    TO authenticated
    WITH CHECK (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'departments' AND policyname = 'Admins can update departments'
  ) THEN
    CREATE POLICY "Admins can update departments"
    ON public.departments
    FOR UPDATE
    TO authenticated
    USING (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
    WITH CHECK (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'departments' AND policyname = 'Admins can delete departments'
  ) THEN
    CREATE POLICY "Admins can delete departments"
    ON public.departments
    FOR DELETE
    TO authenticated
    USING (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    );
  END IF;
END $$;

-- Divisions policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'divisions' AND policyname = 'Admins can insert divisions'
  ) THEN
    CREATE POLICY "Admins can insert divisions"
    ON public.divisions
    FOR INSERT
    TO authenticated
    WITH CHECK (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'divisions' AND policyname = 'Admins can update divisions'
  ) THEN
    CREATE POLICY "Admins can update divisions"
    ON public.divisions
    FOR UPDATE
    TO authenticated
    USING (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
    WITH CHECK (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'divisions' AND policyname = 'Admins can delete divisions'
  ) THEN
    CREATE POLICY "Admins can delete divisions"
    ON public.divisions
    FOR DELETE
    TO authenticated
    USING (
      exists (
        select 1 from public.user_profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    );
  END IF;
END $$;