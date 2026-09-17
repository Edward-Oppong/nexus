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
