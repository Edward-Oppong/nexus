// ============================================================
// src/domain/nexus-assessment.ts
// Phase 6F: Nexus Assessment Lifecycle Model
// Defines the full chain: GENERATED → REVIEW_REQUIRED → REVIEWED
// and the human review record (Accept / Edit / Reject).
// Implements assessment versioning and superseding.
// ============================================================

// ----------------------------------------------------------
// Assessment lifecycle states
// ----------------------------------------------------------
export type NexusAssessmentStatus =
  | 'GENERATED'        // Just created by the reasoning engine
  | 'REVIEW_REQUIRED'  // Requires clinician adjudication
  | 'REVIEWED'         // All findings reviewed and acted on
  | 'SUPERSEDED';      // New assessment generated; this one archived

// ----------------------------------------------------------
// Review actions — the three and only three choices
// ----------------------------------------------------------
export type ReviewAction = 'ACCEPT' | 'EDIT' | 'REJECT';

// ----------------------------------------------------------
// Reasoning scope — what a query is/isn't allowed to conclude
// ----------------------------------------------------------
export type ReasoningScopePurpose =
  | 'CASE_REVIEW'
  | 'EVIDENCE_REVIEW'
  | 'SUMMARY'
  | 'CONTRADICTION_REVIEW'
  | 'MISSING_INFORMATION'
  | 'HYPOTHESIS_REVIEW';

export interface ReasoningScope {
  purpose: ReasoningScopePurpose;
  allowedOutputs: string[];
  prohibitedOutputs: string[];
}

// ----------------------------------------------------------
// Safety boundary states
// ----------------------------------------------------------
export type SafetyBoundaryState =
  | 'OK'
  | 'INSUFFICIENT_DATA'  // Not enough to evaluate — no false certainty generated
  | 'CONTRADICTION'      // Conflicting data detected
  | 'OUT_OF_SCOPE'       // Outside supported reasoning scope
  | 'SAFETY_CRITICAL';   // Escalated for urgent human review

// ----------------------------------------------------------
// Nexus finding (atomic output requiring review)
// ----------------------------------------------------------
export type NexusFindingType =
  | 'SUPPORT'
  | 'CONTRADICTION'
  | 'MISSING_INFORMATION'
  | 'CONTEXT'
  | 'SAFETY';

export type NexusFindingStatus = 'UNREVIEWED' | 'ACCEPTED' | 'EDITED' | 'REJECTED';

export interface NexusFinding {
  id: string;
  assessmentId: string;
  findingType: NexusFindingType;
  content: string;
  status: NexusFindingStatus;
  hypothesisId?: string;       // Which hypothesis this finding relates to
  findingIds?: string[];        // Grounded clinical finding IDs
  evidenceSourceIds?: string[]; // Grounded evidence source IDs
  createdAt: string;
}

// ----------------------------------------------------------
// Nexus recommendation (advisory only — not autonomous)
// ----------------------------------------------------------
export type NexusRecommendationCategory =
  | 'REVIEW'
  | 'INFORMATION'
  | 'INVESTIGATION'
  | 'SAFETY'
  | 'FOLLOW_UP';

export type NexusRecommendationStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED';

export interface NexusRecommendation {
  id: string;
  assessmentId: string;
  category: NexusRecommendationCategory;
  content: string;
  rationale?: string;
  status: NexusRecommendationStatus;
  createdAt: string;
}

// ----------------------------------------------------------
// Evidence snapshot — which sources were used for this assessment
// ----------------------------------------------------------
export interface AssessmentEvidenceSource {
  evidenceSourceId: string;
  retrievalRank: number;
  relevanceScore?: number;
}

// ----------------------------------------------------------
// Contradiction detected by deterministic layer
// ----------------------------------------------------------
export interface DetectedContradiction {
  id: string;
  findingAId: string;
  findingBId: string;
  explanation: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
}

// ----------------------------------------------------------
// Full Nexus assessment
// ----------------------------------------------------------
export interface NexusAssessment {
  id: string;
  caseId: string;
  status: NexusAssessmentStatus;
  summary: string;
  // Qualitative only — no numeric confidence
  dataCompleteness?: 'HIGH' | 'MODERATE' | 'LOW';
  evidenceConsistency?: 'HIGH' | 'MODERATE' | 'CONFLICTING';
  applicability?: string;
  limitations: string[];
  // Versioning
  modelName: string;
  modelVersion: string;
  promptVersion: string;
  pipelineVersion: string;
  createdAt: string;
  supersededById?: string;
  // Structured outputs (validated via Zod before persistence)
  nexusFindings: NexusFinding[];
  recommendations: NexusRecommendation[];
  contradictions: DetectedContradiction[];
  evidenceSources: AssessmentEvidenceSource[];
  // Safety boundary
  safetyBoundary: SafetyBoundaryState;
  safetyBoundaryReason?: string;
}

// ----------------------------------------------------------
// Review record — preserved even when superseded
// ----------------------------------------------------------
export interface ReviewRecord {
  id: string;
  assessmentId: string;
  nexusFindingId?: string;
  reviewerId: string;
  reviewerName: string;
  action: ReviewAction;
  originalContent: string;
  revisedContent?: string;    // For EDIT action
  reason?: string;            // Mandatory for REJECT
  reviewedAt: string;
}

// ----------------------------------------------------------
// Raw structured output from reasoning provider (pre-validation)
// ----------------------------------------------------------
export interface RawReasoningOutput {
  summary: string;
  hypotheses: Array<{
    label: string;
    rationale: string;
    supportingFindingIds: string[];
    contradictingFindingIds: string[];
    missingInformation: string[];
    evidenceSourceIds: string[];
  }>;
  contradictions: Array<{
    findingAId: string;
    findingBId: string;
    explanation: string;
  }>;
  limitations: string[];
}
