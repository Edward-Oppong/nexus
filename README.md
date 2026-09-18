# Nexus Clinical Workstation

> **An AI-augmented clinical reasoning workstation for structured diagnostic decision support.**
> **Version 1.2.0 (Live Backend, GoTrue Auth & Clinical PDF Reconstruction)**

Nexus is a structured clinical reasoning environment — not an AI chatbot, not a diagnosis engine. It supports clinicians in gathering, organising, and evaluating clinical evidence, while ensuring all AI-generated content is explicitly flagged and requires human review before any clinical decision is made.

---

## Table of Contents

1. [Philosophy & Design Principles](#1-philosophy--design-principles)
2. [Getting Started & Authentication](#2-getting-started--authentication)
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

## 2. Getting Started & Authentication

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

# 3. Configure environment variables
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_HF_API_TOKEN

# 4. Start the development server
npm run dev
# Runs at http://localhost:5173 (or configured dev port)

# 5. Build for production
npm run build

# 6. Preview production build
npm run preview
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous client key | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Optional |
| `VITE_HF_API_TOKEN` | Hugging Face Inference API token for live clinical NER/classification | Yes (falls back to deterministic stubs) |
| `VITE_OPENAI_API_KEY` | OpenAI API key for reasoning edge functions | Edge functions only |
| `VITE_FHIR_BASE_URL` | Default FHIR server base URL | Optional |

### Demo Accounts & Credentials

For development and clinical demonstration, pre-seeded institutional accounts are provided:

| Role | Email | Password | Scope / Permissions |
|------|-------|----------|---------------------|
| Attending Clinician | `dr.sarah.chen@nexus-hospital.demo` | `NexusDemo2026!` | Full clinical decision authority, case review & close |
| Clinical Reviewer | `prof.marcus.vance@nexus-hospital.demo` | `NexusDemo2026!` | Review, validation, and case close authority |
| Critical Care Nurse | `nurse.elena.rostova@nexus-hospital.demo` | `NexusDemo2026!` | Clinical observations and data entry |
| Clinical Pathologist / Lab | `lab.david.kim@nexus-hospital.demo` | `NexusDemo2026!` | Laboratory results entry |
| System Administrator | `admin@nexus-hospital.demo` | `NexusAdmin2026!` | Institutional management & user administration |

> **Note on Supabase Auth:** Demo user accounts are managed by Supabase GoTrue with bcrypt encryption (`031_fix_auth_users_passwords.sql`). Each account includes synchronized `auth.identities` records to allow direct password sign-in.

### Database Migrations Setup

Ensure migrations are applied in your Supabase SQL Editor in sequence:
- `001` through `030`: Base schema, roles, multi-tenant orgs, CDS rules, interoperability, and knowledge graph.
- `031_fix_auth_users_passwords.sql`: Applies bcrypt passwords, GoTrue `auth.identities`, and confirms email addresses.
- `032_case_close_permission.sql`: Registers `case.close` permission and adds the dedicated RLS update policy for case soft-deletion.

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
│   │   ├── contracts/          — Formal architecture & system rule contracts
│   │   │   └── intelligence-contracts.ts — 18 Non-Negotiable System Rules
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
│   │   ├── authentication/     — Institutional login & GoTrue provider
│   │   ├── cases/              — Case queue & intake workspace
│   │   │   ├── api/            — Live Supabase APIs (deleteCase.ts soft-delete, getCaseDetail.ts)
│   │   │   ├── components/     — DocumentReconstructionReview.tsx (clinical PDF inspection)
│   │   │   └── CaseListView.tsx
│   │   ├── case-workspace/     — 3-Zone Clinical Workspace
│   │   │   ├── CaseWorkspaceView.tsx
│   │   │   ├── IntelligenceRail.tsx — Context-dispatched review rail
│   │   │   ├── api/            — Case-level API calls
│   │   │   ├── panels/         — Intelligence Rail panels (Signals, Hypotheses, Evidence, Uncertainty, Review, AskNexus)
│   │   │   └── tabs/           — All workspace tab panels
│   │   ├── overview/           — Clinical dashboard
│   │   ├── patients/           — Patient registry (live getPatients.ts)
│   │   ├── review/             — Needs Review queue
│   │   ├── safety/             — System-wide safety issues
│   │   └── tasks/              — Clinical task management
│   │
│   └── lib/
│       ├── case-state-machine.ts    — Allowed case status transitions
│       ├── intelligence/            — AI reasoning & orchestration layer
│       │   ├── governance/          — Model registry, A/B testing, feedback curation
│       │   ├── services/            — Specialized adapters (NER extraction, pdf-extraction-service.ts, classification, evidence ranking)
│       │   ├── context-builder.ts   — Deterministic clinical prompt context assembly
│       │   ├── reasoning-orchestrator.ts — 9-step pipeline execution
│       │   └── reasoning-provider.ts — Model abstraction layer
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

### Case Deletion & Audit Trail Preservation

In clinical workflows, cases must never be erased from the database:
- **Soft-Delete Only**: Deleting a case in the UI executes `deleteCase.ts`, which sets `status = 'RESOLVED'` and timestamps `closed_at = now()`.
- **Audit Logged**: An audit entry is immediately inserted into `public.audit_events` (`action_type: 'CASE_DELETED'`), recording the timestamp, case ID, and authenticated user identity.
- **Permission & RLS**: Case deletion/closure requires the `case.close` permission and is guarded at the database level by RLS policy `case_close_permission` (Migration 032).

---

## 6. Intelligence Layer

### Architecture Principle

> **Nexus builds: Case → Context Builder → Evidence Layer → AI Reasoning → Schema/Grounding Validation → Human Review**
> Nexus explicitly rejects: `Frontend → LLM → Answer`. Clinical AI must be deterministic in data assembly, grounded in retrieved evidence, constrained by strict schema, and bounded by human clinical review.

### 18 Non-Negotiable System Rules

All intelligence operations are governed by 18 invariant system rules formalized as typed constraints in [`intelligence-contracts.ts`](file:///c:/Users/user/Desktop/nexus/src/domain/contracts/intelligence-contracts.ts):

| Rule | Short Name | Invariant |
|------|------------|-----------|
| R1 | Provenance on Every Field | Every finding, observation, and hypothesis must have an immutable provenance record. |
| R2 | Pure Deterministic Context Builder | Context is built from database state; AI models never query the database directly. |
| R3 | Evidence Precedes Generation | Evidence retrieval and reranking runs *before* clinical synthesis, not as post-hoc justification. |
| R4 | Document Classification Precedes OCR/Extraction | Fast document classification determines processing strategy before heavy extraction inference. |
| R5 | Strictly Qualitative Uncertainty | Numeric probability scores (e.g. `82.4%`, `0.73`) are strictly forbidden and hard-rejected by schema regex. |
| R6 | Character-Accurate Source Spans | Extracted clinical findings must include exact character start/end offsets from source document text. |
| R7 | Two-Stage Evidence Retrieval | Bi-encoder dense embedding retrieval (recall) followed by Cross-Encoder reranking (precision). |
| R8 | Zero Ungrounded Findings | Every hypothesis must cite existing case finding IDs; hallucinated IDs trigger immediate assessment rejection. |
| R9 | Model Version Stamped on Assessment | Assessments record registry ID, Hugging Face model ID, and inference parameters. |
| R10 | Non-Definitive Generative Language | AI models never declare definitive diagnosis; outputs are candidate hypotheses requiring review. |
| R11 | Atomic Assessment Persist & Audit | Assessment persistence and regulatory audit ledger write execute in a single database transaction. |
| R12 | Context Window Token Budgeting | Context builder enforces deterministic token budgets (Findings: 3,000, Evidence: 2,500, History: 1,500). |
| R13 | Graceful Degraded Fallbacks | External provider timeouts fall back to local rule scores and cached evidence. |
| R14 | Continuous Attribution Explainability | Hypotheses expose positive/negative finding contributions (feature attributions). |
| R15 | Deterministic Rules Overrule AI | Guideline scoring engines (Duke, CURB-65, Wells) take precedence over generative suggestions. |
| R16 | Human Review Structurally Required | No AI output can transition a case to `DECISION_RECORDED` or `RESOLVED` without a human clinician signature. |
| R17 | Clinician Feedback Loop (DPO) | Clinician accept/reject/modify actions generate structured pairs for offline fine-tuning. |
| R18 | Multi-Tenant Model Isolation | Model inference context, embeddings, and vector similarity queries are strictly scoped by organisation ID. |

### Specialized Model Stack

Nexus avoids monolithic LLMs in favor of a specialized, auditable model hierarchy registered in `src/lib/intelligence/governance/model-registry.ts`:

| Function | Model Identifier | Hugging Face Hub ID | Parameters / Specialization |
|----------|------------------|---------------------|-----------------------------|
| Entity Extraction (NER) | `medbert-ner` | `ribhu/medbert-clinical-ner` | 110M — Clinical NER: symptoms, diseases, anatomy |
| Document Classification | `clinicalbert-doc-clf` | `ParamDev/clinicalbert-medical-doc-classifier` | 110M — Document type routing (discharge, lab, radiology) |
| Finding Classification | `bio-clinicalbert-finding` | `emilyalsentzer/Bio_ClinicalBERT-ft` | 110M — Finding severity and temporality classification |
| Evidence Query Encoder | `medcpt-query` | `ncbi/MedCPT-Query-Encoder` | 110M — Stage 1 dense clinical query embedding |
| Evidence Article Encoder | `medcpt-article` | `ncbi/MedCPT-Article-Encoder` | 110M — Stage 1 PubMed/guideline document embedding |
| Evidence Reranker | `medcpt-reranker` | `ncbi/MedCPT-Cross-Encoder` | 110M — Stage 2 Cross-Encoder document-query relevance |
| Primary Synthesis | `medgemma-4b` | `google/medgemma-4b-it` | 4B — Clinical reasoning & candidate hypothesis synthesis |
| Complex Escalation | `medgemma-27b` | `google/medgemma-27b-text-it` | 27B — Multi-system, contradictory or escalated cases |
| Evidence Reranker (Challenger) | `biomed-reranker` | `NYSgpt/biomed-reranker` | 110M — A/B benchmark challenger for evidence ranking |

### Modular Intelligence Service Adapters

Specialized adapters in `src/lib/intelligence/services/` decouple model execution from clinical business logic:
- `extraction-service.ts` — Runs clinical NER, maps entity labels to domain `FindingCategory`, and attaches character-accurate `SourceSpan` records.
- `classification-service.ts` — Determines document processing strategy (fast OCR vs deep parsing) and evaluates finding severity.
- `evidence-ranking-service.ts` — Two-stage retrieval pipeline: initial dense vector search via pgvector, followed by Cross-Encoder reranking.

### Orchestration Pipeline (9 Stages)

```
[1] Clinical Case Data (Patient, Findings, Observations, Documents, Timeline)
      |
      v
[2] Clinical NER & Span Extraction (ribhu/medbert-clinical-ner)
      |  Extracts findings with character-accurate SourceSpans from clinical text
      v
[3] Document & Finding Classification (clinicalbert-medical-doc-classifier + Bio_ClinicalBERT)
      |  Routes document processing strategy; assigns finding severity & temporality
      v
[4] Two-Stage Evidence Retrieval & Reranking (MedCPT Bi-Encoder + Cross-Encoder)
      |  Stage 1 pgvector dense retrieval (top-20) -> Stage 2 Cross-Encoder reranking (top-5)
      v
[5] Deterministic Rules & Context Builder (buildPromptContext)
      |  Clinical guideline scoring + token-budgeted structured prompt assembly
      v
[6] Clinical Reasoning & Synthesis (google/medgemma-4b-it / 27b-text-it)
      |  Generates candidate hypotheses, contraindications, missing investigations
      v
[7] Assessment Schema Validation (validateAssessmentOutput)
      |  Hard rejection of numeric probability scores (% or 0.xx) and definitive diagnoses
      v
[8] Grounding Verification (validateGrounding)
      |  Hard rejection if candidate findings reference nonexistent finding IDs
      v
[9] Provenance-Tagged NexusAssessment Output
      |  Stamped with model registry version, UNVERIFIED status, awaiting clinician review
```

### Assessment Output & Schema Hardening

All AI outputs are validated against `NexusAssessmentSchema`. The schema explicitly forbids pseudo-precision numeric probabilities (hard regex rejection) and definitive diagnostic declarations. Uncertainty is expressed strictly via `QualitativeUncertainty`:

```typescript
interface QualitativeUncertainty {
  dataCompleteness: 'High' | 'Moderate' | 'Low';
  evidenceConsistency: 'High' | 'Moderate' | 'Conflicting';
  modelApplicability: 'High' | 'Moderate' | 'Limited';
  overallState: 'REQUIRES REVIEW' | 'CONTRADICTORY' | 'INSUFFICIENT DATA' | 'STABLE';
}
```

### Contextual Intelligence & Review Rail

The right pane of the clinical workstation is a contextual **Intelligence & Review Rail** (not a chatbot sidebar). It mounts 2–4 specialized panels based on the clinician's active center tab via the **Context Dispatch Matrix**:

| Center Tab | Mounted Rail Panels | Clinical Purpose |
|------------|---------------------|------------------|
| Overview | `CaseSignalsPanel`, `UncertaintyRailPanel` | Immediate situational awareness & case trajectory |
| Findings | `CaseSignalsPanel`, `QuickReviewRailPanel` | Unverified AI extraction sign-off & critical flags |
| Reasoning | `HypothesesRailPanel`, `EvidenceRailPanel`, `UncertaintyRailPanel` | Deep differential evaluation, citation grounding, gaps |
| Investigations | `EvidenceRailPanel`, `CaseSignalsPanel` | Investigation yield, diagnostic protocols & safety checks |
| Timeline | `CaseSignalsPanel`, `UncertaintyRailPanel` | Temporal anomaly detection & interval consistency |
| Documents | `QuickReviewRailPanel`, `EvidenceRailPanel` | Document extraction review & literature grounding |
| Rules | `EvidenceRailPanel`, `UncertaintyRailPanel` | Guideline rule grounding & criteria satisfaction |
| Decision / Safety | `QuickReviewRailPanel`, `UncertaintyRailPanel` | Final sign-off verification & critical safety alerts |

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
- [x] Organisation registration and provisioning
- [x] RBAC: Physician, Nurse, Resident, Admin, Auditor
- [x] Case assignment and escalation rules per organisation
- [x] Organisation-scoped FHIR endpoint configuration

### Phase 9 — Clinical Decision Rules Engine
- [x] Structured clinical decision rules (separate from AI reasoning)
- [x] Dosing calculators (weight-based, renal-adjusted)
- [x] Drug-drug interaction checker (RxNorm + FHIR MedicationStatement)
- [x] Allergy cross-reactivity alerts

### Phase 10 — Advanced Interoperability
- [x] SMART on FHIR launch protocol (EHR context launch)
- [x] CDA / C-CDA document import (common in legacy African HIS)
- [x] IHE XDS.b document exchange
- [x] WHO SMART Base profile compliance (FHIR R4 IG)
- [x] Offline-first sync for low-connectivity environments (IndexedDB + service worker)

### Phase 11 — AI Governance & Model Management
- [x] Model version registry — track which model generated each assessment
- [x] A/B assessment comparison — two providers side by side
- [x] Human feedback loop — clinician corrections feed model fine-tuning
- [x] Explainability panel — per-finding contribution to hypothesis ranking

### Phase 12 — Regulatory & Compliance
- [x] MDCG 2021-6 (AI in medical devices) compliance checklist
- [x] FDA PCCP (Predetermined Change Control Plan) documentation
- [x] GDPR / POPIA data residency controls
- [x] Audit export in FHIR AuditEvent format for regulators

### Phase 13 — Enterprise Hardening, Imaging & Knowledge Graph (v1.0.0 GA)
- [x] Idempotency key persistence across sessions (Postgres `sync_events` + local storage cache)
- [x] FHIR Bundle pagination for large imports (>1,000 resources)
- [x] Persistent sync queue with transaction outbox pattern
- [x] Drag-and-drop document upload in DocumentsTab
- [x] Medical imaging & DICOMweb viewer with multi-slice, W/L presets (Cardiac, Lung, Soft Tissue), and caliper measurements
- [x] HL7 v2.5.1 ER7 hospital messaging engine (ADT^A01, ADT^A08, ORU^R01) with clinical finding extraction
- [x] Real-time contradiction alerts and clinician presence avatars via Supabase Realtime
- [x] Evidence search with clinical knowledge graph (UMLS & SNOMED CT ontological pathfinding)

### Phase 14 — Intelligence Architecture Formalization (v1.1.0)
- [x] 18 Non-Negotiable System Rules formalized as typed runtime constraints in `src/domain/contracts/intelligence-contracts.ts`
- [x] Specialized Hugging Face Model Stack (9 models: NER, classification, MedCPT 2-stage retrieval, MedGemma reasoning)
- [x] Modular service adapters: `extraction-service.ts`, `classification-service.ts`, `evidence-ranking-service.ts`
- [x] Hardened output validation: regex rejection of numeric probability & definitive diagnosis declarations, zero ungrounded findings
- [x] Contextual Intelligence & Review Rail with 6 specialized panels and Context Dispatch Matrix tab integration

### Phase 15 — Live Backend, GoTrue Auth & Clinical PDF Reconstruction (v1.2.0)
- [x] Mock data removed from active clinical path — live Supabase queries for cases, patients, and details (`getCaseDetail`, `getPatients`, `deleteCase`)
- [x] Institutional GoTrue authentication with bcrypt password encryption and `auth.identities` email provider synchronization (Migration 031)
- [x] Pre-configured institutional demo accounts across Clinician, Reviewer, Nurse, Lab, and Admin personas
- [x] Clinical case soft-delete workflow with audit trail preservation (`CASE_DELETED` events) and `case.close` RLS policy (Migration 032)
- [x] High-fidelity clinical PDF document reconstruction and verification review with `pdfjs-dist` text layer extraction (`DocumentReconstructionReview.tsx`)
- [x] Live Hugging Face Inference API integration (`VITE_HF_API_TOKEN`) for zero-shot clinical entity extraction
- [x] Structured hypothesis rejection modal with mandatory clinical justification (`HypothesisRejectionModal.tsx`)

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
