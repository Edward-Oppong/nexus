-- ============================================================
-- 006_cases.sql
-- The central Nexus entity. Every clinical resource is a child
-- of a case. The state machine is enforced by the application
-- layer (lib/case-state-machine.ts) and by triggers here.
-- ============================================================

-- ----------------------------------------------------------
-- cases
-- ----------------------------------------------------------
create table public.cases (
  id              uuid              primary key default gen_random_uuid(),
  organization_id uuid              not null references public.organizations(id) on delete restrict,
  patient_id      uuid              not null references public.patients(id)       on delete restrict,
  encounter_id    uuid              references public.encounters(id)              on delete set null,
  case_number     text              not null,        -- Human-readable: 'CASE-10482'
  title           text,
  status          public.case_status not null default 'DRAFT',
  priority        text              not null default 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
  opened_at       timestamptz,
  closed_at       timestamptz,
  created_by      uuid              not null references public.profiles(id),
  created_at      timestamptz       not null default now(),
  updated_at      timestamptz       not null default now(),
  unique (organization_id, case_number)
);

comment on table public.cases is
  'Central Nexus entity. All clinical data, assessments, and decisions are children of a case.';

comment on column public.cases.status is
  'Enforced by case-state-machine.ts. Direct SQL updates to this column bypass validation — '
  'use application mutations only.';

comment on column public.cases.case_number is
  'Human-readable identifier unique within an organization. Format: CASE-NNNNN.';

-- ----------------------------------------------------------
-- case_members
-- Tracks which users are assigned to a case and in what role.
-- Drives both RLS and the Zone 1 team panel.
-- ----------------------------------------------------------
create table public.case_members (
  id          uuid        primary key default gen_random_uuid(),
  case_id     uuid        not null references public.cases(id)    on delete cascade,
  user_id     uuid        not null references public.profiles(id)  on delete cascade,
  role_name   text        not null,                  -- 'CLINICIAN', 'REVIEWER', 'NURSE', etc.
  joined_at   timestamptz not null default now(),
  unique (case_id, user_id)
);

comment on table public.case_members is
  'Team assignment for a case. Used by RLS policies and the Zone 1 team panel.';
