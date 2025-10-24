-- Cek dan test view audit log
-- Jalankan di Supabase Dashboard SQL Editor

-- Step 1: Cek apakah view sudah ada
SELECT '=== CEK VIEW V_AUDIT_LOG_COMPLETE ===' as info;
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'v_audit_log_complete'
) as view_exists;

-- Step 2: Jika view belum ada, buat view sederhana
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'v_audit_log_complete'
  ) THEN
    -- Buat view sederhana
    CREATE VIEW public.v_audit_log_complete AS
    SELECT 
      al.id,
      al.entity_id,
      al.user_id,
      al.action_type,
      al.table_name,
      al.record_id,
      al.old_values,
      al.new_values,
      al.metadata,
      al.ip_address,
      al.user_agent,
      al.created_at,
      al.session_id,
      -- User information
      COALESCE(up.full_name, au.email, 'Unknown User') as user_name,
      up.role as user_role,
      -- Entity information
      e.name as entity_name
    FROM public.audit_log_v2 al
    LEFT JOIN auth.users au ON al.user_id = au.id
    LEFT JOIN public.user_profiles up ON al.user_id = up.id
    LEFT JOIN public.entities e ON al.entity_id = e.id;
    
    RAISE NOTICE 'View v_audit_log_complete berhasil dibuat';
  ELSE
    RAISE NOTICE 'View v_audit_log_complete sudah ada';
  END IF;
END $$;

-- Step 3: Grant permissions
GRANT SELECT ON public.v_audit_log_complete TO authenticated;
GRANT SELECT ON public.v_audit_log_complete TO anon;

-- Step 4: Test view
SELECT '=== TEST VIEW V_AUDIT_LOG_COMPLETE ===' as info;
SELECT 
  id,
  action_type,
  table_name,
  created_at,
  user_name,
  entity_name
FROM public.v_audit_log_complete
ORDER BY created_at DESC
LIMIT 5;

-- Step 5: Cek jumlah total record
SELECT '=== TOTAL RECORD DI VIEW ===' as info;
SELECT COUNT(*) as total_records FROM public.v_audit_log_complete;

SELECT 'View siap digunakan untuk frontend!' as status;