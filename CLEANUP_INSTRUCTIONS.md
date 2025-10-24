# Instruksi Cleanup Data Admin

## Tujuan
Membersihkan semua data di halaman admin kecuali user admin (admin@gmail.com dan hidayat.suli@gmail.com).

## Skrip yang Tersedia

### 1. **check_admin_data.sql** (WAJIB DILAKUKAN PERTAMA)
- **Tujuan**: Melihat data apa saja yang ada sebelum cleanup
- **Keamanan**: 100% aman, hanya membaca data
- **Jalankan ini dulu** untuk memahami data yang akan dihapus

### 2. **cleanup_minimal_admin_data.sql** (REKOMENDASI)
- **Tujuan**: Membersihkan data user management yang terlihat di halaman admin
- **Keamanan**: Aman, hanya menghapus data yang tidak dibutuhkan
- **Menghapus**: Audit logs non-admin, user profiles non-admin, sales targets, department targets

### 3. **cleanup_admin_visible_data.sql** (OPSIONAL)
- **Tujuan**: Membersihkan semua data yang terlihat di halaman admin
- **Keamanan**: Relatif aman, lebih komprehensif
- **Menghapus**: Semua data di #2 ditambah struktur organisasi, master data, settings

### 4. **cleanup_safe_admin_data.sql** (OPSIONAL - LENGKAP)
- **Tujuan**: Membersihkan SEMUA data kecuali milik admin
- **Keamanan**: Hati-hati, sangat komprehensif
- **Menghapus**: Semua data non-admin termasuk opportunities, customers, companies

## Langkah-langkah Aman

### Step 1: Backup Database (WAJIB)
```bash
# Backup database sebelum cleanup
supabase db dump --data-only > backup_before_cleanup.sql
```

### Step 2: Cek Data yang Ada
```bash
# Jalankan skrip pengecekan
supabase db reset  # Reset ke data awal jika perlu
then run check_admin_data.sql di Supabase dashboard
```

### Step 3: Jalankan Cleanup Minimal (REKOMENDASI)
```bash
# Jalankan cleanup minimal - ini yang paling aman
supabase db reset  # Reset ulang jika perlu
then run cleanup_minimal_admin_data.sql di Supabase dashboard
```

### Step 4: Verifikasi Hasil
- Login ke halaman admin
- Cek daftar user - hanya admin yang tersisa
- Cek audit logs - hanya log admin yang tersisa
- Cek performance - harus lebih cepat

### Step 5: Cleanup Tambahan (OPSIONAL)
Jika ingin lebih bersih, jalankan:
- `cleanup_admin_visible_data.sql` untuk membersihkan data master
- `cleanup_safe_admin_data.sql` untuk membersihkan semua data non-admin

## Data yang Akan Dihapus vs Dipertahankan

### Yang Dipertahankan (Admin Users):
- ✅ User profiles admin
- ✅ Auth users admin (admin@gmail.com, hidayat.suli@gmail.com)
- ✅ Audit logs dari admin
- ✅ Sales targets milik admin
- ✅ Department targets milik admin

### Yang Dihapus (Non-Admin Users):
- ❌ User profiles non-admin
- ❌ Audit logs dari non-admin
- ❌ Sales targets milik non-admin
- ❌ Department targets milik non-admin
- ❌ Target cascades milik non-admin

### Yang Opsional Dihapus:
- ❌ Organizations, companies, customers
- ❌ Opportunities, pipeline items
- ❌ Master data (titles, regions, fiscal calendars)
- ❌ Struktur organisasi (divisions, departments, teams)

## Troubleshooting

### Jika Terjadi Error:
1. **Foreign Key Constraint**: Jalankan skrip dari yang paling sederhana
2. **RLS Policy Error**: Pastikan login sebagai admin
3. **Permission Error**: Gunakan Supabase service role key

### Recovery Jika Salah:
1. Gunakan backup: `supabase db restore backup_before_cleanup.sql`
2. Atau reset database: `supabase db reset`

## Rekomendasi Final
**Gunakan cleanup_minimal_admin_data.sql saja** untuk keamanan maksimal. Ini akan:
- Membersihkan user management di halaman admin
- Menjaga integritas data lainnya
- Meningkatkan performance audit logs
- Tetap aman dan reversibel