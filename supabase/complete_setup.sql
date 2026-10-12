-- ============================================================
-- 001_extensions.sql
-- Enable required PostgreSQL extensions
-- ============================================================

-- UUID generation (gen_random_uuid)
create extension if not exists "pgcrypto";

-- Full-text search and fuzzy matching
create extension if not exists "pg_trgm";

-- IP address types (used by audit_events)
-- inet is a native PG type, no extension needed

-- pgvector — reserved for Phase 6G evidence embeddings
-- create extension if not exists "vector";
-- Uncomment when embedding-based evidence search is introduced.



-- ============================================================
-- 002_enums.sql
-- All domain enums defined before any tables reference them.
-- Define enums first so table definitions have no ordering issues.
-- ============================================================

-- Case lifecycle states (matches Phase 5 CaseStatus domain type)
create type public.case_status as enum (
  'DRAFT',
  'ACTIVE',
  'ANALYZING',
  'PRELIMINARY',
  'REVIEW_REQUIRED',
  'CLINICIAN_REVIEW',
  'DECISION_RECORDED',
  'RESOLVED',
  'UNCERTAIN',
  'CONTRADICTORY',
  'SAFETY_REVIEW',
  'INSUFFICIENT_DATA',
  'OUT_OF_SCOPE'
);

-- Data provenance source type
create type public.provenance_type as enum (
  'HUMAN_ENTERED',
  'DEVICE_MEASURED',
  'IMPORTED',
  'AI_EXTRACTED',
  'AI_GENERATED',
  'CLINICIAN_VERIFIED'
);

-- Investigation lifecycle
create type public.investigation_status as enum (
  'REQUESTED',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'FAILED'
);

-- Hypothesis evaluation state
create type public.hypothesis_status as enum (
  'CANDIDATE',
  'SUPPORTED',
  'CONTRADICTED',
  'INSUFFICIENT_DATA',
  'DISMISSED'
);

-- Evidence-to-hypothesis relationship
create type public.evidence_relationship as enum (
  'SUPPORTS',
  'CONTRADICTS',
  'CONTEXTUALIZES',
  'REQUIRES_REVIEW'
);

-- Clinician review action on AI-generated findings
create type public.review_action as enum (
  'ACCEPT',
  'EDIT',
  'REJECT'
);

-- Safety concern severity (ascending severity order)
create type public.safety_severity as enum (
  'INFORMATION',
  'ATTENTION',
  'URGENT_REVIEW',
  'SAFETY_CRITICAL'
);

-- Task lifecycle
create type public.task_status as enum (
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);



-- ============================================================
-- 003_organizations.sql
-- Multi-tenancy foundation. Every clinical resource is scoped
-- to an organization. A single user may belong to many orgs.
-- ============================================================

create table public.organizations (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  organization_type   text,                          -- e.g. 'HOSPITAL', 'CLINIC', 'DEMO'
  country_code        text,                          -- ISO 3166-1 alpha-2
  timezone            text,                          -- IANA timezone string
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table  public.organizations              is 'Tenants. Each hospital, clinic, or demo environment is an organization.';
comment on column public.organizations.country_code is 'ISO 3166-1 alpha-2 country code, e.g. "NG", "GB", "US".';
comment on column public.organizations.timezone     is 'IANA timezone identifier, e.g. "Africa/Lagos".';



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



-- ============================================================
-- 008_investigations.sql
-- Investigation requests, results, and diagnostic reports.
-- FHIR mapping: ServiceRequest, Observation (result),
--               DiagnosticReport.
-- ============================================================

-- ----------------------------------------------------------
-- investigations
-- A request for a diagnostic test or procedure.
-- Ordered by a clinician; fulfilled by a lab, radiology, etc.
-- FHIR mapping: ServiceRequest.
-- ----------------------------------------------------------
create table public.investigations (
  id                  uuid                          primary key default gen_random_uuid(),
  case_id             uuid                          not null references public.cases(id)     on delete cascade,
  investigation_type  text                          not null,    -- 'BLOOD_TEST', 'IMAGING', 'ECG', etc.
  code                text,                                       -- LOINC or SNOMED code (future)
  reason              text,
  priority            text                          not null default 'NORMAL',
  status              public.investigation_status   not null default 'REQUESTED',
  requested_by        uuid                          not null references public.profiles(id),
  requested_at        timestamptz                   not null default now(),
  completed_at        timestamptz
);

comment on table public.investigations is
  'Requests for diagnostic tests or procedures. '
  'Status flows: REQUESTED → SCHEDULED → IN_PROGRESS → COMPLETED.';

-- ----------------------------------------------------------
-- investigation_results
-- Individual result items within an investigation.
-- An investigation may have many results (e.g. FBC returns
-- WBC, Hb, platelets as separate result rows).
-- FHIR mapping: Observation (component or separate).
-- ----------------------------------------------------------
create table public.investigation_results (
  id              uuid        primary key default gen_random_uuid(),
  investigation_id uuid       not null references public.investigations(id) on delete cascade,
  result_type     text        not null,              -- 'NUMERIC', 'TEXT', 'CATEGORICAL'
  label           text,
  value_numeric   numeric,
  value_text      text,
  unit            text,                              -- UCUM unit code
  reference_range text,                              -- e.g. '3.9–5.0 × 10¹²/L'
  interpretation  text,                              -- 'NORMAL', 'LOW', 'HIGH', 'CRITICAL'
  provenance_id   uuid        references public.provenance_records(id),
  reported_at     timestamptz,
  verified_by     uuid        references public.profiles(id),
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.investigation_results is
  'Individual result items for an investigation. '
  'One investigation → many result rows (e.g. full blood count components).';

-- ----------------------------------------------------------
-- diagnostic_reports
-- Narrative or structured report produced by a specialist
-- (radiologist, pathologist) for an investigation.
-- FHIR mapping: DiagnosticReport.
-- ----------------------------------------------------------
create table public.diagnostic_reports (
  id              uuid        primary key default gen_random_uuid(),
  case_id         uuid        not null references public.cases(id)                on delete cascade,
  investigation_id uuid       references public.investigations(id),
  report_type     text        not null,              -- 'RADIOLOGY', 'PATHOLOGY', 'CARDIOLOGY', etc.
  title           text,
  conclusion      text,
  status          text        not null default 'FINAL',  -- 'PRELIMINARY', 'FINAL', 'AMENDED'
  authored_by     uuid        references public.profiles(id),
  authored_at     timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.diagnostic_reports is
  'Specialist narrative reports. Linked to an investigation where one exists. '
  'FHIR: DiagnosticReport.';



-- ============================================================
-- 009_evidence.sql
-- Evidence sources (clinical literature, guidelines) and
-- links that connect evidence to hypotheses within a case.
-- FHIR mapping: DocumentReference, Citation (R5 preview).
-- ============================================================

-- ----------------------------------------------------------
-- evidence_sources
-- A reusable library of clinical evidence documents.
-- Not scoped to a case — shared across the system.
-- One row per source (journal article, guideline, protocol).
-- ----------------------------------------------------------
create table public.evidence_sources (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  source_type      text        not null,   -- 'GUIDELINE', 'SYSTEMATIC_REVIEW', 'RCT', 'PROTOCOL', etc.
  authority        text,                   -- e.g. 'WHO', 'CDC', 'NICE', 'BMJ'
  citation         text,                   -- Full citation string
  url              text,
  publication_date date,
  retrieval_date   date,
  applicability    text,                   -- Clinical context this evidence applies to
  abstract         text,
  created_at       timestamptz not null default now()
);

comment on table public.evidence_sources is
  'Shared library of clinical literature and guidelines. '
  'Not case-scoped. Linked to cases via evidence_links.';

-- ----------------------------------------------------------
-- evidence_links
-- Associates a piece of evidence with a specific case and
-- optionally a specific hypothesis, with a typed relationship.
-- One source can be linked to many cases / hypotheses.
-- ----------------------------------------------------------
create table public.evidence_links (
  id                 uuid                         primary key default gen_random_uuid(),
  case_id            uuid                         not null references public.cases(id)            on delete cascade,
  hypothesis_id      uuid                         references public.hypotheses(id)                on delete cascade,
  evidence_source_id uuid                         not null references public.evidence_sources(id) on delete cascade,
  relationship       public.evidence_relationship not null,  -- SUPPORTS, CONTRADICTS, etc.
  rationale          text,
  created_at         timestamptz                  not null default now()
);

comment on table public.evidence_links is
  'Links evidence sources to cases and optionally to specific hypotheses. '
  'Relationship type is required: SUPPORTS / CONTRADICTS / CONTEXTUALIZES / REQUIRES_REVIEW.';



-- ============================================================
-- 010_nexus_intelligence.sql
-- Nexus Clinical Intelligence tables: assessments, findings,
-- and recommendations.
-- No pseudo-certain numeric confidence (e.g. 0.94) is stored.
-- These are review items, not autonomous orders.
-- ============================================================

-- ----------------------------------------------------------
-- nexus_assessments
-- Structured synthesis created by Nexus intelligence service.
-- Status defaults to REVIEW_REQUIRED until signed off.
-- ----------------------------------------------------------
create table public.nexus_assessments (
  id                    uuid        primary key default gen_random_uuid(),
  case_id               uuid        not null references public.cases(id) on delete cascade,
  status                text        not null default 'REVIEW_REQUIRED',
  summary               text,
  data_completeness     text,
  evidence_consistency  text,
  applicability         text,
  limitations           text,
  model_name            text,
  model_version         text,
  created_at            timestamptz not null default now()
);

comment on table public.nexus_assessments is
  'Clinical intelligence assessment synthesis for a case. '
  'Contains qualitative appraisals (data completeness, consistency, limitations). '
  'Numeric certainty metrics are intentionally excluded.';

-- ----------------------------------------------------------
-- nexus_findings
-- Findings extracted or highlighted by Nexus requiring review.
-- ----------------------------------------------------------
create table public.nexus_findings (
  id            uuid        primary key default gen_random_uuid(),
  assessment_id uuid        not null references public.nexus_assessments(id) on delete cascade,
  finding_type  text        not null,              -- 'OBSERVATION', 'LAB_ANOMALY', 'RISK_FACTOR', etc.
  content       text        not null,
  status        text        not null default 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'EDITED'
  created_at    timestamptz not null default now()
);

comment on table public.nexus_findings is
  'Atomic findings generated by Nexus requiring clinician verification.';

-- ----------------------------------------------------------
-- nexus_recommendations
-- Suggested next clinical steps or investigations to consider.
-- Non-autonomous advisory items only.
-- ----------------------------------------------------------
create table public.nexus_recommendations (
  id            uuid        primary key default gen_random_uuid(),
  assessment_id uuid        not null references public.nexus_assessments(id) on delete cascade,
  category      text,                              -- 'INVESTIGATION', 'MONITORING', 'SAFETY_CHECK'
  content       text        not null,
  rationale     text,
  status        text        not null default 'PENDING_REVIEW',
  created_at    timestamptz not null default now()
);

comment on table public.nexus_recommendations is
  'Decision support recommendations. Advisory only; never automatic clinical orders.';



-- ============================================================
-- 011_reviews_decisions.sql
-- Human-in-the-loop review, clinical decision capture,
-- and safety concerns.
-- Establishes the clear boundary:
-- Nexus -> Assessment -> Review -> Human Decision
-- ============================================================

-- ----------------------------------------------------------
-- reviews
-- Clinician audit log of accepted, edited, or rejected AI items.
-- When action = 'REJECT', reason is mandatory.
-- ----------------------------------------------------------
create table public.reviews (
  id                uuid                  primary key default gen_random_uuid(),
  assessment_id     uuid                  not null references public.nexus_assessments(id) on delete cascade,
  reviewer_id       uuid                  not null references public.profiles(id),
  action            public.review_action  not null, -- 'ACCEPT', 'EDIT', 'REJECT'
  original_content  text,
  revised_content   text,
  reason            text,                           -- Mandatory when action = 'REJECT'
  reviewed_at       timestamptz           not null default now()
);

comment on table public.reviews is
  'Clinician review decisions on Nexus intelligence outputs. '
  'Full audit trail preserved including before/after content and rejection rationale.';

-- ----------------------------------------------------------
-- decisions
-- Formal clinical decisions authored by the clinical team.
-- These are authoritative human decisions, not AI suggestions.
-- Supports versioning/amendment via amended_from.
-- ----------------------------------------------------------
create table public.decisions (
  id            uuid        primary key default gen_random_uuid(),
  case_id       uuid        not null references public.cases(id) on delete cascade,
  decision_type text        not null,              -- 'DIAGNOSTIC_WORKING', 'MANAGEMENT_PLAN', 'DISCHARGE', etc.
  summary       text        not null,
  rationale     text,
  recorded_by   uuid        not null references public.profiles(id),
  status        text        not null default 'FINAL', -- 'FINAL', 'AMENDED'
  recorded_at   timestamptz not null default now(),
  amended_from  uuid        references public.decisions(id)
);

comment on table public.decisions is
  'Formal clinician decisions recorded for a case. '
  'Always attributed to a human clinician. Immutable record; amendments link via amended_from.';

-- ----------------------------------------------------------
-- safety_concerns
-- Active alerts, contraindications, red flags, or missing critical data.
-- ----------------------------------------------------------
create table public.safety_concerns (
  id                  uuid                    primary key default gen_random_uuid(),
  case_id             uuid                    not null references public.cases(id) on delete cascade,
  severity            public.safety_severity  not null, -- 'INFORMATION', 'ATTENTION', 'URGENT_REVIEW', 'SAFETY_CRITICAL'
  category            text                    not null, -- 'CONTRADICTION', 'DRUG_INTERACTION', 'VITAL_TREND', 'MISSING_DATA'
  description         text                    not null,
  trigger_source      text,                             -- e.g. 'Vital sign threshold', 'Nexus contradiction detector'
  recommended_action  text,
  status              text                    not null default 'OPEN', -- 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'
  created_at          timestamptz             not null default now(),
  resolved_at         timestamptz,
  resolved_by         uuid                    references public.profiles(id)
);

comment on table public.safety_concerns is
  'Clinical safety items, contradiction warnings, and critical concerns. '
  'Visible in Zone 3 and headers to ensure patient safety.';



-- ============================================================
-- 012_tasks_timeline.sql
-- Tasks and chronological clinical timeline events.
-- Timeline answers: "What happened clinically?"
-- ============================================================

-- ----------------------------------------------------------
-- tasks
-- Clinical and administrative tasks associated with a case.
-- ----------------------------------------------------------
create table public.tasks (
  id            uuid                primary key default gen_random_uuid(),
  case_id       uuid                references public.cases(id) on delete cascade,
  assigned_to   uuid                references public.profiles(id),
  title         text                not null,
  description   text,
  status        public.task_status  not null default 'OPEN',
  priority      text                not null default 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
  due_at        timestamptz,
  created_by    uuid                references public.profiles(id),
  created_at    timestamptz         not null default now(),
  completed_at  timestamptz
);

comment on table public.tasks is
  'Clinical tasks and workflows assigned to clinicians, nurses, or labs.';

-- ----------------------------------------------------------
-- timeline_events
-- Chronological event stream for a case.
-- Unifies clinical occurrences, observations, orders, notes,
-- and AI analysis markers into an accessible clinical timeline.
-- ----------------------------------------------------------
create table public.timeline_events (
  id            uuid        primary key default gen_random_uuid(),
  case_id       uuid        not null references public.cases(id) on delete cascade,
  actor_type    text        not null,              -- 'CLINICIAN', 'NURSE', 'SYSTEM', 'NEXUS_AI', 'DEVICE'
  actor_user_id uuid        references public.profiles(id),
  event_type    text        not null,              -- 'CASE_OPENED', 'OBSERVATION_ADDED', 'INVESTIGATION_ORDERED', 'NEXUS_SYNTHESIS', 'DECISION_FINALIZED'
  title         text        not null,
  description   text,
  metadata      jsonb,
  occurred_at   timestamptz not null default now()
);

comment on table public.timeline_events is
  'Chronological case history. Answers: What occurred in this clinical encounter and when?';



-- ============================================================
-- 013_audit_provenance.sql
-- Immutable system and data audit events.
-- Differentiates:
-- Timeline = What happened clinically?
-- Audit = What did the system/user do? (Security & compliance)
-- Note: provenance_records was created in 007 to satisfy FK ordering.
-- ============================================================

-- ----------------------------------------------------------
-- audit_events
-- Tamper-evident immutable audit log for clinical safety,
-- data governance, HIPAA/GDPR, and regulatory compliance.
-- ----------------------------------------------------------
create table public.audit_events (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        references public.organizations(id),
  actor_user_id   uuid        references public.profiles(id),
  action          text        not null,              -- 'CASE_VIEWED', 'FINDING_CREATED', 'FINDING_REJECTED', 'DECISION_FINALIZED', 'POLICY_OVERRIDE'
  resource_type   text        not null,              -- 'case', 'finding', 'nexus_assessment', 'decision', etc.
  resource_id     uuid,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

comment on table public.audit_events is
  'Immutable operational and compliance audit log. '
  'Tracks data reads, edits, AI approvals, and administrative actions.';



-- ============================================================
-- 014_documents.sql
-- Document metadata for files stored in Supabase Storage.
-- Actual file blobs live in Supabase Storage buckets,
-- Postgres stores structured references, mime types, and links.
-- ============================================================

create table public.documents (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete restrict,
  case_id         uuid        references public.cases(id)                  on delete cascade,
  document_type   text        not null,              -- 'LAB_REPORT', 'RADIOLOGY_DICOM', 'REFERRAL_LETTER', 'DISCHARGE_SUMMARY'
  file_name       text        not null,
  storage_path    text        not null,              -- Path inside Supabase Storage bucket
  mime_type       text,
  uploaded_by     uuid        references public.profiles(id),
  created_at      timestamptz not null default now()
);

comment on table public.documents is
  'Metadata for documents and attachments stored in Supabase Storage buckets. '
  'Postgres stores pointers and classifications; blobs reside in object storage.';



-- ============================================================
-- 015_indexes.sql
-- Critical indexes for query performance across high-volume
-- clinical entities and relationships.
-- ============================================================

-- Cases and membership
create index if not exists idx_cases_patient on public.cases(patient_id);
create index if not exists idx_cases_organization on public.cases(organization_id);
create index if not exists idx_cases_status on public.cases(status);
create index if not exists idx_case_members_case on public.case_members(case_id);
create index if not exists idx_case_members_user on public.case_members(user_id);

-- Encounters & Patients
create index if not exists idx_patients_organization on public.patients(organization_id);
create index if not exists idx_encounters_patient on public.encounters(patient_id);
create index if not exists idx_encounters_organization on public.encounters(organization_id);

-- Clinical core
create index if not exists idx_observations_case on public.observations(case_id);
create index if not exists idx_observations_category on public.observations(case_id, category);
create index if not exists idx_findings_case on public.clinical_findings(case_id);
create index if not exists idx_findings_status on public.clinical_findings(case_id, status);
create index if not exists idx_hypotheses_case on public.hypotheses(case_id);
create index if not exists idx_hypothesis_findings_hyp on public.hypothesis_findings(hypothesis_id);
create index if not exists idx_hypothesis_findings_find on public.hypothesis_findings(finding_id);

-- Investigations & Reports
create index if not exists idx_investigations_case on public.investigations(case_id);
create index if not exists idx_investigations_status on public.investigations(status);
create index if not exists idx_investigation_results_inv on public.investigation_results(investigation_id);
create index if not exists idx_diagnostic_reports_case on public.diagnostic_reports(case_id);

-- Evidence
create index if not exists idx_evidence_links_case on public.evidence_links(case_id);
create index if not exists idx_evidence_links_hypothesis on public.evidence_links(hypothesis_id);
create index if not exists idx_evidence_sources_type on public.evidence_sources(source_type);

-- Nexus Intelligence
create index if not exists idx_assessments_case on public.nexus_assessments(case_id);
create index if not exists idx_nexus_findings_assessment on public.nexus_findings(assessment_id);
create index if not exists idx_nexus_recommendations_assessment on public.nexus_recommendations(assessment_id);
create index if not exists idx_reviews_assessment on public.reviews(assessment_id);

-- Governance & Safety
create index if not exists idx_decisions_case on public.decisions(case_id);
create index if not exists idx_safety_concerns_case on public.safety_concerns(case_id);
create index if not exists idx_safety_concerns_status on public.safety_concerns(case_id, status);
create index if not exists idx_tasks_case on public.tasks(case_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to, status);

-- Timeline & Audit
create index if not exists idx_timeline_case_time on public.timeline_events(case_id, occurred_at);
create index if not exists idx_audit_resource on public.audit_events(resource_type, resource_id);
create index if not exists idx_audit_organization on public.audit_events(organization_id, created_at);

-- Documents
create index if not exists idx_documents_case on public.documents(case_id);
create index if not exists idx_documents_org on public.documents(organization_id);



-- ============================================================
-- 016_functions_triggers.sql
-- Automatic timestamp triggers and security definer helper
-- functions to prevent recursive RLS evaluations.
-- ============================================================

-- ----------------------------------------------------------
-- set_updated_at
-- Standardized trigger function to maintain updated_at timestamps.
-- ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at triggers
drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists patients_updated_at on public.patients;
create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists cases_updated_at on public.cases;
create trigger cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

drop trigger if exists clinical_findings_updated_at on public.clinical_findings;
create trigger clinical_findings_updated_at
  before update on public.clinical_findings
  for each row execute function public.set_updated_at();

drop trigger if exists hypotheses_updated_at on public.hypotheses;
create trigger hypotheses_updated_at
  before update on public.hypotheses
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------
-- Security definer RLS helpers
-- Set search_path = '' to protect against search_path hijack.
-- Marked stable to allow query planner optimizations.
-- ----------------------------------------------------------

-- Check whether authenticated caller is an active member of target organization
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org
      and om.user_id = (select auth.uid())
      and om.is_active = true
  );
$$;

-- Check whether authenticated caller is an assigned member of target case
create or replace function public.is_case_member(target_case uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.case_members cm
    where cm.case_id = target_case
      and cm.user_id = (select auth.uid())
  );
$$;

-- Check whether authenticated caller possesses a specific permission code
create or replace function public.has_permission(permission_code text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.roles r on r.name = om.role_name
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where om.user_id = (select auth.uid())
      and om.is_active = true
      and p.code = permission_code
  );
$$;



-- ============================================================
-- 017_rls.sql
-- Row Level Security (RLS) policies and role grants.
-- Strict multi-tenant isolation:
-- Authenticated User -> Organization Membership -> Case Membership -> Resource.
-- No permissive "using (true)" on clinical tables.
-- ============================================================

-- ----------------------------------------------------------
-- 1. Enable RLS on ALL tables
-- ----------------------------------------------------------
alter table public.organizations         enable row level security;
alter table public.profiles              enable row level security;
alter table public.organization_members  enable row level security;
alter table public.roles                 enable row level security;
alter table public.permissions           enable row level security;
alter table public.role_permissions      enable row level security;

alter table public.patients              enable row level security;
alter table public.encounters            enable row level security;
alter table public.cases                 enable row level security;
alter table public.case_members          enable row level security;

alter table public.provenance_records    enable row level security;
alter table public.observations          enable row level security;
alter table public.clinical_findings     enable row level security;
alter table public.hypotheses            enable row level security;
alter table public.hypothesis_findings   enable row level security;

alter table public.investigations        enable row level security;
alter table public.investigation_results enable row level security;
alter table public.diagnostic_reports    enable row level security;

alter table public.evidence_sources      enable row level security;
alter table public.evidence_links        enable row level security;

alter table public.nexus_assessments     enable row level security;
alter table public.nexus_findings        enable row level security;
alter table public.nexus_recommendations enable row level security;

alter table public.reviews               enable row level security;
alter table public.decisions             enable row level security;
alter table public.safety_concerns       enable row level security;

alter table public.tasks                 enable row level security;
alter table public.timeline_events       enable row level security;
alter table public.audit_events          enable row level security;
alter table public.documents             enable row level security;

-- ----------------------------------------------------------
-- 2. Principle of Least Privilege: Revoke and explicit Grant
-- ----------------------------------------------------------
-- Anon cannot read or write any clinical or identity table
revoke all on public.organizations         from anon;
revoke all on public.profiles              from anon;
revoke all on public.organization_members  from anon;
revoke all on public.roles                 from anon;
revoke all on public.permissions           from anon;
revoke all on public.role_permissions      from anon;
revoke all on public.patients              from anon;
revoke all on public.encounters            from anon;
revoke all on public.cases                 from anon;
revoke all on public.case_members          from anon;
revoke all on public.provenance_records    from anon;
revoke all on public.observations          from anon;
revoke all on public.clinical_findings     from anon;
revoke all on public.hypotheses            from anon;
revoke all on public.hypothesis_findings   from anon;
revoke all on public.investigations        from anon;
revoke all on public.investigation_results from anon;
revoke all on public.diagnostic_reports    from anon;
revoke all on public.evidence_sources      from anon;
revoke all on public.evidence_links        from anon;
revoke all on public.nexus_assessments     from anon;
revoke all on public.nexus_findings        from anon;
revoke all on public.nexus_recommendations from anon;
revoke all on public.reviews               from anon;
revoke all on public.decisions             from anon;
revoke all on public.safety_concerns       from anon;
revoke all on public.tasks                 from anon;
revoke all on public.timeline_events       from anon;
revoke all on public.audit_events          from anon;
revoke all on public.documents             from anon;

-- Authenticated roles granted application-level table access subject to RLS
grant select, insert, update on public.organizations         to authenticated;
grant select, insert, update on public.profiles              to authenticated;
grant select                 on public.organization_members  to authenticated;
grant select                 on public.roles                 to authenticated;
grant select                 on public.permissions           to authenticated;
grant select                 on public.role_permissions      to authenticated;

grant select, insert, update on public.patients              to authenticated;
grant select, insert, update on public.encounters            to authenticated;
grant select, insert, update on public.cases                 to authenticated;
grant select, insert, delete on public.case_members          to authenticated;

grant select, insert         on public.provenance_records    to authenticated;
grant select, insert, update on public.observations          to authenticated;
grant select, insert, update on public.clinical_findings     to authenticated;
grant select, insert, update on public.hypotheses            to authenticated;
grant select, insert, delete on public.hypothesis_findings   to authenticated;

grant select, insert, update on public.investigations        to authenticated;
grant select, insert, update on public.investigation_results to authenticated;
grant select, insert, update on public.diagnostic_reports    to authenticated;

grant select                 on public.evidence_sources      to authenticated;
grant select, insert, delete on public.evidence_links        to authenticated;

grant select, insert, update on public.nexus_assessments     to authenticated;
grant select, insert, update on public.nexus_findings        to authenticated;
grant select, insert, update on public.nexus_recommendations to authenticated;

grant select, insert         on public.reviews               to authenticated;
grant select, insert, update on public.decisions             to authenticated;
grant select, insert, update on public.safety_concerns       to authenticated;

grant select, insert, update on public.tasks                 to authenticated;
grant select, insert         on public.timeline_events       to authenticated;
grant select, insert         on public.audit_events          to authenticated;
grant select, insert, update on public.documents             to authenticated;


-- ----------------------------------------------------------
-- 3. Core RLS Policies
-- ----------------------------------------------------------

-- Organizations: users view orgs where they are active members
create policy "members_can_view_organization"
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

-- Profiles: users can view profiles in their shared organizations; update their own profile
create policy "users_view_colleague_profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid()) or
    exists (
      select 1 from public.organization_members my_org
      join public.organization_members peer_org on peer_org.organization_id = my_org.organization_id
      where my_org.user_id = (select auth.uid())
        and peer_org.user_id = profiles.id
        and my_org.is_active = true
        and peer_org.is_active = true
    )
  );

create policy "users_update_own_profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Organization Members: members can view colleagues within same organization
create policy "members_view_org_roster"
  on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id));

-- Roles & Permissions: authenticated users can inspect roles & permissions
create policy "authenticated_read_roles"
  on public.roles for select to authenticated
  using (true);

create policy "authenticated_read_permissions"
  on public.permissions for select to authenticated
  using (true);

create policy "authenticated_read_role_permissions"
  on public.role_permissions for select to authenticated
  using (true);

-- Patients: users view patients belonging to their organizations
create policy "members_view_patients"
  on public.patients for select to authenticated
  using (public.is_org_member(organization_id));

create policy "members_insert_patients"
  on public.patients for insert to authenticated
  with check (public.is_org_member(organization_id));

-- Encounters: users view encounters for their organization
create policy "members_view_encounters"
  on public.encounters for select to authenticated
  using (public.is_org_member(organization_id));

create policy "members_insert_encounters"
  on public.encounters for insert to authenticated
  with check (public.is_org_member(organization_id));

-- Cases: access granted to assigned case members OR org clinicians (governed by org membership & case assignment)
create policy "case_members_view_cases"
  on public.cases for select to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.view'))
  );

create policy "case_create_permission"
  on public.cases for insert to authenticated
  with check (
    public.is_org_member(organization_id) and
    public.has_permission('case.create')
  );

create policy "case_edit_permission"
  on public.cases for update to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.edit'))
  );

-- Case members: viewable by org members of the case
create policy "view_case_members"
  on public.case_members for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_members.case_id
        and public.is_org_member(c.organization_id)
    )
  );

-- Clinical findings: scoped through case membership / view permission
create policy "view_clinical_findings"
  on public.clinical_findings for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = clinical_findings.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_clinical_findings"
  on public.clinical_findings for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = clinical_findings.case_id
        and public.is_org_member(c.organization_id)
        and public.has_permission('finding.create')
    )
  );

-- Observations: scoped through case
create policy "view_observations"
  on public.observations for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = observations.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Hypotheses & hypothesis_findings: scoped through case
create policy "view_hypotheses"
  on public.hypotheses for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = hypotheses.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_hypothesis_findings"
  on public.hypothesis_findings for select to authenticated
  using (
    exists (
      select 1 from public.hypotheses h
      join public.cases c on c.id = h.case_id
      where h.id = hypothesis_findings.hypothesis_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Investigations & results
create policy "view_investigations"
  on public.investigations for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = investigations.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_investigations"
  on public.investigations for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = investigations.case_id
        and public.is_org_member(c.organization_id)
        and public.has_permission('investigation.request')
    )
  );

create policy "view_investigation_results"
  on public.investigation_results for select to authenticated
  using (
    exists (
      select 1 from public.investigations i
      join public.cases c on c.id = i.case_id
      where i.id = investigation_results.investigation_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Evidence sources (shared clinical library) & links
create policy "view_evidence_sources"
  on public.evidence_sources for select to authenticated
  using (true);

create policy "view_evidence_links"
  on public.evidence_links for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = evidence_links.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Nexus intelligence assessments & items
create policy "view_nexus_assessments"
  on public.nexus_assessments for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = nexus_assessments.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_nexus_findings"
  on public.nexus_findings for select to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_findings.assessment_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_nexus_recommendations"
  on public.nexus_recommendations for select to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_recommendations.assessment_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Reviews & Decisions
create policy "view_reviews"
  on public.reviews for select to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = reviews.assessment_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_reviews"
  on public.reviews for insert to authenticated
  with check (
    reviewer_id = (select auth.uid()) and
    public.has_permission('nexus.review')
  );

create policy "view_decisions"
  on public.decisions for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = decisions.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_decisions"
  on public.decisions for insert to authenticated
  with check (
    recorded_by = (select auth.uid()) and
    public.has_permission('decision.create')
  );

-- Safety concerns
create policy "view_safety_concerns"
  on public.safety_concerns for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = safety_concerns.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Tasks & Timeline
create policy "view_tasks"
  on public.tasks for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = tasks.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_timeline_events"
  on public.timeline_events for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = timeline_events.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Audit Events: viewable only by users with audit.view permission in the organization
create policy "view_audit_events"
  on public.audit_events for select to authenticated
  using (
    public.is_org_member(organization_id) and
    public.has_permission('audit.view')
  );

-- Documents
create policy "view_documents"
  on public.documents for select to authenticated
  using (
    public.is_org_member(organization_id) and
    (
      case_id is null or
      exists (
        select 1 from public.cases c
        where c.id = documents.case_id
          and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
      )
    )
  );



-- ============================================================
-- 018_seed_demo_data.sql
-- Canonical synthetic demo data for Nexus Clinical Workstation.
-- All data points are explicitly marked: SYNTHETIC DEMO DATA.
-- Contains:
-- 1. Standard Permissions and Role Assignments
-- 2. Organization: Nexus Teaching Hospital [DEMO]
-- 3. Demo Personas (Clinician, Reviewer, Nurse, Lab, Admin)
-- 4. Patients: A (Respiratory/Sepsis), B (Cardiac), C (Renal)
-- 5. Cases: CASE-10482 (Primary Demo), CASE-10483, CASE-10484
-- 6. Clinical Observations, Findings, Hypotheses, Evidence Links
-- ============================================================

-- ----------------------------------------------------------
-- 1. Standard Permissions
-- ----------------------------------------------------------
insert into public.permissions (id, code, description) values
  ('a0000001-0000-0000-0000-000000000001', 'case.view', 'View case details and history'),
  ('a0000001-0000-0000-0000-000000000002', 'case.create', 'Open new clinical case'),
  ('a0000001-0000-0000-0000-000000000003', 'case.edit', 'Modify case parameters and status'),
  ('a0000001-0000-0000-0000-000000000004', 'case.close', 'Finalize and close a case'),
  ('a0000001-0000-0000-0000-000000000005', 'finding.create', 'Record new clinical finding'),
  ('a0000001-0000-0000-0000-000000000006', 'finding.edit', 'Edit recorded clinical finding'),
  ('a0000001-0000-0000-0000-000000000007', 'finding.verify', 'Formally verify a clinical finding'),
  ('a0000001-0000-0000-0000-000000000008', 'investigation.request', 'Order lab or imaging investigation'),
  ('a0000001-0000-0000-0000-000000000009', 'investigation.view', 'View ordered investigations and reports'),
  ('a0000001-0000-0000-0000-000000000010', 'investigation.result.create', 'Upload or enter investigation results'),
  ('a0000001-0000-0000-0000-000000000011', 'nexus.review', 'Access Nexus intelligence and conduct review'),
  ('a0000001-0000-0000-0000-000000000012', 'nexus.accept', 'Accept an AI suggestion or finding'),
  ('a0000001-0000-0000-0000-000000000013', 'nexus.edit', 'Edit an AI suggestion prior to accepting'),
  ('a0000001-0000-0000-0000-000000000014', 'nexus.reject', 'Reject an AI suggestion with mandatory rationale'),
  ('a0000001-0000-0000-0000-000000000015', 'decision.create', 'Record authoritative clinician decision'),
  ('a0000001-0000-0000-0000-000000000016', 'decision.amend', 'Amend an existing clinical decision'),
  ('a0000001-0000-0000-0000-000000000017', 'safety.view', 'View safety alerts and contradictions'),
  ('a0000001-0000-0000-0000-000000000018', 'safety.resolve', 'Acknowledge or resolve safety concerns'),
  ('a0000001-0000-0000-0000-000000000019', 'team.manage', 'Assign and reassign case team members'),
  ('a0000001-0000-0000-0000-000000000020', 'users.manage', 'Manage organization member accounts'),
  ('a0000001-0000-0000-0000-000000000021', 'organization.manage', 'Configure organization settings'),
  ('a0000001-0000-0000-0000-000000000022', 'audit.view', 'Inspect immutable audit logs')
on conflict (code) do nothing;

-- ----------------------------------------------------------
-- 2. Standard Roles
-- ----------------------------------------------------------
insert into public.roles (id, name, description) values
  ('b0000001-0000-0000-0000-000000000001', 'ADMINISTRATOR', 'Full system and organizational governance access'),
  ('b0000001-0000-0000-0000-000000000002', 'CLINICIAN', 'Attending physician: orders, decisions, case management'),
  ('b0000001-0000-0000-0000-000000000003', 'REVIEWER', 'Senior specialist or consultant with review authority'),
  ('b0000001-0000-0000-0000-000000000004', 'NURSE', 'Clinical observation logging, vitals recording, care tasks'),
  ('b0000001-0000-0000-0000-000000000005', 'LABORATORY', 'Diagnostic test processing and result entry')
on conflict (name) do nothing;

-- Grant permissions to CLINICIAN
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'CLINICIAN'
  and p.code in (
    'case.view', 'case.create', 'case.edit', 'case.close',
    'finding.create', 'finding.edit', 'finding.verify',
    'investigation.request', 'investigation.view',
    'nexus.review', 'nexus.accept', 'nexus.edit', 'nexus.reject',
    'decision.create', 'decision.amend',
    'safety.view', 'safety.resolve', 'team.manage'
  )
on conflict do nothing;

-- Grant permissions to REVIEWER
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'REVIEWER'
  and p.code in (
    'case.view', 'finding.verify', 'investigation.view',
    'nexus.review', 'nexus.accept', 'nexus.edit', 'nexus.reject',
    'decision.create', 'decision.amend', 'safety.view', 'safety.resolve', 'audit.view'
  )
on conflict do nothing;

-- Grant permissions to ADMINISTRATOR
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'ADMINISTRATOR'
on conflict do nothing;

-- ----------------------------------------------------------
-- 3. Demo Organization
-- ----------------------------------------------------------
insert into public.organizations (id, name, organization_type, country_code, timezone, is_active)
values (
  'c0000001-0000-0000-0000-000000000001',
  'Nexus Teaching Hospital [DEMO]',
  'DEMO_ACADEMIC_MEDICAL_CENTER',
  'GB',
  'Europe/London',
  true
)
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 4. Auth Users & Profiles (Deterministic IDs for Demo)
-- ----------------------------------------------------------
-- Seed into auth.users if available
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      ('d0000001-0000-0000-0000-000000000001', 'dr.sarah.chen@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"Dr. Sarah Chen"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000002', 'prof.marcus.vance@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"Prof. Marcus Vance"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000003', 'nurse.elena.rostova@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"Elena Rostova, RN"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000004', 'lab.david.kim@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"David Kim, MLS"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000005', 'admin@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"System Administrator"}', now(), now())
    on conflict (id) do nothing;
  end if;
end $$;

-- Public Profiles
insert into public.profiles (id, full_name, email, profession, license_identifier, avatar_url)
values
  ('d0000001-0000-0000-0000-000000000001', 'Dr. Sarah Chen, MD', 'dr.sarah.chen@nexus-hospital.demo', 'Attending Physician, Acute Internal Medicine', 'GMC-7412890', null),
  ('d0000001-0000-0000-0000-000000000002', 'Prof. Marcus Vance, FRCP', 'prof.marcus.vance@nexus-hospital.demo', 'Consultant Pulmonologist & Clinical Reviewer', 'GMC-4819033', null),
  ('d0000001-0000-0000-0000-000000000003', 'Elena Rostova, RN', 'nurse.elena.rostova@nexus-hospital.demo', 'Lead Triage & Critical Care Nurse', 'NMC-18B0421E', null),
  ('d0000001-0000-0000-0000-000000000004', 'David Kim, MLS', 'lab.david.kim@nexus-hospital.demo', 'Senior Clinical Pathologist / Laboratory Specialist', 'HCPC-CS19022', null),
  ('d0000001-0000-0000-0000-000000000005', 'System Administrator', 'admin@nexus-hospital.demo', 'Chief Clinical Information Officer', 'CCIO-001', null)
on conflict (id) do nothing;

-- Organization Memberships
insert into public.organization_members (organization_id, user_id, role_name, is_active)
values
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'CLINICIAN', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'REVIEWER', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'NURSE', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000004', 'LABORATORY', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000005', 'ADMINISTRATOR', true)
on conflict (organization_id, user_id) do nothing;

-- ----------------------------------------------------------
-- 5. Synthetic Patients
-- ----------------------------------------------------------
insert into public.patients (id, organization_id, external_patient_id, given_name, family_name, date_of_birth, sex, phone)
values
  ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'SYNTH-PT-10482', 'Arthur', 'Pendleton', '1961-04-18', 'MALE', '+44 7700 900142'),
  ('e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'SYNTH-PT-10483', 'Beatriz', 'Moreno-Silva', '1984-11-03', 'FEMALE', '+44 7700 900581'),
  ('e0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'SYNTH-PT-10484', 'Chukwuemeka', 'Okonkwo', '1955-08-22', 'MALE', '+44 7700 900729')
on conflict (id) do nothing;

-- Encounters
insert into public.encounters (id, patient_id, organization_id, encounter_type, started_at, status, location)
values
  ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'EMERGENCY_ADMISSION', now() - interval '6 hours', 'ACTIVE', 'Resus Bay 3 -> Acute Assessment Unit'),
  ('f0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'INPATIENT', now() - interval '2 days', 'ACTIVE', 'Cardiology Ward 4B Bed 12'),
  ('f0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'OUTPATIENT_DIAGNOSTIC', now() - interval '1 day', 'ACTIVE', 'Renal Day Unit')
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 6. Demo Cases
-- ----------------------------------------------------------
insert into public.cases (id, organization_id, patient_id, encounter_id, case_number, title, status, priority, opened_at, created_by)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000001',
    'f0000001-0000-0000-0000-000000000001',
    'CASE-10482',
    'Acute respiratory deterioration in immunocompromised host with persistent fever [SYNTHETIC DEMO]',
    'REVIEW_REQUIRED',
    'HIGH',
    now() - interval '5 hours',
    'd0000001-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000002',
    'f0000001-0000-0000-0000-000000000002',
    'CASE-10483',
    'Atypical chest pain with discordant biomarker kinetics and prior stent [SYNTHETIC DEMO]',
    'ACTIVE',
    'NORMAL',
    now() - interval '18 hours',
    'd0000001-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000003',
    'f0000001-0000-0000-0000-000000000003',
    'CASE-10484',
    'Rapid progressive renal decline with cutaneous vasculitic purpura [SYNTHETIC DEMO]',
    'PRELIMINARY',
    'URGENT',
    now() - interval '1 day',
    'd0000001-0000-0000-0000-000000000001'
  )
on conflict (id) do nothing;

-- Case Team Members
insert into public.case_members (case_id, user_id, role_name)
values
  ('00000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'Attending Clinician'),
  ('00000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'Clinical Reviewer'),
  ('00000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'Triage Nurse')
on conflict (case_id, user_id) do nothing;

-- ----------------------------------------------------------
-- 7. Provenance & Clinical Data for CASE-10482
-- ----------------------------------------------------------
-- Provenance entries
insert into public.provenance_records (id, provenance_type, source_system, actor_user_id, model_name, model_version, captured_at, notes)
values
  ('10000001-0000-0000-0000-000000000001', 'DEVICE_MEASURED', 'Mindray BeneVision N12', null, null, null, now() - interval '4 hours', 'Continuous automated telemetry feed'),
  ('10000001-0000-0000-0000-000000000002', 'HUMAN_ENTERED', 'Nexus Bedside Workstation', 'd0000001-0000-0000-0000-000000000001', null, null, now() - interval '3 hours', 'Direct admission clerking examination'),
  ('10000001-0000-0000-0000-000000000003', 'AI_EXTRACTED', 'Nexus Clinical NLP Pipeline', null, 'Nexus-Reasoning-Core', 'v2.4-clinical', now() - interval '2 hours', 'Automated extraction from referral text and vitals telemetry')
on conflict (id) do nothing;

-- Observations (Structured vitals and lab numbers)
insert into public.observations (case_id, category, label, value_numeric, unit, reference_low, reference_high, observed_at, provenance_id)
values
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Body Temperature', 38.9, '°C', 36.1, 37.5, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Oxygen Saturation (SpO2)', 91.0, '%', 95.0, 100.0, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Respiratory Rate', 28.0, '/min', 12.0, 20.0, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Heart Rate', 114.0, 'bpm', 60.0, 100.0, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'LABORATORY', 'C-Reactive Protein (CRP)', 184.0, 'mg/L', 0.0, 5.0, now() - interval '3 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'LABORATORY', 'Serum Procalcitonin', 2.8, 'ng/mL', 0.0, 0.5, now() - interval '3 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'LABORATORY', 'White Blood Cell Count', 16.8, '10^9/L', 4.0, 11.0, now() - interval '3 hours', '10000001-0000-0000-0000-000000000001');

-- Clinical Findings
insert into public.clinical_findings (id, case_id, category, label, description, status, provenance_id, created_by)
values
  ('20000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'SYMPTOM', 'Persistent high fever (38.9°C) unresponsive to oral paracetamol', 'Patient reports rigors and nocturnal drenching sweats for 6 days', 'ACTIVE', '10000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('20000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'SIGN', 'Bilateral fine inspiratory crackles in basal zones', 'Auscultation confirms focal bronchial breathing at right lower lobe base', 'ACTIVE', '10000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('20000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'HISTORY', 'Immunosuppressed state secondary to rituximab maintenance', 'Completed cycle 4 three weeks prior for follicular lymphoma', 'ACTIVE', '10000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('20000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'SIGN', 'Hypoxemic respiratory failure requiring 4L supplemental O2', 'Resting SpO2 drops to 87% on room air', 'ACTIVE', '10000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Hypotheses
insert into public.hypotheses (id, case_id, label, status, rationale, created_by, provenance_id)
values
  ('30000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Community-Acquired Bacterial Pneumonia with Sepsis Risk', 'SUPPORTED', 'Marked fever, elevated CRP/procalcitonin, focal lung findings, and tachypnoea in elderly host', 'd0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000002'),
  ('30000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pneumocystis Jirovecii Pneumonia (PJP) / Opportunistic Fungal Infection', 'CANDIDATE', 'Prolonged hypoxaemia disproportionate to physical findings in rituximab-treated patient', 'd0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000003'),
  ('30000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Acute Pulmonary Embolism with Secondary Infarction', 'DISMISSED', 'CTPA negative for filling defect; tachypnoea explained by parenchymal consolidation', 'd0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- Hypothesis-Finding Junctions
insert into public.hypothesis_findings (hypothesis_id, finding_id, relationship, rationale)
values
  ('30000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000001', 'SUPPORTS', 'High continuous fever consistent with acute pyogenic infection'),
  ('30000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000002', 'SUPPORTS', 'Focal crackles confirm lower lobe consolidation'),
  ('30000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000003', 'SUPPORTS', 'B-cell depletion from rituximab dramatically increases opportunistic risk'),
  ('30000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000004', 'SUPPORTS', 'Severe hypoxaemia with exertional desaturation is hallmark of PJP')
on conflict (hypothesis_id, finding_id) do nothing;

-- ----------------------------------------------------------
-- 8. Nexus Intelligence Synthesis
-- ----------------------------------------------------------
insert into public.nexus_assessments (id, case_id, status, summary, data_completeness, evidence_consistency, applicability, limitations, model_name, model_version)
values (
  '40000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'REVIEW_REQUIRED',
  'Nexus Case Synthesis: 63yo male with severe community-acquired pneumonia physiology complicated by B-cell depletion immunosuppression. Elevated procalcitonin (2.8 ng/mL) and high inflammatory markers favor pyogenic bacterial etiology, but atypical fungal opportunistic process (PJP) cannot be excluded without induced sputum or beta-D-glucan.',
  'Moderate (blood cultures pending; induced sputum pending; initial HRCT pending)',
  'High concordance between physiological vitals, auscultatory signs, and laboratory inflammatory markers',
  'Adult acute hospital inpatient; immunocompromised oncology protocol',
  'Synthesized from synthetic training records. Clinical evaluation by attending physician mandatory before therapy initiation.',
  'Nexus-Reasoning-Core',
  'v2.4-clinical'
)
on conflict (id) do nothing;

insert into public.nexus_findings (id, assessment_id, finding_type, content, status)
values
  ('50000001-0000-0000-0000-000000000001', '40000001-0000-0000-0000-000000000001', 'OBSERVATION', 'Procalcitonin 2.8 ng/mL strongly correlates with systemic bacterial invasion versus viral respiratory infection alone', 'PENDING_REVIEW'),
  ('50000001-0000-0000-0000-000000000002', '40000001-0000-0000-0000-000000000001', 'RISK_FACTOR', 'Recent rituximab exposure reduces humoral response, impairing sputum antibody diagnostic reliability', 'PENDING_REVIEW')
on conflict (id) do nothing;

insert into public.nexus_recommendations (id, assessment_id, category, content, rationale, status)
values
  ('60000001-0000-0000-0000-000000000001', '40000001-0000-0000-0000-000000000001', 'INVESTIGATION', 'Order serum (1,3)-beta-D-glucan assay and fungal galactomannan antigen test', 'Rule out atypical opportunistic fungal infection given B-cell depletion', 'PENDING_REVIEW'),
  ('60000001-0000-0000-0000-000000000002', '40000001-0000-0000-0000-000000000001', 'MONITORING', 'Institute continuous pulse oximetry and q1h NEWS2 scoring protocol', 'High risk of acute hypoxic decompensation within initial 24 hours', 'PENDING_REVIEW')
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 9. Safety Concerns
-- ----------------------------------------------------------
insert into public.safety_concerns (id, case_id, severity, category, description, trigger_source, recommended_action, status)
values
  ('70000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'URGENT_REVIEW', 'HYPOXIA_DECOMPENSATION', 'Oxygen requirement increased from 2L to 4L in past 3 hours to maintain SpO2 >= 92%', 'Automated vitals rate-of-change monitor', 'Urgent review by respiratory registrar; prepare High Flow Nasal Cannula (HFNC)', 'OPEN'),
  ('70000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ATTENTION', 'CONTRADICTION', 'Normal leukocyte count reported on baseline lab vs leukocytosis on current differential', 'Nexus Contradiction Detector', 'Verify whether sample was drawn post-steroid administration or reflects true marrow response', 'OPEN')
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 10. Clinical Timeline Events
-- ----------------------------------------------------------
insert into public.timeline_events (case_id, actor_type, actor_user_id, event_type, title, description, occurred_at)
values
  ('00000000-0000-0000-0000-000000000001', 'CLINICIAN', 'd0000001-0000-0000-0000-000000000001', 'CASE_OPENED', 'Case opened in Emergency Assessment Unit', 'Admitted via ambulance triage for severe pyrexial respiratory distress', now() - interval '5 hours'),
  ('00000000-0000-0000-0000-000000000001', 'DEVICE', null, 'OBSERVATION_ADDED', 'Multiparameter telemetry vitals synchronized', 'Temperature 38.9°C, SpO2 91% on room air, HR 114 bpm', now() - interval '4 hours'),
  ('00000000-0000-0000-0000-000000000001', 'NEXUS_AI', null, 'NEXUS_SYNTHESIS', 'Nexus Clinical Synthesis generated', 'Assessment v2.4 generated with 2 candidate hypotheses and 2 recommendations', now() - interval '2 hours')
on conflict do nothing;



-- ============================================================
-- 019_phase6c_security_model.sql
-- Phase 6C: Canonical Role & Permission Security Model
-- 1. Strongly typed enums: app_role and app_permission
-- 2. Organization-aware authorization function: authorize(permission, org_id)
-- 3. Controlled role-permission matrix with strict separation
--    (Organization Admin does NOT automatically receive clinical access)
-- 4. Rejection rationale requirement constraint
-- 5. Decision immutability trigger (FINAL decisions cannot be overwritten)
-- ============================================================

-- ----------------------------------------------------------
-- 1. Controlled Enums
-- ----------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'clinician',
      'nurse',
      'laboratory',
      'reviewer',
      'organization_admin',
      'platform_admin'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'app_permission') then
    create type public.app_permission as enum (
      'case.view',
      'case.create',
      'case.edit',
      'case.close',
      'finding.view',
      'finding.create',
      'finding.edit',
      'finding.verify',
      'investigation.view',
      'investigation.request',
      'investigation.result.create',
      'investigation.result.verify',
      'nexus.view',
      'nexus.review',
      'nexus.accept',
      'nexus.edit',
      'nexus.reject',
      'decision.view',
      'decision.create',
      'decision.amend',
      'safety.view',
      'safety.resolve',
      'task.view',
      'task.create',
      'task.update',
      'team.view',
      'team.manage',
      'user.view',
      'user.manage',
      'organization.view',
      'organization.manage',
      'audit.view'
    );
  end if;
end $$;

-- ----------------------------------------------------------
-- 2. Refactor roles and permissions structure to use typed enums
-- ----------------------------------------------------------
-- Add typed role column to roles if not present
alter table public.roles add column if not exists role_type public.app_role;

-- Add typed role column to organization_members
alter table public.organization_members add column if not exists role public.app_role;

-- Migrate existing seed roles to app_role enum values
update public.roles set role_type = lower(name)::public.app_role where role_type is null and name in ('CLINICIAN', 'NURSE', 'LABORATORY', 'REVIEWER');
update public.roles set role_type = 'organization_admin' where name = 'ADMINISTRATOR' and role_type is null;

-- Ensure all roles exist with typed role_type
insert into public.roles (name, role_type, description)
values
  ('clinician', 'clinician', 'Clinical assessment, diagnoses working hypotheses, orders, and decisions'),
  ('nurse', 'nurse', 'Clinical observations, bedside telemetry, and care tasks'),
  ('laboratory', 'laboratory', 'Investigation results entry and specimen processing'),
  ('reviewer', 'reviewer', 'Clinical peer review, Nexus intelligence evaluation, and safety resolution'),
  ('organization_admin', 'organization_admin', 'Organization and user administration (strictly segregated from clinical decision authority)'),
  ('platform_admin', 'platform_admin', 'Platform infrastructure and multi-tenant management')
on conflict (name) do update set role_type = excluded.role_type;

-- Update organization_members.role
update public.organization_members
set role = lower(role_name)::public.app_role
where role is null and role_name in ('CLINICIAN', 'NURSE', 'LABORATORY', 'REVIEWER');

update public.organization_members
set role = 'organization_admin'
where role is null and role_name = 'ADMINISTRATOR';

-- ----------------------------------------------------------
-- 3. Dedicated typed role_permissions join
-- ----------------------------------------------------------
create table if not exists public.app_role_permissions (
  role public.app_role not null,
  permission public.app_permission not null,
  primary key (role, permission)
);

-- Populate Role-Permission Matrix (Section 6C.5)
insert into public.app_role_permissions (role, permission) values
  -- Clinician
  ('clinician', 'case.view'),
  ('clinician', 'case.create'),
  ('clinician', 'case.edit'),
  ('clinician', 'finding.view'),
  ('clinician', 'finding.create'),
  ('clinician', 'finding.edit'),
  ('clinician', 'finding.verify'),
  ('clinician', 'investigation.view'),
  ('clinician', 'investigation.request'),
  ('clinician', 'investigation.result.verify'),
  ('clinician', 'nexus.view'),
  ('clinician', 'nexus.review'),
  ('clinician', 'nexus.accept'),
  ('clinician', 'nexus.edit'),
  ('clinician', 'nexus.reject'),
  ('clinician', 'decision.view'),
  ('clinician', 'decision.create'),
  ('clinician', 'decision.amend'),
  ('clinician', 'safety.view'),
  ('clinician', 'safety.resolve'),
  ('clinician', 'task.view'),
  ('clinician', 'task.create'),
  ('clinician', 'task.update'),
  ('clinician', 'team.view'),

  -- Nurse
  ('nurse', 'case.view'),
  ('nurse', 'finding.view'),
  ('nurse', 'finding.create'),
  ('nurse', 'investigation.view'),
  ('nurse', 'nexus.view'),
  ('nurse', 'safety.view'),
  ('nurse', 'task.view'),
  ('nurse', 'task.update'),
  ('nurse', 'team.view'),

  -- Laboratory (Restricted to investigation scope)
  ('laboratory', 'case.view'),
  ('laboratory', 'investigation.view'),
  ('laboratory', 'investigation.result.create'),
  ('laboratory', 'task.view'),
  ('laboratory', 'task.update'),

  -- Reviewer
  ('reviewer', 'case.view'),
  ('reviewer', 'finding.view'),
  ('reviewer', 'finding.verify'),
  ('reviewer', 'investigation.view'),
  ('reviewer', 'investigation.result.verify'),
  ('reviewer', 'nexus.view'),
  ('reviewer', 'nexus.review'),
  ('reviewer', 'nexus.accept'),
  ('reviewer', 'nexus.edit'),
  ('reviewer', 'nexus.reject'),
  ('reviewer', 'decision.view'),
  ('reviewer', 'decision.create'),
  ('reviewer', 'decision.amend'),
  ('reviewer', 'safety.view'),
  ('reviewer', 'safety.resolve'),
  ('reviewer', 'task.view'),
  ('reviewer', 'team.view'),
  ('reviewer', 'audit.view'),

  -- Organization Admin (Administrative only - no clinical decision or findings authority)
  ('organization_admin', 'case.view'),
  ('organization_admin', 'case.create'),
  ('organization_admin', 'case.edit'),
  ('organization_admin', 'case.close'),
  ('organization_admin', 'team.view'),
  ('organization_admin', 'team.manage'),
  ('organization_admin', 'user.view'),
  ('organization_admin', 'user.manage'),
  ('organization_admin', 'organization.view'),
  ('organization_admin', 'organization.manage'),
  ('organization_admin', 'audit.view'),

  -- Platform Admin
  ('platform_admin', 'organization.view'),
  ('platform_admin', 'organization.manage'),
  ('platform_admin', 'user.view'),
  ('platform_admin', 'user.manage'),
  ('platform_admin', 'audit.view')
on conflict (role, permission) do nothing;

-- ----------------------------------------------------------
-- 4. Central Organization-Aware Authorization Function (6C.8)
-- ----------------------------------------------------------
create or replace function public.authorize(
  requested_permission public.app_permission,
  target_organization uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  has_perm boolean;
begin
  select exists (
    select 1
    from public.organization_members om
    join public.app_role_permissions arp on arp.role = coalesce(om.role, lower(om.role_name)::public.app_role)
    where om.organization_id = target_organization
      and om.user_id = (select auth.uid())
      and om.is_active = true
      and arp.permission = requested_permission
  ) into has_perm;

  return coalesce(has_perm, false);
end;
$$;

-- Global / Cross-Org fallback authorization check
create or replace function public.authorize(
  requested_permission public.app_permission
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.organization_members om
    join public.app_role_permissions arp on arp.role = coalesce(om.role, lower(om.role_name)::public.app_role)
    where om.user_id = (select auth.uid())
      and om.is_active = true
      and arp.permission = requested_permission
  );
end;
$$;

-- ----------------------------------------------------------
-- 5. Business Rule Constraints & Immutability Triggers
-- ----------------------------------------------------------

-- 6C.26: Rejection requires non-empty rationale
alter table public.reviews
  drop constraint if exists check_rejection_reason;

alter table public.reviews
  add constraint check_rejection_reason check (
    action != 'REJECT' or (reason is not null and length(trim(reason)) >= 5)
  );

-- 6C.28: Finalized Decisions cannot be overwritten
create or replace function public.prevent_final_decision_overwrite()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'FINAL' then
    raise exception 'Cannot overwrite or modify a finalized clinical decision. Create a new decision linked via amended_from.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_final_decision_overwrite on public.decisions;
create trigger trg_prevent_final_decision_overwrite
  before update on public.decisions
  for each row execute function public.prevent_final_decision_overwrite();

-- ----------------------------------------------------------
-- 6. Updated RLS Policies Using Org-Aware Authorization
-- ----------------------------------------------------------

-- Cases
drop policy if exists "authorized users can view cases" on public.cases;
create policy "authorized users can view cases"
  on public.cases for select to authenticated
  using (
    public.is_case_member(id) or
    public.authorize('case.view', organization_id)
  );

drop policy if exists "authorized users can create cases" on public.cases;
create policy "authorized users can create cases"
  on public.cases for insert to authenticated
  with check (
    public.authorize('case.create', organization_id)
  );

drop policy if exists "authorized users can update cases" on public.cases;
create policy "authorized users can update cases"
  on public.cases for update to authenticated
  using (
    public.authorize('case.edit', organization_id)
  )
  with check (
    public.authorize('case.edit', organization_id)
  );

-- Findings
drop policy if exists "authorized users can view findings" on public.clinical_findings;
create policy "authorized users can view findings"
  on public.clinical_findings for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = clinical_findings.case_id
        and (public.is_case_member(c.id) or public.authorize('finding.view', c.organization_id))
    )
  );

drop policy if exists "authorized users can create findings" on public.clinical_findings;
create policy "authorized users can create findings"
  on public.clinical_findings for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = clinical_findings.case_id
        and public.authorize('finding.create', c.organization_id)
    )
  );

-- Decisions
drop policy if exists "authorized users can record decisions" on public.decisions;
create policy "authorized users can record decisions"
  on public.decisions for insert to authenticated
  with check (
    recorded_by = (select auth.uid()) and
    exists (
      select 1 from public.cases c
      where c.id = decisions.case_id
        and public.authorize('decision.create', c.organization_id)
    )
  );



-- ============================================================
-- 020_phase6d_core_clinical.sql
-- Phase 6D: Patients, Encounters, and Cases Domain Engine
-- 1. case_role enum: LEAD, CONTRIBUTOR, REVIEWER, OBSERVER
-- 2. Case members role separation from global organization role
-- 3. Atomic transition_case() stored procedure with timeline & audit logs
-- 4. Organization-scoped case number generation function
-- 5. Seed Cases:
--    - CASE-10001: Active investigation (ANALYZING)
--    - CASE-10002: Conflicting clinical findings (CONTRADICTORY)
--    - CASE-10003: Incomplete clinical presentation (INSUFFICIENT_DATA)
-- ============================================================

-- ----------------------------------------------------------
-- 1. Case Roles (Separating professional title from case duty)
-- ----------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'case_role') then
    create type public.case_role as enum (
      'LEAD',
      'CONTRIBUTOR',
      'REVIEWER',
      'OBSERVER'
    );
  end if;
end $$;

-- Update case_members table with typed case_role
alter table public.case_members add column if not exists case_role public.case_role not null default 'CONTRIBUTOR';

-- ----------------------------------------------------------
-- 2. Organization-Scoped Case Number Generator
-- Format: CASE-10001, CASE-10002...
-- ----------------------------------------------------------
create table if not exists public.organization_counters (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  case_counter integer not null default 10000
);

create or replace function public.generate_case_number(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next_val integer;
begin
  insert into public.organization_counters (organization_id, case_counter)
  values (p_org_id, 10001)
  on conflict (organization_id)
  do update set case_counter = public.organization_counters.case_counter + 1
  returning case_counter into v_next_val;

  return 'CASE-' || v_next_val::text;
end;
$$;

-- ----------------------------------------------------------
-- 3. Atomic Database Case State Transition Function (Section 6)
-- ----------------------------------------------------------
create or replace function public.transition_case(
  p_case_id uuid,
  p_target_status public.case_status,
  p_rationale text default null
)
returns public.cases
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case public.cases;
  v_current_status public.case_status;
  v_org_id uuid;
  v_user_id uuid;
  v_is_legal boolean := false;
begin
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to transition clinical case status';
  end if;

  -- 2. Fetch current case
  select * into v_case from public.cases where id = p_case_id;
  if not found then
    raise exception 'Case % not found', p_case_id;
  end if;

  v_current_status := v_case.status;
  v_org_id := v_case.organization_id;

  -- 3. Verify case edit permission in organization
  if not public.authorize('case.edit', v_org_id) and not public.is_case_member(p_case_id) then
    raise exception 'Unauthorized: caller lacks case.edit permission in organization %', v_org_id;
  end if;

  -- If status is identical, no-op
  if v_current_status = p_target_status then
    return v_case;
  end if;

  -- 4. Validate allowed state machine transitions (Phase 6D rules)
  case v_current_status
    when 'DRAFT' then
      v_is_legal := (p_target_status in ('ACTIVE'));
    when 'ACTIVE' then
      v_is_legal := (p_target_status in ('ANALYZING', 'INSUFFICIENT_DATA', 'CONTRADICTORY', 'SAFETY_REVIEW', 'OUT_OF_SCOPE'));
    when 'ANALYZING' then
      v_is_legal := (p_target_status in ('PRELIMINARY', 'CONTRADICTORY', 'INSUFFICIENT_DATA', 'ACTIVE'));
    when 'PRELIMINARY' then
      v_is_legal := (p_target_status in ('REVIEW_REQUIRED', 'CONTRADICTORY', 'INSUFFICIENT_DATA'));
    when 'REVIEW_REQUIRED' then
      v_is_legal := (p_target_status in ('CLINICIAN_REVIEW', 'SAFETY_REVIEW', 'INSUFFICIENT_DATA'));
    when 'CLINICIAN_REVIEW' then
      v_is_legal := (p_target_status in ('DECISION_RECORDED', 'REVIEW_REQUIRED', 'ACTIVE'));
    when 'DECISION_RECORDED' then
      v_is_legal := (p_target_status in ('RESOLVED', 'CLINICIAN_REVIEW'));
    when 'RESOLVED' then
      v_is_legal := (p_target_status in ('ACTIVE')); -- Re-opened
    -- Exceptional states transitions
    when 'UNCERTAIN' then
      v_is_legal := (p_target_status in ('ACTIVE', 'REVIEW_REQUIRED', 'CLINICIAN_REVIEW'));
    when 'CONTRADICTORY' then
      v_is_legal := (p_target_status in ('SAFETY_REVIEW', 'CLINICIAN_REVIEW', 'ACTIVE'));
    when 'SAFETY_REVIEW' then
      v_is_legal := (p_target_status in ('CLINICIAN_REVIEW', 'ACTIVE'));
    when 'INSUFFICIENT_DATA' then
      v_is_legal := (p_target_status in ('ACTIVE', 'CLINICIAN_REVIEW'));
    when 'OUT_OF_SCOPE' then
      v_is_legal := (p_target_status in ('ACTIVE'));
    else
      v_is_legal := false;
  end case;

  if not v_is_legal then
    raise exception 'Illegal case transition: Cannot move clinical case from % to %', v_current_status, p_target_status;
  end if;

  -- 5. Update case row
  update public.cases
  set status = p_target_status,
      closed_at = case when p_target_status = 'RESOLVED' then now() else closed_at end,
      updated_at = now()
  where id = p_case_id
  returning * into v_case;

  -- 6. Insert chronological clinical timeline event
  insert into public.timeline_events (
    case_id,
    actor_type,
    actor_user_id,
    event_type,
    title,
    description,
    occurred_at
  ) values (
    p_case_id,
    'CLINICIAN',
    v_user_id,
    'STATUS_TRANSITION',
    'Case transitioned to ' || p_target_status::text,
    coalesce(p_rationale, 'State transitioned from ' || v_current_status::text || ' to ' || p_target_status::text),
    now()
  );

  -- 7. Insert immutable security & compliance audit event
  insert into public.audit_events (
    organization_id,
    actor_user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    created_at
  ) values (
    v_org_id,
    v_user_id,
    'CASE_STATE_TRANSITION',
    'case',
    p_case_id,
    jsonb_build_object('status', v_current_status),
    jsonb_build_object('status', p_target_status, 'rationale', p_rationale),
    now()
  );

  return v_case;
end;
$$;

-- ----------------------------------------------------------
-- 4. Seed Canonical Demonstration Cases (Section 21)
-- ----------------------------------------------------------
-- Seed counter initialized for demo organization
insert into public.organization_counters (organization_id, case_counter)
values ('c0000001-0000-0000-0000-000000000001', 10003)
on conflict (organization_id) do update set case_counter = 10003;

-- Patient P-001 (Arthur Pendleton) has Encounter 1 and Case A (CASE-10001)
insert into public.cases (
  id,
  organization_id,
  patient_id,
  encounter_id,
  case_number,
  title,
  status,
  priority,
  opened_at,
  created_by
) values
  -- Case A: Active Investigation (ANALYZING)
  (
    '00000000-0000-0000-0000-000000010001',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000001',
    'f0000001-0000-0000-0000-000000000001',
    'CASE-10001',
    'Fever and respiratory symptoms [SYNTHETIC DEMO]',
    'ANALYZING',
    'HIGH',
    now() - interval '3 hours',
    'd0000001-0000-0000-0000-000000000001'
  ),
  -- Case B: Conflicting Information (CONTRADICTORY)
  (
    '00000000-0000-0000-0000-000000010002',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000002',
    'f0000001-0000-0000-0000-000000000002',
    'CASE-10002',
    'Conflicting clinical findings with discordant biomarker kinetics [SYNTHETIC DEMO]',
    'CONTRADICTORY',
    'HIGH',
    now() - interval '8 hours',
    'd0000001-0000-0000-0000-000000000001'
  ),
  -- Case C: Insufficient Information (INSUFFICIENT_DATA)
  (
    '00000000-0000-0000-0000-000000010003',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000003',
    'f0000001-0000-0000-0000-000000000003',
    'CASE-10003',
    'Incomplete clinical presentation requiring baseline panels [SYNTHETIC DEMO]',
    'INSUFFICIENT_DATA',
    'NORMAL',
    now() - interval '14 hours',
    'd0000001-0000-0000-0000-000000000001'
  )
on conflict (id) do nothing;

-- Assign Case Roles for Demo Cases
insert into public.case_members (case_id, user_id, role_name, case_role)
values
  ('00000000-0000-0000-0000-000000010001', 'd0000001-0000-0000-0000-000000000001', 'CLINICIAN', 'LEAD'),
  ('00000000-0000-0000-0000-000000010001', 'd0000001-0000-0000-0000-000000000002', 'REVIEWER', 'REVIEWER'),
  ('00000000-0000-0000-0000-000000010002', 'd0000001-0000-0000-0000-000000000001', 'CLINICIAN', 'LEAD'),
  ('00000000-0000-0000-0000-000000010003', 'd0000001-0000-0000-0000-000000000001', 'CLINICIAN', 'LEAD')
on conflict (case_id, user_id) do update set case_role = excluded.case_role;



-- ============================================================
-- 021_phase6e_clinical_intelligence.sql
-- Phase 6E: Clinical Data, Contradictions, Missing Info & FHIR Alignment
-- 1. clinical_contradictions table (First-class contradiction tracking)
-- 2. missing_information table (Explicit information gap tracking)
-- 3. RLS policies and indexes for contradictions and missing information
-- ============================================================

-- ----------------------------------------------------------
-- 1. Clinical Contradictions Table (Section 14 & 25)
-- First-class clinical entity surfacing inconsistencies (e.g. SpO2 91% vs 98%)
-- ----------------------------------------------------------
create table if not exists public.clinical_contradictions (
  id              uuid        primary key default gen_random_uuid(),
  case_id         uuid        not null references public.cases(id) on delete cascade,
  finding_a_id    uuid        references public.clinical_findings(id) on delete set null,
  finding_b_id    uuid        references public.clinical_findings(id) on delete set null,
  observation_a_id uuid       references public.observations(id) on delete set null,
  observation_b_id uuid       references public.observations(id) on delete set null,
  description     text        not null,
  severity        public.safety_severity not null default 'ATTENTION',
  status          text        not null default 'OPEN', -- 'OPEN', 'RECONCILED', 'DISMISSED'
  detected_by     text        not null default 'NEXUS_CONTRADICTION_DETECTOR',
  resolved_by     uuid        references public.profiles(id),
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz not null default now()
);

comment on table public.clinical_contradictions is
  'First-class tracking of clinical and laboratory discrepancies requiring clinician reconciliation.';

-- ----------------------------------------------------------
-- 2. Missing Information Table (Section 15 & 25)
-- Structured clinical information gaps identified by Nexus reasoning
-- ----------------------------------------------------------
create table if not exists public.missing_information (
  id              uuid        primary key default gen_random_uuid(),
  case_id         uuid        not null references public.cases(id) on delete cascade,
  description     text        not null,
  importance      text        not null default 'MODERATE', -- 'LOW', 'MODERATE', 'HIGH'
  status          text        not null default 'OPEN',     -- 'OPEN', 'ADDRESSED', 'DISMISSED'
  investigation_id uuid       references public.investigations(id) on delete set null,
  addressed_at    timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.missing_information is
  'Clinical data gaps identified as necessary to evaluate candidate hypotheses.';

-- ----------------------------------------------------------
-- 3. Critical Indexes
-- ----------------------------------------------------------
create index if not exists idx_contradictions_case on public.clinical_contradictions(case_id);
create index if not exists idx_contradictions_status on public.clinical_contradictions(case_id, status);
create index if not exists idx_missing_info_case on public.missing_information(case_id);
create index if not exists idx_missing_info_status on public.missing_information(case_id, status);

-- ----------------------------------------------------------
-- 4. Row Level Security
-- ----------------------------------------------------------
alter table public.clinical_contradictions enable row level security;
alter table public.missing_information enable row level security;

revoke all on public.clinical_contradictions from anon;
revoke all on public.missing_information from anon;

grant select, insert, update on public.clinical_contradictions to authenticated;
grant select, insert, update on public.missing_information to authenticated;

-- Contradictions access scoped through case authorization
create policy "authorized users view contradictions"
  on public.clinical_contradictions for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = clinical_contradictions.case_id
        and (public.is_case_member(c.id) or public.authorize('case.view', c.organization_id))
    )
  );

create policy "authorized users manage contradictions"
  on public.clinical_contradictions for update to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = clinical_contradictions.case_id
        and (public.is_case_member(c.id) or public.authorize('case.edit', c.organization_id))
    )
  );

-- Missing information access scoped through case authorization
create policy "authorized users view missing information"
  on public.missing_information for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = missing_information.case_id
        and (public.is_case_member(c.id) or public.authorize('case.view', c.organization_id))
    )
  );

create policy "authorized users manage missing information"
  on public.missing_information for update to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = missing_information.case_id
        and (public.is_case_member(c.id) or public.authorize('case.edit', c.organization_id))
    )
  );

-- ----------------------------------------------------------
-- 5. Seed Demonstration Contradictions & Missing Info
-- ----------------------------------------------------------
insert into public.clinical_contradictions (
  id,
  case_id,
  description,
  severity,
  status,
  detected_by
) values
  (
    '80000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Normal baseline leukocyte count from prior outpatient record vs acute leukocytosis (WBC 16.8 x 10^9/L) on current admission.',
    'ATTENTION',
    'OPEN',
    'Nexus Contradiction Detector v2.4'
  ),
  (
    '80000001-0000-0000-0000-000000010002',
    '00000000-0000-0000-0000-000000010002',
    'Discordant cardiac biomarker kinetics: High-sensitivity Troponin T plateaued while CK-MB index normalized at 4-hour interval.',
    'URGENT_REVIEW',
    'OPEN',
    'Nexus Contradiction Detector v2.4'
  )
on conflict (id) do nothing;

insert into public.missing_information (
  id,
  case_id,
  description,
  importance,
  status
) values
  (
    '90000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Serum (1,3)-beta-D-glucan and Aspergillus galactomannan antigen assays to differentiate bacterial versus opportunistic fungal pneumonia.',
    'HIGH',
    'OPEN'
  ),
  (
    '90000001-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Induced sputum microbiological culture and Pneumocystis immunofluorescence PCR.',
    'HIGH',
    'OPEN'
  )
on conflict (id) do nothing;



-- ============================================================
-- 022_phase6f_intelligence_pipeline.sql
-- Phase 6F: Nexus Intelligence Pipeline, Reasoning Scopes, Grounding & Review
-- 1. Extend nexus_assessments with pipeline versioning, context snapshots & safety boundaries
-- 2. Create reasoning_scopes table for deterministic query guardrails
-- 3. Create nexus_assessment_sources table for traceable evidence citation
-- 4. Create hypothesis_finding_relationships table (SUPPORTS / CONTRADICTS / CONTEXTUALIZES)
-- 5. RLS policies ensuring strict multi-tenant clinical data isolation
-- ============================================================

-- ----------------------------------------------------------
-- 0. Compatibility projection: organization_memberships view
-- ----------------------------------------------------------
create or replace view public.organization_memberships as
select
  id,
  organization_id,
  user_id,
  user_id as profile_id,
  role,
  role_name,
  is_active,
  case when is_active then 'ACTIVE' else 'INACTIVE' end as status,
  joined_at,
  joined_at as created_at
from public.organization_members;

grant select on public.organization_memberships to authenticated, anon;

-- ----------------------------------------------------------
-- 1. Extend nexus_assessments with Phase 6F Governance Attributes
-- ----------------------------------------------------------
alter table public.nexus_assessments
  add column if not exists context_snapshot jsonb,
  add column if not exists prompt_version text default '6F.1',
  add column if not exists pipeline_version text default '2026.1',
  add column if not exists safety_boundary text not null default 'OK',
  add column if not exists safety_boundary_reason text,
  add column if not exists superseded_by_id uuid references public.nexus_assessments(id) on delete set null;

comment on column public.nexus_assessments.context_snapshot is
  'Immutable snapshot of verified clinical context passed into the reasoning engine at inference time.';
comment on column public.nexus_assessments.superseded_by_id is
  'Links to the superseding assessment when a new analysis is triggered. Prior assessments are never overwritten.';

-- ----------------------------------------------------------
-- 2. Reasoning Scopes Table (Section 34)
-- Enforces query boundaries and prohibited outputs (guardrails)
-- ----------------------------------------------------------
create table if not exists public.reasoning_scopes (
  id                  uuid        primary key default gen_random_uuid(),
  purpose             text        not null unique, -- 'CASE_REVIEW', 'EVIDENCE_REVIEW', 'SUMMARY', 'CONTRADICTION_REVIEW', 'MISSING_INFORMATION', 'HYPOTHESIS_REVIEW'
  description         text        not null,
  allowed_outputs     text[]      not null default '{}',
  prohibited_outputs  text[]      not null default '{}',
  is_active           boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.reasoning_scopes is
  'Defines strict clinical scope boundaries and disallowed autonomous actions for reasoning pipelines.';

-- Seed default clinical scopes
insert into public.reasoning_scopes (purpose, description, allowed_outputs, prohibited_outputs)
values
  ('CASE_REVIEW', 'General case overview and clinical synthesis', 
   array['Clinical summary', 'Timeline correlation', 'Risk categorization'], 
   array['Autonomous diagnosis', 'Medication prescription', 'Autonomous order dispatch']),
  ('HYPOTHESIS_REVIEW', 'Candidate hypothesis evaluation against clinical findings', 
   array['Candidate status', 'Supporting findings', 'Contradicting findings', 'Evidence citations'], 
   array['Probabilistic diagnostic scores', 'Definitive disease confirmation']),
  ('CONTRADICTION_REVIEW', 'Reconciliation of conflicting findings or vital signs', 
   array['Clinical tension explanation', 'Measurement timing analysis', 'Reconciliation recommendations'], 
   array['Silent dismissal of contradictory findings']),
  ('MISSING_INFORMATION', 'Identification of clinical information gaps', 
   array['Diagnostic test recommendations', 'Missing clinical parameters', 'Sensitivity guidance'], 
   array['Unbounded speculative workups'])
on conflict (purpose) do nothing;

-- ----------------------------------------------------------
-- 3. Nexus Assessment Evidence Sources Table (Section 35)
-- Explicit link table for evidence traceability
-- ----------------------------------------------------------
create table if not exists public.nexus_assessment_sources (
  id                  uuid        primary key default gen_random_uuid(),
  assessment_id       uuid        not null references public.nexus_assessments(id) on delete cascade,
  evidence_source_id  uuid        references public.evidence_sources(id) on delete cascade,
  retrieval_rank      integer     not null default 1,
  relevance_score     numeric(4,3),
  created_at          timestamptz not null default now()
);

comment on table public.nexus_assessment_sources is
  'Grounded evidence sources retrieved and utilized for a specific Nexus clinical assessment.';

-- ----------------------------------------------------------
-- 4. Hypothesis-Finding Relationships Table (Section 36)
-- Explicit link table: SUPPORTS, CONTRADICTS, CONTEXTUALIZES
-- ----------------------------------------------------------
create table if not exists public.hypothesis_finding_relationships (
  id              uuid        primary key default gen_random_uuid(),
  hypothesis_id   uuid        not null references public.hypotheses(id) on delete cascade,
  finding_id      uuid        not null references public.clinical_findings(id) on delete cascade,
  relationship    text        not null check (relationship in ('SUPPORTS', 'CONTRADICTS', 'CONTEXTUALIZES')),
  rationale       text,
  created_at      timestamptz not null default now(),
  constraint uq_hyp_finding unique (hypothesis_id, finding_id)
);

comment on table public.hypothesis_finding_relationships is
  'Formalized relational mapping between candidate hypotheses and supporting/contradicting findings.';

-- ----------------------------------------------------------
-- 5. Indexes
-- ----------------------------------------------------------
create index if not exists idx_assessment_sources_assessment on public.nexus_assessment_sources(assessment_id);
create index if not exists idx_assessment_sources_evidence on public.nexus_assessment_sources(evidence_source_id);
create index if not exists idx_hyp_finding_rel_hyp on public.hypothesis_finding_relationships(hypothesis_id);
create index if not exists idx_hyp_finding_rel_finding on public.hypothesis_finding_relationships(finding_id);
create index if not exists idx_assessments_superseded on public.nexus_assessments(superseded_by_id);

-- ----------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ----------------------------------------------------------
alter table public.reasoning_scopes enable row level security;
alter table public.nexus_assessment_sources enable row level security;
alter table public.hypothesis_finding_relationships enable row level security;

-- Reasoning scopes: readable by all authenticated users
create policy "reasoning_scopes_select_authenticated"
  on public.reasoning_scopes
  for select
  to authenticated
  using (true);

-- Assessment sources: inherit case tenant access via nexus_assessments -> cases
create policy "assessment_sources_select_org_members"
  on public.nexus_assessment_sources
  for select
  to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_assessment_sources.assessment_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

create policy "assessment_sources_insert_clinicians"
  on public.nexus_assessment_sources
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_assessment_sources.assessment_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- Hypothesis-Finding relationships: inherit case tenant access via hypotheses -> cases
create policy "hyp_finding_rel_select_org_members"
  on public.hypothesis_finding_relationships
  for select
  to authenticated
  using (
    exists (
      select 1 from public.hypotheses h
      join public.cases c on c.id = h.case_id
      where h.id = hypothesis_finding_relationships.hypothesis_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

create policy "hyp_finding_rel_manage_clinicians"
  on public.hypothesis_finding_relationships
  for all
  to authenticated
  using (
    exists (
      select 1 from public.hypotheses h
      join public.cases c on c.id = h.case_id
      where h.id = hypothesis_finding_relationships.hypothesis_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );



-- ============================================================
-- 023_phase6g_review_decision_safety.sql
-- Phase 6G: Review, Decisions, Safety & Clinical Workflow
-- 1. decisions table with amended_from self-referential chain & immutability trigger
-- 2. safety_concerns table with structured severity & lifecycle
-- 3. reviews table (adjudication audit log: Accept / Edit / Reject)
-- 4. tasks table for clinical workflow duties
-- 5. audit_events append-only clinical governance log
-- 6. Strict RLS policies and indexes
-- ============================================================

-- ----------------------------------------------------------
-- 1. Decisions Table (Section 10, 11, 12)
-- Decisions are immutable. Amendments link via amended_from.
-- ----------------------------------------------------------
create table if not exists public.decisions (
  id                          uuid        primary key default gen_random_uuid(),
  case_id                     uuid        not null references public.cases(id) on delete cascade,
  decision_type               text        not null check (decision_type in (
                                            'CLINICAL_ASSESSMENT',
                                            'INVESTIGATION_PLAN',
                                            'FOLLOW_UP',
                                            'REFERRAL',
                                            'CASE_RESOLUTION',
                                            'OTHER'
                                          )),
  summary                     text        not null,
  rationale                   text,
  recorded_by                 uuid        not null references public.profiles(id),
  status                      text        not null default 'ACTIVE' check (status in ('ACTIVE', 'AMENDED', 'VOID')),
  recorded_at                 timestamptz not null default now(),
  amended_from                uuid        references public.decisions(id) on delete set null,
  amendment_reason            text,
  related_assessment_id       uuid        references public.nexus_assessments(id) on delete set null,
  legal_disclaimer_acknowledged boolean   not null default true
);

alter table public.decisions
  add column if not exists amendment_reason text,
  add column if not exists related_assessment_id uuid references public.nexus_assessments(id) on delete set null,
  add column if not exists legal_disclaimer_acknowledged boolean not null default true;

comment on table public.decisions is
  'Official clinician-owned decisions. Immutable record: amendments create a linked chain.';

-- Trigger enforcing Decision Immutability: Summary and rationale cannot be modified in-place
create or replace function public.enforce_decision_immutability()
returns trigger as $$
begin
  if old.status = 'ACTIVE' and (new.summary <> old.summary or new.rationale <> old.rationale) then
    raise exception 'Clinical decisions are immutable. To modify a decision, record an amendment linked via amended_from.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_decision_immutability on public.decisions;
create trigger trg_decision_immutability
  before update on public.decisions
  for each row
  execute function public.enforce_decision_immutability();

-- ----------------------------------------------------------
-- 2. Safety Concerns Table (Section 13, 14, 15, 16, 17)
-- First-class structured safety issues with non-transient lifecycle
-- ----------------------------------------------------------
create table if not exists public.safety_concerns (
  id                  uuid        primary key default gen_random_uuid(),
  case_id             uuid        not null references public.cases(id) on delete cascade,
  severity            text        not null check (severity in (
                                    'INFORMATION',
                                    'ATTENTION',
                                    'URGENT_REVIEW',
                                    'SAFETY_CRITICAL'
                                  )),
  category            text        not null,
  description         text        not null,
  trigger_source      text        not null check (trigger_source in ('SYSTEM', 'NEXUS', 'CLINICIAN', 'INVESTIGATION')),
  recommended_action  text,
  status              text        not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  created_at          timestamptz not null default now(),
  acknowledged_by     uuid        references public.profiles(id),
  acknowledged_at     timestamptz,
  resolved_by         uuid        references public.profiles(id),
  resolved_at         timestamptz,
  clinical_notes      text
);

alter table public.safety_concerns
  add column if not exists clinical_notes text;

comment on table public.safety_concerns is
  'Structured safety hazards and contraindication alerts. Resolved concerns are never deleted.';

-- ----------------------------------------------------------
-- 3. Reviews Table (Section 4, 5, 6, 7, 8)
-- Audit record of human adjudication (Accept / Edit / Reject)
-- ----------------------------------------------------------
create table if not exists public.reviews (
  id                  uuid        primary key default gen_random_uuid(),
  case_id             uuid        not null references public.cases(id) on delete cascade,
  assessment_id       uuid        references public.nexus_assessments(id) on delete set null,
  finding_id          uuid        references public.clinical_findings(id) on delete set null,
  reviewer_id         uuid        not null references public.profiles(id),
  action              text        not null check (action in ('ACCEPT', 'EDIT', 'REJECT')),
  original_content    text        not null,
  revised_content     text,
  reason_category     text,
  reason              text,
  reviewed_at         timestamptz not null default now()
);

alter table public.reviews
  add column if not exists case_id uuid references public.cases(id) on delete cascade,
  add column if not exists finding_id uuid references public.clinical_findings(id) on delete set null,
  add column if not exists reason_category text;

comment on table public.reviews is
  'Traceable audit trail of clinician review actions on AI and diagnostic outputs.';

-- ----------------------------------------------------------
-- 4. Tasks Table (Section 18, 19)
-- Clinical tasks generated by reviews, safety, and follow-ups
-- ----------------------------------------------------------
create table if not exists public.tasks (
  id                  uuid        primary key default gen_random_uuid(),
  case_id             uuid        references public.cases(id) on delete cascade,
  assigned_to         uuid        references public.profiles(id) on delete set null,
  title               text        not null,
  description         text,
  status              text        not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  priority            text        not null default 'ROUTINE' check (priority in ('ROUTINE', 'HIGH', 'URGENT')),
  due_at              timestamptz,
  created_by          uuid        references public.profiles(id),
  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  completed_by        uuid        references public.profiles(id)
);

alter table public.tasks
  add column if not exists completed_by uuid references public.profiles(id);

comment on table public.tasks is
  'Clinical workflow duties and investigation follow-ups.';

-- ----------------------------------------------------------
-- 5. Audit Events Table (Section 26)
-- Append-only clinical governance log
-- ----------------------------------------------------------
create table if not exists public.audit_events (
  id                  uuid        primary key default gen_random_uuid(),
  actor_user_id       uuid        references public.profiles(id),
  action              text        not null,
  resource_type       text        not null,
  resource_id         text        not null,
  old_values          jsonb,
  new_values          jsonb,
  created_at          timestamptz not null default now()
);

comment on table public.audit_events is
  'Immutable, append-only log of all clinical governance actions and state transitions.';

-- Trigger preventing deletion or updates in audit_events
create or replace function public.enforce_audit_append_only()
returns trigger as $$
begin
  raise exception 'audit_events table is strictly append-only. Modification and deletion are prohibited.';
end;
$$ language plpgsql;

drop trigger if exists trg_audit_append_only on public.audit_events;
create trigger trg_audit_append_only
  before update or delete on public.audit_events
  for each row
  execute function public.enforce_audit_append_only();

-- ----------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------
create index if not exists idx_decisions_case on public.decisions(case_id);
create index if not exists idx_decisions_status on public.decisions(case_id, status);
create index if not exists idx_decisions_amended on public.decisions(amended_from);
create index if not exists idx_safety_concerns_case on public.safety_concerns(case_id);
create index if not exists idx_safety_concerns_severity on public.safety_concerns(case_id, severity, status);
create index if not exists idx_reviews_case on public.reviews(case_id);
create index if not exists idx_reviews_assessment on public.reviews(assessment_id);
create index if not exists idx_tasks_case on public.tasks(case_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to, status);
create index if not exists idx_audit_resource on public.audit_events(resource_type, resource_id);

-- ----------------------------------------------------------
-- 7. Row Level Security (RLS)
-- ----------------------------------------------------------
alter table public.decisions enable row level security;
alter table public.safety_concerns enable row level security;
alter table public.reviews enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_events enable row level security;

-- Decisions policies: tenant-isolated via case
create policy "decisions_select_org_members"
  on public.decisions for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = decisions.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

create policy "decisions_insert_clinicians"
  on public.decisions for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = decisions.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- Safety concerns policies
create policy "safety_concerns_select_org_members"
  on public.safety_concerns for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = safety_concerns.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

create policy "safety_concerns_modify_clinicians"
  on public.safety_concerns for all to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = safety_concerns.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- Reviews policies
create policy "reviews_select_org_members"
  on public.reviews for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = reviews.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

create policy "reviews_insert_reviewers"
  on public.reviews for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = reviews.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- Tasks policies
create policy "tasks_select_org_members"
  on public.tasks for select to authenticated
  using (
    case_id is null or exists (
      select 1 from public.cases c
      where c.id = tasks.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

create policy "tasks_manage_org_members"
  on public.tasks for all to authenticated
  using (
    case_id is null or exists (
      select 1 from public.cases c
      where c.id = tasks.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- Audit events policies: readable by org auditors/admins; insert only
create policy "audit_events_select_authorized"
  on public.audit_events for select to authenticated
  using (true);

create policy "audit_events_insert_authenticated"
  on public.audit_events for insert to authenticated
  with check (true);



-- ============================================================
-- 024_phase6h_interoperability.sql
-- Phase 6H: Interoperability, Documents & External Data
--
-- Core principle: Every clinical datum must carry its origin.
-- FHIR R4 mappings are stored alongside native Nexus IDs so
-- that records can always be round-tripped through an HL7 FHIR
-- server without loss of clinical meaning.
--
-- WHO SMART / FHIR R4 alignment:
--   fhir_resource_maps  → tracks every Nexus↔FHIR ID binding
--   external_sources    → authoritative catalogue of external systems
--   import_events       → structured intake log (provenance chain)
--   clinical_documents  → rich, typed document intake (replaces 014)
--   fhir_export_bundles → generated FHIR Bundles ready for export
-- ============================================================

-- ----------------------------------------------------------
-- 1. External Sources Registry
-- Authoritative catalogue of every external system Nexus
-- connects to. Each record carries the trust level and the
-- integration protocol so operators can review data lineage.
-- ----------------------------------------------------------
create table if not exists public.external_sources (
  id                uuid        primary key default gen_random_uuid(),
  organization_id   uuid        not null references public.organizations(id) on delete cascade,
  name              text        not null,
  system_type       text        not null check (system_type in (
                                  'EHR', 'LIS', 'RIS', 'PACS', 'DEVICE',
                                  'PHARMACY', 'REGISTRY', 'RESEARCH_DB',
                                  'MANUAL_UPLOAD', 'OTHER'
                                )),
  protocol          text        not null default 'MANUAL' check (protocol in (
                                  'FHIR_R4', 'HL7_V2', 'DICOM',
                                  'CSV', 'PDF', 'MANUAL', 'API', 'OTHER'
                                )),
  base_url          text,
  trust_level       text        not null default 'STANDARD' check (trust_level in (
                                  'AUTHORITATIVE', 'STANDARD', 'SUPPLEMENTARY', 'UNVERIFIED'
                                )),
  is_active         boolean     not null default true,
  created_by        uuid        references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.external_sources is
  'Registry of all external clinical systems that feed data into Nexus. '
  'Each record carries protocol, trust level, and FHIR endpoint for provenance and interoperability.';

-- ----------------------------------------------------------
-- 2. Import Events Table
-- Structured intake log for every batch of data arriving from
-- an external source. Individual records reference their
-- import event for a complete provenance chain.
-- ----------------------------------------------------------
create table if not exists public.import_events (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete cascade,
  external_source_id  uuid        references public.external_sources(id) on delete set null,
  case_id             uuid        references public.cases(id) on delete set null,
  patient_id          uuid        references public.patients(id) on delete set null,
  import_type         text        not null check (import_type in (
                                    'FHIR_BUNDLE', 'HL7_MESSAGE', 'DOCUMENT_UPLOAD',
                                    'OBSERVATION_BATCH', 'LAB_RESULT_BATCH',
                                    'IMAGING_REPORT', 'MANUAL_ENTRY', 'OTHER'
                                  )),
  status              text        not null default 'PENDING' check (status in (
                                    'PENDING', 'PROCESSING', 'COMPLETED',
                                    'PARTIAL', 'FAILED', 'REJECTED'
                                  )),
  records_received    integer     not null default 0,
  records_imported    integer     not null default 0,
  records_failed      integer     not null default 0,
  raw_payload         jsonb,
  error_log           text[],
  reviewed_by         uuid        references public.profiles(id),
  reviewed_at         timestamptz,
  imported_by         uuid        references public.profiles(id),
  imported_at         timestamptz not null default now(),
  notes               text
);

comment on table public.import_events is
  'Structured log of every external data intake event. '
  'Preserves raw payload, record counts, and clinician review for FHIR/HL7 audit trails.';

-- ----------------------------------------------------------
-- 3. Clinical Documents Table (enhanced, supersedes 014)
-- Rich, typed document intake for the full lifecycle:
-- intake → classification → extraction → attestation → FHIR.
-- FHIR R4 alignment: DocumentReference + Composition resources
-- ----------------------------------------------------------
create table if not exists public.clinical_documents (
  id                    uuid        primary key default gen_random_uuid(),
  organization_id       uuid        not null references public.organizations(id) on delete restrict,
  case_id               uuid        references public.cases(id) on delete cascade,
  patient_id            uuid        references public.patients(id) on delete set null,
  import_event_id       uuid        references public.import_events(id) on delete set null,

  -- Classification
  document_class        text        not null check (document_class in (
                                      'DISCHARGE_SUMMARY', 'REFERRAL_LETTER',
                                      'CONSULTATION_NOTE', 'LAB_REPORT',
                                      'IMAGING_REPORT', 'PATHOLOGY_REPORT',
                                      'OPERATIVE_NOTE', 'NURSING_NOTE',
                                      'PRESCRIPTION', 'CONSENT_FORM',
                                      'ADVANCE_DIRECTIVE', 'CORRESPONDENCE',
                                      'EXTERNAL_RECORD', 'OTHER'
                                    )),
  document_status       text        not null default 'RECEIVED' check (document_status in (
                                      'RECEIVED', 'PROCESSING', 'REVIEWED',
                                      'ATTESTED', 'SUPERSEDED', 'REJECTED'
                                    )),

  -- Core content
  title                 text        not null,
  description           text,
  source_facility       text,
  authored_by           text,
  authored_at           timestamptz,
  received_at           timestamptz not null default now(),

  -- Storage
  storage_path          text,
  storage_bucket        text        not null default 'clinical-documents',
  file_name             text,
  mime_type             text,
  file_size_bytes       bigint,

  -- Extracted structured content
  extracted_findings    jsonb,
  extracted_diagnoses   jsonb,
  extracted_medications jsonb,
  extracted_at          timestamptz,
  extracted_by_model    text,

  -- Clinician attestation
  attested_by           uuid        references public.profiles(id),
  attested_at           timestamptz,
  attestation_note      text,

  -- FHIR linkage
  fhir_document_reference_id   text,
  fhir_composition_id          text,

  -- External source
  external_source_id    uuid        references public.external_sources(id) on delete set null,
  external_document_id  text,

  uploaded_by           uuid        references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.clinical_documents is
  'Rich clinical document intake with full lifecycle: receive → classify → extract → attest. '
  'Aligned with FHIR R4 DocumentReference and Composition resources.';

-- ----------------------------------------------------------
-- 4. FHIR Resource Maps
-- Bidirectional index linking every Nexus domain object to
-- its corresponding FHIR resource on external servers.
-- FHIR R4 alignment: Patient, Observation, DiagnosticReport,
--   Condition, Procedure, MedicationRequest, Provenance
-- ----------------------------------------------------------
create table if not exists public.fhir_resource_maps (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete cascade,

  -- Nexus side
  nexus_resource_type text        not null check (nexus_resource_type in (
                                    'PATIENT', 'ENCOUNTER', 'CASE',
                                    'OBSERVATION', 'FINDING', 'INVESTIGATION',
                                    'DIAGNOSTIC_REPORT', 'HYPOTHESIS', 'DECISION',
                                    'DOCUMENT', 'SAFETY_CONCERN', 'PROVENANCE'
                                  )),
  nexus_resource_id   uuid        not null,

  -- FHIR side
  fhir_resource_type  text        not null,
  fhir_resource_id    text        not null,
  fhir_version_id     text,
  fhir_server_url     text,
  fhir_last_updated   timestamptz,

  -- Sync metadata
  sync_direction      text        not null default 'EXPORT' check (sync_direction in (
                                    'EXPORT', 'IMPORT', 'BIDIRECT'
                                  )),
  last_synced_at      timestamptz,
  sync_status         text        not null default 'PENDING' check (sync_status in (
                                    'PENDING', 'SYNCED', 'CONFLICT', 'ERROR'
                                  )),
  sync_error          text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (nexus_resource_type, nexus_resource_id, fhir_server_url)
);

comment on table public.fhir_resource_maps is
  'Bidirectional FHIR resource identity map. Links every Nexus domain object '
  'to its corresponding FHIR resource on external servers.';

-- ----------------------------------------------------------
-- 5. FHIR Export Bundles
-- Immutable point-in-time FHIR R4 Bundle snapshots generated
-- for transfer, referral, registry submission, or audit.
-- FHIR R4 alignment: Bundle resource (transaction, document)
-- ----------------------------------------------------------
create table if not exists public.fhir_export_bundles (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete restrict,
  case_id             uuid        references public.cases(id) on delete set null,
  patient_id          uuid        references public.patients(id) on delete set null,

  bundle_type         text        not null check (bundle_type in (
                                    'TRANSACTION', 'DOCUMENT', 'COLLECTION',
                                    'HISTORY', 'SEARCHSET'
                                  )),
  purpose             text        not null check (purpose in (
                                    'TRANSFER_OF_CARE', 'REFERRAL', 'RESEARCH_EXPORT',
                                    'AUDIT_DISCLOSURE', 'PATIENT_REQUEST',
                                    'REGISTRY_SUBMISSION', 'INTERNAL_SYNC', 'OTHER'
                                  )),

  recipient_name      text,
  recipient_fhir_url  text,

  fhir_bundle         jsonb       not null,
  resource_count      integer     not null default 0,
  fhir_version        text        not null default 'R4',

  status              text        not null default 'DRAFT' check (status in (
                                    'DRAFT', 'READY', 'TRANSMITTED',
                                    'ACKNOWLEDGED', 'FAILED'
                                  )),
  generated_by        uuid        references public.profiles(id),
  generated_at        timestamptz not null default now(),
  transmitted_at      timestamptz,
  acknowledged_at     timestamptz,
  error_message       text
);

comment on table public.fhir_export_bundles is
  'Immutable FHIR R4 Bundle export records. Each bundle is a point-in-time '
  'clinical data snapshot for transfer, referral, or registry submission.';

-- ----------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------
create index if not exists idx_external_sources_org       on public.external_sources(organization_id);
create index if not exists idx_import_events_org          on public.import_events(organization_id);
create index if not exists idx_import_events_case         on public.import_events(case_id);
create index if not exists idx_import_events_patient      on public.import_events(patient_id);
create index if not exists idx_import_events_status       on public.import_events(status, organization_id);
create index if not exists idx_clinical_docs_case         on public.clinical_documents(case_id);
create index if not exists idx_clinical_docs_patient      on public.clinical_documents(patient_id);
create index if not exists idx_clinical_docs_class        on public.clinical_documents(organization_id, document_class);
create index if not exists idx_clinical_docs_status       on public.clinical_documents(document_status, case_id);
create index if not exists idx_fhir_maps_nexus            on public.fhir_resource_maps(nexus_resource_type, nexus_resource_id);
create index if not exists idx_fhir_maps_fhir             on public.fhir_resource_maps(fhir_resource_type, fhir_resource_id);
create index if not exists idx_fhir_maps_org              on public.fhir_resource_maps(organization_id);
create index if not exists idx_fhir_bundles_case          on public.fhir_export_bundles(case_id);
create index if not exists idx_fhir_bundles_org           on public.fhir_export_bundles(organization_id, status);

-- ----------------------------------------------------------
-- 7. Row Level Security
-- ----------------------------------------------------------
alter table public.external_sources     enable row level security;
alter table public.import_events        enable row level security;
alter table public.clinical_documents   enable row level security;
alter table public.fhir_resource_maps   enable row level security;
alter table public.fhir_export_bundles  enable row level security;

-- External sources
create policy "external_sources_select_org"
  on public.external_sources for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "external_sources_manage_admin"
  on public.external_sources for all to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
        and role in ('organization_admin', 'platform_admin')
    )
  );

-- Import events
create policy "import_events_select_org"
  on public.import_events for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "import_events_insert_org"
  on public.import_events for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "import_events_update_org"
  on public.import_events for update to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

-- Clinical documents
create policy "clinical_documents_select_org"
  on public.clinical_documents for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "clinical_documents_insert_org"
  on public.clinical_documents for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "clinical_documents_update_org"
  on public.clinical_documents for update to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

-- FHIR resource maps
create policy "fhir_maps_select_org"
  on public.fhir_resource_maps for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "fhir_maps_insert_org"
  on public.fhir_resource_maps for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

-- FHIR export bundles
create policy "fhir_bundles_select_org"
  on public.fhir_export_bundles for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "fhir_bundles_insert_org"
  on public.fhir_export_bundles for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "fhir_bundles_update_org"
  on public.fhir_export_bundles for update to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );



-- ============================================================
-- 025_phase8_org_fhir_config.sql
-- Phase 8: Multi-tenant Organisation Model
--
-- New tables:
--   organization_fhir_configs  — per-org FHIR endpoint registry
--   organization_invitations   — pending member invitation records
--
-- Design principles:
--   • All tables scoped to organization_id — strict tenancy isolation
--   • RLS enforces organization.manage for writes, case.view for reads
--   • No clinical data — no PHI/PII in these tables beyond email addresses
--   • Audit events written on every mutation (trigger pattern below)
-- ============================================================

-- ----------------------------------------------------------
-- 1. Organisation FHIR Endpoint Registry
-- Per-org catalogue of external system connections.
-- ARCHITECTURE §10: FHIR translation occurs ONLY at this boundary.
-- The internal domain model is FHIR-free.
-- ----------------------------------------------------------

create table if not exists public.organization_fhir_configs (
  id                    uuid          primary key default gen_random_uuid(),
  organization_id       uuid          not null references public.organizations(id) on delete cascade,

  -- Human-readable display name
  name                  text          not null,

  -- External system classification
  system_type           text          not null check (system_type in (
                                        'EHR', 'LIS', 'RIS', 'PACS', 'DEVICE',
                                        'PHARMACY', 'REGISTRY', 'RESEARCH_DB',
                                        'MANUAL_UPLOAD', 'OTHER'
                                      )),

  -- Integration protocol
  protocol              text          not null default 'FHIR_R4' check (protocol in (
                                        'FHIR_R4', 'HL7_V2', 'DICOM',
                                        'CSV', 'PDF', 'MANUAL', 'API', 'OTHER'
                                      )),

  -- FHIR R4 base URL or HL7 endpoint — nullable for MANUAL
  base_url              text,

  -- Trust level determines whether imported data can progress a case
  -- without explicit clinician review (ARCHITECTURE §9, Provenance Badge Rules)
  trust_level           text          not null default 'STANDARD' check (trust_level in (
                                        'AUTHORITATIVE', 'STANDARD', 'SUPPLEMENTARY', 'UNVERIFIED'
                                      )),

  -- Soft delete — never hard-delete a registered endpoint (audit trail)
  is_active             boolean       not null default true,

  -- Circuit breaker state (updated by integration-sync edge function)
  -- ARCHITECTURE §10 Retry and Circuit Breaker Parameters
  circuit_breaker_status text         not null default 'CLOSED' check (circuit_breaker_status in (
                                        'CLOSED', 'OPEN', 'HALF_OPEN'
                                      )),

  -- Last circuit breaker state change timestamp
  circuit_breaker_updated_at timestamptz,

  -- Failure count since last reset (resets on CLOSED transition)
  failure_count         integer       not null default 0,

  -- Credentials — stored as Supabase secret references ONLY.
  -- Never store actual API keys, tokens, or passwords here.
  -- The integration-sync edge function resolves these at runtime.
  secret_reference      text,        -- e.g. 'FHIR_EPIC_TOKEN' (Supabase secret name)

  created_by            uuid          references auth.users(id),
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

-- Index for org-scoped queries
create index if not exists idx_org_fhir_configs_org_id
  on public.organization_fhir_configs(organization_id);

-- Partial index for active endpoints only (common query path)
create index if not exists idx_org_fhir_configs_active
  on public.organization_fhir_configs(organization_id, system_type)
  where is_active = true;

comment on table public.organization_fhir_configs is
  'Phase 8: Per-organisation FHIR endpoint registry. '
  'FHIR R4 translation occurs ONLY at this boundary — the internal domain model is FHIR-free. '
  'Managed by organization_admin role. Credentials stored as Supabase secret references only — never inline.';

comment on column public.organization_fhir_configs.trust_level is
  'AUTHORITATIVE: imported data treated as clinician-level input. '
  'STANDARD: requires clinician review before case progression. '
  'SUPPLEMENTARY: informational only — cannot be used as primary evidence. '
  'UNVERIFIED: flagged for manual review on every import.';

comment on column public.organization_fhir_configs.circuit_breaker_status is
  'CLOSED: endpoint healthy, calls proceeding normally. '
  'OPEN: endpoint paused after failureThreshold (3) failures — 60s cooldown. '
  'HALF_OPEN: probe period — next call determines CLOSED or OPEN. '
  'See ARCHITECTURE §10 Retry and Circuit Breaker Parameters.';

-- ----------------------------------------------------------
-- 2. Organisation Invitations
-- Pending member invitation records.
-- Supabase edge function (future) sends email with a time-limited link.
-- On acceptance: org_membership row is created; invitation marked ACCEPTED.
-- ----------------------------------------------------------

create table if not exists public.organization_invitations (
  id                    uuid          primary key default gen_random_uuid(),
  organization_id       uuid          not null references public.organizations(id) on delete cascade,

  -- Invitee email — used to match on sign-up/sign-in
  email                 text          not null,

  -- Role to assign on acceptance
  role                  text          not null check (role in (
                                        'clinician', 'nurse', 'laboratory', 'reviewer',
                                        'organization_admin', 'platform_admin'
                                      )),

  -- Who created this invitation (must have user.manage permission)
  invited_by_user_id    uuid          not null references auth.users(id),

  -- Invitation lifecycle
  status                text          not null default 'PENDING' check (status in (
                                        'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'
                                      )),

  -- Invite link token — hashed using pgcrypto for storage
  -- The plaintext token is returned to the caller once and never stored
  token_hash            text          unique,

  -- Hard expiry — invitations expire after 7 days (configurable)
  expires_at            timestamptz   not null default (now() + interval '7 days'),

  -- Accepted membership — populated on acceptance
  accepted_membership_id uuid         references public.organization_members(id),
  accepted_at           timestamptz,

  -- Revocation reason (audit trail)
  revoked_reason        text,
  revoked_at            timestamptz,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

-- Unique constraint: only one PENDING invitation per email per org
create unique index if not exists idx_org_invitations_pending_unique
  on public.organization_invitations(organization_id, lower(email))
  where status = 'PENDING';

-- Index for org-scoped queries
create index if not exists idx_org_invitations_org_id
  on public.organization_invitations(organization_id, status);

comment on table public.organization_invitations is
  'Phase 8: Pending organisation membership invitations. '
  'Supabase edge function (organization-invite) generates a time-limited link, '
  'delivers it by email, and marks ACCEPTED on the first use. '
  'Token is hashed before storage — the plaintext link is never stored.';

-- ----------------------------------------------------------
-- 3. Row Level Security
--
-- Policy design for organization_fhir_configs:
--   SELECT: any active org member (case.view)
--   INSERT/UPDATE: organization.manage permission holders
--   DELETE: none — soft-delete via is_active = false only
--
-- Policy design for organization_invitations:
--   SELECT: user.manage holders (org_admin) in the same org
--   INSERT: user.manage holders
--   UPDATE: user.manage holders (revoke) + system service role (accept)
--   DELETE: none
-- ----------------------------------------------------------

alter table public.organization_fhir_configs enable row level security;
alter table public.organization_invitations enable row level security;

-- Helper: check if the current user has an active membership in the given org
-- (reuses the same pattern as existing tables)
create or replace function public.user_is_member_of(p_org_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_org_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- Helper: check if the current user has a specific role in the given org
create or replace function public.user_has_role_in_org(p_org_id uuid, p_roles text[])
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_org_id
      and user_id = auth.uid()
      and is_active = true
      and role_name = any(p_roles)
  );
$$;

-- organization_fhir_configs: SELECT — any active org member
create policy "fhir_configs_select_members"
  on public.organization_fhir_configs for select
  using (user_is_member_of(organization_id));

-- organization_fhir_configs: INSERT — organization_admin only
create policy "fhir_configs_insert_org_admin"
  on public.organization_fhir_configs for insert
  with check (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_fhir_configs: UPDATE — organization_admin only
-- (includes circuit breaker status updates — integration-sync uses service role)
create policy "fhir_configs_update_org_admin"
  on public.organization_fhir_configs for update
  using (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_fhir_configs: DELETE — blocked at policy level (use is_active = false)
-- No DELETE policy = no deletes possible

-- organization_invitations: SELECT — org_admin in same org
create policy "invitations_select_org_admin"
  on public.organization_invitations for select
  using (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_invitations: INSERT — org_admin
create policy "invitations_insert_org_admin"
  on public.organization_invitations for insert
  with check (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_invitations: UPDATE — org_admin (for revocation)
-- Acceptance is handled by service role in the edge function
create policy "invitations_update_org_admin"
  on public.organization_invitations for update
  using (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- ----------------------------------------------------------
-- 4. Auto-update timestamps trigger
-- ----------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_org_fhir_configs_updated_at
  before update on public.organization_fhir_configs
  for each row execute function public.set_updated_at();

create trigger trg_org_invitations_updated_at
  before update on public.organization_invitations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------
-- 5. Seed: Demo FHIR endpoint configs for Nexus Teaching Hospital
-- These match DEMO_FHIR_CONFIGS in AuthProvider.tsx.
-- Only inserted if the demo org exists and no configs already present.
-- ----------------------------------------------------------

do $$
declare
  v_org_id uuid := 'c0000001-0000-0000-0000-000000000001';
begin
  if exists (
    select 1 from public.organizations where id = v_org_id
  ) and not exists (
    select 1 from public.organization_fhir_configs where organization_id = v_org_id
  ) then

    insert into public.organization_fhir_configs
      (id, organization_id, name, system_type, protocol, base_url, trust_level, is_active, circuit_breaker_status, created_at)
    values
      (
        'f0000001-0000-0000-0000-000000000001'::uuid, v_org_id,
        'Epic EHR — Teaching Hospital', 'EHR', 'FHIR_R4',
        'https://epic.nexus-hospital.demo/api/FHIR/R4',
        'AUTHORITATIVE', true, 'CLOSED', '2026-01-15T08:00:00Z'
      ),
      (
        'f0000001-0000-0000-0000-000000000002'::uuid, v_org_id,
        'Mindray BeneVision — Bedside Devices', 'DEVICE', 'HL7_V2',
        'https://hl7.mindray.nexus-hospital.demo/mllp',
        'STANDARD', true, 'CLOSED', '2026-02-01T10:00:00Z'
      ),
      (
        'f0000001-0000-0000-0000-000000000003'::uuid, v_org_id,
        'LabSystems LIS — Pathology', 'LIS', 'FHIR_R4',
        'https://lis.nexus-hospital.demo/fhir/r4',
        'AUTHORITATIVE', true, 'HALF_OPEN', '2026-03-10T09:30:00Z'
      );

  end if;
end;
$$;

-- ----------------------------------------------------------
-- 6. Changelog annotation
-- ----------------------------------------------------------
comment on schema public is
  'Nexus Clinical Workstation — Phase 8 migration applied: '
  'organization_fhir_configs and organization_invitations tables added. '
  'RLS policies: org member SELECT, org_admin INSERT/UPDATE. '
  'No DELETE policy on either table — immutable record keeping.';



-- ============================================================
-- supabase/migrations/026_phase9_clinical_decision_rules.sql
-- Phase 9: Clinical Decision Rules Engine, Pharmacotherapy Dosing,
-- Drug-Drug Interactions (RxNorm), and Allergy Cross-Reactivity Schema
-- ============================================================

-- ------------------------------------------------------------
-- 1. CLINICAL DECISION RULES DEFINITIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_decision_rules (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('DIAGNOSTIC_CRITERIA', 'PROGNOSTIC_SCORE', 'SEVERITY_INDEX', 'CLINICAL_TRIGGER')),
    specialty TEXT NOT NULL,
    guideline_citation TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    evaluation_logic TEXT NOT NULL CHECK (evaluation_logic IN ('SUM_POINTS', 'MAJOR_MINOR_CRITERIA', 'THRESHOLD_MATCH')),
    criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------
-- 2. CLINICAL RULE EXECUTIONS (AUDIT LOG FOR CDS RUNS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id TEXT NOT NULL REFERENCES clinical_decision_rules(id) ON DELETE CASCADE,
    case_id TEXT,
    organization_id UUID,
    evaluated_by UUID,
    score NUMERIC,
    major_count INTEGER,
    minor_count INTEGER,
    matched_tier_label TEXT NOT NULL,
    matched_risk_severity TEXT NOT NULL CHECK (matched_risk_severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    criteria_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    clinical_summary TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_rule_exec_case ON clinical_rule_executions(case_id);
CREATE INDEX IF NOT EXISTS idx_rule_exec_org ON clinical_rule_executions(organization_id);

-- ------------------------------------------------------------
-- 3. DRUG-DRUG INTERACTIONS (RxNorm)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drug_interactions (
    id TEXT PRIMARY KEY,
    drug_a_name TEXT NOT NULL,
    drug_a_rxnorm TEXT NOT NULL,
    drug_b_name TEXT NOT NULL,
    drug_b_rxnorm TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('CONTRAINDICATED', 'MAJOR', 'MODERATE', 'MINOR')),
    mechanism TEXT NOT NULL,
    clinical_consequence TEXT NOT NULL,
    evidence_level TEXT NOT NULL CHECK (evidence_level IN ('DEFINITIVE', 'PROBABLE', 'SUSPECTED')),
    management_recommendation TEXT NOT NULL,
    guideline_reference TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ddi_rxnorm_a ON drug_interactions(drug_a_rxnorm);
CREATE INDEX IF NOT EXISTS idx_ddi_rxnorm_b ON drug_interactions(drug_b_rxnorm);

-- ------------------------------------------------------------
-- 4. ALLERGY CROSS-REACTIVITY RULES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allergy_cross_reactivities (
    id TEXT PRIMARY KEY,
    allergen_class TEXT NOT NULL,
    offending_agent TEXT NOT NULL,
    target_agent TEXT NOT NULL,
    target_drug_class TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('CONTRAINDICATED', 'HIGH_RISK', 'MODERATE_RISK', 'LOW_RISK', 'SAFE_ALTERNATIVE')),
    estimated_cross_reactivity_percent TEXT NOT NULL,
    immunological_mechanism TEXT NOT NULL,
    clinical_guidance TEXT NOT NULL,
    recommended_action TEXT NOT NULL CHECK (recommended_action IN ('AVOID', 'USE_WITH_MONITORING', 'SAFE_TO_ADMINISTER', 'SKIN_TEST_FIRST')),
    safe_alternatives TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_allergy_class ON allergy_cross_reactivities(allergen_class);

-- ------------------------------------------------------------
-- 5. PATIENT PHARMACOTHERAPY & RENAL DOSING ASSESSMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_dosing_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT,
    organization_id UUID,
    patient_id TEXT,
    drug_id TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    patient_metrics JSONB NOT NULL,
    renal_metrics JSONB NOT NULL,
    calculated_loading_dose TEXT,
    calculated_maintenance_dose TEXT NOT NULL,
    calculated_interval TEXT NOT NULL,
    monitoring_plan TEXT NOT NULL,
    safety_alerts TEXT[] NOT NULL DEFAULT '{}',
    calculated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_dosing_case ON patient_dosing_calculations(case_id);
CREATE INDEX IF NOT EXISTS idx_dosing_org ON patient_dosing_calculations(organization_id);

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE clinical_decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_cross_reactivities ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_dosing_calculations ENABLE ROW LEVEL SECURITY;

-- Knowledge base tables are globally readable by all authenticated clinicians
CREATE POLICY p9_rules_read ON clinical_decision_rules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p9_ddi_read ON drug_interactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p9_allergy_read ON allergy_cross_reactivities
    FOR SELECT TO authenticated USING (true);

-- Execution & calculation records are scoped by organization
CREATE POLICY p9_rule_exec_select ON clinical_rule_executions
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p9_rule_exec_insert ON clinical_rule_executions
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p9_dosing_select ON patient_dosing_calculations
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p9_dosing_insert ON patient_dosing_calculations
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

-- ------------------------------------------------------------
-- 7. SEED INITIAL CLINICAL DATA
-- ------------------------------------------------------------
INSERT INTO clinical_decision_rules (id, code, title, short_description, category, specialty, guideline_citation, version, evaluation_logic)
VALUES 
    ('rule-duke-endocarditis', 'DUKE_IE_2023', 'Modified Duke Criteria for Infective Endocarditis', 'Stratifies major and minor criteria for infective endocarditis.', 'DIAGNOSTIC_CRITERIA', 'Infectious Disease / Cardiology', '2023 Duke-ISCVID Criteria for Infective Endocarditis; Clin Infect Dis 2023.', '2023.1', 'MAJOR_MINOR_CRITERIA'),
    ('rule-curb-65', 'CURB_65', 'CURB-65 Score for Pneumonia Severity', 'Stratifies mortality risk in community-acquired pneumonia.', 'SEVERITY_INDEX', 'Pulmonology / Emergency Medicine', 'Lim WS, et al. Defining community acquired pneumonia severity on presentation to hospital. Thorax. 2003.', '2003.1', 'SUM_POINTS'),
    ('rule-wells-pe', 'WELLS_PE', 'Wells Criteria for Pulmonary Embolism', 'Pre-test clinical probability of pulmonary embolism.', 'PROGNOSTIC_SCORE', 'Vascular Medicine / Pulmonology / ER', 'Wells PS, et al. Thromb Haemost. 2000.', '2000.2', 'SUM_POINTS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO drug_interactions (id, drug_a_name, drug_a_rxnorm, drug_b_name, drug_b_rxnorm, severity, mechanism, clinical_consequence, evidence_level, management_recommendation, guideline_reference)
VALUES
    ('ddi-vanc-gent', 'Vancomycin', '11124', 'Gentamicin', '4734', 'MAJOR', 'Additive proximal tubular necrosis and hair cell ototoxicity.', 'Marked increase in acute kidney injury incidence and irreversible vestibulotoxicity.', 'DEFINITIVE', 'Limit synergy to 2-3 days; monitor daily serum creatinine and trough levels.', 'AHA 2015 Infective Endocarditis Guidelines; ASHP/IDSA 2020.'),
    ('ddi-warf-amiodarone', 'Warfarin', '11289', 'Amiodarone', '703', 'MAJOR', 'Inhibition of CYP2C9 and CYP1A2 by amiodarone impairing S-warfarin clearance.', 'Dramatic elevation in INR with substantial risk of life-threatening hemorrhage.', 'DEFINITIVE', 'Proactively reduce warfarin dose by 33-50% upon initiating amiodarone.', 'CHEST 2021 Antithrombotic Guidelines.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO allergy_cross_reactivities (id, allergen_class, offending_agent, target_agent, target_drug_class, risk_level, estimated_cross_reactivity_percent, immunological_mechanism, clinical_guidance, recommended_action, safe_alternatives)
VALUES
    ('allergy-pen-amox-amp', 'PENICILLIN', 'Penicillin / Amoxicillin', 'Ampicillin', 'Aminopenicillin', 'CONTRAINDICATED', '100%', 'Identical 6-APA nucleus and aminopenicillin epitopes.', 'Direct class cross-reactivity. Contraindicated in confirmed penicillin allergy.', 'AVOID', ARRAY['Vancomycin', 'Daptomycin', 'Aztreonam', 'Levofloxacin']),
    ('allergy-pen-ceph-3rd', 'PENICILLIN', 'Penicillin', 'Ceftriaxone / Cefotaxime / Cefepime', '3rd / 4th Generation Cephalosporin', 'LOW_RISK', '< 1%', 'Distinct 7-ACA core and methoxyimino R1 side chains.', 'Safe in non-severe penicillin allergy and under observation.', 'SAFE_TO_ADMINISTER', ARRAY['Ceftriaxone', 'Cefepime', 'Vancomycin', 'Aztreonam'])
ON CONFLICT (id) DO NOTHING;



-- ============================================================
-- supabase/migrations/027_phase10_advanced_interoperability.sql
-- Phase 10: Advanced Health Interoperability Database Schema
-- SMART on FHIR, CDA/C-CDA documents, IHE XDS.b, WHO SMART Guidelines, and Offline Outbox
-- ============================================================

-- ------------------------------------------------------------
-- 1. SMART ON FHIR LAUNCH SESSIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS smart_launch_sessions (
    id TEXT PRIMARY KEY,
    iss TEXT NOT NULL,
    launch_token TEXT,
    client_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    state TEXT NOT NULL,
    patient_id TEXT,
    encounter_id TEXT,
    user_id TEXT,
    fhir_version TEXT NOT NULL DEFAULT '4.0.1',
    access_token_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'AUTHORIZED', 'TOKEN_EXCHANGED', 'FAILED')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_smart_iss ON smart_launch_sessions(iss);
CREATE INDEX IF NOT EXISTS idx_smart_patient ON smart_launch_sessions(patient_id);

-- ------------------------------------------------------------
-- 2. CDA / C-CDA IMPORTED DOCUMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cda_imported_documents (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    organization_id UUID,
    document_title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_organization TEXT NOT NULL,
    effective_time TIMESTAMPTZ,
    raw_xml TEXT NOT NULL,
    parsed_sections JSONB NOT NULL DEFAULT '{}'::jsonb,
    extracted_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_warnings TEXT[] NOT NULL DEFAULT '{}',
    imported_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_cda_case ON cda_imported_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_cda_org ON cda_imported_documents(organization_id);

-- ------------------------------------------------------------
-- 3. IHE XDS.b REGISTRY METADATA ENTRIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ihe_xds_registry_entries (
    entry_uuid TEXT PRIMARY KEY,
    unique_id TEXT NOT NULL UNIQUE,
    patient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    format_code JSONB NOT NULL,
    type_code JSONB NOT NULL,
    class_code JSONB NOT NULL,
    confidentiality_code TEXT NOT NULL DEFAULT 'N',
    creation_time TEXT NOT NULL,
    repository_unique_id TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    hash_sha1 TEXT NOT NULL,
    availability_status TEXT NOT NULL CHECK (availability_status IN ('Approved', 'Deprecated')),
    author_person TEXT NOT NULL,
    author_institution TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_xds_patient ON ihe_xds_registry_entries(patient_id);

-- ------------------------------------------------------------
-- 4. WHO SMART GUIDELINES COMPLIANCE AUDITS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS who_smart_compliance_audits (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    organization_id UUID,
    overall_status TEXT NOT NULL CHECK (overall_status IN ('COMPLIANT', 'NEEDS_ATTENTION', 'NON_COMPLIANT')),
    compliance_percentage INTEGER NOT NULL,
    total_checks INTEGER NOT NULL,
    passed_checks INTEGER NOT NULL,
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    who_smart_version TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_who_case ON who_smart_compliance_audits(case_id);

-- ------------------------------------------------------------
-- 5. OFFLINE SYNC TRANSACTIONAL OUTBOX
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offline_sync_outbox (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    case_id TEXT NOT NULL,
    organization_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    retry_attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_case ON offline_sync_outbox(case_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON offline_sync_outbox(status);

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE smart_launch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cda_imported_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ihe_xds_registry_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE who_smart_compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_outbox ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated clinicians
CREATE POLICY p10_smart_read ON smart_launch_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p10_smart_insert ON smart_launch_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p10_cda_read ON cda_imported_documents
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_cda_insert ON cda_imported_documents
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_xds_read ON ihe_xds_registry_entries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p10_who_read ON who_smart_compliance_audits
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_outbox_read ON offline_sync_outbox
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_outbox_insert ON offline_sync_outbox
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

-- ------------------------------------------------------------
-- 7. SEED REGIONAL DEMO ENTRIES
-- ------------------------------------------------------------
INSERT INTO ihe_xds_registry_entries (
    entry_uuid, unique_id, patient_id, title, mime_type, format_code, type_code, class_code,
    confidentiality_code, creation_time, repository_unique_id, size_bytes, hash_sha1,
    availability_status, author_person, author_institution
) VALUES 
    ('urn:uuid:7d1b33e4-8521-4f47-8a19-4f36402d8471', '2.16.840.1.113883.19.5.99999.1.2026.0941',
     'syn-pat-00482^^^&2.16.840.1.113883.19.5&ISO', 'Referral & Continuity of Care Document (C-CDA)',
     'text/xml', '{"code": "urn:hl7-org:sdwg:ccda-structuredBody:2.1", "codingScheme": "1.3.6.1.4.1.19376.1.2.3", "displayName": "HL7 C-CDA Structured Body R2.1"}'::jsonb,
     '{"code": "34133-9", "codingScheme": "2.16.840.1.113883.6.1", "displayName": "Summarization of Episode Note"}'::jsonb,
     '{"code": "DOC", "codingScheme": "1.3.6.1.4.1.19376.1.2.7", "displayName": "Clinical Document"}'::jsonb,
     'N', '20260910143000', '1.3.6.1.4.1.21367.2011.2.3.101', 42104, 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
     'Approved', 'Dr. Kwame Asante, MD', 'Korle Bu Teaching Hospital')
ON CONFLICT (entry_uuid) DO NOTHING;



-- ============================================================
-- supabase/migrations/028_phase11_ai_governance.sql
-- Phase 11: AI Governance, Model Management, A/B Testing & Explainability Schema
-- Tracks Model Versions, A/B Adjudication, Human Feedback / DPO, and Explainability Cache
-- ============================================================

-- ------------------------------------------------------------
-- 1. AI MODEL REGISTRY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_model_registry (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    family TEXT NOT NULL,
    parameters_billion NUMERIC(6, 1) NOT NULL,
    context_window_tokens INTEGER NOT NULL,
    quantization TEXT NOT NULL,
    deployment_status TEXT NOT NULL CHECK (deployment_status IN ('PRODUCTION_PRIMARY', 'PRODUCTION_CANARY', 'EVALUATION', 'SHADOW', 'DEPRECATED')),
    medqa_score NUMERIC(5, 2) NOT NULL,
    mmlu_clinical_score NUMERIC(5, 2) NOT NULL,
    hallucination_rate NUMERIC(5, 2) NOT NULL,
    median_latency_ms INTEGER NOT NULL,
    training_cutoff_date DATE NOT NULL,
    license TEXT NOT NULL,
    is_fine_tuned BOOLEAN NOT NULL DEFAULT true,
    compliance_tags TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_model_registry_status ON ai_model_registry(deployment_status);
CREATE INDEX IF NOT EXISTS idx_model_registry_family ON ai_model_registry(family);

-- ------------------------------------------------------------
-- 2. A/B COMPARISON SESSIONS & ADJUDICATION
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_comparison_sessions (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    prompt_template_id TEXT NOT NULL,
    model_a_id TEXT NOT NULL REFERENCES ai_model_registry(id) ON DELETE CASCADE,
    model_b_id TEXT NOT NULL REFERENCES ai_model_registry(id) ON DELETE CASCADE,
    model_a_output JSONB NOT NULL,
    model_b_output JSONB NOT NULL,
    concordance_score NUMERIC(5, 4) NOT NULL,
    discrepancy_count INTEGER NOT NULL DEFAULT 0,
    clinician_preference TEXT CHECK (clinician_preference IN ('MODEL_A', 'MODEL_B', 'EQUIVALENT', 'BOTH_UNSATISFACTORY')),
    clinician_adjudication_notes TEXT,
    evaluator_user_id UUID,
    evaluator_persona TEXT,
    adjudicated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ab_case ON ab_comparison_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_ab_models ON ab_comparison_sessions(model_a_id, model_b_id);

-- ------------------------------------------------------------
-- 3. HUMAN FEEDBACK & DPO CURATION RECORDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS human_feedback_records (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    model_id TEXT NOT NULL REFERENCES ai_model_registry(id) ON DELETE CASCADE,
    hypothesis_id TEXT,
    finding_id TEXT,
    error_taxonomy TEXT NOT NULL CHECK (error_taxonomy IN (
        'HALLUCINATED_FINDING',
        'UNSUPPORTED_LEAP',
        'OVERCONFIDENCE',
        'CONTRADICTION_MISSED',
        'SEVERITY_UNDERESTIMATION',
        'OMITTED_DIFFERENTIAL',
        'IRRELEVANT_INVESTIGATION',
        'TERMINOLOGY_INACCURACY'
    )),
    original_claim TEXT NOT NULL,
    clinician_correction TEXT NOT NULL,
    clinician_rationale TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL_SAFETY')),
    dpo_export_eligible BOOLEAN NOT NULL DEFAULT true,
    clinician_id UUID,
    clinician_role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_model ON human_feedback_records(model_id);
CREATE INDEX IF NOT EXISTS idx_feedback_case ON human_feedback_records(case_id);
CREATE INDEX IF NOT EXISTS idx_feedback_dpo ON human_feedback_records(dpo_export_eligible);

-- ------------------------------------------------------------
-- 4. HYPOTHESIS EXPLAINABILITY & ATTRIBUTION CACHE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hypothesis_explainability_cache (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    hypothesis_id TEXT NOT NULL,
    base_prior_probability NUMERIC(5, 4) NOT NULL,
    posterior_probability NUMERIC(5, 4) NOT NULL,
    attributions JSONB NOT NULL DEFAULT '[]'::jsonb,
    counterfactuals JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_explain_case_hyp ON hypothesis_explainability_cache(case_id, hypothesis_id);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE ai_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_comparison_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypothesis_explainability_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY p11_model_registry_select ON ai_model_registry
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p11_ab_comparison_select ON ab_comparison_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p11_ab_comparison_insert ON ab_comparison_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p11_ab_comparison_update ON ab_comparison_sessions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p11_feedback_select ON human_feedback_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p11_feedback_insert ON human_feedback_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p11_explain_select ON hypothesis_explainability_cache
    FOR SELECT TO authenticated USING (true);

-- ------------------------------------------------------------
-- 6. SEED FOUNDATION MODELS & DEMO GOVERNANCE DATA
-- ------------------------------------------------------------
INSERT INTO ai_model_registry (
    id, name, version, family, parameters_billion, context_window_tokens,
    quantization, deployment_status, medqa_score, mmlu_clinical_score,
    hallucination_rate, median_latency_ms, training_cutoff_date,
    license, is_fine_tuned, compliance_tags, description
) VALUES
(
    'nexus-clinical-70b-v2.1',
    'Nexus Clinical Reasoning LLM',
    '2.1.0',
    'Llama-3-NexusFineTune',
    70.0,
    131072,
    'FP16',
    'PRODUCTION_PRIMARY',
    91.4,
    88.7,
    1.8,
    420,
    '2026-03-01',
    'Nexus Enterprise Clinical License',
    true,
    ARRAY['HIPAA', 'GDPR-Health', 'FDA-SaMD-Class-II-Ready', 'CE-MDR'],
    'Flagship diagnostic reasoning foundation model fine-tuned on verified multi-specialty clinical trajectories.'
),
(
    'meditron-70b-v1.2',
    'Meditron Clinical Foundation',
    '1.2.4',
    'Meditron-EPFL',
    70.0,
    32768,
    'AWQ-4bit',
    'PRODUCTION_CANARY',
    86.8,
    84.2,
    3.2,
    310,
    '2025-11-15',
    'Apache-2.0',
    false,
    ARRAY['HIPAA', 'Research-Approved'],
    'Open-source clinical foundational benchmark model curated by EPFL for medical literature reasoning.'
),
(
    'clinical-camel-70b-v1.0',
    'ClinicalCamel Diagnostic Engine',
    '1.0.8',
    'Camel-Health',
    70.0,
    32768,
    'FP16',
    'EVALUATION',
    83.5,
    81.9,
    4.5,
    580,
    '2025-08-01',
    'Non-Commercial Clinical Research',
    true,
    ARRAY['Research-Only'],
    'Dialogue-specialized clinical consultation model benchmarked for differential diagnostic generation.'
),
(
    'nexus-lite-8b-v2.0',
    'Nexus Edge Diagnostic Lite',
    '2.0.1',
    'Llama-3.1-EdgeNexus',
    8.0,
    65536,
    'GGUF-Q8',
    'SHADOW',
    79.6,
    77.3,
    4.1,
    95,
    '2026-01-10',
    'Nexus Edge License',
    true,
    ARRAY['Offline-Capable', 'Edge-Optimized'],
    'Ultra-low latency edge model for real-time mobile and local bedside clinical decision support.'
)
ON CONFLICT (id) DO UPDATE SET
    medqa_score = EXCLUDED.medqa_score,
    deployment_status = EXCLUDED.deployment_status,
    updated_at = timezone('utc', now());

INSERT INTO human_feedback_records (
    id, case_id, model_id, hypothesis_id, finding_id, error_taxonomy,
    original_claim, clinician_correction, clinician_rationale,
    severity, dpo_export_eligible
) VALUES
(
    'fb-001',
    'case-10482',
    'nexus-clinical-70b-v2.1',
    'hyp-1',
    'f-002',
    'UNSUPPORTED_LEAP',
    'Holosystolic murmur at cardiac apex definitively indicates acute mitral valve leaflet perforation.',
    'Murmur stigmata confirms severe mitral regurgitation; leaflet perforation requires TEE visualization to verify anatomical defect.',
    'Avoid asserting definitive anatomical perforation without structural echocardiographic confirmation.',
    'MODERATE',
    true
),
(
    'fb-002',
    'case-10482',
    'meditron-70b-v1.2',
    'hyp-2',
    'f-004',
    'OVERCONFIDENCE',
    'Presence of elevated ESR rules out viral myocarditis with 99% certainty.',
    'Elevated ESR is non-specific inflammatory marker elevated in both bacterial endocarditis and myocarditis.',
    'Model inflated diagnostic certainty of a non-specific acute phase reactant.',
    'HIGH',
    true
)
ON CONFLICT (id) DO NOTHING;



-- ============================================================
-- supabase/migrations/029_phase12_regulatory_compliance.sql
-- Phase 12: Regulatory & Compliance Database Schema
-- MDCG 2021-6, FDA PCCP Modification Protocols, GDPR/POPIA Sovereignty & FHIR Audit Exports
-- ============================================================

-- ------------------------------------------------------------
-- 1. REGULATORY COMPLIANCE AUDITS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regulatory_compliance_audits (
    id TEXT PRIMARY KEY,
    standard TEXT NOT NULL CHECK (standard IN ('MDCG_2021_6', 'EU_AI_ACT_HIGH_RISK', 'FDA_PCCP', 'GDPR_HEALTH')),
    target_workstation_version TEXT NOT NULL,
    classification_rule TEXT NOT NULL,
    overall_score NUMERIC(5, 2) NOT NULL,
    total_clauses INTEGER NOT NULL,
    compliant_count INTEGER NOT NULL,
    partially_compliant_count INTEGER NOT NULL,
    non_compliant_count INTEGER NOT NULL,
    clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
    audited_by TEXT NOT NULL,
    audited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_reg_audit_standard ON regulatory_compliance_audits(standard);
CREATE INDEX IF NOT EXISTS idx_reg_audit_time ON regulatory_compliance_audits(audited_at DESC);

-- ------------------------------------------------------------
-- 2. FDA PCCP MODIFICATION PROTOCOLS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fda_pccp_modifications (
    protocol_id TEXT PRIMARY KEY,
    modification_type TEXT NOT NULL,
    description TEXT NOT NULL,
    allowed_variance_range TEXT NOT NULL,
    actual_proposed_change TEXT NOT NULL,
    boundary_evaluation TEXT NOT NULL CHECK (boundary_evaluation IN (
        'WITHIN_AUTHORIZED_BOUNDS',
        'REQUIRES_INTERNAL_VALIDATION',
        'TRIGGERS_NEW_510K'
    )),
    verification_method TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    approval_status TEXT NOT NULL CHECK (approval_status IN ('APPROVED', 'PENDING_REVIEW', 'REJECTED')),
    regulatory_impact_rationale TEXT NOT NULL,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_pccp_type ON fda_pccp_modifications(modification_type);
CREATE INDEX IF NOT EXISTS idx_pccp_status ON fda_pccp_modifications(approval_status);

-- ------------------------------------------------------------
-- 3. PATIENT AI CONSENT RECORDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_consent_records (
    patient_id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    scopes JSONB NOT NULL DEFAULT '{}'::jsonb,
    consented_by TEXT NOT NULL,
    consent_recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    expiration_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_consent_patient ON patient_consent_records(patient_id);

-- ------------------------------------------------------------
-- 4. DATA SUBJECT RIGHTS (DSR) REQUESTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN (
        'RIGHT_TO_ACCESS',
        'RIGHT_TO_RECTIFICATION',
        'RIGHT_TO_ERASURE',
        'RIGHT_TO_RESTRICTION'
    )),
    jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('EU_GDPR', 'ZA_POPIA', 'GH_DPA', 'US_HIPAA')),
    status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'IDENTITY_VERIFIED', 'PROCESSING', 'FULFILLED', 'REJECTED')),
    request_details TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    fulfilled_at TIMESTAMPTZ,
    certified_by TEXT,
    audit_evidence_ref TEXT
);

CREATE INDEX IF NOT EXISTS idx_dsr_patient ON data_subject_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_jurisdiction ON data_subject_requests(jurisdiction);

-- ------------------------------------------------------------
-- 5. REGULATORY AUDIT EXPORT MANIFESTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regulatory_audit_exports (
    export_id TEXT PRIMARY KEY,
    target_authority TEXT NOT NULL,
    format TEXT NOT NULL,
    date_range_start TIMESTAMPTZ NOT NULL,
    date_range_end TIMESTAMPTZ NOT NULL,
    total_event_count INTEGER NOT NULL,
    sha256_checksum TEXT NOT NULL,
    exported_by TEXT NOT NULL,
    exported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_export_target ON regulatory_audit_exports(target_authority);
CREATE INDEX IF NOT EXISTS idx_audit_export_time ON regulatory_audit_exports(exported_at DESC);

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE regulatory_compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fda_pccp_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_audit_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY p12_audits_select ON regulatory_compliance_audits
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_audits_insert ON regulatory_compliance_audits
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_pccp_select ON fda_pccp_modifications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_pccp_insert ON fda_pccp_modifications
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_pccp_update ON fda_pccp_modifications
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p12_consent_select ON patient_consent_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_consent_insert ON patient_consent_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_consent_update ON patient_consent_records
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p12_dsr_select ON data_subject_requests
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_dsr_insert ON data_subject_requests
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_dsr_update ON data_subject_requests
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p12_exports_select ON regulatory_audit_exports
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_exports_insert ON regulatory_audit_exports
    FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. SEED REGULATORY RECORDS
-- ------------------------------------------------------------
INSERT INTO fda_pccp_modifications (
    protocol_id, modification_type, description, allowed_variance_range,
    actual_proposed_change, boundary_evaluation, verification_method,
    acceptance_criteria, approval_status, regulatory_impact_rationale,
    reviewed_by, reviewed_at
) VALUES
(
    'AMP-001',
    'PROMPT_TEMPLATE_OPTIMIZATION',
    'Refinements to clinical reasoning prompt templates for differential synthesis.',
    'Wording updates preserving strict JSON output schema and non-numeric probability constraint.',
    'Incorporate explicit Duke Minor vascular criteria guidance into system prompt.',
    'WITHIN_AUTHORIZED_BOUNDS',
    'Regression testing against 200 synthetic reference case trajectories with automated schema validation.',
    '100% schema conformance; no regression on primary differential recall.',
    'APPROVED',
    'Does not alter intended use or clinical output format. Within pre-authorized modification boundaries.',
    'Dr. Sarah Lin, MD (Regulatory Clinical Lead)',
    '2026-09-02T10:15:00Z'
),
(
    'AMP-002',
    'REASONING_TEMPERATURE_TUNING',
    'Adjusting LLM decoding temperature for diagnostic reasoning stability.',
    'Temperature range 0.00 to 0.25; top-p 0.90 to 0.98.',
    'Lower primary reasoning temperature from 0.20 to 0.12 to reduce candidate hypothesis variance.',
    'WITHIN_AUTHORIZED_BOUNDS',
    'Monte Carlo temperature stability trial across 50 clinical edge cases.',
    'Hallucination rate remains under 2.0%; zero omitted high-risk safety flags.',
    'APPROVED',
    'Maintains conservative deterministic generation bounds. Well within authorized parameters.',
    'Dr. Marcus Vance, Chief Medical Officer',
    '2026-09-05T14:30:00Z'
),
(
    'AMP-003',
    'WEIGHT_QUANTIZATION_CHANGE',
    'Quantization optimization for reduced inference latency on edge nodes.',
    'Quantization format change (FP16 -> AWQ-4bit / GGUF-Q8) with MedQA degradation < 1.5%.',
    'Deploy AWQ-4bit quantized checkpoint for Meditron-70b auxiliary model.',
    'REQUIRES_INTERNAL_VALIDATION',
    'Side-by-side A/B assessment against full FP16 baseline across 100 benchmark clinical vignettes.',
    'Concordance score > 0.90; MedQA benchmark delta <= 1.0%.',
    'PENDING_REVIEW',
    'Permissible within PCCP upon verified completion of full A/B concordance evaluation.',
    NULL,
    NULL
)
ON CONFLICT (protocol_id) DO NOTHING;

INSERT INTO patient_consent_records (
    patient_id, patient_name, consent_given, scopes, consented_by, consent_recorded_at
) VALUES
(
    'syn-pat-00482',
    'Amara Okafor',
    true,
    '{"realTimeDiagnosticAssistance": true, "retrospectiveQualityAudit": true, "deIdentifiedModelTraining": false, "crossInstitutionalResearch": true}'::jsonb,
    'Dr. Kwame Asante, MD',
    '2026-09-08T08:30:00Z'
)
ON CONFLICT (patient_id) DO NOTHING;

INSERT INTO data_subject_requests (
    id, patient_id, patient_name, request_type, jurisdiction, status,
    request_details, requested_at, fulfilled_at, certified_by, audit_evidence_ref
) VALUES
(
    'DSR-2026-001',
    'syn-pat-00482',
    'Amara Okafor',
    'RIGHT_TO_ACCESS',
    'GH_DPA',
    'FULFILLED',
    'Full export of all AI diagnostic inferences, clinical reasoning traces, and audit logs.',
    '2026-09-09T14:20:00Z',
    '2026-09-09T16:00:00Z',
    'Legal & Privacy Officer (K. Mensah)',
    'export-dsr-482-signed.zip (SHA-256 verified)'
)
ON CONFLICT (id) DO NOTHING;



-- ============================================================
-- supabase/migrations/030_phase13_production_hardening.sql
-- Phase 13: Enterprise Production Hardening Database Schema
-- DICOM Imaging, HL7 v2.x Hospital Messaging, Knowledge Graph & Collaboration
-- ============================================================

-- ------------------------------------------------------------
-- 1. DICOM STUDIES & SERIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dicom_studies (
    study_instance_uid TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    accession_number TEXT NOT NULL,
    study_date DATE NOT NULL,
    study_time TIME NOT NULL,
    modalities_in_study TEXT[] NOT NULL,
    study_description TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    referring_physician_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_dicom_patient ON dicom_studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_dicom_accession ON dicom_studies(accession_number);

CREATE TABLE IF NOT EXISTS dicom_series (
    series_instance_uid TEXT PRIMARY KEY,
    study_instance_uid TEXT NOT NULL REFERENCES dicom_studies(study_instance_uid) ON DELETE CASCADE,
    series_number INTEGER NOT NULL,
    modality TEXT NOT NULL,
    series_description TEXT NOT NULL,
    body_part_examined TEXT NOT NULL,
    number_of_instances INTEGER NOT NULL DEFAULT 1,
    instances_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_series_study ON dicom_series(study_instance_uid);

-- ------------------------------------------------------------
-- 2. HL7 V2.x INCOMING MESSAGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hl7v2_incoming_messages (
    id TEXT PRIMARY KEY,
    message_type TEXT NOT NULL,
    sending_application TEXT NOT NULL,
    sending_facility TEXT NOT NULL,
    receiving_application TEXT NOT NULL,
    receiving_facility TEXT NOT NULL,
    message_datetime TIMESTAMPTZ NOT NULL,
    message_control_id TEXT NOT NULL,
    processing_id TEXT NOT NULL DEFAULT 'P',
    version_id TEXT NOT NULL DEFAULT '2.5.1',
    raw_er7_text TEXT NOT NULL,
    parsed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_hl7_control ON hl7v2_incoming_messages(message_control_id);
CREATE INDEX IF NOT EXISTS idx_hl7_type ON hl7v2_incoming_messages(message_type);

-- ------------------------------------------------------------
-- 3. CLINICAL KNOWLEDGE GRAPH (UMLS & SNOMED CT)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_knowledge_nodes (
    cui TEXT PRIMARY KEY,
    snomed_code TEXT,
    preferred_term TEXT NOT NULL,
    node_type TEXT NOT NULL,
    definition TEXT,
    synonyms TEXT[] NOT NULL DEFAULT '{}',
    semantic_category TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kg_snomed ON clinical_knowledge_nodes(snomed_code);

CREATE TABLE IF NOT EXISTS clinical_knowledge_edges (
    id TEXT PRIMARY KEY,
    source_cui TEXT NOT NULL REFERENCES clinical_knowledge_nodes(cui) ON DELETE CASCADE,
    target_cui TEXT NOT NULL REFERENCES clinical_knowledge_nodes(cui) ON DELETE CASCADE,
    predicate TEXT NOT NULL,
    evidence_strength TEXT NOT NULL,
    clinical_mechanism TEXT NOT NULL,
    reference_pmids TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_kg_source ON clinical_knowledge_edges(source_cui);
CREATE INDEX IF NOT EXISTS idx_kg_target ON clinical_knowledge_edges(target_cui);

-- ------------------------------------------------------------
-- 4. ACTIVE COLLABORATIVE SESSIONS (PRESENCE)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS active_collaborative_sessions (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    user_id UUID,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#2563EB',
    initials TEXT NOT NULL,
    current_tab TEXT NOT NULL DEFAULT 'reasoning',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_collab_case ON active_collaborative_sessions(case_id);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE dicom_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicom_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE hl7v2_incoming_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_collaborative_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY p13_dicom_studies_select ON dicom_studies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_dicom_series_select ON dicom_series
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_hl7_select ON hl7v2_incoming_messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_hl7_insert ON hl7v2_incoming_messages
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p13_kg_nodes_select ON clinical_knowledge_nodes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_kg_edges_select ON clinical_knowledge_edges
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_collab_select ON active_collaborative_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_collab_all ON active_collaborative_sessions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. SEED DICOM & KNOWLEDGE GRAPH DATA
-- ------------------------------------------------------------
INSERT INTO dicom_studies (
    study_instance_uid, patient_id, patient_name, accession_number,
    study_date, study_time, modalities_in_study, study_description,
    institution_name, referring_physician_name
) VALUES (
    '1.2.840.113619.2.55.3.2831154.20260910.1048201',
    'syn-pat-00482',
    'Okafor^Amara',
    'ACC-2026-TEE-0482',
    '2026-09-10',
    '11:30:00',
    ARRAY['US'],
    'TEE (Transesophageal Echocardiography) Comprehensive Diagnostic Protocol',
    'Korle Bu Teaching Hospital / Heart & Vascular Institute',
    'Dr. Kwame Asante, MD'
) ON CONFLICT (study_instance_uid) DO NOTHING;

INSERT INTO clinical_knowledge_nodes (cui, snomed_code, preferred_term, node_type, definition, synonyms, semantic_category)
VALUES
('C0038397', '115329001', 'Streptococcus viridans group', 'ORGANISM', 'Commensal oral streptococci with affinity for damaged endocardial surfaces.', ARRAY['Viridans streptococci'], 'Bacterium'),
('C0011849', '301011002', 'Bacteremia', 'FINDING', 'Presence of viable bacteria circulating within the bloodstream.', ARRAY['Bacterial bloodstream infection'], 'Pathologic Finding'),
('C0155668', '277472004', 'Endocardial Vegetation', 'FINDING', 'Amorphous mass composed of fibrin, platelets, microbial colonies, and sparse inflammatory cells on valve leaflets.', ARRAY['Valvular vegetation'], 'Pathologic Finding'),
('C0014144', '301011002', 'Infective Endocarditis (Subacute Bacterial)', 'DISEASE_OR_SYNDROME', 'Microbial infection of the endocardial surface of the heart, characterized by valvular vegetations.', ARRAY['Subacute bacterial endocarditis', 'SBE'], 'Disease or Syndrome'),
('C0026266', '48724000', 'Mitral Valve Regurgitation', 'FINDING', 'Retrograde blood flow from left ventricle into left atrium during ventricular systole.', ARRAY['Mitral insufficiency'], 'Pathologic Function')
ON CONFLICT (cui) DO NOTHING;

INSERT INTO clinical_knowledge_edges (id, source_cui, target_cui, predicate, evidence_strength, clinical_mechanism, reference_pmids)
VALUES
('edge-01', 'C0038397', 'C0011849', 'CAUSES', 'DEFINITIVE', 'Transient mucosal breach during dental manipulation allows oral viridans flora into systemic circulation.', ARRAY['26377488']),
('edge-02', 'C0011849', 'C0155668', 'CAUSES', 'DEFINITIVE', 'Circulating bacteria adhere to sterile platelet-fibrin thrombi on pre-damaged endocardial surfaces.', ARRAY['15944423']),
('edge-03', 'C0155668', 'C0014144', 'MANIFESTATION_OF', 'DEFINITIVE', 'Valvular vegetation with persistent bacteremia establishes diagnostic endocarditis.', ARRAY['10774614']),
('edge-04', 'C0155668', 'C0026266', 'CAUSES', 'DEFINITIVE', 'Mechanical coaptation failure and leaflet perforation produce regurgitant jet.', ARRAY['28434756'])
ON CONFLICT (id) DO NOTHING;



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



-- ============================================================
-- 032_case_close_permission.sql
-- Adds case.close permission and a dedicated RLS UPDATE policy
-- so that clinicians and org_admins can soft-delete (close) cases.
--
-- Root cause: deleteCase.ts called UPDATE cases SET status='RESOLVED'
-- which hit the case_edit_permission RLS policy requiring case.edit.
-- Users without that permission received 401 permission denied.
-- ============================================================

-- 1. Register the permission if it doesn't exist yet
insert into public.permissions (code, description)
values ('case.close', 'Close or archive a clinical case')
on conflict (code) do nothing;

-- 2. Grant case.close to clinician role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'clinician'
  and p.code  = 'case.close'
on conflict do nothing;

-- 3. Grant case.close to organization_admin role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'organization_admin'
  and p.code  = 'case.close'
on conflict do nothing;

-- 4. Grant case.close to reviewer role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'reviewer'
  and p.code  = 'case.close'
on conflict do nothing;

-- 5. Add a dedicated RLS UPDATE policy for case closure / soft-delete.
--    A user must be an org member with case.close permission,
--    OR be an assigned case member (attending clinician on the case).
drop policy if exists "case_close_permission" on public.cases;
create policy "case_close_permission"
  on public.cases for update to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.close'))
  )
  with check (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.close'))
  );



-- ============================================================
-- 033_delete_permissions.sql
-- Grants DELETE privilege on cases, tasks, investigations, and all associated
-- case records to authenticated, and adds dedicated RLS DELETE policies.
-- Ensures that deleting a case cascades or permits deleting all associated records
-- (tasks, findings, investigations, safety issues, decisions, timeline events, documents)
-- across all sections of the application.
-- ============================================================

-- 1. Grant table-level DELETE permissions to authenticated
grant delete on public.cases to authenticated;
grant delete on public.tasks to authenticated;
grant delete on public.investigations to authenticated;
grant delete on public.investigation_results to authenticated;
grant delete on public.clinical_findings to authenticated;
grant delete on public.safety_concerns to authenticated;
grant delete on public.decisions to authenticated;
grant delete on public.reviews to authenticated;
grant delete on public.timeline_events to authenticated;
grant delete on public.clinical_documents to authenticated;
grant delete on public.fhir_export_bundles to authenticated;

-- 2. Register 'investigation.delete' permission if not existing
insert into public.permissions (code, description)
values ('investigation.delete', 'Cancel or delete diagnostic investigation orders')
on conflict (code) do nothing;

-- 3. Grant 'investigation.delete' to clinician and org_admin roles
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name in ('clinician', 'organization_admin')
  and p.code = 'investigation.delete'
on conflict do nothing;

-- 4. RLS DELETE Policy on public.cases
drop policy if exists "authorized_users_delete_cases" on public.cases;
create policy "authorized_users_delete_cases"
  on public.cases for delete to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and (
      public.has_permission('case.close') or
      public.has_permission('case.edit')
    ))
  );

-- 5. RLS DELETE Policy on public.tasks
drop policy if exists "authorized_users_delete_tasks" on public.tasks;
create policy "authorized_users_delete_tasks"
  on public.tasks for delete to authenticated
  using (
    created_by = auth.uid() or
    assigned_to = auth.uid() or
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 6. RLS DELETE Policy on public.investigations
drop policy if exists "authorized_users_delete_investigations" on public.investigations;
create policy "authorized_users_delete_investigations"
  on public.investigations for delete to authenticated
  using (
    requested_by = auth.uid() or
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 7. RLS DELETE Policy on public.clinical_findings
drop policy if exists "authorized_users_delete_findings" on public.clinical_findings;
create policy "authorized_users_delete_findings"
  on public.clinical_findings for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 8. RLS DELETE Policy on public.safety_concerns
drop policy if exists "authorized_users_delete_safety_concerns" on public.safety_concerns;
create policy "authorized_users_delete_safety_concerns"
  on public.safety_concerns for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 9. RLS DELETE Policy on public.decisions
drop policy if exists "authorized_users_delete_decisions" on public.decisions;
create policy "authorized_users_delete_decisions"
  on public.decisions for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 10. RLS DELETE Policy on public.timeline_events
drop policy if exists "authorized_users_delete_timeline_events" on public.timeline_events;
create policy "authorized_users_delete_timeline_events"
  on public.timeline_events for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );



-- ============================================================
-- 034_nexus_assessment_extended_columns.sql
-- Extend nexus_assessments and nexus_findings with fields
-- required for full Nexus analysis persistence.
-- ============================================================

-- Add contradictions JSONB to nexus_assessments (array of DetectedContradiction)
alter table public.nexus_assessments
  add column if not exists contradictions jsonb default '[]'::jsonb;

-- Add finding_ids and evidence_source_ids to nexus_findings
alter table public.nexus_findings
  add column if not exists finding_ids jsonb default '[]'::jsonb,
  add column if not exists evidence_source_ids jsonb default '[]'::jsonb;

comment on column public.nexus_assessments.contradictions is
  'Detected clinical contradictions (deterministic + AI layer). Stored as JSONB array.';
comment on column public.nexus_findings.finding_ids is
  'Grounded clinical finding IDs referenced by this nexus finding.';
comment on column public.nexus_findings.evidence_source_ids is
  'Grounded evidence source IDs referenced by this nexus finding.';

-- ============================================================
-- Insert / Update RLS policies for nexus tables
-- PostgreSQL does not support CREATE POLICY IF NOT EXISTS,
-- so we drop each policy first then recreate it.
-- ============================================================

-- nexus_assessments: INSERT
drop policy if exists "insert_nexus_assessments" on public.nexus_assessments;
create policy "insert_nexus_assessments"
  on public.nexus_assessments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = nexus_assessments.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- nexus_assessments: UPDATE
drop policy if exists "update_nexus_assessments" on public.nexus_assessments;
create policy "update_nexus_assessments"
  on public.nexus_assessments
  for update
  to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = nexus_assessments.case_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- nexus_findings: INSERT
drop policy if exists "insert_nexus_findings" on public.nexus_findings;
create policy "insert_nexus_findings"
  on public.nexus_findings
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_findings.assessment_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- nexus_findings: UPDATE
drop policy if exists "update_nexus_findings" on public.nexus_findings;
create policy "update_nexus_findings"
  on public.nexus_findings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_findings.assessment_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );

-- nexus_recommendations: INSERT
drop policy if exists "insert_nexus_recommendations" on public.nexus_recommendations;
create policy "insert_nexus_recommendations"
  on public.nexus_recommendations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_recommendations.assessment_id
        and c.organization_id in (
          select organization_id from public.organization_memberships
          where profile_id = auth.uid() and status = 'ACTIVE'
        )
    )
  );



-- ============================================================
-- 035_remove_seeded_assessments.sql
-- Remove all seeded/hardcoded demo analysis data.
-- The Nexus analysis system now generates and persists
-- assessments dynamically when clinicians run analysis.
-- ============================================================

-- Remove seeded nexus findings (cascade from nexus_assessments)
-- and seeded nexus assessments for the demo case
delete from public.nexus_assessments
where id = '40000001-0000-0000-0000-000000000001';

-- Remove seeded hypotheses for the demo cases
-- (real hypotheses are generated by Nexus analysis runs)
delete from public.hypotheses
where id in (
  '30000001-0000-0000-0000-000000000001',
  '30000001-0000-0000-0000-000000000002',
  '30000001-0000-0000-0000-000000000003'
);

-- Remove seeded timeline event for Nexus synthesis
delete from public.timeline_events
where title = 'Nexus Clinical Synthesis generated'
  and actor_type = 'NEXUS_AI';



