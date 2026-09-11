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
