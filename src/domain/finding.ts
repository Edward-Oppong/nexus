// ============================================================
// src/domain/finding.ts
// Phase 6E: Clinical Finding Domain Model (Section 4 & 5)
// A finding is more clinically meaningful than a raw observation.
// Preserves complete verification chain and source provenance.
// ============================================================

export type CanonicalFindingCategory =
  | 'SYMPTOM'
  | 'SIGN'
  | 'LABORATORY'
  | 'IMAGING'
  | 'HISTORY'
  | 'MEDICATION'
  | 'EXAMINATION'
  | 'OTHER';

export type FindingCategory = CanonicalFindingCategory | 'symptom' | 'sign' | 'vital' | 'history' | 'laboratory' | 'observation';

export type CanonicalFindingStatus =
  | 'UNREVIEWED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'MODIFIED';

export type VerificationStatus = CanonicalFindingStatus | 'Verified' | 'Unverified' | 'Rejected';

export type ProvenanceType =
  | 'HUMAN_ENTERED'
  | 'DEVICE_MEASURED'
  | 'IMPORTED'
  | 'AI_EXTRACTED'
  | 'AI_GENERATED'
  | 'CLINICIAN_VERIFIED'
  | 'Human-entered'
  | 'Device-measured'
  | 'Imported'
  | 'AI-extracted'
  | 'AI-generated'
  | 'Clinician-verified';

export interface FindingProvenance {
  sourceText?: string;
  sourceContext: string;
  recordedBy: string;
  recordedAt: string;
  extractionModel?: string; // e.g. "Nexus NLP v2.4 (Simulated)"
  deviceModel?: string;     // e.g. "Mindray BeneVision N12"
  provenanceType: ProvenanceType;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  rejectionNote?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

export interface ClinicalFinding {
  id: string;
  caseId?: string;
  label: string;
  description?: string;
  category: FindingCategory;
  sourceDisplay?: string;
  statusDisplay?: string;
  status?: CanonicalFindingStatus;
  provenance: FindingProvenance;
  provenanceId?: string;
  createdBy?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
