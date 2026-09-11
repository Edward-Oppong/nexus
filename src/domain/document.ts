// ============================================================
// src/domain/document.ts
// Phase 6H: Clinical Document Domain Model
//
// Documents are distinct from observations and findings.
// A document is a received artifact (PDF, structured report,
// letter) whose content may later be extracted into findings.
//
// Architecture:
//   Supabase Storage (blob) ← storage_path
//   clinical_documents (metadata, lifecycle, extractions)
//   clinical_findings (verified, extracted findings)
//
// The document itself is never replaced by an AI interpretation.
// Extraction does not equal verification.
// ============================================================

export type DocumentClass =
  | 'DISCHARGE_SUMMARY'
  | 'REFERRAL_LETTER'
  | 'CONSULTATION_NOTE'
  | 'LAB_REPORT'
  | 'IMAGING_REPORT'
  | 'PATHOLOGY_REPORT'
  | 'OPERATIVE_NOTE'
  | 'NURSING_NOTE'
  | 'PRESCRIPTION'
  | 'CONSENT_FORM'
  | 'ADVANCE_DIRECTIVE'
  | 'CORRESPONDENCE'
  | 'EXTERNAL_RECORD'
  | 'OTHER';

export type DocumentStatus =
  | 'RECEIVED'     // Raw intake, not yet processed
  | 'PROCESSING'   // AI extraction in progress
  | 'REVIEWED'     // Clinician has reviewed extracted findings
  | 'ATTESTED'     // Clinician has formally attested to contents
  | 'SUPERSEDED'   // A newer version of this document exists
  | 'REJECTED';    // Discarded by a clinician after review

export interface ExtractedFinding {
  id: string;
  text: string;               // Verbatim extracted text
  category?: string;          // Mapped clinical category
  code?: string;              // SNOMED/LOINC code if resolved
  codeSystem?: string;
  confidence?: number;        // AI confidence 0–1
  onsetDate?: string;
  resolved: boolean;          // Whether clinician has acted on this
}

export interface ExtractedDiagnosis {
  code?: string;
  codeSystem?: string;
  description: string;
  status?: 'ACTIVE' | 'RESOLVED' | 'HISTORICAL';
}

export interface ExtractedMedication {
  name: string;
  code?: string;
  codeSystem?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  status?: 'ACTIVE' | 'STOPPED' | 'HISTORICAL';
}

/**
 * ClinicalDocument — the Nexus-internal representation of a received
 * document. Decoupled from FHIR; mapped to DocumentReference at the
 * integration boundary.
 */
export interface ClinicalDocument {
  id: string;
  organizationId: string;
  caseId?: string;
  patientId?: string;
  importEventId?: string;

  // Classification
  documentClass: DocumentClass;
  documentStatus: DocumentStatus;

  // Identity
  title: string;
  description?: string;
  sourceFacility?: string;   // "City General Hospital"
  authoredBy?: string;       // Original author (free text from source)
  authoredAt?: string;

  // Storage
  storagePath?: string;      // Path inside Supabase Storage bucket
  storageBucket: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;

  // Extracted clinical content (AI-produced; not clinician-verified)
  extractedFindings?: ExtractedFinding[];
  extractedDiagnoses?: ExtractedDiagnosis[];
  extractedMedications?: ExtractedMedication[];
  extractedAt?: string;
  extractedByModel?: string;

  // Clinician attestation
  attestedBy?: string;
  attestedAt?: string;
  attestationNote?: string;

  // FHIR linkage
  fhirDocumentReferenceId?: string;
  fhirCompositionId?: string;

  // External provenance
  externalSourceId?: string;
  externalDocumentId?: string;

  uploadedBy: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentSortField = 'receivedAt' | 'authoredAt' | 'documentClass' | 'documentStatus';

export interface DocumentFilter {
  documentClass?: DocumentClass;
  documentStatus?: DocumentStatus;
  caseId?: string;
  patientId?: string;
}

// Document class display labels
export const DOCUMENT_CLASS_LABELS: Record<DocumentClass, string> = {
  DISCHARGE_SUMMARY: 'Discharge Summary',
  REFERRAL_LETTER: 'Referral Letter',
  CONSULTATION_NOTE: 'Consultation Note',
  LAB_REPORT: 'Lab Report',
  IMAGING_REPORT: 'Imaging Report',
  PATHOLOGY_REPORT: 'Pathology Report',
  OPERATIVE_NOTE: 'Operative Note',
  NURSING_NOTE: 'Nursing Note',
  PRESCRIPTION: 'Prescription',
  CONSENT_FORM: 'Consent Form',
  ADVANCE_DIRECTIVE: 'Advance Directive',
  CORRESPONDENCE: 'Correspondence',
  EXTERNAL_RECORD: 'External Record',
  OTHER: 'Other',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  RECEIVED: 'Received',
  PROCESSING: 'Processing',
  REVIEWED: 'Reviewed',
  ATTESTED: 'Attested',
  SUPERSEDED: 'Superseded',
  REJECTED: 'Rejected',
};

// Which statuses allow clinician actions
export function canAttest(doc: ClinicalDocument): boolean {
  return doc.documentStatus === 'REVIEWED';
}

export function canReview(doc: ClinicalDocument): boolean {
  return doc.documentStatus === 'RECEIVED' || doc.documentStatus === 'PROCESSING';
}

export function hasExtractedContent(doc: ClinicalDocument): boolean {
  return (
    (doc.extractedFindings?.length ?? 0) > 0 ||
    (doc.extractedDiagnoses?.length ?? 0) > 0 ||
    (doc.extractedMedications?.length ?? 0) > 0
  );
}
