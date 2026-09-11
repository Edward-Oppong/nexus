// ============================================================
// src/domain/hypothesis.ts
// Phase 6F: Formalized Hypothesis Domain Model
// A hypothesis is a candidate clinical explanation — not a diagnosis.
// No numeric probability scores are produced or stored.
// FHIR R4: Condition (candidate use case)
// ============================================================

// ----------------------------------------------------------
// Canonical hypothesis status — no numeric probability
// ----------------------------------------------------------
export type CanonicalHypothesisStatus =
  | 'CANDIDATE'          // Under consideration — not yet confirmed or excluded
  | 'SUPPORTED'          // Evidence and findings lean toward this
  | 'CONTRADICTED'       // Directly contradicted by findings/evidence
  | 'INSUFFICIENT_DATA'  // Cannot evaluate — data missing
  | 'DISMISSED';         // Clinician-dismissed; excluded from active reasoning

// Backward-compatible display status for UI
export type HypothesisStatus = 'Supported' | 'Uncertain' | 'Contradicted';

// ----------------------------------------------------------
// Hypothesis finding relationship
// ----------------------------------------------------------
export type HypothesisFindingRelationship = 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXTUALIZES';

export interface HypothesisFindingLink {
  findingId: string;
  relationship: HypothesisFindingRelationship;
  rationale?: string;
}

// ----------------------------------------------------------
// Candidate Hypothesis (UI-facing, used in mock data)
// ----------------------------------------------------------
export interface CandidateHypothesis {
  id: string;
  caseId?: string;
  title: string;
  status: HypothesisStatus;
  canonicalStatus?: CanonicalHypothesisStatus;
  statusDetail: string;
  supportingFindingIds: string[];
  contradictingFindingIds: string[];
  informationGapIds: string[];
  evidenceIds: string[];
  // Phase 6F canonical fields
  missingInformation?: string[];
  rationale?: string;
  provenanceId?: string;
  nexusAssessment: string;
  clinicalReviewStatus: 'Pending Review' | 'Accepted' | 'Rejected';
  reviewNote?: string;
}

// ----------------------------------------------------------
// Qualitative uncertainty (replaces numeric confidence)
// ----------------------------------------------------------
export interface QualitativeUncertainty {
  dataCompleteness: 'High' | 'Moderate' | 'Low';
  dataCompletenessReason: string;
  evidenceConsistency: 'High' | 'Moderate' | 'Conflicting';
  evidenceConsistencyReason: string;
  modelApplicability: 'High' | 'Moderate' | 'Limited';
  modelApplicabilityReason: string;
  overallState: 'REQUIRES REVIEW' | 'CONTRADICTORY' | 'INSUFFICIENT DATA' | 'STABLE';
  primaryReason: string;
}

// ----------------------------------------------------------
// Information gap (missing data items)
// ----------------------------------------------------------
export interface InformationGap {
  id: string;
  testName: string;
  priority: 'HIGH PRIORITY' | 'MODERATE PRIORITY' | 'ROUTINE';
  whyItMatters: string;
  affectedHypotheses: string[];
  status: 'Not yet resolved' | 'Requested' | 'Result received';
  investigationId?: string;
}

// ----------------------------------------------------------
// Hypothesis candidate output from reasoning engine
// ----------------------------------------------------------
export interface HypothesisCandidate {
  label: string;
  rationale: string;
  supportingFindingIds: string[];      // Must exist in CaseContext.findings
  contradictingFindingIds: string[];   // Must exist in CaseContext.findings
  missingInformation: string[];
  evidenceSourceIds: string[];         // Must exist in EvidenceSource library
}
