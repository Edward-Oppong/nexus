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
