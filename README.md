# Nexus Clinical Workstation

> **An AI-augmented clinical reasoning workstation for structured diagnostic decision support.**

Nexus is a structured clinical reasoning environment — not an AI chatbot, not a diagnosis engine. It supports clinicians in gathering, organising, and evaluating clinical evidence, while ensuring all AI-generated content is explicitly flagged and requires human review before any clinical decision is made.

---

## Table of Contents

1. [Philosophy & Design Principles](#1-philosophy--design-principles)
2. [Getting Started](#2-getting-started)
3. [Project Structure](#3-project-structure)
4. [Domain Model](#4-domain-model)
5. [Clinical Workflow & Case States](#5-clinical-workflow--case-states)
6. [Intelligence Layer](#6-intelligence-layer)
7. [Safety Architecture](#7-safety-architecture)
8. [Interoperability — FHIR R4](#8-interoperability--fhir-r4)
9. [Supabase Edge Functions](#9-supabase-edge-functions)
10. [Known Thresholds & Limits](#10-known-thresholds--limits)
11. [Failure Modes & Recovery](#11-failure-modes--recovery)
12. [Roadmap & Future Updates](#12-roadmap--future-updates)
13. [Contributing](#13-contributing)

---

## 1. Philosophy & Design Principles

### Nexus is an orchestration layer, not an AI doctor

The system is deliberately designed so that:

- **No numeric probability scores are shown** — clinical hypothesis ranking is qualitative (`CANDIDATE`, `SUPPORTED`, `CONTRADICTED`, `INSUFFICIENT_DATA`, `DISMISSED`).
- **Every AI output is provenance-tagged** — all AI-extracted or AI-generated findings carry `provenanceType: AI_EXTRACTED | AI_GENERATED` and are shown as `UNVERIFIED` until a clinician explicitly reviews them.
- **The clinician decides** — Nexus reasons, synthesises, and flags. A named, logged clinician must accept or reject every candidate hypothesis before a case progresses.
- **FHIR-aware, not FHIR-dependent** — internal domain models are clean and independent. FHIR R4 mapping happens only at the integration boundary.

### Provenance Guardrail (non-negotiable)

Every `ClinicalFinding`, `Observation`, `ClinicalDocument`, and `CandidateHypothesis` must carry a `ProvenanceRecord`:

```
ProvenanceType:
  HUMAN_ENTERED       — typed by clinician in Nexus UI
  DEVICE_MEASURED     — received from a bedside monitor/device
  IMPORTED            — imported from an external system (EHR, LIS, PACS)
  AI_EXTRACTED        — extracted from a document by an AI model
  AI_GENERATED        — synthesised by a reasoning model
  CLINICIAN_VERIFIED  — AI output reviewed and accepted by a named clinician
```

Any AI-type provenance is visually badged in the UI and cannot transition a case without a `CLINICIAN_VERIFIED` override.

---

## 2. Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 18 |
| npm | >= 9 |
| TypeScript | >= 5.6 (via devDependencies) |
| Supabase CLI | >= 1.x (for edge functions) |

### Install & Run

```bash
# 1. Clone the repository
git clone <repo-url>
cd nexus

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 4. Start the development server
npm run dev
# Runs at http://localhost:5173 (Vite default) or 127.0.0.1:3000 if --port is set

# 5. Build for production
npm run build

# 6. Preview production build
npm run preview
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key | Yes |
| `VITE_OPENAI_API_KEY` | OpenAI API key for reasoning edge functions | Edge functions only |
| `VITE_FHIR_BASE_URL` | Default FHIR server base URL | Optional |

> API keys used in edge functions are set as Supabase secrets — they are never exposed to the client bundle.

---

## 3. Project Structure

```
nexus/
├── index.html                  — Vite entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── main.tsx                — React root mount
│   ├── App.tsx                 — Top-level router
│   │
│   ├── app/
│   │   ├── app-shell/          — Global layout (sidebar, header)
│   │   └── providers/          — React context providers
│   │       └── CaseContext.tsx — Active case state management
│   │
│   ├── domain/                 — CANONICAL domain types (source of truth)
│   │   ├── auth.ts
│   │   ├── case.ts             — CaseStatus, Case, SyntheticPatient
│   │   ├── document.ts         — ClinicalDocument
│   │   ├── evidence.ts         — EvidenceSource, EvidenceResult
│   │   ├── external-source.ts  — ExternalDataSource integration metadata
│   │   ├── fhir.ts             — Nexus-internal FHIR-flavoured types
│   │   ├── finding.ts          — ClinicalFinding
│   │   ├── hypothesis.ts       — CandidateHypothesis, QualitativeUncertainty
│   │   ├── investigation.ts    — InvestigationOrder
│   │   ├── nexus-assessment.ts — NexusAssessment output schema
│   │   ├── observation.ts      — Observation
│   │   ├── patient.ts          — Patient
│   │   ├── provenance.ts       — ProvenanceRecord, ProvenanceType
│   │   ├── safety.ts           — SafetyIssue
│   │   └── timeline.ts         — TimelineEvent
│   │
│   ├── features/               — Feature-sliced pages & views
│   │   ├── authentication/     — Login, auth flow
│   │   ├── cases/              — Case list / queue
│   │   ├── case-workspace/     — 3-Zone Clinical Workspace
│   │   │   ├── CaseWorkspaceView.tsx
│   │   │   ├── api/            — Case-level API calls
│   │   │   └── tabs/           — All workspace tab panels
│   │   ├── overview/           — Clinical dashboard
│   │   ├── patients/           — Patient registry
│   │   ├── review/             — Needs Review queue
│   │   ├── safety/             — System-wide safety issues
│   │   └── tasks/              — Clinical task management
│   │
│   └── lib/
│       ├── case-state-machine.ts    — Allowed case status transitions
│       ├── intelligence/            — AI reasoning layer
│       └── interoperability/        — FHIR R4 integration layer
│           ├── fhir/                — Types, client, validators, version URIs
│           ├── mappers/             — Nexus <-> FHIR R4 transformation
│           ├── connectors/          — External system adapters
│           ├── normalization/       — Code and unit normalisation
│           └── sync/                — Import/export pipelines, queue, retry
│
└── supabase/
    ├── migrations/              — SQL schema migrations
    └── functions/               — Deno edge functions
```

---

## 4. Domain Model

All domain types live in `src/domain/`. These types are **independent of FHIR** — they represent Nexus's internal clinical model.

### Core Entities

| Entity | File | Description |
|--------|------|-------------|
| `Case` | `case.ts` | Clinical case with lifecycle status |
| `Patient` | `patient.ts` | Minimal patient demographic |
| `ClinicalFinding` | `finding.ts` | Symptoms, signs, and observations |
| `CandidateHypothesis` | `hypothesis.ts` | Candidate diagnostic explanation |
| `InvestigationOrder` | `investigation.ts` | Requested investigations |
| `NexusAssessment` | `nexus-assessment.ts` | Full AI reasoning output |
| `ProvenanceRecord` | `provenance.ts` | Data origin chain |
| `SafetyIssue` | `safety.ts` | Red flags and safety alerts |
| `ClinicalDocument` | `document.ts` | Uploaded or imported clinical documents |
| `EvidenceSource` | `evidence.ts` | Clinical evidence references |

### Key Design Rules

1. **No database IDs in domain models** — IDs are `string` (UUID-compatible but not DB-coupled).
2. **No `any` types** — all types are explicit; mapper layer handles external type coercion.
3. **Immutable by convention** — domain models are read via context; mutations go through dedicated actions.

---

## 5. Clinical Workflow & Case States

Nexus enforces a strict state machine. Illegal transitions are rejected by `validateCaseTransition()`.

```
DRAFT
  └─> ACTIVE
        ├─> ANALYZING
        │     ├─> PRELIMINARY
        │     │     ├─> REVIEW_REQUIRED
        │     │     │     ├─> CLINICIAN_REVIEW
        │     │     │     │     ├─> DECISION_RECORDED -> RESOLVED -> ACTIVE (re-open)
        │     │     │     │     └─> REVIEW_REQUIRED / ACTIVE
        │     │     │     └─> SAFETY_REVIEW / INSUFFICIENT_DATA
        │     │     └─> CONTRADICTORY / INSUFFICIENT_DATA
        │     └─> CONTRADICTORY / INSUFFICIENT_DATA / ACTIVE
        ├─> INSUFFICIENT_DATA
        ├─> CONTRADICTORY -> SAFETY_REVIEW / CLINICIAN_REVIEW / ACTIVE
        ├─> SAFETY_REVIEW -> CLINICIAN_REVIEW / ACTIVE
        └─> OUT_OF_SCOPE -> ACTIVE

Exception states: UNCERTAIN, CONTRADICTORY, SAFETY_REVIEW, INSUFFICIENT_DATA, OUT_OF_SCOPE
```

### State Invariants

| State | Invariant |
|-------|-----------|
| `REVIEW_REQUIRED` | At least one unreviewed AI finding exists |
| `SAFETY_REVIEW` | At least one active `SafetyIssue` with `severity: High` |
| `DECISION_RECORDED` | A named clinician has accepted or overridden a hypothesis |
| `RESOLVED` | All high-severity safety issues are `Resolved` or `Acknowledged` |

---

## 6. Intelligence Layer

### Orchestration Pipeline

```
ClinicalCase Data
      |
      v
[1] Data Quality Check (deterministic, no AI)
      |
      v
[2] Evidence Retrieval (local knowledge base + PubMed edge function)
      |
      v
[3] Context Builder (assembles structured prompt context)
      |
      v
[4] Reasoning Provider (AI model call — OpenAI / Vertex / local model)
      |
      v
[5] Assessment Schema Validation (validateAssessmentOutput)
      |
      v
[6] Grounding Check (validateGrounding — verifies finding IDs exist in case)
      |
      v
[7] NexusAssessment output (provenance-tagged, UNVERIFIED)
```

### Provider Abstraction

`src/lib/intelligence/reasoning-provider.ts` abstracts the underlying model so it can be swapped without changing the orchestrator.

### Assessment Output (No Numeric Probability)

All AI outputs are validated against `NexusAssessmentSchema`. The schema explicitly forbids numeric probability scores. Uncertainty is expressed via `QualitativeUncertainty`:

```typescript
interface QualitativeUncertainty {
  dataCompleteness: 'High' | 'Moderate' | 'Low';
  evidenceConsistency: 'High' | 'Moderate' | 'Conflicting';
  modelApplicability: 'High' | 'Moderate' | 'Limited';
  overallState: 'REQUIRES REVIEW' | 'CONTRADICTORY' | 'INSUFFICIENT DATA' | 'STABLE';
}
```

---

## 7. Safety Architecture

### Safety Issue Lifecycle

```
Detected (AI or rule-based)     ->  status: Active - Review Required
     |
     v
Acknowledged (clinician)        ->  acknowledgedBy + acknowledgedAt
     |
     v
Resolved (clinician sign-off)   ->  clinicalNote required
     |
     v
Archived (immutable audit trail)
```

### Automatic Escalation Triggers

| Trigger | Effect |
|---------|--------|
| SafetyIssue severity: High created | Case -> SAFETY_REVIEW |
| Two+ contradictory findings on same body system | Case -> CONTRADICTORY |
| HIGH PRIORITY information gap unresolved > 24h | System alert |
| Contradicted hypothesis still Pending Review | Case -> REVIEW_REQUIRED |

### Contradiction Detection

The `contradiction-check` edge function uses:
1. **Semantic contradiction** — embedding similarity between findings with opposite implications.
2. **Rule-based contradiction** — vital sign contradictions (e.g., SpO2 > 98% AND "respiratory failure" finding).

---

## 8. Interoperability — FHIR R4

> Nexus is **FHIR-aware, not FHIR-dependent.**

### Integration Architecture

```
EXTERNAL SYSTEMS
    |
    +-- EHR / LHIMS     (FHIR R4 REST)
    +-- LIS / Lab       (HL7 v2 / FHIR DiagnosticReport)
    +-- PACS / Imaging  (DICOMweb / FHIR ImagingStudy)
    +-- Bedside Devices (HL7 v2 / FHIR Observation)
         |
         v
    [Connector Layer]     src/lib/interoperability/connectors/
         |
         v
    [Normalization]       src/lib/interoperability/normalization/
         |  LOINC, SNOMED code normalisation; UCUM unit standardisation
         v
    [FHIR Mappers]        src/lib/interoperability/mappers/
         |  Pure functions: FhirResource <-> Nexus domain type
         v
    [Import / Export Pipeline]  src/lib/interoperability/sync/
         |  Idempotency, deduplication, SyncQueue, retry
         v
    [Nexus Domain Layer]
         |  Clean internal types — no FHIR coupling
         v
    [UI / Clinical Workspace]
```

### Mapper Inventory

| FHIR Resource | Nexus Domain Type | File |
|---------------|-------------------|------|
| Patient | Patient | mappers/patient.ts |
| Encounter | Encounter | mappers/encounter.ts |
| Condition | ClinicalFinding | mappers/condition.ts |
| Observation | Observation | mappers/observation.ts |
| DiagnosticReport | DiagnosticReport | mappers/diagnostic-report.ts |
| DocumentReference | ClinicalDocument | mappers/document-reference.ts |
| Practitioner | Practitioner | mappers/practitioner.ts |
| CareTeam | CareTeam | mappers/care-team.ts |
| Task | Task | mappers/task.ts |
| AuditEvent | AuditEntry | mappers/audit-event.ts |
| Provenance | ProvenanceRecord | mappers/provenance.ts |
| ServiceRequest | InvestigationOrder | mappers/service-request.ts |

### FHIR System URIs

All code system URIs are centralised in `src/lib/interoperability/fhir/version.ts`. Never use inline URI strings.

### Idempotency

Every imported resource gets a deterministic idempotency key:
```
SHA-256( sourceSystem + '::' + resourceType + '::' + resourceId )
```
Duplicate imports are safely skipped.

### Retry & Circuit Breaker

| Parameter | Default |
|-----------|---------|
| maxRetries | 3 |
| baseDelayMs | 1,000 ms |
| maxDelayMs | 10,000 ms |
| jitter | +/- 20% |
| failureThreshold | 3 failures |
| cooldownMs | 60,000 ms |

---

## 9. Supabase Edge Functions

| Function | Description |
|----------|-------------|
| `audit-event` | Writes immutable FHIR AuditEvent to audit ledger |
| `contradiction-check` | Semantic + rule-based contradiction detection |
| `evidence-search` | PubMed / knowledge base retrieval |
| `extract-findings` | AI extraction from raw clinical text |
| `integration-export` | Compiles and pushes case as FHIR Bundle |
| `integration-import` | Receives and validates inbound FHIR Bundle |
| `integration-sync` | Bidirectional sync orchestrator |
| `nexus-review` | Full AI reasoning pipeline for a case |
| `process-document` | OCR + AI extraction for uploaded clinical documents |

---

## 10. Known Thresholds & Limits

| Parameter | Value | Notes |
|-----------|-------|-------|
| Max findings per reasoning call | ~500 | Context builder truncates beyond this |
| Max evidence items per reasoning call | 20 | Top-ranked by relevance |
| Reasoning context window | ~32k tokens | Provider-dependent |
| FHIR Bundle max entries (import) | 1,000 resources | Larger bundles must be paginated |
| SyncQueue max pending items | 500 | Overflow triggers degraded-mode warning |
| Circuit breaker failure threshold | 3 failures | Then endpoint is paused |
| Circuit breaker cooldown | 60,000 ms | Reset window |
| Idempotency key scope | Session-scoped | Not persisted between sessions |
| Document max upload size | 50 MB (Supabase default) | OCR quality degrades above ~20 MB |
| Audit log retention | Indefinite | Constrained by Supabase storage plan |

---

## 11. Failure Modes & Recovery

### F1 — Reasoning provider unreachable
- **Effect:** Case stays at current state. "Analysis unavailable" banner shown.
- **Recovery:** Manual retry from ReasoningTab. No data lost.

### F2 — FHIR import validation failure
- **Effect:** Bundle rejected. Error logged with resource type + ID.
- **Recovery:** Inspect error in DocumentsTab > FHIR Hub. Fix source and re-import.

### F3 — External connector circuit opened
- **Effect:** Calls blocked for 60 s cooldown. UI shows connector as DEGRADED.
- **Recovery:** Automatic half-open probe after cooldown. Success resets circuit.

### F4 — AI extraction produces ungrounded findings
- **Effect:** Assessment rejected wholesale. Case flagged REVIEW_REQUIRED.
- **Recovery:** Second reasoning attempt with corrective system prompt.

### F5 — Illegal state transition attempted
- **Effect:** Transition blocked. Error message returned from `validateCaseTransition()`.
- **Recovery:** UI enforces valid transitions only. Fix calling code if triggered programmatically.

### F6 — Duplicate import (idempotency key collision)
- **Effect:** Record silently skipped. `recordsSkipped` increments.
- **Recovery:** None needed — expected behaviour.

### F7 — Safety issue not resolved before RESOLVED transition
- **Effect:** Transition blocked by state machine.
- **Recovery:** Clinician must acknowledge/resolve all High severity issues in SafetyTab.

---

## 12. Roadmap & Future Updates

### Phase 7 — Persistence & Real Data
- [ ] Replace mock `FullSyntheticCase` with Supabase-backed data layer
- [ ] Row-level security (RLS) per organisation
- [ ] Supabase Realtime for collaborative case updates
- [ ] Audit trail persistence to database

### Phase 8 — Multi-tenant Organisation Model
- [ ] Organisation registration and provisioning
- [ ] RBAC: Physician, Nurse, Resident, Admin, Auditor
- [ ] Case assignment and escalation rules per organisation
- [ ] Organisation-scoped FHIR endpoint configuration

### Phase 9 — Clinical Decision Rules Engine
- [ ] Structured clinical decision rules (separate from AI reasoning)
- [ ] Dosing calculators (weight-based, renal-adjusted)
- [ ] Drug-drug interaction checker (RxNorm + FHIR MedicationStatement)
- [ ] Allergy cross-reactivity alerts

### Phase 10 — Advanced Interoperability
- [ ] SMART on FHIR launch protocol (EHR context launch)
- [ ] CDA / C-CDA document import (common in legacy African HIS)
- [ ] IHE XDS.b document exchange
- [ ] WHO SMART Base profile compliance (FHIR R4 IG)
- [ ] Offline-first sync for low-connectivity environments (IndexedDB + service worker)

### Phase 11 — AI Governance & Model Management
- [ ] Model version registry — track which model generated each assessment
- [ ] A/B assessment comparison — two providers side by side
- [ ] Human feedback loop — clinician corrections feed model fine-tuning
- [ ] Explainability panel — per-finding contribution to hypothesis ranking

### Phase 12 — Regulatory & Compliance
- [ ] MDCG 2021-6 (AI in medical devices) compliance checklist
- [ ] FDA PCCP (Predetermined Change Control Plan) documentation
- [ ] GDPR / POPIA data residency controls
- [ ] Audit export in FHIR AuditEvent format for regulators

### Near-term Backlog
- [ ] Idempotency key persistence across sessions
- [ ] FHIR Bundle pagination for large imports (>1,000 resources)
- [ ] SyncQueue persistence (currently in-memory)
- [ ] Drag-and-drop document upload in DocumentsTab
- [ ] Inline DICOM viewer (OHIF Viewer integration)
- [ ] `process-document` support for HL7 v2 ADT messages
- [ ] Real-time contradiction alerts via Supabase Realtime
- [ ] Evidence search with clinical knowledge graph (UMLS, SNOMED hierarchy)

---

## 13. Contributing

### Code Standards
- TypeScript strict mode — `"strict": true`. No `any`, no implicit `undefined`.
- No inline FHIR URIs — all system URIs from `src/lib/interoperability/fhir/version.ts`.
- Provenance on every clinical entity — all AI-created data must carry `provenanceType`.
- Mapper purity — mapper functions are pure (no side effects, no API calls).
- State machine enforcement — all case state changes through `validateCaseTransition()`.

### Branch Strategy
```
main          — production-ready releases
develop       — integration branch
feature/*     — individual feature work
hotfix/*      — emergency production fixes
```

### Commit Convention
```
feat(scope):     description
fix(scope):      description
docs(scope):     description
refactor(scope): description
```

---

*Nexus Clinical Workstation — Built with clinical responsibility in mind.*
*All AI outputs require human review. No clinical decision should be made on AI output alone.*
