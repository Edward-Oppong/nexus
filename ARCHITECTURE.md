# Nexus Clinical Workstation — Authoritative System Architecture

> **Version: 1.2.0 (Live Backend, GoTrue Auth & Clinical PDF Reconstruction)** | Stack: React 18 + TypeScript 5 + Vite 6 + Supabase | FHIR: R4
>
> This is the architecture we build against. Not a design sketch — a production requirement.

This document is the authoritative technical reference for the Nexus Clinical Workstation. It covers the full system topology, every layer of the stack, database schema, authorization model, data flow, clinical safety mechanisms, and integration boundaries.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Layer Architecture](#2-layer-architecture)
3. [Domain Model Layer](#3-domain-model-layer)
4. [Authorization, Roles and Permissions](#4-authorization-roles-and-permissions)
5. [Database Schema and RLS](#5-database-schema-and-rls)
6. [Case State Machine](#6-case-state-machine)
7. [Clinical Workspace Design](#7-clinical-workspace-design)
8. [Intelligence and Reasoning Layer](#8-intelligence-and-reasoning-layer)
9. [Safety and Provenance System](#9-safety-and-provenance-system)
10. [FHIR R4 Interoperability Layer](#10-fhir-r4-interoperability-layer)
11. [Edge Function Architecture](#11-edge-function-architecture)
12. [Data Flow — Persistence Model](#12-data-flow--persistence-model)
13. [Dependency Graph](#13-dependency-graph)
14. [Security Model](#14-security-model)
15. [Performance Targets](#15-performance-targets)
16. [Failure Modes Reference](#16-failure-modes-reference)
17. [Changelog](#17-changelog)

---

## 1. System Overview

```
+----------------------------------------------------------+
|                    BROWSER / CLIENT                      |
|  React 18 SPA  --  Vite 6  --  TypeScript 5 strict      |
|                                                          |
|  Case Header (global case context bar)                   |
|  +-----------------+------------------+----------------+ |
|  | Case Nav        | Clinical         | Intelligence   | |
|  | (Zone B)        | Workspace (C)    | Rail (Zone D)  | |
|  +-----------------+------------------+----------------+ |
+-------------------------------+--------------------------+
                                | HTTPS / WSS
+-------------------------------v--------------------------+
|                    SUPABASE BACKEND                      |
|  Auth (JWT)  |  PostgreSQL (RLS)  |  Realtime (WS)       |
|                                                          |
|  Deno Edge Functions:                                    |
|   audit-event    contradiction-check   nexus-review      |
|   integration-export   integration-import                |
|   integration-sync     process-document                  |
|   evidence-search      extract-findings                  |
+-------------------------------+--------------------------+
                                |
+-------------------------------v--------------------------+
|                  EXTERNAL SYSTEMS                        |
|  EHR/LHIMS (FHIR R4)  LIS/Lab  PACS/Imaging  Devices    |
+----------------------------------------------------------+
```

---

## 2. Layer Architecture

Nexus is a strict layered architecture. No upward imports. Lower layers never import from higher layers.

```
+-----------------------------------------------------+  Layer 5
|         UI / Features / Components                 |  React components, tabs, panels
+-----------------------------------------------------+  Layer 4
|       Application State and Providers              |  React Context, CaseContext
+-----------------------------------------------------+  Layer 3
|     Intelligence / Interoperability                 |  reasoning-orchestrator, mappers
+-----------------------------------------------------+  Layer 2
|              Domain Model                          |  src/domain/* — PURE TYPES ONLY
+-----------------------------------------------------+  Layer 1
|         Infrastructure / Supabase                  |  supabase client, edge functions
+-----------------------------------------------------+
```

### Layer Import Rules

| Layer | Contents | May Import From |
|-------|----------|-----------------|
| Domain | `src/domain/*` | Nothing (pure types) |
| Infrastructure | `src/lib/supabase/` | Domain only |
| Intelligence | `src/lib/intelligence/` | Domain + Infrastructure |
| Interoperability | `src/lib/interoperability/` | Domain + Infrastructure |
| Application | `src/app/providers/` | All lib layers |
| Features | `src/features/` | Application + lib layers |
| UI Components | `src/components/` | Domain only |

### CaseContext is NOT the source of truth

`CaseContext` is a query/state orchestration layer — a cache of the database state for the UI.
Every mutation follows this path:

```
UI action
  -> Application mutation
  -> Supabase RPC / Edge Function (JWT)
  -> PostgreSQL + RLS (write)
  -> audit_event (same transaction)
  -> timeline_event
  -> query invalidation
  -> CaseContext refreshes
  -> UI re-renders
```

The database is authoritative. CaseContext reads from it.

---

## 3. Domain Model Layer

All canonical types live in `src/domain/`. Framework-free TypeScript interfaces only.
No React, no Supabase, no FHIR coupling in this layer.

### Entity Relationship

```
Organization
    |
    +--< OrganizationMembership (user + role per org)
    |
    +--< Case
              |
              +--- Patient
              +--- Encounter
              +--< ClinicalFinding
              |         +--- ProvenanceRecord
              |         +--- SafetyIssue (conditional)
              +--< CandidateHypothesis
              |         +--- ProvenanceRecord
              |         +--- HypothesisFindingLink[]
              |         +--- InformationGap[]
              +--< InvestigationOrder
              |         +--- ProvenanceRecord
              +--< ClinicalDocument
              |         +--- ProvenanceRecord
              +--< NexusAssessment (versioned; one ACTIVE at a time)
              |         +--- AssessmentEvidenceSource[]
              |         +--- DetectedContradiction[]
              |         +--- QualitativeUncertainty
              |         +--- supersedes_assessment_id (nullable)
              +--< TimelineEvent (immutable log)
              +--< AuditEvent (immutable ledger)
```

### Key Type Definitions

**CaseStatus (13 states):**
`DRAFT`, `ACTIVE`, `ANALYZING`, `PRELIMINARY`, `REVIEW_REQUIRED`, `CLINICIAN_REVIEW`,
`DECISION_RECORDED`, `RESOLVED`, `UNCERTAIN`, `CONTRADICTORY`, `SAFETY_REVIEW`,
`INSUFFICIENT_DATA`, `OUT_OF_SCOPE`

**CanonicalHypothesisStatus — no numeric probability, ever:**
`CANDIDATE`, `SUPPORTED`, `CONTRADICTED`, `INSUFFICIENT_DATA`, `DISMISSED`

**ProvenanceType (6 types):**
`HUMAN_ENTERED`, `DEVICE_MEASURED`, `IMPORTED`, `AI_EXTRACTED`, `AI_GENERATED`, `CLINICIAN_VERIFIED`

---

## 4. Authorization, Roles and Permissions

Authorization is a **current architecture requirement**, not a Phase 8 concern.

### Model

```
User
  -> OrganizationMembership (userId + organizationId + role)
  -> Role -> Permission matrix
  -> authorize(permission, targetOrganizationId)
```

Authorization is always organization-scoped. A user with a role in Org A cannot satisfy
permission checks for Org B. The database is the final enforcement point via RLS.

### Roles (defined in `src/domain/auth.ts`)

| Role | Description |
|------|-------------|
| `clinician` | Attending physician — full clinical authority |
| `nurse` | Clinical support — data entry and observation |
| `laboratory` | Lab staff — result entry only; no clinical decision access |
| `reviewer` | Clinical reviewer — read + review authority |
| `organization_admin` | Org management only — **no clinical decision authority** |
| `platform_admin` | Platform-level only — no clinical access |

> **Critical rule:** `organization_admin` does not receive clinical access. Admin is segregated from clinical decision authority by design.

### Permission Set

```
case.view, case.create, case.edit, case.close
finding.view, finding.create, finding.edit, finding.verify
investigation.view, investigation.request
investigation.result.create, investigation.result.verify
nexus.view, nexus.review, nexus.accept, nexus.edit, nexus.reject
decision.view, decision.create, decision.amend
safety.view, safety.resolve
task.view, task.create, task.update
team.view, team.manage
user.view, user.manage
organization.view, organization.manage
audit.view
```

### Role-Permission Matrix

| Permission | clinician | nurse | lab | reviewer | org_admin | platform_admin |
|---|---|---|---|---|---|---|
| case.view | Y | Y | Y | Y | Y | |
| case.create | Y | | | | Y | |
| case.edit | Y | | | | Y | |
| case.close | Y | | | Y | Y | |
| finding.create | Y | Y | | | | |
| finding.verify | Y | | | Y | | |
| investigation.request | Y | | | | | |
| investigation.result.create | | | Y | | | |
| investigation.result.verify | Y | | | Y | | |
| nexus.view | Y | Y | | Y | | |
| nexus.review | Y | | | Y | | |
| nexus.accept | Y | | | Y | | |
| nexus.reject | Y | | | Y | | |
| decision.create | Y | | | Y | | |
| safety.resolve | Y | | | Y | | |
| team.manage | | | | | Y | |
| user.manage | | | | | Y | Y |
| organization.manage | | | | | Y | Y |
| audit.view | | | | Y | Y | Y |

### Case Closure & Soft-Deletion Semantics

In clinical information systems, patient records, diagnostic findings, and case records must **never be physically deleted** (`DELETE FROM cases`). Hard deletes destroy legal diagnostic audit trails and violate regulatory data retention standards (MDCG 2021-6, FDA SaMD, HIPAA).

Nexus implements a non-destructive **Soft-Deletion Pattern** via `src/features/cases/api/deleteCase.ts`:
1. When a user requests to delete or close an active case, the case status is transitioned to `RESOLVED` and `closed_at` is stamped with the current timestamp.
2. In the same operation, an immutable audit event (`event_type: 'DELETED'`, `action_type: 'CASE_DELETED'`) is appended to `public.audit_events` with the user's display name and justification.
3. RLS policy `case_close_permission` (Migration 032) grants closure authorization to assigned case team members or users with `case.close` permission (`clinician`, `reviewer`, `organization_admin`).

### Authorization Check Pattern

```typescript
// Always organization-scoped — never permission alone
authorize(permission: AppPermission, targetOrganizationId: string): boolean

// Checks:
// 1. User has active OrganizationMembership for targetOrganizationId
// 2. That membership's role includes the requested permission
// 3. RLS enforces this at DB level as the final guard
```

---

## 5. Database Schema and RLS

### organizations

```sql
CREATE TABLE organizations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  organization_type TEXT,
  country_code     CHAR(2),
  timezone         TEXT DEFAULT 'UTC',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### profiles

```sql
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  profession       TEXT,
  license_identifier TEXT,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### organization_memberships

```sql
CREATE TABLE organization_memberships (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  role             TEXT NOT NULL CHECK (role IN (
                     'clinician','nurse','laboratory','reviewer',
                     'organization_admin','platform_admin')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
```

### cases

```sql
CREATE TABLE cases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  patient_id       UUID REFERENCES patients(id),
  case_number      TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'DRAFT',
  priority         TEXT NOT NULL DEFAULT 'ROUTINE',
  opened_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at        TIMESTAMPTZ,
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### nexus_assessments (versioned)

```sql
CREATE TABLE nexus_assessments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                  UUID NOT NULL REFERENCES cases(id),
  version                  INTEGER NOT NULL DEFAULT 1,
  status                   TEXT NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('ACTIVE','SUPERSEDED','REJECTED')),
  supersedes_assessment_id UUID REFERENCES nexus_assessments(id),
  model_name               TEXT NOT NULL,
  model_version            TEXT NOT NULL,
  provenance_type          TEXT NOT NULL DEFAULT 'AI_GENERATED',
  verification_status      TEXT NOT NULL DEFAULT 'UNVERIFIED',
  clinical_summary         TEXT,
  raw_output               JSONB,
  generated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at              TIMESTAMPTZ,
  reviewed_by              UUID REFERENCES auth.users(id),
  UNIQUE(case_id, version)
);
-- Only one ACTIVE assessment per case — enforced by trigger or application constraint
```

### sync_events (persistent idempotency + queue)

Replaces both the in-memory `Set<string>` and the in-memory `SyncQueue`. Survives edge function restarts.

```sql
CREATE TABLE sync_events (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id),
  integration_source_id  TEXT NOT NULL,
  external_resource_type TEXT NOT NULL,
  external_resource_id   TEXT NOT NULL,
  idempotency_key        TEXT NOT NULL,
  operation              TEXT NOT NULL CHECK (operation IN ('IMPORT','EXPORT','SYNC')),
  status                 TEXT NOT NULL DEFAULT 'QUEUED'
                           CHECK (status IN (
                             'QUEUED','PROCESSING','SUCCEEDED',
                             'FAILED','RETRYING','DEAD_LETTER')),
  attempt_count          INTEGER NOT NULL DEFAULT 0,
  last_attempted_at      TIMESTAMPTZ,
  succeeded_at           TIMESTAMPTZ,
  error_detail           TEXT,
  payload                JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sync_events_idempotency_idx ON sync_events(idempotency_key);
```

Queue states: `QUEUED` → `PROCESSING` → `SUCCEEDED` / `FAILED` → `RETRYING` → `DEAD_LETTER`

Job claims use `SELECT ... FOR UPDATE SKIP LOCKED` (atomic, prevents double-processing).
`PROCESSING` items older than 5 minutes are re-queued by a cron job.

### audit_events (immutable)

```sql
CREATE TABLE audit_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  case_id          UUID REFERENCES cases(id),
  actor_user_id    UUID REFERENCES auth.users(id),
  action           TEXT NOT NULL,
  resource_type    TEXT NOT NULL,
  resource_id      TEXT,
  detail           JSONB,
  recorded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
-- INSERT: allowed for service role
-- SELECT: allowed for audit.view permission holders only (via RLS)
-- UPDATE / DELETE: no policies defined = blocked
```

### Row Level Security Pattern

```sql
-- Example: cases table
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY cases_org_isolation ON cases FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

RLS must exist on every table containing clinical data. No exceptions.

### Backend Case State Transition Enforcement

The TypeScript `validateCaseTransition()` enforces UX and application logic.
The PostgreSQL function is the final authority — a client cannot bypass it.

```sql
CREATE OR REPLACE FUNCTION transition_case_status(
  p_case_id UUID,
  p_target_status TEXT,
  p_actor_user_id UUID
) RETURNS void AS $$
DECLARE
  v_current_status TEXT;
  v_allowed TEXT[];
BEGIN
  SELECT status INTO v_current_status FROM cases WHERE id = p_case_id FOR UPDATE;

  v_allowed := CASE v_current_status
    WHEN 'DRAFT'             THEN ARRAY['ACTIVE']
    WHEN 'ACTIVE'            THEN ARRAY['ANALYZING','INSUFFICIENT_DATA','CONTRADICTORY','SAFETY_REVIEW','OUT_OF_SCOPE']
    WHEN 'ANALYZING'         THEN ARRAY['PRELIMINARY','CONTRADICTORY','INSUFFICIENT_DATA','ACTIVE']
    WHEN 'PRELIMINARY'       THEN ARRAY['REVIEW_REQUIRED','CONTRADICTORY','INSUFFICIENT_DATA']
    WHEN 'REVIEW_REQUIRED'   THEN ARRAY['CLINICIAN_REVIEW','SAFETY_REVIEW','INSUFFICIENT_DATA']
    WHEN 'CLINICIAN_REVIEW'  THEN ARRAY['DECISION_RECORDED','REVIEW_REQUIRED','ACTIVE']
    WHEN 'DECISION_RECORDED' THEN ARRAY['RESOLVED','CLINICIAN_REVIEW']
    WHEN 'RESOLVED'          THEN ARRAY['ACTIVE']
    WHEN 'UNCERTAIN'         THEN ARRAY['ACTIVE','REVIEW_REQUIRED','CLINICIAN_REVIEW']
    WHEN 'CONTRADICTORY'     THEN ARRAY['SAFETY_REVIEW','CLINICIAN_REVIEW','ACTIVE']
    WHEN 'SAFETY_REVIEW'     THEN ARRAY['CLINICIAN_REVIEW','ACTIVE']
    WHEN 'INSUFFICIENT_DATA' THEN ARRAY['ACTIVE','CLINICIAN_REVIEW']
    WHEN 'OUT_OF_SCOPE'      THEN ARRAY['ACTIVE']
    ELSE ARRAY[]::TEXT[]
  END;

  IF NOT (p_target_status = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Illegal case transition: % -> %', v_current_status, p_target_status;
  END IF;

  UPDATE cases SET status = p_target_status, updated_at = now() WHERE id = p_case_id;

  -- Audit in the SAME transaction. If audit fails, status update rolls back.
  INSERT INTO audit_events (organization_id, case_id, actor_user_id, action, resource_type, resource_id, detail)
  SELECT organization_id, p_case_id, p_actor_user_id,
         'status_transition', 'case', p_case_id::text,
         jsonb_build_object('from', v_current_status, 'to', p_target_status)
  FROM cases WHERE id = p_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Authentication & Password Hashing Architecture (Migration 031)

When Supabase GoTrue processes password authentication (`POST /auth/v1/token?grant_type=password`), it performs strict verification across both `auth.users` and `auth.identities`:
1. **Password Encryption**: Stored passwords must be valid bcrypt hashes. Plaintext or empty strings cause immediate rejection with `400: Invalid login credentials`. Passwords are encrypted using PostgreSQL `pgcrypto`:
   ```sql
   extensions.crypt('PasswordString', extensions.gen_salt('bf', 10))
   ```
2. **GoTrue Identity Provider Binding**: Seeding `auth.users` directly without `auth.identities` breaks authentication. GoTrue requires a linked identity record for the `email` provider with `identity_data` containing `{"sub": user_id, "email": email, "email_verified": true}`.
3. **Institutional Accounts**: Demo clinical personas are deterministically seeded and synced with `public.profiles` and `public.organization_members`:
   - `dr.sarah.chen@nexus-hospital.demo` (Clinician) — `NexusDemo2026!`
   - `prof.marcus.vance@nexus-hospital.demo` (Reviewer) — `NexusDemo2026!`
   - `nurse.elena.rostova@nexus-hospital.demo` (Nurse) — `NexusDemo2026!`
   - `lab.david.kim@nexus-hospital.demo` (Lab) — `NexusDemo2026!`
   - `admin@nexus-hospital.demo` (Organization Admin) — `NexusAdmin2026!`

### Case Closure & Soft-Delete RLS Policy (Migration 032)

To allow authorized clinicians and reviewers to close or soft-delete cases without granting blanket update privileges over other clinical fields, Migration 032 introduces a scoped RLS policy:

```sql
-- 1. Register case.close permission
insert into public.permissions (code, description)
values ('case.close', 'Close or archive a clinical case')
on conflict (code) do nothing;

-- 2. Grant to clinician, reviewer, organization_admin
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('clinician', 'reviewer', 'organization_admin')
  and p.code = 'case.close'
on conflict do nothing;

-- 3. Dedicated RLS UPDATE policy for case closure
create policy "case_close_permission"
  on public.cases for update to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.close'))
  )
  with check (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.close'))
  );
```

---

## 6. Case State Machine

Application layer: `src/lib/case-state-machine.ts` — UX enforcement
Database layer: `transition_case_status()` PostgreSQL function — final authority

### Transition Table

| From | Allowed Transitions To |
|------|------------------------|
| DRAFT | ACTIVE |
| ACTIVE | ANALYZING, INSUFFICIENT_DATA, CONTRADICTORY, SAFETY_REVIEW, OUT_OF_SCOPE |
| ANALYZING | PRELIMINARY, CONTRADICTORY, INSUFFICIENT_DATA, ACTIVE |
| PRELIMINARY | REVIEW_REQUIRED, CONTRADICTORY, INSUFFICIENT_DATA |
| REVIEW_REQUIRED | CLINICIAN_REVIEW, SAFETY_REVIEW, INSUFFICIENT_DATA |
| CLINICIAN_REVIEW | DECISION_RECORDED, REVIEW_REQUIRED, ACTIVE |
| DECISION_RECORDED | RESOLVED, CLINICIAN_REVIEW |
| RESOLVED | ACTIVE (re-open under formal review) |
| UNCERTAIN | ACTIVE, REVIEW_REQUIRED, CLINICIAN_REVIEW |
| CONTRADICTORY | SAFETY_REVIEW, CLINICIAN_REVIEW, ACTIVE |
| SAFETY_REVIEW | CLINICIAN_REVIEW, ACTIVE |
| INSUFFICIENT_DATA | ACTIVE, CLINICIAN_REVIEW |
| OUT_OF_SCOPE | ACTIVE |

### PRELIMINARY vs REVIEW_REQUIRED — Explicit Distinction

| State | Meaning |
|-------|---------|
| `PRELIMINARY` | Assessment generated and persisted. Not yet placed into formal review queue. Assessment is visible but no clinician action has been initiated. |
| `REVIEW_REQUIRED` | Formal review queue has been created. At least one unreviewed AI finding exists. Clinician action is actively required. |

The workflow explicitly performs both transitions:

```
nexus-review generates and persists assessment
  |
  v
case -> PRELIMINARY  (assessment exists, not yet in review)
  |
  v
system creates review queue items
  |
  v
case -> REVIEW_REQUIRED  (review initiated, clinician action needed)
```

### State Clinical Meanings

| State | Clinical Meaning |
|-------|-----------------|
| DRAFT | Case initialised, not yet active in clinical intake |
| ACTIVE | Active clinical assessment underway; data gathering in progress |
| ANALYZING | Nexus reasoning evaluating findings and biomarker trends |
| PRELIMINARY | Initial assessment generated; not yet in formal review queue |
| REVIEW_REQUIRED | Review queue created; clinician action actively required |
| CLINICIAN_REVIEW | Attending clinician actively reviewing candidate hypotheses |
| DECISION_RECORDED | Authoritative clinical decision recorded by physician |
| RESOLVED | Encounter concluded; management plan executed |
| UNCERTAIN | Diagnostic ambiguity; competing hypotheses similar plausibility |
| CONTRADICTORY | Conflicting findings require human reconciliation |
| SAFETY_REVIEW | Urgent red flag requiring immediate clinician sign-off |
| INSUFFICIENT_DATA | Missing requisite baseline information |
| OUT_OF_SCOPE | Requires tertiary specialisation outside current protocol |

### State Invariants (database-enforced)

| State | Required Condition |
|-------|--------------------|
| REVIEW_REQUIRED | At least one unreviewed AI finding in review queue |
| SAFETY_REVIEW | At least one SafetyIssue with severity=High and status=Active |
| DECISION_RECORDED | Named clinician has accepted or overridden a hypothesis |
| RESOLVED | All High-severity safety issues are Resolved or Acknowledged |

---

## 7. Clinical Workspace Design

### Layout

The case header is a global context bar, not a zone. The workspace is a 3-zone layout.

```
Case Header — patient identity | case status | priority | care team
+------------------+---------------------------+----------------------+
| Case Navigation  | Clinical Workspace        | Intelligence Rail    |
| (Zone B)         | (Zone C — active tab)     | (Zone D)             |
|                  |                           |                      |
| Clinical Data    |                           | Case state           |
| Findings         |                           | Why review needed    |
| Investigations   | (Active tab content)      | Hypotheses           |
| Hypotheses       |                           | Evidence summary     |
| Evidence         |                           | Uncertainty          |
| Reasoning        |                           | Information gaps     |
| Decision         |                           | Safety alerts        |
| Safety           |                           | Ask Nexus            |
| Timeline         |                           |                      |
| Team             |                           |                      |
| Review           |                           |                      |
| Documents        |                           |                      |
| Summary          |                           |                      |
+------------------+---------------------------+----------------------+
```

### Intelligence Rail Scope

The Intelligence Rail is a contextual clinical workspace, not a chatbot sidebar. It is a **Nexus Intelligence & Review Rail**. Panels are mounted and unmounted automatically via a **Context Dispatch Matrix** based on the clinician's active center tab. A manual filter override (`AUTO / SIGNALS / REVIEW / EVIDENCE`) is available in the rail header.

**Panel inventory:**

| Panel | Component | Purpose |
|-------|-----------|----------|
| Case Signals | `CaseSignalsPanel` | Deterministic flags: safety alerts, unverified findings, pending tests |
| Hypotheses | `HypothesesRailPanel` | Top-3 candidates — qualitative status, supporting/contradicting counts. No % |
| Evidence | `EvidenceRailPanel` | MedCPT-reranked guideline excerpts. Rerankable on demand |
| Uncertainty | `UncertaintyRailPanel` | `primaryReason`, evidence consistency, pending test conditioning |
| Quick Review | `QuickReviewRailPanel` | In-rail Accept / Edit / Reject with immediate audit trail |
| Ask Nexus | `AskNexusRailPanel` | Secondary grounded case query input (collapsible, bottom) |

**Context Dispatch Matrix:**

| Active Center Tab | Mounted Panels (top → bottom) |
|---|---|
| `summary` (default) | Case Signals → Hypotheses → Evidence → Ask Nexus |
| `documents` | Quick Review → Case Signals → Evidence |
| `investigations` | Case Signals → Uncertainty → Hypotheses |
| `findings` | Quick Review → Uncertainty → Hypotheses |
| `reasoning` | Hypotheses → Evidence → Uncertainty → Ask Nexus |
| `safety` / `rules` | Case Signals → Uncertainty → Ask Nexus |

**FHIR Hub and integration controls belong in the Documents tab**, not the Intelligence Rail.

### Tab Inventory

| Tab | File | Phase | Purpose |
|-----|------|-------|---------|
| Clinical Data | ClinicalDataTab.tsx | 6B | History, vitals, medications, allergies |
| Findings | FindingsTab.tsx | 6C | Clinical findings with provenance badges |
| Investigations | InvestigationsTab.tsx | 6C | Ordered investigations and results |
| Reasoning | ReasoningTab.tsx | 6F | Candidate hypotheses, qualitative status |
| Evidence | EvidenceTab.tsx | 6F | Supporting clinical evidence |
| Decision | DecisionTab.tsx | 6G | Clinical decision recording |
| Safety | SafetyTab.tsx | 6G | Safety issues lifecycle |
| Timeline | TimelineTab.tsx | 6D | Chronological clinical events |
| Team | TeamTab.tsx | 6D | Care team and assignments |
| Review | ReviewTab.tsx | 6G | AI output review queue |
| Documents | DocumentsTab.tsx | 6H | Documents and FHIR integration hub |
| Rules & CDS | RulesTab.tsx | 9 | Deterministic guideline scoring, dosing, DDIs, allergy cross-reactivity |
| Summary | SummaryTab.tsx | 6G | Case summary output |

### Administration Panel Tab Inventory (Phase 8)

| Tab | File | Permission Required | Purpose |
|-----|------|--------------------|---------|
| Organisation Settings | OrgSettingsTab.tsx | `organization.manage` | Name, type, country, timezone |
| Team Members | TeamMembersTab.tsx | `user.manage` | Member roster, roles, invitations |
| FHIR Endpoints | FhirEndpointsTab.tsx | `organization.manage` | Org-scoped external system connections |
| Audit Log | AuditLogTab.tsx | `audit.view` | Immutable event ledger viewer |
| System Disclosure | SystemDisclosureTab.tsx | None (all authenticated) | AI model registry and provenance reference |

---

## 8. Intelligence and Reasoning Layer

### Architecture Principle

Nexus does **not** build `Frontend → LLM → Answer`. It builds:

```
ClinicalCase
    |
    v
[Context Builder — Controlled Context Package]
    |        |        |
Patient  Clinical  Documents
data     rules
    |
    v
[Evidence Layer — MedCPT two-stage retrieval]
    |
    v
[AI Reasoning — MedGemma with system rules]
    |
    v
[Schema / Grounding Validation — hard rejection]
    |
    v
[NexusAssessment — provenance-tagged, UNVERIFIED]
    |
    v
[Human Review — clinician adjudicates every finding]
```

### 18 Non-Negotiable System Rules

Defined in `src/domain/contracts/intelligence-contracts.ts` as `NEXUS_SYSTEM_RULES`. Enforced by schema validation at every output step.

| # | Rule (abbreviated) |
|---|---|
| 1 | AI cannot directly mutate clinical records |
| 2 | Every AI output must carry ContractProvenance |
| 3 | No numeric probability in any output |
| 4 | Uncertainty expressed via QualitativeUncertainty only |
| 5 | Hard rejection for `87% probability / risk / certainty` patterns |
| 6 | All contextFindingIds must exist in the active case |
| 7 | All contextEvidenceIds must exist in the evidence library |
| 8 | NER spans carry character-accurate start/end offsets |
| 9 | Model name and version required in every ProvenanceRecord |
| 10 | No `definitive diagnosis is` / `diagnosed with certainty` declarations |
| 11 | Clinician review required before any AI finding enters clinical record |
| 12 | Safety issues are deterministic rule outputs — not AI-generated |
| 13 | Evidence rerankScore represents retrieval relevance only |
| 14 | Extraction outputs are CandidateFindingProposals — not findings |
| 15 | Classification confidence is a model signal — not a clinical probability |
| 16 | Context buckets: KNOWN / INFERRED / UNKNOWN — never collapsed |
| 17 | AI retry hard limit: maximum 2 attempts, then STOP |
| 18 | All audit events written in the same transaction as the mutation |

### Specialized Model Stack

Defined in `src/lib/intelligence/governance/model-registry.ts`. These are **engineering candidates evaluated against clinical AI literature** — not clinical validation claims.

| Registry ID | HF Model ID | Role | Status |
|---|---|---|---|
| `biomedical-ner-all` | `d4data/biomedical-ner-all` | Clinical NER (SYMPTOM, DISEASE, MEDICATION, PROCEDURE, ANATOMY, LAB_VALUE, SEVERITY) | ACTIVE |
| `bart-doc-classifier` | `facebook/bart-large-mnli` | Zero-shot clinical document type classification | ACTIVE |
| `bioclinicalbert-finding-classifier` | `emilyalsentzer/Bio_ClinicalBERT` | Clinical BERT representation & finding classification | ACTIVE |
| `medcpt-query-encoder` | `ncbi/MedCPT-Query-Encoder` | Dense query embedding (pgvector) | ACTIVE |
| `medcpt-article-encoder` | `ncbi/MedCPT-Article-Encoder` | Evidence article indexing | ACTIVE |
| `medcpt-cross-encoder` | `ncbi/MedCPT-Cross-Encoder` | Two-stage cross-encoder reranking | ACTIVE |
| `biomed-reranker` | `NYSgpt/biomed-reranker` | Challenger reranker | CHALLENGER |
| `falconsai-medical-summarization` | `Falconsai/medical_summarization` | Clinical document summarization & synthesis | ACTIVE |
| `medgemma-27b-text-it` | `google/medgemma-27b-text-it` | Case synthesis + assessment (Private / Custom Endpoint) | ACTIVE |

No model receives un-controlled clinical data. All inputs pass through the Context Builder first.

### Component Map

```
src/domain/contracts/
+-- intelligence-contracts.ts   — 18 System Rules, all pipeline contracts as TypeScript types

src/lib/intelligence/
+-- context-builder.ts          — Controlled Context Package with EpistemicContextBuckets
+-- data-quality-service.ts     — Pre-reasoning deterministic quality checks
+-- evidence-service.ts         — Evidence retrieval and ranking
+-- nexus-assessment-schema.ts  — AI output schema validation (hardened grounding)
+-- reasoning-orchestrator.ts   — Main pipeline
+-- reasoning-provider.ts       — AI provider abstraction
+-- governance/
|   +-- model-registry.ts       — Specialized HF model registry with operational constraints
+-- services/
    +-- extraction-service.ts        — MedBERT NER adapter (character-accurate spans)
    +-- classification-service.ts    — Document + finding classification adapters
    +-- evidence-ranking-service.ts  — MedCPT two-stage retrieval pipeline
```

### Orchestration Pipeline

```
ClinicalCase Data
  |
  v
[1] Data Quality Check (deterministic — runs before any AI call)
  |
  v
[2] NER Extraction (medbert-clinical-ner — character-accurate spans)
  |  Output: CandidateFindingProposal[] — never written directly
  v
[3] Document Classification (clinicalbert-doc-classifier)
  |  Output: processingStrategy — LAB / IMAGING / CLINICAL_NOTE
  v
[4] Evidence Retrieval — Two-Stage MedCPT Pipeline
  |  Stage 1: Dense pgvector match (top 50)
  |  Stage 2: MedCPT Cross-Encoder reranking (top N)
  |  rerankScore = retrieval relevance — never a diagnostic probability
  v
[5] Context Builder — Controlled Context Package
  |  Buckets: KNOWN / INFERRED / UNKNOWN (never collapsed)
  |  Token budget enforced; low-priority items truncated
  v
[6] Reasoning Provider (MedGemma — abstracted behind interface)
  |
  v
[7] Schema Validation (validateAssessmentOutput)
  |  Rule 5: Reject any numeric probability/risk/certainty pattern
  |  Rule 10: Reject definitive diagnosis declarations
  |  Attempt 1: fail -> Attempt 2 (corrective prompt) -> fail -> STOP
  v
[8] Grounding Check (validateGrounding) — HARD ERRORS
  |  All supportingFindingIds must exist in the active case
  |  All evidenceIds must exist in the evidence library
  v
[9] Persist + State Transition (PostgreSQL transaction)
  |
  v
NexusAssessment (provenanceType: AI_GENERATED, verificationStatus: UNVERIFIED)
```

### AI Retry — Hard Maximum of 2 Attempts

```
Attempt 1 -> validation/grounding failure
               |
               v
Attempt 2 (corrective system prompt) -> failure
               |
               v
STOP. Never retry further.
Case -> REVIEW_REQUIRED
Intelligence status: UNAVAILABLE
```

Never retry until the model produces something acceptable. Two attempts only.

### Assessment Versioning

A case accumulates assessments as new data arrives:

```
Assessment v1 (status: ACTIVE)
  |
  | New lab results / findings / clinician corrections
  v
Assessment v2 generated
  v1 -> SUPERSEDED  (retained for audit)
  v2 -> ACTIVE (supersedes_assessment_id = v1.id)
```

Only one assessment per case is `ACTIVE`. All prior assessments are retained.

### Provider Abstraction

```typescript
interface ReasoningProvider {
  name: string;
  generate(prompt: string, systemPrompt: string): Promise<string>;
}
// Supported: OpenAI GPT, Vertex AI, Mock provider
// The orchestrator never knows which model is active
```

### Qualitative Uncertainty — No Numbers

```typescript
interface QualitativeUncertainty {
  dataCompleteness: 'High' | 'Moderate' | 'Low';
  dataCompletenessReason: string;
  evidenceConsistency: 'High' | 'Moderate' | 'Conflicting';
  evidenceConsistencyReason: string;
  modelApplicability: 'High' | 'Moderate' | 'Limited';
  modelApplicabilityReason: string;
  overallState: 'REQUIRES REVIEW' | 'CONTRADICTORY' | 'INSUFFICIENT DATA' | 'STABLE';
  primaryReason: string;
}
```

### Data Quality Pre-Check

Before any AI reasoning call:

```
runDataQualityChecks({ findings, investigations, informationGaps })

Checks:
  completeness — mandatory fields present?
  recency      — timestamps within acceptable window?
  consistency  — cross-referenced IDs resolve?

If completenessScore = 'Low':
  pipeline halts immediately
  case flagged INSUFFICIENT_DATA
  no AI call is made
```

---

## 9. Safety and Provenance System

### Provenance Record

```typescript
interface ProvenanceRecord {
  id: string;
  provenanceType: ProvenanceType;
  sourceSystem?: string;    // e.g. 'Epic EHR', 'Mindray BeneVision'
  sourceReference?: string;
  actorUserId?: string;
  modelName?: string;       // Required for AI types
  modelVersion?: string;    // Required for AI types (regulatory audit)
  capturedAt?: string;
  notes?: string;
  createdAt: string;
}
```

### UI Provenance Badge Rules

| provenanceType | UI Display | Can progress case? |
|----------------|------------|-------------------|
| HUMAN_ENTERED | None (trusted baseline) | Yes |
| DEVICE_MEASURED | Device icon | Yes (after QA check) |
| IMPORTED | Import icon | Yes (after clinician review) |
| AI_EXTRACTED | Yellow AI badge + UNVERIFIED | No — requires CLINICIAN_VERIFIED |
| AI_GENERATED | Orange AI badge + UNVERIFIED | No — requires CLINICIAN_VERIFIED |
| CLINICIAN_VERIFIED | Green checkmark | Yes |

### Safety Issue Lifecycle

```
Detected (AI or rule-based)
  status: Active - Review Required
  provenanceType: AI_GENERATED
  |
  v
Acknowledged (clinician confirms awareness)
  acknowledgedBy: userId
  acknowledgedAt: timestamp
  |
  v
Resolved (clinician signs off)
  clinicalNote: required
  |
  v
Archived (audit trail — immutable)
```

### Auto-Escalation Triggers

| Trigger | Immediate Effect |
|---------|-----------------|
| SafetyIssue severity=High created | Case -> SAFETY_REVIEW (DB enforced) |
| Two+ contradictory findings on same body system | Case -> CONTRADICTORY |
| HIGH PRIORITY info gap unresolved > 24h | System alert (no auto-transition) |
| Contradicted hypothesis still Pending Review | Case -> REVIEW_REQUIRED |

---

## 10. FHIR R4 Interoperability Layer

### Core Principle

> The Nexus internal model is NEVER stored as FHIR.
> FHIR translation happens ONLY at the boundary.

### Integration Architecture

```
EXTERNAL SYSTEMS
  +-- EHR / LHIMS     (FHIR R4 REST)
  +-- LIS / Lab       (HL7 v2 / FHIR DiagnosticReport)
  +-- PACS / Imaging  (DICOMweb / FHIR ImagingStudy)
  +-- Bedside Devices (HL7 v2 / FHIR Observation)
       |
       v
  [Connector Layer]           src/lib/interoperability/connectors/
       |
       v
  [7-Step FHIR Validation]    src/lib/interoperability/fhir/validators.ts
       |
       v
  [Terminology Service]       src/lib/interoperability/normalization/
  |  Candidate match only — not authoritative auto-conversion
       v
  [FHIR Mappers]              src/lib/interoperability/mappers/
  |  Pure functions — no side effects, no API calls
       v
  [Sync Pipeline]             src/lib/interoperability/sync/
  |  Idempotency: Postgres sync_events
  |  Queue: Postgres sync_events status
       v
  [Nexus Domain Layer]  — no FHIR coupling
       v
  [UI / Clinical Workspace]
```

### Corrected ClinicalFinding FHIR Mapping

The previous strategy of mapping all ClinicalFindings to `Condition` was too broad.

```
ClinicalFinding
  |
  +-- condition-like (symptoms, signs, diagnoses)          -> FHIR Condition
  |
  +-- observation-like (measurements, vitals, lab values)  -> FHIR Observation
  |
  +-- history narrative (past conditions)                  -> FHIR Condition
  |     clinicalStatus: resolved / inactive
  |
  +-- AI interpretation / nexus reasoning artifact         -> NOT mapped to FHIR
        (remains Nexus-domain internal — not for external systems)
```

A `CandidateHypothesis` is NOT automatically mapped to FHIR Condition.
It becomes a Condition only after:
1. Clinician accepts it (`clinicalReviewStatus: 'Accepted'`)
2. A clinical decision is formally recorded

### Mapper Inventory

| FHIR Resource | Nexus Domain Type | Mapper File | Notes |
|---------------|-------------------|-------------|-------|
| Patient | Patient | mappers/patient.ts | |
| Encounter | Encounter | mappers/encounter.ts | |
| Condition | ClinicalFinding (condition-like only) | mappers/condition.ts | Not all findings |
| Observation | Observation / ClinicalFinding (obs-like) | mappers/observation.ts | |
| DiagnosticReport | DiagnosticReport | mappers/diagnostic-report.ts | |
| DocumentReference | ClinicalDocument | mappers/document-reference.ts | |
| Practitioner | Practitioner | mappers/practitioner.ts | |
| CareTeam | CareTeam | mappers/care-team.ts | |
| Task | InvestigationOrder | mappers/task.ts | |
| ServiceRequest | InvestigationOrder | mappers/service-request.ts | |
| AuditEvent | AuditEntry | mappers/audit-event.ts | |
| Provenance | ProvenanceRecord | mappers/provenance.ts | |

### 7-Step FHIR Validation

```
[1] JSON / schema validity
      Is the resource valid JSON with required FHIR fields?

[2] FHIR resource validity
      Is resourceType a known FHIR R4 type?
      Are required fields for that type present?

[3] Profile / conformance check
      Does the resource conform to declared meta.profile?
      Note: full conformance validation deferred to a FHIR validator library in production

[4] Terminology validation
      Are system URIs from the canonical registry (version.ts)?
      Are codes non-empty?
      Candidate check only — not authoritative code validation

[5] Reference validation
      Do contained references resolve within the bundle?

[6] Business-rule validation
      e.g. Observation must have value or dataAbsentReason
      e.g. Condition must have a subject reference

[7] Organization / source authorization
      Does the source system have permission to import to this organization?
```

Steps 1–2 block on failure. Steps 3–7 log warnings and flag for review where appropriate.
Full conformance validation (step 3) is designed to be delegated to a FHIR validator library (e.g. HAPI Validator) in production.

### Terminology Service Abstraction

Free text is never silently converted to a coded concept without a confidence and ambiguity signal.

```typescript
interface TerminologyService {
  searchConcept(text: string, system: 'SNOMED' | 'LOINC' | 'ICD10' | 'RXNORM'):
    Promise<ConceptMatch[]>;
  validateCode(system: string, code: string):
    Promise<{ valid: boolean; display?: string }>;
  mapConcept(sourceSystem: string, sourceCode: string, targetSystem: string):
    Promise<ConceptMap | null>;
}

interface ConceptMatch {
  code: string;
  display: string;
  system: string;
  confidence: 'HIGH' | 'MODERATE' | 'LOW' | 'AMBIGUOUS';
  requiresVerification: boolean; // Always true for AI-matched concepts
}
```

The terminology service must not hard-code US-centric coding strategies.
The architecture supports WHO SMART-aligned multi-context deployments.

### Persistent Idempotency

```typescript
// Before (session-scoped, lost on restart):
const processedKeys = new Set<string>();

// After (Postgres-backed, survives restarts):
async function isAlreadyProcessed(key: string): Promise<boolean> {
  const { data } = await supabase
    .from('sync_events')
    .select('id')
    .eq('idempotency_key', key)
    .eq('status', 'SUCCEEDED')
    .single();
  return !!data;
}
```

### Retry and Circuit Breaker Parameters

| Parameter | Default | Notes |
|-----------|---------|-------|
| maxRetries | 3 | Hard cap — never auto-retry indefinitely |
| baseDelayMs | 1,000 ms | Initial backoff |
| maxDelayMs | 10,000 ms | Hard cap |
| jitter | +/- 20% | Prevents thundering herd |
| failureThreshold | 3 failures | Opens circuit |
| cooldownMs | 60,000 ms | Reset window |

### FHIR System URIs

All code system URIs are centralised in `src/lib/interoperability/fhir/version.ts`.
Never use inline URI strings — always import from that file.

---

## 11. Edge Function Architecture

All edge functions are Deno 1.x runtimes on Supabase's edge network.

### Function Inventory

| Function | Trigger | Description |
|----------|---------|-------------|
| `audit-event` | Every clinical write | Writes immutable AuditEvent |
| `contradiction-check` | On finding added | Semantic + rule-based contradiction detection |
| `evidence-search` | On hypothesis created | PubMed / knowledge base retrieval |
| `extract-findings` | Manual or auto | AI extraction from raw clinical text |
| `integration-export` | On demand | Compiles and pushes case as FHIR Bundle |
| `integration-import` | Webhook / manual | Receives and validates inbound FHIR Bundle |
| `integration-sync` | Scheduled / on demand | Bidirectional sync orchestrator |
| `nexus-review` | On demand | Full AI reasoning pipeline |
| `process-document` | On document upload | OCR + AI extraction |

### Transactional Audit Pattern

For critical mutations (state transitions, decision recording, safety resolution):

```
PREFERRED — PostgreSQL function (status transitions):
  BEGIN;
    UPDATE cases SET status = ... WHERE id = ...;
    INSERT INTO audit_events (...) VALUES (...);
  COMMIT;
  -- If audit insert fails, status update rolls back.

ALTERNATIVE — Outbox pattern (edge function mutations):
  INSERT INTO outbox_events (mutation_type, payload, audit_payload);
  -- Background worker processes both writes atomically.

NEVER:
  await updateCaseStatus(...);
  await writeAuditEvent(...);  // If this fails, audit is silently lost.
```

### Function Dependency Map

```
nexus-review
  +-- AI provider (external API — via Supabase secret)
  +-- evidence-search -> PubMed (external)
  +-- contradiction-check
  +-- audit-event (via DB transaction)

integration-sync
  +-- integration-import -> External EHR / LIS / PACS
  +-- integration-export -> External EHR / LIS
  +-- audit-event

process-document
  +-- extract-findings (AI)
  +-- audit-event
```

### Auth Flow

```
Client sends Supabase JWT
  -> Edge Function verifies JWT with service role key (Supabase secret)
  -> Function executes with verified user context
  -> External API calls use Supabase secrets only
  -> Results + audit events written to PostgreSQL
```

---

## 12. Data Flow — Persistence Model

### Clinician Creates a Finding

```
Clinician submits finding in FindingsTab
  -> Application mutation called
  -> Edge Function / Supabase RPC (JWT verified)
  -> PostgreSQL (RLS validates user + organization)
       findings row inserted
       ProvenanceRecord row { provenanceType: HUMAN_ENTERED, actor_user_id }
       timeline_event row inserted
       audit_event row inserted (same transaction)
  -> Query invalidation (Realtime or explicit re-fetch)
  -> CaseContext refreshes from DB (cache update)
  -> UI re-renders
```

### AI Reasoning Run

```
Clinician triggers Run Analysis in ReasoningTab
  -> nexus-review edge function { caseId, authToken }
     [1] Load full case context from PostgreSQL
     [2] runDataQualityChecks() -- if Low: INSUFFICIENT_DATA, stop
     [3] retrieveEvidenceForCase()
     [4] buildReasoningContext()
     [5] provider.generate()
     [6] validateAssessmentOutput() -- max 2 attempts; then STOP
     [7] validateGrounding()
  -> PostgreSQL transaction:
       INSERT nexus_assessments (status: ACTIVE, version: N+1)
       UPDATE nexus_assessments SET status = SUPERSEDED WHERE id = prior_id
       INSERT findings (AI_GENERATED, UNVERIFIED)
       INSERT hypothesis links + provenance records
       CALL transition_case_status(caseId, 'PRELIMINARY', actorId)
  -> COMMIT
  -> Query invalidation
  -> UI: UNVERIFIED badges on all AI findings
  -> system creates review queue items
  -> CALL transition_case_status(caseId, 'REVIEW_REQUIRED', actorId)
```

### FHIR Import Flow

```
FHIR Bundle received (webhook or DocumentsTab upload)
  -> integration-import edge function (JWT + org authorization)
     [1] 7-step FHIR validation per resource
     [2] Per resource:
           idempotencyKey = SHA-256(source::type::id)
           SELECT FROM sync_events WHERE idempotency_key = key
           If SUCCEEDED: skip (recordsSkipped++)
           If not found: INSERT sync_event (status: PROCESSING)
     [3] fromFhir*() mapper (pure function — no side effects)
     [4] INSERT to Nexus domain tables
     [5] UPDATE sync_event SET status = SUCCEEDED
     [6] INSERT audit_event (same transaction as steps 4 + 5)
  -> COMMIT
  -> ImportPipelineResult returned
```

### Case Soft-Deletion Flow

```
Clinician / Reviewer triggers Delete Case in CaseListView or CaseNav
  -> deleteCase.ts API called with { caseId, deletedByDisplayName }
  -> Supabase client updates public.cases:
       SET status = 'RESOLVED', closed_at = now(), updated_at = now()
       WHERE id = caseId
  -> RLS policy 'case_close_permission' validates:
       is_case_member(caseId) OR (is_org_member(org_id) AND has_permission('case.close'))
  -> Supabase client inserts into public.audit_events:
       event_type: 'DELETED'
       action_type: 'CASE_DELETED'
       summary: 'Clinical case removed from active index'
       recorded_at: now()
  -> Local CaseContext drops case from active workspace cache
  -> Navigation automatically redirects to Overview dashboard
```

### Clinical PDF Document Reconstruction & Verification Flow

```
Clinician uploads PDF or opens Document Reconstruction Review
  -> pdf-extraction-service.ts loads file buffer via pdfjs-dist
  -> Extracts structured text stream + per-token glyph bounding coordinates
  -> huggingface-api.ts / extraction-service.ts classifies clinical entities (NER)
  -> DocumentReconstructionReview.tsx mounts side-by-side verification:
       Left viewport: Interactive multi-page PDF document canvas
       Right viewport: Entity curation stream with character-level SourceSpans
  -> Clinician inspects bounding highlights overlaid on source text
  -> One-click "Accept Finding" converts verified candidate into ClinicalFinding (CLINICIAN_VERIFIED)
```

---

## 13. Dependency Graph

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| @supabase/supabase-js | ^2.116.0 | DB, auth, edge functions, realtime |
| lucide-react | ^1.16.0 | Clinical UI iconography |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.6.3 | Type system (strict mode) |
| vite | ^6.0.1 | Build tool and dev server |
| @vitejs/plugin-react | ^4.3.4 | React fast refresh |
| @types/react | ^18.3.12 | React type definitions |
| @types/react-dom | ^18.3.1 | ReactDOM type definitions |

No runtime AI SDK in the browser. All AI calls are made from edge functions.
API keys never reach the client bundle.

---

## 14. Security Model

### Authentication

- Supabase Auth (JWT) — all API calls require a valid session token
- Session tokens expire per Supabase configuration (default: 1 hour + refresh token)
- Edge functions verify JWT using Supabase service role key (never exposed to client)

### Authorization

- RLS on all PostgreSQL tables with clinical data — no exceptions
- Authorization is always organization-scoped: user + permission + target_organization_id
- `organization_admin` is segregated from clinical decision authority
- Application-layer `authorize()` check: first line of defence
- Database RLS: final enforcement — cannot be bypassed by client code

### API Key Management

- AI provider keys: Supabase edge function secrets only
- External system credentials: Supabase secrets only
- FHIR server tokens: injected into `FhirClient` at edge function runtime
- No secrets in the client bundle. No exceptions.

### Audit Integrity

- `audit_events` table: INSERT-only — no UPDATE, no DELETE permitted
- Critical mutation + audit event in the same DB transaction
- For edge function mutations: outbox pattern ensures eventual consistency

---

## 15. Performance Targets

Performance promises are not made before the backend is measured in staging under real PostgreSQL + RLS + network load.

### Measurement Framework

| Metric | Definition | Aspirational Target |
|--------|------------|---------------------|
| Initial shell render | First paint of app chrome | P95 < 1.5s |
| First meaningful clinical content | First case data visible | P95 < 3s |
| Full case hydration | All tabs loaded, no spinners | P95 < 5s |
| Tab switch (loaded tab) | Visibility toggle | P95 < 100ms |
| Nexus assessment | Reasoning start to result | P95 < 30s (AI provider dominates) |
| FHIR import (< 100 resources) | Received to domain records written | P95 < 3s |
| FHIR import (1,000 resources) | Received to domain records written | P95 < 15s |
| Audit event write | AuditEvent persisted | P95 < 500ms |

Targets are aspirational until validated in staging. Do not treat as hard SLAs prior to measurement.

### Known Bottlenecks

| Bottleneck | Current Mitigation | Future Resolution |
|------------|-------------------|-------------------|
| AI reasoning latency (8–25s) | Progress indicator; 60s timeout | Streaming responses (Phase 11) |
| Large FHIR bundles (> 1,000) | Not yet paginated | Chunked paginated processing |
| Assessment re-analysis | Full pipeline re-runs | Incremental delta-context (Phase 11) |
| RLS query overhead | Indexed foreign keys | Query plan analysis in staging |

---

## 16. Failure Modes Reference

### F1 — Reasoning provider unreachable
```
Trigger:   nexus-review returns 5xx or times out (> 60s)
Effect:    Case stays at current state. No data modified.
           Analysis unavailable banner in ReasoningTab.
Recovery:  Manual retry by clinician. Max 2 attempts enforced.
```

### F2 — FHIR import validation failure
```
Trigger:   Inbound resource fails 7-step FHIR validation
Effect:    Resource rejected. recordsFailed increments.
           sync_event status = FAILED.
           Error: { resourceType, id, validationStep, message }
Recovery:  Inspect error in DocumentsTab.
           Fix source system and re-import.
           Postgres idempotency prevents double-write on retry.
```

### F3 — External connector circuit opened
```
Trigger:   DegradedModeManager: failureCount >= 3 for endpoint
Effect:    Calls blocked for 60s. UI: connector = DEGRADED.
Recovery:  Automatic half-open probe after cooldown.
           Success: circuit resets. Failure: cooldown restarts.
```

### F4 — AI extraction produces ungrounded findings
```
Trigger:   validateGrounding() finds findingId not in CaseContext
Effect:    Assessment rejected wholesale. No findings written.
           Attempt 2 with corrective system prompt.
           If attempt 2 fails: STOP. Case -> REVIEW_REQUIRED.
Recovery:  Clinician manually enters findings.
           Never retry beyond attempt 2 automatically.
```

### F5 — Illegal state transition
```
Trigger:   transition_case_status() RAISE EXCEPTION (DB-level)
Effect:    Transaction rolled back. Status unchanged.
Recovery:  UI enforces valid transitions via validateCaseTransition().
           DB function is the final guard.
```

### F6 — Duplicate import (idempotency collision)
```
Trigger:   sync_events.idempotency_key already exists + status = SUCCEEDED
Effect:    Resource silently skipped. recordsSkipped increments.
Recovery:  None needed — expected correct behaviour.
           Re-importing the same bundle is always safe.
```

### F7 — RESOLVED transition with active High safety issue
```
Trigger:   DECISION_RECORDED -> RESOLVED with SafetyIssue severity=High + Active
Effect:    Transition blocked by DB transition_case_status() function.
Recovery:  Clinician must Acknowledge or Resolve all High-severity issues first.
```

### F8 — Reasoning context exceeds token budget
```
Trigger:   Combined findings + evidence exceeds provider token window
Effect:    Context builder truncates by priority (low-priority findings dropped).
           Warning: Context truncated: N findings omitted.
           Reasoning proceeds on reduced context.
Recovery:  Clinician flags critical findings as HIGH PRIORITY.
           Future: split reasoning across calls (Phase 11).
```

### F9 — Audit event write fails (edge function path)
```
Trigger:   audit-event edge function fails after clinical mutation committed
Effect:    Clinical action exists with no corresponding audit event.
           This is a data integrity issue for critical mutations.
Recovery:  For critical mutations: use DB-level transaction.
           (transition_case_status includes audit write in same transaction)
           For edge function mutations: implement outbox pattern.
           Never use fire-and-forget async audit calls for critical actions.
```

### F10 — SyncQueue item lost on restart
```
Trigger:   Edge function restart while processing an in-memory queue item
Effect:    Previously: QUEUED / PROCESSING items were lost.
           Now: resolved by Postgres-backed sync_events table.
Recovery:  PROCESSING items older than 5 minutes re-queued by cron.
           DEAD_LETTER items require manual investigation.
```

---

## 17. Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0.5.0 | 2026-09-11 | Initial architecture document |
| v0.6.0 | 2026-09-11 | Major corrections from architecture audit. Authorization promoted to current requirement (not Phase 8). Role and permission model aligned to `src/domain/auth.ts` — clinician, nurse, laboratory, reviewer, organization_admin, platform_admin. Organization-aware authorization enforced at DB level. PostgreSQL as authoritative source of truth; CaseContext demoted to cache. Backend case state enforcement via `transition_case_status()` PostgreSQL function. NexusAssessment versioning added (ACTIVE / SUPERSEDED / REJECTED). Persistent idempotency and SyncQueue via Postgres `sync_events` table (replaces in-memory Set and SyncQueue). Corrected ClinicalFinding to FHIR Condition mapping — only condition-like findings; not all findings and not hypotheses. 7-step FHIR validation documented. Terminology service abstraction added — candidate match with confidence signal; no silent auto-conversion. FHIR Hub moved from Intelligence Rail to Documents tab. Performance targets replaced with P50/P95 measurement framework — no promises before staging measurement. Transactional audit pattern documented; outbox pattern for edge function mutations. AI retry hard-limited to maximum 2 attempts. PRELIMINARY vs REVIEW_REQUIRED distinction clarified. Database schema and RLS specification added. Failure modes F9 and F10 added. |
| v0.7.0 | 2026-09-11 | Phase 8 — Multi-tenant Organisation Model implemented. `OrganizationFhirConfig` and `OrganizationInvitation` domain types added to `src/domain/auth.ts`. Org-scoped `authorize(permission, targetOrganizationId, memberships)` function added (ARCHITECTURE §4). `AuthProvider` extended with `authorize()` on context, `DEMO_FHIR_CONFIGS` (5 demo endpoints across 3 orgs), and import of domain `authorize` function. `AdministrationView` fully rebuilt as 5-tab workstation: Organisation Settings (`organization.manage`), Team Members (`user.manage`), FHIR Endpoints (`organization.manage`), Audit Log (`audit.view`), System Disclosure (all). Tab navigation shows lock icons for restricted panels; defaults to first accessible tab for current role. Demo data: 10 team members across 3 orgs, 15 audit events, 5 FHIR endpoint configs. Migration 025 adds `organization_fhir_configs` and `organization_invitations` tables with RLS, helper functions `user_is_member_of()` and `user_has_role_in_org()`, auto-update triggers, and demo seed data. No DELETE policies on either table — immutable record keeping. |
| v0.8.0 | 2026-09-11 | Phase 9 — Clinical Decision Rules Engine implemented. Pure domain types defined in `src/domain/rules-engine.ts` separating deterministic CDS from generative reasoning. Deterministic library in `src/lib/rules-engine/`: guideline scoring (Modified Duke Criteria, CURB-65, Wells PE, qSOFA, Centor, CHA₂DS₂-VASc), renal dosing calculator (Cockcroft-Gault CrCl, CKD-EPI 2021, Mosteller BSA, Devine IBW/AdjBW, antimicrobial and anticoagulant protocols), RxNorm drug-drug interaction checker with pairwise severity grading (`CONTRAINDICATED`, `MAJOR`, `MODERATE`), and allergy cross-reactivity engine analyzing beta-lactam R1 side chains, sulfas, NSAIDs, and HIT. First-class `RulesTab.tsx` workstation integrated into `CaseWorkspaceView` and `CaseNav`. Pre-flight CDS validation integrated into `DecisionTab.tsx` and `SafetyTab.tsx`. Database migration `026_phase9_clinical_decision_rules.sql` created with RLS and audit records. |
| v0.9.0 | 2026-09-11 | Phase 10 — Advanced Interoperability implemented. Domain types added to `src/domain/interoperability-advanced.ts`. SMART on FHIR v1/v2 launch protocol engine (`smart-launcher.ts`) with EHR context simulation (`iss`, `launch`, patient/encounter scopes). Real XML HL7 CDA R2 / C-CDA Continuity of Care Document parser (`cda-parser.ts`) extracting Allergies, Problem List, Vitals, and Medications directly into case findings. Cross-Enterprise Document Sharing IHE XDS.b engine (`ihe-xds.ts`) implementing ITI-18 Registry Stored Query and ITI-43 Document Retrieval. WHO SMART Guidelines Base profile validator (`who-smart-validator.ts`) enforcing ICD-11, SNOMED GPS, and DAK compliance. Offline-first sync engine (`offline-sync-engine.ts`) with reactive network connectivity monitor and transactional Outbox queue replaying mutations on reconnect. Rebuilt `DocumentsTab.tsx` with 5 interoperability consoles and added reactive network/sync status pill in `CaseHeader.tsx`. Database migration `027_phase10_advanced_interoperability.sql` created with RLS and audit tables. |
| v0.10.0 | 2026-09-11 | Phase 11 — AI Governance & Model Management implemented. Pure domain types defined in `src/domain/ai-governance.ts`. Model Version Registry (`model-registry.ts`) tracking MedQA, MMLU-Clinical, hallucination rate, context window, and deployment status. Side-by-side A/B assessment comparison engine (`ab-comparison-engine.ts`) with multi-dimensional concordance scoring and clinician preference adjudication. Human feedback curation engine (`feedback-curator.ts`) capturing clinician corrections with error taxonomy (`HALLUCINATED_FINDING`, `UNSUPPORTED_LEAP`, `OVERCONFIDENCE`) and generating DPO JSONL export pairs. Explainability engine (`explainability-engine.ts`) computing Shapley-proxy feature attributions, positive/negative directional influence, and counterfactual sensitivity simulations. First-class 4-console `AiGovernanceView.tsx` workstation integrated into `AppShell`, `GlobalNav`, and `CaseContext`. Point-of-care feature attribution drawer integrated into `ReasoningTab.tsx`. Database migration `028_phase11_ai_governance.sql` created with RLS and seed models. |
| v0.11.0 | 2026-09-11 | Phase 12 — Regulatory & Compliance Architecture implemented. Pure domain types defined in `src/domain/regulatory-compliance.ts`. MDCG 2021-6 & EU AI Act automated auditor (`mdcg-auditor.ts`) evaluating 9 SaMD clauses across human oversight, accuracy benchmarks, transparency IFU, and cybersecurity. FDA Predetermined Change Control Plan (PCCP) engine (`fda-pccp-tracker.ts`) enforcing Authorized Modification Protocol (AMP) boundaries and distinguishing permissible adjustments from mandatory 510(k) triggers. Data residency sovereignty manager (`data-residency-manager.ts`) enforcing regional jurisdiction controls (EU GDPR eu-central-1, South Africa POPIA af-south-1, Ghana DPA accra-edge-01, US HIPAA us-east-1), patient AI consent scopes, and Data Subject Rights (DSR) lifecycle fulfillment. Tamper-evident regulatory audit exporter (`regulatory-audit-exporter.ts`) compiling immutable clinical events into standardized FHIR R4 AuditEvent collection Bundles sealed with cryptographic SHA-256 checksums. Dedicated 4-console `RegulatoryComplianceView.tsx` workstation integrated into `AppShell` and `GlobalNav`. Database migration `029_phase12_regulatory_compliance.sql` created with RLS, audit policies, and production seed data. |
| v1.0.0 | 2026-09-12 | Phase 13 — Enterprise Production Hardening, DICOM PACS Imaging, HL7 v2.x Hospital Messaging & Clinical Knowledge Graph (Production GA). Pure domain types defined in `src/domain/knowledge-graph.ts`, `src/domain/dicom.ts`, and `src/domain/hl7v2.ts`. Unified Medical Language System (UMLS) and SNOMED CT ontological pathfinder (`clinical-knowledge-graph.ts`) tracing pathophysiological trajectories connecting findings to candidate hypotheses. DICOMweb procedural multi-slice imaging client (`dicom-client.ts`) with synthetic TEE cardiac echo study, Window/Level contrast presets, zoom/pan transform matrix, and interactive caliper distance measurement overlay. HL7 v2.5.1 ER7 messaging engine (`hl7v2-parser.ts`) supporting `ADT^A01` (Admit), `ADT^A08` (Update), and `ORU^R01` (Observation Results) with automatic clinical finding ingestion. Real-time multi-clinician collaboration engine (`realtime-collaboration.ts`) with presence awareness, contradiction event broadcasting, cross-session persistent idempotency cache, and FHIR Bundle pagination helper. UI workstation extensions: `DicomViewerModal.tsx` in `InvestigationsTab.tsx`, `KnowledgeGraphDrawer.tsx` in `ReasoningTab.tsx`, HL7 v2.x console with interactive ER7 ingestion in `DocumentsTab.tsx`, and real-time presence avatars stack in `CaseHeader.tsx`. Database migration `030_phase13_production_hardening.sql` created with RLS, audit policies, and production seed data. |
| v1.1.0 | 2026-09-17 | Intelligence Architecture Formalization. New principle: Nexus builds Case → Context Builder → Evidence Layer → AI Reasoning → Schema/Grounding Validation → Human Review — never Frontend → LLM → Answer. **18 Non-Negotiable System Rules** formalized in `src/domain/contracts/intelligence-contracts.ts` as a typed constant array — covering provenance, grounding, numeric probability prohibition, NER span accuracy, model versioning, and audit atomicity. **Specialized model stack registered** in `src/lib/intelligence/governance/model-registry.ts`: 9 Hugging Face models across NER (ribhu/medbert-clinical-ner), document classification (ParamDev/clinicalbert-medical-doc-classifier), finding classification (emilyalsentzer/Bio_ClinicalBERT-ft), two-stage evidence retrieval (ncbi/MedCPT-Query-Encoder + Article-Encoder + Cross-Encoder; NYSgpt/biomed-reranker as CHALLENGER), and synthesis (google/medgemma-4b-it + medgemma-27b-text-it). **Three modular service adapters** added in `src/lib/intelligence/services/`: `extraction-service.ts` (NER with character-accurate SourceSpans), `classification-service.ts` (document processing strategy + finding severity), `evidence-ranking-service.ts` (pgvector dense retrieval → Cross-Encoder reranking). **Assessment schema hardened**: Rule 5 (numeric probability regex — hard rejection), Rule 10 (definitive diagnosis declarations — hard rejection), grounding violations upgraded from warnings to hard errors. **Contextual Intelligence & Review Rail**: six panel components (`CaseSignalsPanel`, `HypothesesRailPanel`, `EvidenceRailPanel`, `UncertaintyRailPanel`, `QuickReviewRailPanel`, `AskNexusRailPanel`) and refactored `IntelligenceRail.tsx` with Context Dispatch Matrix mounting 2–4 relevant panels per active center tab. Manual override filter (`AUTO / SIGNALS / REVIEW / EVIDENCE`). Build: ✓ 2025 modules, 0 TypeScript errors. |
| v1.2.0 | 2026-09-18 | Live Supabase Backend, GoTrue Auth & Clinical PDF Reconstruction. **Mock data removed from active clinical path**: case list, case detail, and patient registry queries connect directly to live Supabase PostgreSQL (`getCaseDetail`, `getPatients`, `deleteCase`, `CaseContext`); demo stubs preserved only as an offline fallback when `isSupabaseConfigured` is false. **GoTrue Supabase Auth Architecture (Migration 031)**: resolved `400: Invalid login credentials` by establishing `pgcrypto` bcrypt password hashes (`NexusDemo2026!`, `NexusAdmin2026!`), linking mandatory `auth.identities` records for the email provider, and synchronizing `auth.users` state (`aud = 'authenticated'`, `role = 'authenticated'`, `email_confirmed_at`). **Case Soft-Deletion & Closure (Migration 032)**: implemented non-destructive case deletion via `deleteCase.ts` setting `status = 'RESOLVED'` and logging `CASE_DELETED` to `audit_events`; granted `case.close` permission to `clinician`, `reviewer`, and `organization_admin` with dedicated RLS update policy. **Clinical PDF Reconstruction & Verification**: integrated `pdfjs-dist` browser extraction pipeline (`pdf-extraction-service.ts`) with interactive `DocumentReconstructionReview.tsx` component providing side-by-side text-layer alignment and live Hugging Face clinical entity extraction. **Hypothesis Rejection Adjudication**: added `HypothesisRejectionModal.tsx` requiring structured clinical justification before candidate hypothesis dismissal. |
| v1.3.0 | 2026-09-22 | Live Hugging Face Serverless Stack Migration. Upgraded specialized intelligence models to 100% verified live serverless inference endpoints on `router.huggingface.co/hf-inference`. **Biomedical NER**: replaced unhosted `ribhu/medbert-clinical-ner` with live `d4data/biomedical-ner-all` (HTTP 200, ~4.0s) extracting Symptoms, Severity, Procedures, Anatomy, and Medications. **Document Classification**: upgraded `ParamDev/clinicalbert-medical-doc-classifier` to `facebook/bart-large-mnli` zero-shot classification (HTTP 200, ~0.6s) across clinical note categories. **Clinical BERT**: migrated `emilyalsentzer/Bio_ClinicalBERT-ft` to base `emilyalsentzer/Bio_ClinicalBERT` (HTTP 200, ~4.0s). **Clinical Summarization**: migrated unhosted `google/medgemma-4b-it` to live `Falconsai/medical_summarization` (HTTP 200, ~4.1s). **MedCPT Alignment**: updated `ncbi/MedCPT-Cross-Encoder` payload to `text-classification` router standard, resolving 400 parameter errors to full HTTP 200 execution alongside `ncbi/MedCPT-Query-Encoder`. Testing Console (`HuggingFaceModelTestingModal.tsx`) and client services synchronized. |
| v1.4.0 | 2026-09-22 | UI Intelligence Polish: DICOM Removal, Pipeline Stepper, CDS Auto-Detection & Model Provenance. **DICOM Purge**: removed `DicomViewerModal.tsx`, `src/lib/imaging/dicom-client.ts`, `src/domain/dicom.ts`; scrubbed all user-facing copy across 8 landing sections/components (`WorkflowTourSection`, `TechnicalCredibilitySection`, `TechnicalArchitectureModal`, `FeaturesAccordion`, `NexusFeaturesSection`, `EcosystemSection`, `EcosystemVisual`, `WorkstationMockup`, `ProblemSolutionSection`, `ContextPipelineSection`) replacing DICOM references with clinical diagnostic reports and guideline retrieval. **Live Multi-Stage Pipeline Stepper** (`NexusAssessmentPanel.tsx`): when `runNexusAnalysis` is active, replaces the panel with an animated 4-stage progress stepper (Data Quality & Bounds Check → MedCPT Dense Semantic Retrieval → Falconsai Clinical Synthesis → 18-Rule Grounding Validation). Each stage circle pulses with a cyan glow when active, turns green ✓ when complete; an indeterminate shimmer bar and a live detail text strip complete the display. Stage notifications emitted via new `onStageProgress` callback in `OrchestrationOptions`; `AnalysisStageInfo` type exported from `reasoning-orchestrator.ts`; `analysisStage` state exposed through `CaseContext`. **CDS Auto-Detection** (`RulesTab.tsx`): `autoDetectedCriteria` useMemo scans all active case finding labels/descriptions with regex patterns for CURB-65 (confusion, BUN, respiratory rate, hypotension, age ≥ 65), Wells PE (DVT signs, tachycardia, haemoptysis, immobilisation, prior VTE), and Modified Duke Criteria (blood culture positivity, echocardiographic evidence, fever, vascular phenomena, immunologic phenomena). A green banner appears above the criteria checklist showing count of detected criteria and a one-click "Apply N unselected" button. Individual criterion rows sport an "Auto-detected" chip (green pill) and a green border when matched. **Model Provenance Badges**: `HypothesesRailPanel.tsx` displays `MedCPT` and `Falconsai` blue attribution pills beneath each hypothesis card's support/contradict counts. `DocumentReconstructionReview.tsx` displays `NER: d4data/biomedical-ner-all` and `Synthesis: Falconsai/medical_summarization` badge strips in the findings table header. Build: 0 TypeScript errors (`npx tsc --noEmit`, exit code 0). |


---

*This document is the architecture Nexus builds against.*
*Every significant design change must be reflected here before implementation begins.*
*All AI outputs require human review. No clinical decision should be made on AI output alone.*
