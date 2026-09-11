-- ============================================================
-- 004_identity_and_roles.sql
-- Profiles extend auth.users. Roles + permissions define what
-- each org member can do. Membership links users to orgs.
-- ============================================================

-- ----------------------------------------------------------
-- profiles
-- One profile per Supabase Auth user. Authentication
-- credentials remain exclusively in auth.users. This table
-- holds display and professional identity only.
-- ----------------------------------------------------------
create table public.profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  full_name           text        not null,
  email               text,
  profession          text,                          -- e.g. 'Physician', 'Nurse', 'Radiologist'
  license_identifier  text,                          -- Professional registration number
  avatar_url          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is
  'Professional identity. Authentication credentials stay in auth.users. No passwords here.';

-- ----------------------------------------------------------
-- organization_members
-- A user can belong to multiple organizations with different
-- roles in each. This is the core access-control join table.
-- ----------------------------------------------------------
create table public.organization_members (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id)  on delete cascade,
  user_id         uuid        not null references public.profiles(id)        on delete cascade,
  role_name       text        not null,              -- 'CLINICIAN', 'REVIEWER', 'NURSE', etc.
  is_active       boolean     not null default true,
  joined_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

comment on table public.organization_members is
  'One row per user-per-organization. A user may appear in many orgs.';

-- ----------------------------------------------------------
-- roles
-- Named roles scoped to the Nexus permission model.
-- Seeded roles: ADMINISTRATOR, CLINICIAN, REVIEWER, NURSE,
--               LABORATORY, PHARMACIST, RADIOLOGIST.
-- ----------------------------------------------------------
create table public.roles (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------
-- permissions
-- Granular permission codes. The front-end and edge functions
-- both use these codes for guards.
-- ----------------------------------------------------------
create table public.permissions (
  id          uuid        primary key default gen_random_uuid(),
  code        text        not null unique,
  description text,
  created_at  timestamptz not null default now()
);

comment on column public.permissions.code is
  'Dot-notation permission code, e.g. "case.create", "nexus.reject".';

-- ----------------------------------------------------------
-- role_permissions
-- Many-to-many junction: which roles grant which permissions.
-- ----------------------------------------------------------
create table public.role_permissions (
  role_id       uuid not null references public.roles(id)        on delete cascade,
  permission_id uuid not null references public.permissions(id)  on delete cascade,
  primary key (role_id, permission_id)
);
