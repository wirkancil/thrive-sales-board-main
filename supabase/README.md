Thrive Sales Board — Supabase Migrations

Overview
- This folder contains clean, structured migrations to reset and recreate the database schema aligned with the frontend code in `src/`.
- Migrations order:
  1. `0000_reset.sql` — drops legacy objects safely
  2. `0001_core.sql` — extensions, enums, master tables, `user_profiles`
  3. `0002_operations.sql` — organizations, contacts, pipelines, stages, opportunities, pipeline items, sales activity
  4. `0003_supporting.sql` — manager mapping, sales targets, fx rates, reports, notifications
  5. `0004_audit_and_views.sql` — audit tables and views, master views
  6. `0005_rpcs.sql` — RPC functions used by the app
  7. `0006_seed.sql` — minimal seed data for immediate app usage

Prerequisites
- Install the Supabase CLI: `brew install supabase`
- Make sure you have your Supabase project ready and know the `project-ref` and database password.
  - Find `project-ref` in the Supabase Dashboard URL (e.g., `https://app.supabase.com/project/<project-ref>`)
  - Find DB password under Dashboard → Settings → Database → Connection string

Steps: Push to Supabase Cloud
1) Log in to Supabase:
   - `supabase login`
   - Paste your access token from the Dashboard → Account → Access Tokens
2) Link your project:
   - `supabase link --project-ref <YOUR_PROJECT_REF>`
   - Enter the database password when prompted.
3) Push migrations to the linked project:
   - `supabase db push`
   - The CLI will apply migrations in order; `0000_reset.sql` prepares a clean slate.

Optional: Local reset for testing
- To test locally before pushing:
  - `supabase start` (if using local dev)
  - `supabase db reset`
  - `supabase db migrate up` (if you manage migrations manually)

Verification Checklist
- In Supabase SQL Editor, run quick checks:
  - `select * from public.user_profiles limit 1;`
  - `select * from public.v_master_customer limit 1;`
  - `select * from public.v_audit_log_complete limit 1;`
  - `select * from public.pipeline_stages;`
- Confirm RPCs exist:
  - `select routine_name from information_schema.routines where specific_schema = 'public' and routine_name in ('log_audit_event','admin_clear_audit_logs','mark_all_notifications_read','get_users_with_profiles');`

Notes
- Backup any important data before running `0000_reset.sql` on production.
- The schema is designed to match the current frontend queries; further migrations can evolve it as needed.