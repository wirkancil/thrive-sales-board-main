# Multi-Tenancy Per Organisasi (PT)
Desain, alur, dan implementasi sederhana agar admin tiap perusahaan dapat mengelola timnya tanpa mencampur data dengan perusahaan lain.

## Tujuan
- Memisahkan data per organisasi (PT) secara ketat di database dan aplikasi.
- Memungkinkan admin organisasi mengundang anggota (admin hingga staff) ke organisasinya.
- Menjaga UX tetap sederhana, tanpa menambah kompleksitas operasi harian.

## Prinsip Inti
- Boundary tenant: `organization_id` (bukan `region_id`). `region_id` tetap atribut bisnis, tidak untuk isolasi data.
- Isolasi di DB: Row Level Security (RLS) membatasi akses data berdasarkan organisasi pengguna.
- Konsistensi peran: gunakan satu sumber peran (rekomendasi: `simplified_role` → `admin`, `head`, `manager`, `account_manager`).
- Filter di aplikasi: semua query front-end mem-filter organisasi agar UX konsisten; RLS menjaga keamanan saat filter terlewat.

## Arsitektur Saat Ini (yang terdeteksi)
- Tabel `organizations` sudah ada; RLS sebagian telah diterapkan.
- Kolom `organization_id` sudah ada di `user_profiles` dan `divisions`.
- Hierarki: `departments` merujuk `divisions`, `teams` merujuk `departments`.
- RLS banyak berbasis peran (admin/head/manager) dan unit (`division_id`/`department_id`) namun belum konsisten memakai boundary organisasi.
- Terdapat dua sistem peran (`role` vs `new_role`/`simplified_role`) yang berjalan bersamaan.
- Beberapa migrasi sempat membuat policy permisif “Users can view all organizations” — perlu diketatkan untuk isolasi tenant.

## Desain Disarankan (tersimple)
- Gunakan `organizations` sebagai tenant utama.
- Gunakan `user_profiles.organization_id` sebagai membership user terhadap organisasi.
- Boundary untuk `departments` dan `teams` diturunkan via join ke `divisions` → `organization_id`.
- Tambahkan helper `current_user_organization_id()` untuk dipakai di semua policy RLS.

## Skema & RLS (contoh siap pakai)
Tambahkan fungsi helper dan ketatkan kebijakan RLS pada tabel inti untuk isolasi antar organisasi.

```sql
-- Helper: kunci tenant per user
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO authenticated;

-- Organizations: view/manage hanya org sendiri
DROP POLICY IF EXISTS "Users can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;

CREATE POLICY org_select_self
ON public.organizations
FOR SELECT TO authenticated
USING (id = public.current_user_organization_id());

CREATE POLICY org_admin_manage_self
ON public.organizations
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin' AND id = public.current_user_organization_id())
WITH CHECK (public.current_user_role() = 'admin' AND id = public.current_user_organization_id());

-- Divisions: batasi per organisasi
DROP POLICY IF EXISTS "Authenticated users can view divisions" ON public.divisions;

CREATE POLICY div_select_by_org
ON public.divisions
FOR SELECT TO authenticated
USING (organization_id = public.current_user_organization_id());

CREATE POLICY div_admin_manage_by_org
ON public.divisions
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin' AND organization_id = public.current_user_organization_id())
WITH CHECK (public.current_user_role() = 'admin' AND organization_id = public.current_user_organization_id());

-- Departments: batasi via divisions -> organization_id
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

CREATE POLICY dept_select_by_org
ON public.departments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.divisions d
    WHERE d.id = departments.division_id
      AND d.organization_id = public.current_user_organization_id()
  )
);

CREATE POLICY dept_admin_manage_by_org
ON public.departments
FOR ALL TO authenticated
USING (
  public.current_user_role() = 'admin' AND EXISTS (
    SELECT 1 FROM public.divisions d
    WHERE d.id = departments.division_id
      AND d.organization_id = public.current_user_organization_id()
  )
)
WITH CHECK (
  public.current_user_role() = 'admin' AND EXISTS (
    SELECT 1 FROM public.divisions d
    WHERE d.id = departments.division_id
      AND d.organization_id = public.current_user_organization_id()
  )
);

-- Teams: batasi via departments -> divisions -> organization_id
CREATE POLICY team_select_by_org
ON public.teams
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.departments dep
    JOIN public.divisions d ON d.id = dep.division_id
    WHERE dep.id = teams.department_id
      AND d.organization_id = public.current_user_organization_id()
  )
);

CREATE POLICY team_admin_manage_by_org
ON public.teams
FOR ALL TO authenticated
USING (
  public.current_user_role() = 'admin' AND EXISTS (
    SELECT 1
    FROM public.departments dep
    JOIN public.divisions d ON d.id = dep.division_id
    WHERE dep.id = teams.department_id
      AND d.organization_id = public.current_user_organization_id()
  )
)
WITH CHECK (
  public.current_user_role() = 'admin' AND EXISTS (
    SELECT 1
    FROM public.departments dep
    JOIN public.divisions d ON d.id = dep.division_id
    WHERE dep.id = teams.department_id
      AND d.organization_id = public.current_user_organization_id()
  )
);

-- Contoh: Sales targets SELECT by org + role
DROP POLICY IF EXISTS "Admins can view all targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Managers can view department targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Heads can view division targets" ON public.sales_targets;

CREATE POLICY targets_select_by_org_and_role
ON public.sales_targets
FOR SELECT TO authenticated
USING (
  (assigned_to = auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles me
    WHERE me.id = auth.uid() AND me.role = 'manager'
      AND me.department_id = sales_targets.department_id
      AND EXISTS (
        SELECT 1 FROM public.departments dep
        JOIN public.divisions d ON d.id = dep.division_id
        WHERE dep.id = sales_targets.department_id
          AND d.organization_id = public.current_user_organization_id()
      )
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles me
    WHERE me.id = auth.uid() AND me.role = 'head'
      AND me.division_id = sales_targets.division_id
      AND EXISTS (
        SELECT 1 FROM public.divisions d
        WHERE d.id = sales_targets.division_id
          AND d.organization_id = public.current_user_organization_id()
      )
  )
  OR
  (public.current_user_role() = 'admin' AND EXISTS (
    SELECT 1 FROM public.divisions d
    WHERE d.id = sales_targets.division_id
      AND d.organization_id = public.current_user_organization_id()
  ))
);

-- Indeks performa
CREATE INDEX IF NOT EXISTS idx_divisions_org_id ON public.divisions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON public.user_profiles(organization_id);
```

## Alur Invite Member (admin → staff)
Alur tersimple tanpa backend tambahan: token undangan yang dibuat admin, lalu user bergabung via halaman “Join Organization”.

- Admin mengundang (email + peran + unit opsional). Sistem membuat token dan menyimpan undangan.
- User login/daftar, masukkan token, sistem:
  - Mengaitkan `user_profiles.organization_id` ke organisasi undangan.
  - Menetapkan peran (`simplified_role`) dan `division_id`/`department_id`/`team_id` bila ada.
  - Menandai undangan diterima (`accepted`).

Skema tabel undangan dan RPC yang disarankan:

```sql
-- Tabel undangan organisasi
CREATE TABLE IF NOT EXISTS public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  email text NOT NULL,
  role simplified_role NOT NULL DEFAULT 'account_manager',
  division_id uuid NULL REFERENCES public.divisions(id),
  department_id uuid NULL REFERENCES public.departments(id),
  team_id uuid NULL REFERENCES public.teams(id),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked | expired
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_invites_admin_rw
ON public.org_invites
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin' AND org_id = public.current_user_organization_id())
WITH CHECK (public.current_user_role() = 'admin' AND org_id = public.current_user_organization_id());

-- RPC: admin membuat undangan
CREATE OR REPLACE FUNCTION public.admin_invite_member(
  p_email text,
  p_role simplified_role,
  p_division uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL,
  p_team uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_token text := encode(gen_random_bytes(16),'hex');
DECLARE v_org uuid;
BEGIN
  IF public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'not allowed' USING errcode='42501';
  END IF;

  SELECT public.current_user_organization_id() INTO v_org;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'admin has no organization';
  END IF;

  INSERT INTO public.org_invites(org_id,email,role,division_id,department_id,team_id,invited_by,token)
  VALUES (v_org, p_email, p_role, p_division, p_department, p_team, auth.uid(), v_token);

  RETURN v_token; -- tampilkan ke admin, kirim via email/WA
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_invite_member(text,simplified_role,uuid,uuid,uuid) TO authenticated;

-- RPC: penerima undangan join organisasi
CREATE OR REPLACE FUNCTION public.accept_org_invite(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_inv public.org_invites%ROWTYPE;
DECLARE v_user_email text;
BEGIN
  SELECT * INTO v_inv FROM public.org_invites WHERE token = p_token AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired invite';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL OR lower(v_user_email) <> lower(v_inv.email) THEN
    RAISE EXCEPTION 'invite not for this user';
  END IF;

  UPDATE public.user_profiles
     SET organization_id = v_inv.org_id,
         new_role = v_inv.role,
         division_id = COALESCE(v_inv.division_id, division_id),
         department_id = COALESCE(v_inv.department_id, department_id),
         team_id = COALESCE(v_inv.team_id, team_id)
   WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_profile not found';
  END IF;

  UPDATE public.org_invites SET status = 'accepted' WHERE id = v_inv.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_org_invite(text) TO authenticated;
```

## Perubahan Aplikasi (front-end)
- Tambah halaman Admin “Invite Members”:
  - Form: `email`, `role`, opsional `division`/`department`/`team`.
  - Memanggil RPC `admin_invite_member`, tampilkan link `...?invite=token`.
- Tambah halaman “Join Organization”:
  - Input `token`, memanggil RPC `accept_org_invite`.
- Hook filter per organisasi:
  - `useDivisions`: filter `organization_id = userProfile.organization_id`.
  - `useSalesTargets`, `useRoleBasedData`: pastikan filter via join bersifat organisasi user.
- Catatan: `src/pages/Admin.tsx` memiliki `region_id?: string;` → tetap gunakan `region_id` sebagai atribut bisnis, jangan untuk batas tenant.

## Rekomendasi Konsistensi Peran
- Pilih satu sumber peran: `simplified_role` (`new_role`) atau `role`.
- Seragamkan fungsi izin (contoh: `current_user_role()` atau `current_user_new_role()`), dan kebijakan RLS merujuk ke satu sumber.
- Migrasi ringan: ubah referensi fungsi/policy agar konsisten.

## Rencana Rollout (3 Fase)
- Fase 0 (1 hari): Tambah `current_user_organization_id()`, ketatkan RLS di `organizations`, `divisions`, `departments`, `teams`, `sales_targets`, tambah indeks.
- Fase 1 (1–2 hari): Tambah `org_invites` + RPC undang/terima. Tambah UI Admin “Invite Members” & halaman “Join Organization”.
- Fase 2 (1–2 hari): Patch hooks utama untuk filter organisasi, QA lintas 2 organisasi, dokumentasi.

## Uji & Validasi
- Buat 2 organisasi (PT A, PT B), buat admin masing-masing.
- Admin A mengundang 3 user; admin B mengundang 2 user.
- Verifikasi:
  - User A tidak bisa melihat data PT B dan sebaliknya.
  - Admin A tidak bisa mengelola organisasi B.
  - RLS menolak query lintas organisasi (cek dengan Supabase SQL editor).
  - UI memuat data sesuai organisasi user (cek list `divisions`, `departments`, `teams`, `sales_targets`).

## Risiko & Mitigasi
- RLS tidak seragam → audit policy, hapus yang permisif (“view all”).
- Duplikasi `role` vs `new_role` → konsolidasikan, uji regressions.
- Performa menurun karena join → tambahkan indeks (`divisions.organization_id`, FK join), hindari scan berat.
- RPC `SECURITY DEFINER` → minimalkan permukaan, validasi peran dan organisasi dengan tegas.

## Catatan Implementasi
- Pendekatan tersimple: single-org-per-user. Jika suatu saat perlu multi-org-per-user:
  - Buat `organization_members(user_id, org_id, role, ...)`.
  - Sediakan “org aktif” di UI/sesi, ubah RLS merujuk org aktif.
  - Kompleksitas naik; lakukan bila benar-benar dibutuhkan.

## Checklist
- Boundary tenant = `organization_id` (bukan `region_id`).
- Tambah `current_user_organization_id()` dan terapkan di policy inti.
- Ketatkan RLS: `organizations`, `divisions`, `departments`, `teams`, `sales_targets`.
- Tambah `org_invites` + RPC undang/terima, dan UI sederhana.
- Konsolidasikan sistem peran ke satu sumber.
- Tambahkan indeks untuk performa.
- Uji 2 organisasi dengan beberapa peran.

## Lampiran: Indeks yang disarankan
```sql
CREATE INDEX IF NOT EXISTS idx_divisions_org_id ON public.divisions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON public.user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_division_id ON public.departments(division_id);
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON public.teams(department_id);
```

## Deliverables
- Migrasi fungsi + RLS “tenant lock”.
- Migrasi `org_invites` + RPC undang/terima.
- Patch hook filter organisasi (divisions/targets/role-based data).
- UI Admin “Invite Members”, UI “Join Organization”.
- Dokumentasi (file ini).