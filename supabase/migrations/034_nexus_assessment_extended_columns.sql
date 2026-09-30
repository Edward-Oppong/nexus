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
