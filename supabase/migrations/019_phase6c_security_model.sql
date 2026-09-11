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
