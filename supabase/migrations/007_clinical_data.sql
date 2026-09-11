-- ============================================================
-- 007_clinical_data.sql
-- Observations, clinical findings, hypotheses, and the
-- provenance_records table that ties data to its source.
-- provenance_records is defined here because it is first
-- referenced by observations and findings.
-- ============================================================

-- ----------------------------------------------------------
-- provenance_records
-- Every clinical data point must declare its origin.
-- This is a non-negotiable architectural requirement.
-- Sources: human entry, device measurement, AI extraction,
--          AI generation, clinician verification, import.
-- ----------------------------------------------------------
create table public.provenance_records (
  id                  uuid                    primary key default gen_random_uuid(),
  provenance_type     public.provenance_type  not null,
  source_system       text,                           -- e.g. 'Nexus', 'Vitals Monitor M3', 'LIS'
  source_reference    text,                           -- External record ID or document ref
  actor_user_id       uuid                    references public.profiles(id),
  model_name          text,                           -- AI model name if AI_EXTRACTED / AI_GENERATED
  model_version       text,                           -- Model version for audit trail
  captured_at         timestamptz,                    -- When the original data event occurred
  notes               text,
  created_at          timestamptz             not null default now()
);

comment on table public.provenance_records is
  'Common provenance record for all clinical data. '
  'Every observation, finding, and AI output references a row in this table.';

comment on column public.provenance_records.provenance_type is
  'HUMAN_ENTERED: typed by a clinician. '
  'DEVICE_MEASURED: from a monitoring device. '
  'AI_EXTRACTED: extracted by an AI model from text. '
  'AI_GENERATED: synthesized by an AI model. '
  'CLINICIAN_VERIFIED: previously AI or imported, then explicitly verified by a clinician. '
  'IMPORTED: imported from an external system.';

-- ----------------------------------------------------------
-- observations
-- Structured measurements and vital signs.
-- One flexible table rather than separate tables per
-- measurement type (temp, HR, SpO2, BP, lab result).
-- FHIR mapping: Observation resource.
-- ----------------------------------------------------------
create table public.observations (
  id              uuid        primary key default gen_random_uuid(),
  case_id         uuid        not null references public.cases(id)                on delete cascade,
  category        text        not null,              -- 'VITAL_SIGN', 'LABORATORY', 'IMAGING', etc.
  code            text,                              -- LOINC or SNOMED code (future)
  label           text        not null,              -- Human-readable: 'Temperature', 'SpO2'
  value_numeric   numeric,
  value_text      text,
  unit            text,                              -- UCUM unit code: '°C', '%', 'mmHg'
  reference_low   numeric,
  reference_high  numeric,
  observed_at     timestamptz,
  provenance_id   uuid        references public.provenance_records(id),
  verified_by     uuid        references public.profiles(id),
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.observations is
  'Structured measurements. One row per measurement event. '
  'value_numeric and value_text are mutually exclusive for a given row.';

-- ----------------------------------------------------------
-- clinical_findings
-- Qualitative clinical observations made by a clinician
-- or extracted by the AI and reviewed by a clinician.
-- These are NOT diagnoses. They are factual observations
-- (e.g. "Productive cough for 5 days", "Crepitations bilateral lower zones").
-- FHIR mapping: Observation (clinical-finding category).
-- ----------------------------------------------------------
create table public.clinical_findings (
  id              uuid        primary key default gen_random_uuid(),
  case_id         uuid        not null references public.cases(id)                on delete cascade,
  category        text        not null,              -- 'SYMPTOM', 'SIGN', 'HISTORY', 'EXAMINATION'
  label           text        not null,
  description     text,
  status          text        not null default 'ACTIVE', -- 'ACTIVE', 'RESOLVED', 'REJECTED'
  provenance_id   uuid        references public.provenance_records(id),
  verified_by     uuid        references public.profiles(id),
  verified_at     timestamptz,
  created_by      uuid        references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.clinical_findings is
  'Qualitative clinical observations. Not diagnoses. '
  'AI-generated findings enter as status=ACTIVE and require clinician review.';

-- ----------------------------------------------------------
-- hypotheses
-- Candidate clinical explanations under consideration.
-- These are NOT diagnoses. The word "diagnosis" is intentionally
-- absent from this table definition.
-- FHIR mapping: Condition (provisional, differential).
-- ----------------------------------------------------------
create table public.hypotheses (
  id              uuid                      primary key default gen_random_uuid(),
  case_id         uuid                      not null references public.cases(id) on delete cascade,
  label           text                      not null,  -- e.g. 'Community-Acquired Pneumonia'
  status          public.hypothesis_status  not null default 'CANDIDATE',
  rationale       text,
  created_by      uuid                      references public.profiles(id),
  provenance_id   uuid                      references public.provenance_records(id),
  created_at      timestamptz               not null default now(),
  updated_at      timestamptz               not null default now()
);

comment on table public.hypotheses is
  'Candidate clinical hypotheses under evaluation. '
  'NEVER labelled as diagnoses in the UI. Qualitative uncertainty only: '
  'CANDIDATE / SUPPORTED / CONTRADICTED / INSUFFICIENT_DATA / DISMISSED.';

-- ----------------------------------------------------------
-- hypothesis_findings
-- Links findings to hypotheses with a typed relationship.
-- Replaces the anti-pattern of storing arrays of finding IDs
-- as JSONB. Enables proper foreign-key integrity and querying.
-- ----------------------------------------------------------
create table public.hypothesis_findings (
  hypothesis_id uuid                        not null references public.hypotheses(id)          on delete cascade,
  finding_id    uuid                        not null references public.clinical_findings(id)   on delete cascade,
  relationship  public.evidence_relationship not null, -- SUPPORTS, CONTRADICTS, etc.
  rationale     text,
  primary key (hypothesis_id, finding_id)
);

comment on table public.hypothesis_findings is
  'Typed join between hypotheses and the findings that support or contradict them. '
  'Replaces JSONB arrays of IDs. Enables relational queries and integrity.';
