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
