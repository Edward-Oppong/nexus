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
