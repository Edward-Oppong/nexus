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
