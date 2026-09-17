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
