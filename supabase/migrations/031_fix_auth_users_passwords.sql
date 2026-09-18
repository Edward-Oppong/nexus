-- ============================================================
-- 031_fix_auth_users_passwords.sql
-- Fix: Supabase Auth (GoTrue) "400: Invalid login credentials"
-- 
-- Why this happens:
-- 1. Seed migration 018 inserted auth.users with empty encrypted_password.
-- 2. GoTrue requires 'aud' = 'authenticated' and 'role' = 'authenticated'.
-- 3. GoTrue strictly requires a corresponding entry in 'auth.identities'
--    for provider = 'email'. Without an identity record, GoTrue cannot
--    locate the user during signInWithPassword and returns 400 invalid_credentials.
--
-- Demo Accounts:
--   Clinician : dr.sarah.chen@nexus-hospital.demo       (Pass: NexusDemo2026!)
--   Reviewer  : prof.marcus.vance@nexus-hospital.demo   (Pass: NexusDemo2026!)
--   Nurse     : nurse.elena.rostova@nexus-hospital.demo (Pass: NexusDemo2026!)
--   Lab       : lab.david.kim@nexus-hospital.demo       (Pass: NexusDemo2026!)
--   Admin     : admin@nexus-hospital.demo               (Pass: NexusAdmin2026!)
-- ============================================================

set search_path to public, extensions;

-- 1. Ensure pgcrypto extension is installed
create extension if not exists pgcrypto with schema extensions;

-- 2. Upsert Demo Auth Users with bcrypt password & authenticated role
do $$
declare
  demo_users record;
begin
  for demo_users in (
    select * from (
      values
        ('d0000001-0000-0000-0000-000000000001'::uuid, 'dr.sarah.chen@nexus-hospital.demo', 'NexusDemo2026!', '{"name":"Dr. Sarah Chen"}'::jsonb),
        ('d0000001-0000-0000-0000-000000000002'::uuid, 'prof.marcus.vance@nexus-hospital.demo', 'NexusDemo2026!', '{"name":"Prof. Marcus Vance"}'::jsonb),
        ('d0000001-0000-0000-0000-000000000003'::uuid, 'nurse.elena.rostova@nexus-hospital.demo', 'NexusDemo2026!', '{"name":"Elena Rostova, RN"}'::jsonb),
        ('d0000001-0000-0000-0000-000000000004'::uuid, 'lab.david.kim@nexus-hospital.demo', 'NexusDemo2026!', '{"name":"David Kim, MLS"}'::jsonb),
        ('d0000001-0000-0000-0000-000000000005'::uuid, 'admin@nexus-hospital.demo', 'NexusAdmin2026!', '{"name":"System Administrator"}'::jsonb)
    ) as t(id, email, password, metadata)
  ) loop

    -- Update existing user or insert if missing
    if exists (select 1 from auth.users where id = demo_users.id or email = demo_users.email) then
      update auth.users
      set
        instance_id          = coalesce(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
        aud                  = 'authenticated',
        role                 = 'authenticated',
        encrypted_password   = extensions.crypt(demo_users.password, extensions.gen_salt('bf', 10)),
        email_confirmed_at   = coalesce(email_confirmed_at, now()),
        raw_app_meta_data    = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data   = demo_users.metadata,
        is_sso_user          = false,
        is_super_admin       = false,
        confirmation_token   = '',
        recovery_token       = '',
        email_change_token_new = '',
        email_change         = '',
        updated_at           = now()
      where id = demo_users.id or email = demo_users.email;
    else
      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        is_sso_user,
        is_super_admin
      )
      values (
        demo_users.id,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        demo_users.email,
        extensions.crypt(demo_users.password, extensions.gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        demo_users.metadata,
        now(),
        now(),
        '',
        '',
        '',
        '',
        false,
        false
      );
    end if;

  end loop;
end $$;

-- 3. Populate auth.identities (GoTrue requires this for email logins)
do $$
declare
  u record;
  v_has_provider_id boolean;
  v_has_email_col boolean;
  v_email_generated boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'auth' and table_name = 'identities' and column_name = 'provider_id'
  ) into v_has_provider_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'auth' and table_name = 'identities' and column_name = 'email'
  ) into v_has_email_col;

  if v_has_email_col then
    select coalesce(is_generated = 'ALWAYS', false)
    into v_email_generated
    from information_schema.columns
    where table_schema = 'auth' and table_name = 'identities' and column_name = 'email';
  else
    v_email_generated := true;
  end if;

  for u in (
    select id, email
    from auth.users
    where email in (
      'dr.sarah.chen@nexus-hospital.demo',
      'prof.marcus.vance@nexus-hospital.demo',
      'nurse.elena.rostova@nexus-hospital.demo',
      'lab.david.kim@nexus-hospital.demo',
      'admin@nexus-hospital.demo'
    )
  ) loop
    -- Clean any existing or incomplete identities
    delete from auth.identities where user_id = u.id;

    -- Insert identity row
    if v_has_provider_id and (not v_has_email_col or v_email_generated) then
      execute format(
        'insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
         values (%L, %L, %L, %L::jsonb, %L, now(), now(), now())',
        u.id::text,
        u.id::text,
        u.id,
        json_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false)::text,
        'email'
      );
    elsif v_has_provider_id and v_has_email_col and not v_email_generated then
      execute format(
        'insert into auth.identities (id, provider_id, user_id, identity_data, provider, email, last_sign_in_at, created_at, updated_at)
         values (%L, %L, %L, %L::jsonb, %L, %L, now(), now(), now())',
        u.id::text,
        u.id::text,
        u.id,
        json_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false)::text,
        'email',
        u.email
      );
    else
      execute format(
        'insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
         values (%L, %L, %L::jsonb, %L, now(), now(), now())',
        u.id::text,
        u.id,
        json_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false)::text,
        'email'
      );
    end if;
  end loop;
end $$;

-- 4. Ensure Public Profiles exist
insert into public.profiles (id, full_name, email, profession, license_identifier)
values
  ('d0000001-0000-0000-0000-000000000001', 'Dr. Sarah Chen, MD', 'dr.sarah.chen@nexus-hospital.demo', 'Attending Physician, Acute Internal Medicine', 'GMC-7412890'),
  ('d0000001-0000-0000-0000-000000000002', 'Prof. Marcus Vance, FRCP', 'prof.marcus.vance@nexus-hospital.demo', 'Consultant Pulmonologist & Clinical Reviewer', 'GMC-4819033'),
  ('d0000001-0000-0000-0000-000000000003', 'Elena Rostova, RN', 'nurse.elena.rostova@nexus-hospital.demo', 'Lead Triage & Critical Care Nurse', 'NMC-18B0421E'),
  ('d0000001-0000-0000-0000-000000000004', 'David Kim, MLS', 'lab.david.kim@nexus-hospital.demo', 'Senior Clinical Pathologist / Laboratory Specialist', 'HCPC-CS19022'),
  ('d0000001-0000-0000-0000-000000000005', 'System Administrator', 'admin@nexus-hospital.demo', 'Chief Clinical Information Officer', 'CCIO-001')
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  profession = excluded.profession,
  license_identifier = excluded.license_identifier;

-- 5. Ensure Organization Memberships exist
insert into public.organization_members (organization_id, user_id, role_name, is_active)
values
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'CLINICIAN', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'REVIEWER', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'NURSE', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000004', 'LABORATORY', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000005', 'ADMINISTRATOR', true)
on conflict (organization_id, user_id) do update set
  role_name = excluded.role_name,
  is_active = true;

-- Verification query
select
  u.id,
  u.email,
  u.role,
  u.aud,
  (u.encrypted_password is not null and length(u.encrypted_password) > 20) as has_bcrypt_password,
  exists (select 1 from auth.identities i where i.user_id = u.id) as has_identity
from auth.users u
where u.email in (
  'dr.sarah.chen@nexus-hospital.demo',
  'prof.marcus.vance@nexus-hospital.demo',
  'nurse.elena.rostova@nexus-hospital.demo',
  'lab.david.kim@nexus-hospital.demo',
  'admin@nexus-hospital.demo'
);
