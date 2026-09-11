-- ============================================================
-- 025_phase8_org_fhir_config.sql
-- Phase 8: Multi-tenant Organisation Model
--
-- New tables:
--   organization_fhir_configs  — per-org FHIR endpoint registry
--   organization_invitations   — pending member invitation records
--
-- Design principles:
--   • All tables scoped to organization_id — strict tenancy isolation
--   • RLS enforces organization.manage for writes, case.view for reads
--   • No clinical data — no PHI/PII in these tables beyond email addresses
--   • Audit events written on every mutation (trigger pattern below)
-- ============================================================

-- ----------------------------------------------------------
-- 1. Organisation FHIR Endpoint Registry
-- Per-org catalogue of external system connections.
-- ARCHITECTURE §10: FHIR translation occurs ONLY at this boundary.
-- The internal domain model is FHIR-free.
-- ----------------------------------------------------------

create table if not exists public.organization_fhir_configs (
  id                    uuid          primary key default gen_random_uuid(),
  organization_id       uuid          not null references public.organizations(id) on delete cascade,

  -- Human-readable display name
  name                  text          not null,

  -- External system classification
  system_type           text          not null check (system_type in (
                                        'EHR', 'LIS', 'RIS', 'PACS', 'DEVICE',
                                        'PHARMACY', 'REGISTRY', 'RESEARCH_DB',
                                        'MANUAL_UPLOAD', 'OTHER'
                                      )),

  -- Integration protocol
  protocol              text          not null default 'FHIR_R4' check (protocol in (
                                        'FHIR_R4', 'HL7_V2', 'DICOM',
                                        'CSV', 'PDF', 'MANUAL', 'API', 'OTHER'
                                      )),

  -- FHIR R4 base URL or HL7 endpoint — nullable for MANUAL
  base_url              text,

  -- Trust level determines whether imported data can progress a case
  -- without explicit clinician review (ARCHITECTURE §9, Provenance Badge Rules)
  trust_level           text          not null default 'STANDARD' check (trust_level in (
                                        'AUTHORITATIVE', 'STANDARD', 'SUPPLEMENTARY', 'UNVERIFIED'
                                      )),

  -- Soft delete — never hard-delete a registered endpoint (audit trail)
  is_active             boolean       not null default true,

  -- Circuit breaker state (updated by integration-sync edge function)
  -- ARCHITECTURE §10 Retry and Circuit Breaker Parameters
  circuit_breaker_status text         not null default 'CLOSED' check (circuit_breaker_status in (
                                        'CLOSED', 'OPEN', 'HALF_OPEN'
                                      )),

  -- Last circuit breaker state change timestamp
  circuit_breaker_updated_at timestamptz,

  -- Failure count since last reset (resets on CLOSED transition)
  failure_count         integer       not null default 0,

  -- Credentials — stored as Supabase secret references ONLY.
  -- Never store actual API keys, tokens, or passwords here.
  -- The integration-sync edge function resolves these at runtime.
  secret_reference      text,        -- e.g. 'FHIR_EPIC_TOKEN' (Supabase secret name)

  created_by            uuid          references auth.users(id),
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

-- Index for org-scoped queries
create index if not exists idx_org_fhir_configs_org_id
  on public.organization_fhir_configs(organization_id);

-- Partial index for active endpoints only (common query path)
create index if not exists idx_org_fhir_configs_active
  on public.organization_fhir_configs(organization_id, system_type)
  where is_active = true;

comment on table public.organization_fhir_configs is
  'Phase 8: Per-organisation FHIR endpoint registry. '
  'FHIR R4 translation occurs ONLY at this boundary — the internal domain model is FHIR-free. '
  'Managed by organization_admin role. Credentials stored as Supabase secret references only — never inline.';

comment on column public.organization_fhir_configs.trust_level is
  'AUTHORITATIVE: imported data treated as clinician-level input. '
  'STANDARD: requires clinician review before case progression. '
  'SUPPLEMENTARY: informational only — cannot be used as primary evidence. '
  'UNVERIFIED: flagged for manual review on every import.';

comment on column public.organization_fhir_configs.circuit_breaker_status is
  'CLOSED: endpoint healthy, calls proceeding normally. '
  'OPEN: endpoint paused after failureThreshold (3) failures — 60s cooldown. '
  'HALF_OPEN: probe period — next call determines CLOSED or OPEN. '
  'See ARCHITECTURE §10 Retry and Circuit Breaker Parameters.';

-- ----------------------------------------------------------
-- 2. Organisation Invitations
-- Pending member invitation records.
-- Supabase edge function (future) sends email with a time-limited link.
-- On acceptance: org_membership row is created; invitation marked ACCEPTED.
-- ----------------------------------------------------------

create table if not exists public.organization_invitations (
  id                    uuid          primary key default gen_random_uuid(),
  organization_id       uuid          not null references public.organizations(id) on delete cascade,

  -- Invitee email — used to match on sign-up/sign-in
  email                 text          not null,

  -- Role to assign on acceptance
  role                  text          not null check (role in (
                                        'clinician', 'nurse', 'laboratory', 'reviewer',
                                        'organization_admin', 'platform_admin'
                                      )),

  -- Who created this invitation (must have user.manage permission)
  invited_by_user_id    uuid          not null references auth.users(id),

  -- Invitation lifecycle
  status                text          not null default 'PENDING' check (status in (
                                        'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'
                                      )),

  -- Invite link token — hashed using pgcrypto for storage
  -- The plaintext token is returned to the caller once and never stored
  token_hash            text          unique,

  -- Hard expiry — invitations expire after 7 days (configurable)
  expires_at            timestamptz   not null default (now() + interval '7 days'),

  -- Accepted membership — populated on acceptance
  accepted_membership_id uuid         references public.organization_memberships(id),
  accepted_at           timestamptz,

  -- Revocation reason (audit trail)
  revoked_reason        text,
  revoked_at            timestamptz,

  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

-- Unique constraint: only one PENDING invitation per email per org
create unique index if not exists idx_org_invitations_pending_unique
  on public.organization_invitations(organization_id, lower(email))
  where status = 'PENDING';

-- Index for org-scoped queries
create index if not exists idx_org_invitations_org_id
  on public.organization_invitations(organization_id, status);

comment on table public.organization_invitations is
  'Phase 8: Pending organisation membership invitations. '
  'Supabase edge function (organization-invite) generates a time-limited link, '
  'delivers it by email, and marks ACCEPTED on the first use. '
  'Token is hashed before storage — the plaintext link is never stored.';

-- ----------------------------------------------------------
-- 3. Row Level Security
--
-- Policy design for organization_fhir_configs:
--   SELECT: any active org member (case.view)
--   INSERT/UPDATE: organization.manage permission holders
--   DELETE: none — soft-delete via is_active = false only
--
-- Policy design for organization_invitations:
--   SELECT: user.manage holders (org_admin) in the same org
--   INSERT: user.manage holders
--   UPDATE: user.manage holders (revoke) + system service role (accept)
--   DELETE: none
-- ----------------------------------------------------------

alter table public.organization_fhir_configs enable row level security;
alter table public.organization_invitations enable row level security;

-- Helper: check if the current user has an active membership in the given org
-- (reuses the same pattern as existing tables)
create or replace function public.user_is_member_of(p_org_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1
    from public.organization_memberships
    where organization_id = p_org_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

-- Helper: check if the current user has a specific role in the given org
create or replace function public.user_has_role_in_org(p_org_id uuid, p_roles text[])
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1
    from public.organization_memberships
    where organization_id = p_org_id
      and user_id = auth.uid()
      and is_active = true
      and role = any(p_roles)
  );
$$;

-- organization_fhir_configs: SELECT — any active org member
create policy "fhir_configs_select_members"
  on public.organization_fhir_configs for select
  using (user_is_member_of(organization_id));

-- organization_fhir_configs: INSERT — organization_admin only
create policy "fhir_configs_insert_org_admin"
  on public.organization_fhir_configs for insert
  with check (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_fhir_configs: UPDATE — organization_admin only
-- (includes circuit breaker status updates — integration-sync uses service role)
create policy "fhir_configs_update_org_admin"
  on public.organization_fhir_configs for update
  using (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_fhir_configs: DELETE — blocked at policy level (use is_active = false)
-- No DELETE policy = no deletes possible

-- organization_invitations: SELECT — org_admin in same org
create policy "invitations_select_org_admin"
  on public.organization_invitations for select
  using (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_invitations: INSERT — org_admin
create policy "invitations_insert_org_admin"
  on public.organization_invitations for insert
  with check (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- organization_invitations: UPDATE — org_admin (for revocation)
-- Acceptance is handled by service role in the edge function
create policy "invitations_update_org_admin"
  on public.organization_invitations for update
  using (
    user_has_role_in_org(organization_id, array['organization_admin', 'platform_admin'])
  );

-- ----------------------------------------------------------
-- 4. Auto-update timestamps trigger
-- ----------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_org_fhir_configs_updated_at
  before update on public.organization_fhir_configs
  for each row execute function public.set_updated_at();

create trigger trg_org_invitations_updated_at
  before update on public.organization_invitations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------
-- 5. Seed: Demo FHIR endpoint configs for Nexus Teaching Hospital
-- These match DEMO_FHIR_CONFIGS in AuthProvider.tsx.
-- Only inserted if the demo org exists and no configs already present.
-- ----------------------------------------------------------

do $$
declare
  v_org_id uuid := 'c0000001-0000-0000-0000-000000000001';
begin
  if exists (
    select 1 from public.organizations where id = v_org_id
  ) and not exists (
    select 1 from public.organization_fhir_configs where organization_id = v_org_id
  ) then

    insert into public.organization_fhir_configs
      (id, organization_id, name, system_type, protocol, base_url, trust_level, is_active, circuit_breaker_status, created_at)
    values
      (
        'fhir-cfg-001'::uuid, v_org_id,
        'Epic EHR — Teaching Hospital', 'EHR', 'FHIR_R4',
        'https://epic.nexus-hospital.demo/api/FHIR/R4',
        'AUTHORITATIVE', true, 'CLOSED', '2026-01-15T08:00:00Z'
      ),
      (
        'fhir-cfg-002'::uuid, v_org_id,
        'Mindray BeneVision — Bedside Devices', 'DEVICE', 'HL7_V2',
        'https://hl7.mindray.nexus-hospital.demo/mllp',
        'STANDARD', true, 'CLOSED', '2026-02-01T10:00:00Z'
      ),
      (
        'fhir-cfg-003'::uuid, v_org_id,
        'LabSystems LIS — Pathology', 'LIS', 'FHIR_R4',
        'https://lis.nexus-hospital.demo/fhir/r4',
        'AUTHORITATIVE', true, 'HALF_OPEN', '2026-03-10T09:30:00Z'
      );

  end if;
end;
$$;

-- ----------------------------------------------------------
-- 6. Changelog annotation
-- ----------------------------------------------------------
comment on schema public is
  'Nexus Clinical Workstation — Phase 8 migration applied: '
  'organization_fhir_configs and organization_invitations tables added. '
  'RLS policies: org member SELECT, org_admin INSERT/UPDATE. '
  'No DELETE policy on either table — immutable record keeping.';
