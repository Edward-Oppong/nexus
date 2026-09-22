// ============================================================
// src/domain/contracts/intelligence-contracts.ts
// NEXUS CLINICAL INTELLIGENCE ARCHITECTURE CONTRACTS
// 
// Formal specification for all multi-model layers, contracts,
// data structures, and the 18 non-negotiable system rules.
// ============================================================

// ------------------------------------------------------------
// 18 NON-NEGOTIABLE SYSTEM RULES
// ------------------------------------------------------------
export const NEXUS_SYSTEM_RULES = [
  {
    id: 1,
    title: 'No Direct DB Mutation',
    rule: 'AI cannot directly mutate canonical clinical records; all outputs are candidate proposals.',
  },
  {
    id: 2,
    title: 'Explicit AI Provenance',
    rule: 'AI-generated or AI-extracted information must always be marked as AI-derived with model ID and version.',
  },
  {
    id: 3,
    title: 'Mandatory Human Verification',
    rule: 'Human verification is required before AI-extracted clinical findings can be treated as verified facts.',
  },
  {
    id: 4,
    title: 'Deterministic Safety Precedence',
    rule: 'Deterministic safety rules cannot be overridden or demoted by generative models.',
  },
  {
    id: 5,
    title: 'Deterministic Clinical Criteria',
    rule: 'Clinical criteria and risk scores (Wells, CURB-65, etc.) are calculated strictly by versioned deterministic code.',
  },
  {
    id: 6,
    title: 'No Invented Evidence',
    rule: 'AI cannot invent evidence sources, PMIDs, or citations; every referenced citation must exist in the retrieval pool.',
  },
  {
    id: 7,
    title: 'Mandatory Source Grounding',
    rule: 'Every AI claim, hypothesis, and recommendation must be grounded in verified finding or evidence IDs from the input context.',
  },
  {
    id: 8,
    title: 'Explicit Epistemic Separation',
    rule: 'The system must explicitly segment clinical facts into KNOWN, INFERRED, and UNKNOWN/GAP buckets.',
  },
  {
    id: 9,
    title: 'Confidence Is Not Probability',
    rule: 'Model classification confidence must never be presented to clinicians as a medical certainty probability.',
  },
  {
    id: 10,
    title: 'No Unsupported Diagnostic Odds',
    rule: 'Generative models are strictly prohibited from emitting numerical diagnostic probabilities (e.g. "87% disease risk").',
  },
  {
    id: 11,
    title: 'Immutable Assessment Versioning',
    rule: 'Every Nexus assessment is an immutable versioned snapshot; regenerations supersede rather than overwrite.',
  },
  {
    id: 12,
    title: 'Comprehensive Provenance Logging',
    rule: 'Every assessment records exact model ID, version, prompt version, schema version, criteria versions, and evidence snapshot ID.',
  },
  {
    id: 13,
    title: 'Human Clinical Decision Authority',
    rule: 'The final clinical decision belongs exclusively to the authorized human clinician workflow.',
  },
  {
    id: 14,
    title: 'Resilient System Availability',
    rule: 'AI failure, timeout, or validation rejection must never render the core clinical record unavailable.',
  },
  {
    id: 15,
    title: 'Complete Auditability',
    rule: 'Every significant AI action (extraction, generation, acceptance, edit, rejection) is persistently logged in the audit trail.',
  },
  {
    id: 16,
    title: 'Enforced RLS & Retrieval Authorization',
    rule: 'Row Level Security (RLS) and organization boundaries apply strictly to vector similarity retrieval.',
  },
  {
    id: 17,
    title: 'Model Modularity & Pluggability',
    rule: 'Models are replaceable service adapters, not the core clinical application architecture itself.',
  },
  {
    id: 18,
    title: 'Synthetic Data Disclaimer',
    rule: 'Synthetic and demo data must never be represented as validated clinical performance.',
  },
] as const;

// ------------------------------------------------------------
// LAYER 1 & 2: PROVENANCE & STRUCTURED CLINICAL DATA
// ------------------------------------------------------------

export type ContractProvenanceType =
  | 'HUMAN_ENTERED'
  | 'DEVICE_MEASURED'
  | 'IMPORTED'
  | 'AI_EXTRACTED'
  | 'AI_GENERATED'
  | 'CLINICIAN_VERIFIED';

export interface SourceSpan {
  start: number;
  end: number;
  text: string;
}

export interface ContractProvenance {
  type: ContractProvenanceType;
  actorId?: string;
  sourceId?: string;
  createdAt: string;
  documentId?: string;
  pageNumber?: number;
  sourceSpan?: SourceSpan;
  modelId?: string;
  modelVersion?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  rejectionNote?: string;
}

export type ContractFindingCategory =
  | 'SYMPTOM'
  | 'SIGN'
  | 'LABORATORY'
  | 'IMAGING'
  | 'HISTORY'
  | 'MEDICATION'
  | 'EXAMINATION'
  | 'OTHER';

export type ContractFindingStatus =
  | 'UNREVIEWED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'MODIFIED';

export interface ContractFinding {
  id: string;
  caseId: string;
  category: ContractFindingCategory;
  display: string;
  status: ContractFindingStatus;
  provenance: ContractProvenance;
}

// ------------------------------------------------------------
// LAYER 3: MEDICAL NER EXTRACTION (d4data/biomedical-ner-all)
// ------------------------------------------------------------

export interface ExtractionInput {
  text: string;
  source: {
    documentId: string;
    pageNumber?: number;
    section?: string;
  };
}

export type EntityType =
  | 'SYMPTOM'
  | 'SIGN'
  | 'DISEASE'
  | 'MEDICATION'
  | 'PROCEDURE'
  | 'ANATOMY'
  | 'LAB_VALUE'
  | 'OTHER';

export interface ExtractedEntity {
  text: string;
  entityType: EntityType;
  startOffset: number;
  endOffset: number;
  confidence?: number;
}

export interface CandidateFindingProposal {
  tempId: string;
  display: string;
  category: ContractFindingCategory;
  sourceDocumentId: string;
  pageNumber?: number;
  sourceSpan: SourceSpan;
  extractionModel: string;
  extractionModelVersion: string;
  confidence?: number;
}

// ------------------------------------------------------------
// LAYER 4 & 5: CLASSIFIERS (Doc & Finding)
// ------------------------------------------------------------

export type DocumentClassificationType =
  | 'CLINICAL_NOTE'
  | 'LAB_REPORT'
  | 'IMAGING_REPORT'
  | 'REFERRAL'
  | 'DISCHARGE_SUMMARY'
  | 'CONSULTATION_NOTE'
  | 'PROCEDURE_NOTE'
  | 'OTHER';

export interface DocumentClassificationResult {
  documentId: string;
  docType: DocumentClassificationType;
  confidence: number;
  modelName: string;
  modelVersion: string;
  processingStrategy: 'LABORATORY_EXTRACTION' | 'IMAGING_EXTRACTION' | 'CLINICAL_NOTE_EXTRACTION' | 'GENERAL_EXTRACTION';
}

export interface FindingClassificationInput {
  text: string;
  entity?: ExtractedEntity;
  surroundingContext?: string;
}

export interface FindingClassificationResult {
  category: ContractFindingCategory;
  confidence: number;
  modelName: string;
  modelVersion: string;
}

// ------------------------------------------------------------
// LAYER 6 & 7: DETERMINISTIC SAFETY & CRITERIA ENGINES
// ------------------------------------------------------------

export type SafetySeverity = 'INFORMATION' | 'ATTENTION' | 'URGENT_REVIEW' | 'SAFETY_CRITICAL';

export interface SafetyRuleContext {
  caseId: string;
  findings: ContractFinding[];
  medications: Array<{ id: string; name: string; status: string; dose?: string }>;
  allergies: Array<{ id: string; substance: string; criticality?: string }>;
  labValues: Array<{ testName: string; value: number | string; unit?: string; isAbnormal: boolean }>;
}

export interface SafetyRuleResult {
  ruleId: string;
  ruleVersion: string;
  ruleName: string;
  status: 'TRIGGERED' | 'NOT_TRIGGERED' | 'INSUFFICIENT_DATA';
  severity: SafetySeverity;
  explanation: string;
  inputReferences: string[];
  recommendedAction?: string;
}

export interface CriteriaItemResult {
  criterionId: string;
  name: string;
  met: boolean;
  scoreContribution: number;
  evidenceRef?: string;
}

export interface CriteriaResult {
  criteriaId: string;
  criteriaVersion: string;
  name: string;
  totalScore: number;
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  metItems: CriteriaItemResult[];
  unmetItems: CriteriaItemResult[];
  missingItems: string[];
  clinicalInterpretation: string;
}

// ------------------------------------------------------------
// LAYER 8: MedCPT RETRIEVAL & CROSS-ENCODER RERANKING
// ------------------------------------------------------------

export interface EvidenceCitation {
  doi?: string;
  pmid?: string;
  journal?: string;
  year?: number;
  url?: string;
}

export interface EvidenceChunk {
  id: string;
  sourceDocumentId: string;
  title: string;
  content: string;
  publicationDate?: string;
  authors?: string[];
  sourceType: 'GUIDELINE' | 'SYSTEMATIC_REVIEW' | 'TRIAL' | 'OBSERVATIONAL' | 'REVIEW' | 'OTHER';
  citation: EvidenceCitation;
  embeddingModel: string;
  embeddingVersion: string;
  metadata?: Record<string, unknown>;
}

export interface RankedEvidenceResult {
  chunk: EvidenceChunk;
  firstStageRank: number;
  retrievalScore: number;
  rerankScore: number;
  matchedConcepts: string[];
  relevanceRationale: string;
}

// ------------------------------------------------------------
// LAYER 9: CONTROLLED CONTEXT PACKAGE (MedGemma Input)
// ------------------------------------------------------------

export interface EpistemicContextBuckets {
  known: Array<{ id: string; fact: string; source: string }>;
  inferred: Array<{ id: string; hypothesis: string; rationale: string }>;
  unknown: Array<{ id: string; gap: string; whyItMatters: string }>;
}

export interface ControlledContextPackage {
  caseId: string;
  patient: {
    age: number;
    biologicalSex: string;
    clinicalSummary: string;
  };
  epistemicBuckets: EpistemicContextBuckets;
  verifiedFindings: ContractFinding[];
  unverifiedFindings: ContractFinding[];
  observations: Array<{ name: string; value: string; unit?: string; interpretation?: string }>;
  medications: Array<{ name: string; dose?: string; route?: string; status: string }>;
  allergies: Array<{ substance: string; criticality?: string; reaction?: string }>;
  deterministicSafety: SafetyRuleResult[];
  criteriaResults: CriteriaResult[];
  contradictions: Array<{ id: string; description: string; findingA: string; findingB: string }>;
  rankedEvidence: Array<{
    id: string;
    title: string;
    sourceType: string;
    excerpt: string;
    citation: EvidenceCitation;
  }>;
  scope: {
    allowedOutputs: string[];
    prohibitedOutputs: string[];
  };
}

// ------------------------------------------------------------
// LAYER 10: STRUCTURED MedGemma GENERATIVE OUTPUT
// ------------------------------------------------------------

export interface HypothesisAssessment {
  id: string;
  label: string;
  status: 'CANDIDATE' | 'SUPPORTED' | 'CONTRADICTED' | 'INSUFFICIENT_DATA' | 'DISMISSED';
  supportingFindingIds: string[];
  contradictingFindingIds: string[];
  evidenceIds: string[];
  missingInformation: string[];
  uncertaintyRationale: string;
}

export interface StructuredMedGemmaAssessmentOutput {
  summary: string;
  hypotheses: HypothesisAssessment[];
  evidenceRelationships: Array<{
    evidenceId: string;
    relatesToHypothesis: string;
    relevanceExplanation: string;
  }>;
  detectedContradictions: Array<{
    description: string;
    sourceFindingIds: string[];
  }>;
  missingInformation: Array<{
    description: string;
    clinicalReason: string;
  }>;
  uncertaintyStatements: string[];
  safetyObservations: Array<{
    description: string;
    relatedRuleId?: string;
  }>;
}

// ------------------------------------------------------------
// LAYER 11 & 12: IMMUTABLE ASSESSMENT VERSION & AUDIT
// ------------------------------------------------------------

export type AssessmentLifecycleState =
  | 'GENERATED'
  | 'REVIEW_REQUIRED'
  | 'ACCEPTED'
  | 'AMENDED'
  | 'SUPERSEDED'
  | 'REJECTED';

export interface GroundingVerificationReport {
  isFullyGrounded: boolean;
  referencedFindingCount: number;
  referencedEvidenceCount: number;
  unresolvedFindingIds: string[];
  unresolvedEvidenceIds: string[];
  prohibitedOutputViolations: string[];
}

export interface NexusAssessmentVersion {
  id: string;
  caseId: string;
  version: number;
  status: AssessmentLifecycleState;

  // Exact Governance Snapshot
  modelRegistryId: string;
  modelName: string;
  modelVersion: string;
  promptVersion: string;
  schemaVersion: string;
  criteriaVersions: Record<string, string>;
  evidenceSnapshotId: string;
  supersedesAssessmentId?: string;

  // Content & Audit
  content: StructuredMedGemmaAssessmentOutput;
  groundingReport: GroundingVerificationReport;

  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewAction?: 'ACCEPT' | 'EDIT' | 'REJECT';
  reviewNotes?: string;
}
