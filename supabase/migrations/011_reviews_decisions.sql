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
