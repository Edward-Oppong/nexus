-- ============================================================
-- 005_patients_encounters.sql
-- Patients and encounters. For the prototype these contain
-- synthetic data only. PII governance is documented but not
-- yet implemented at the storage encryption layer.
-- ============================================================

-- ----------------------------------------------------------
-- patients
-- Scoped to an organization. A patient in Hospital A is a
-- separate row from the same individual in Hospital B.
-- For demo: all rows carry synthetic identifiers only.
-- ----------------------------------------------------------
create table public.patients (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete restrict,
  external_patient_id text,                          -- MRN or external EHR identifier
  given_name          text        not null,
  family_name         text        not null,
  date_of_birth       date,
  sex                 text,                          -- 'MALE', 'FEMALE', 'OTHER', 'UNKNOWN'
  phone               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.patients is
  'Synthetic patient records for the demo environment. '
  'Production deployment requires a separate PII governance review before going live.';

comment on column public.patients.sex is
  'Biological sex for clinical calculation purposes. '
  'Values: MALE, FEMALE, OTHER, UNKNOWN.';

-- ----------------------------------------------------------
-- encounters
-- A clinical encounter (visit, admission, telehealth session).
-- Cases are always linked to an encounter.
-- ----------------------------------------------------------
create table public.encounters (
  id              uuid        primary key default gen_random_uuid(),
  patient_id      uuid        not null references public.patients(id)       on delete restrict,
  organization_id uuid        not null references public.organizations(id)  on delete restrict,
  encounter_type  text        not null,              -- 'INPATIENT', 'OUTPATIENT', 'EMERGENCY', etc.
  started_at      timestamptz not null,
  ended_at        timestamptz,
  location        text,
  status          text        not null default 'ACTIVE',
  created_at      timestamptz not null default now()
);

comment on table public.encounters is
  'Clinical visit or admission. One encounter may have multiple Nexus cases (e.g., different clinical questions).';
