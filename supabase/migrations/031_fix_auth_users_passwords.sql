-- ============================================================
-- 031_fix_auth_users_passwords.sql
-- Fix: Seed migration 018 inserted auth.users rows with empty
-- encrypted_password. This migration sets proper bcrypt hashes
-- so Supabase Auth can authenticate the demo accounts.
--
-- Demo credentials (FOR DEVELOPMENT/DEMO ONLY):
--   Clinician, Nurse, Reviewer, Lab : NexusDemo2026!
--   Administrator                   : NexusAdmin2026!
-- ============================================================

-- pgcrypto is already installed (001_extensions.sql) but set search path
set search_path to public, extensions;

-- Update demo user passwords to proper bcrypt hashes
-- and confirm email addresses so they can sign in immediately
update auth.users
set
  encrypted_password   = extensions.crypt('NexusDemo2026!', extensions.gen_salt('bf')),
  email_confirmed_at   = coalesce(email_confirmed_at, now()),
  confirmation_token   = '',
  recovery_token       = '',
  updated_at           = now()
where email in (
  'dr.sarah.chen@nexus-hospital.demo',
  'prof.marcus.vance@nexus-hospital.demo',
  'nurse.elena.rostova@nexus-hospital.demo',
  'lab.david.kim@nexus-hospital.demo'
);

update auth.users
set
  encrypted_password   = extensions.crypt('NexusAdmin2026!', extensions.gen_salt('bf')),
  email_confirmed_at   = coalesce(email_confirmed_at, now()),
  confirmation_token   = '',
  recovery_token       = '',
  updated_at           = now()
where email = 'admin@nexus-hospital.demo';

-- Verify
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from auth.users
  where email like '%nexus-hospital.demo'
    and encrypted_password is not null
    and encrypted_password != '';

  raise notice 'Demo auth users with passwords set: %', v_count;
end;
$$;
