-- ============================================================
-- 013_audit_provenance.sql
-- Immutable system and data audit events.
-- Differentiates:
-- Timeline = What happened clinically?
-- Audit = What did the system/user do? (Security & compliance)
-- Note: provenance_records was created in 007 to satisfy FK ordering.
-- ============================================================

-- ----------------------------------------------------------
-- audit_events
-- Tamper-evident immutable audit log for clinical safety,
-- data governance, HIPAA/GDPR, and regulatory compliance.
-- ----------------------------------------------------------
create table public.audit_events (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        references public.organizations(id),
  actor_user_id   uuid        references public.profiles(id),
  action          text        not null,              -- 'CASE_VIEWED', 'FINDING_CREATED', 'FINDING_REJECTED', 'DECISION_FINALIZED', 'POLICY_OVERRIDE'
  resource_type   text        not null,              -- 'case', 'finding', 'nexus_assessment', 'decision', etc.
  resource_id     uuid,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

comment on table public.audit_events is
  'Immutable operational and compliance audit log. '
  'Tracks data reads, edits, AI approvals, and administrative actions.';
