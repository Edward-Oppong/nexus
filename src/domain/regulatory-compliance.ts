// ============================================================
// src/domain/regulatory-compliance.ts
// Phase 12: Regulatory & Compliance Pure Domain Models
// Covers MDCG 2021-6 (EU MDR / AI Act), FDA PCCP (SaMD),
// GDPR / POPIA / DPA Data Residency, and Regulatory Audit Exports.
// Pure TypeScript — zero external dependencies.
// ============================================================

// ------------------------------------------------------------
// 1. MDCG 2021-6 & EU Medical Device Regulations
// ------------------------------------------------------------

export type MdcgComplianceStatus =
  | 'COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'NON_COMPLIANT'
  | 'NOT_APPLICABLE';

export type MdcgClauseCategory =
  | 'HUMAN_OVERSIGHT'
  | 'ROBUSTNESS_ACCURACY'
  | 'TRANSPARENCY_IFU'
  | 'DATA_GOVERNANCE'
  | 'POST_MARKET_SURVEILLANCE'
  | 'CYBERSECURITY_RISK';

export interface MdcgClauseCheck {
  clauseId: string;
  clauseTitle: string;
  category: MdcgClauseCategory;
  requirementDescription: string;
  nexusImplementation: string;
  status: MdcgComplianceStatus;
  auditEvidenceRef: string;
  riskMitigation: string;
}

export interface MdcgAuditReport {
  id: string;
  targetWorkstationVersion: string;
  standard: 'MDCG_2021_6' | 'EU_AI_ACT_HIGH_RISK';
  classificationRule: string; // e.g., "MDR Annex VIII Rule 11 (Class IIa SaMD)"
  overallScore: number; // 0 - 100%
  totalClauses: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  clauses: MdcgClauseCheck[];
  auditedBy: string;
  auditedAt: string;
  recommendations: string[];
}

// ------------------------------------------------------------
// 2. FDA PCCP (Predetermined Change Control Plan for AI/ML SaMD)
// ------------------------------------------------------------

export type PccpModificationType =
  | 'PROMPT_TEMPLATE_OPTIMIZATION'
  | 'REASONING_TEMPERATURE_TUNING'
  | 'WEIGHT_QUANTIZATION_CHANGE'
  | 'RETRAINING_SET_EXPANSION'
  | 'CLINICAL_DECISION_RULE_ADDITION'
  | 'OUT_OF_BOUNDS_ARCHITECTURE_SHIFT';

export type PccpBoundaryResult =
  | 'WITHIN_AUTHORIZED_BOUNDS'
  | 'REQUIRES_INTERNAL_VALIDATION'
  | 'TRIGGERS_NEW_510K';

export interface PccpModificationProtocol {
  protocolId: string;
  modificationType: PccpModificationType;
  description: string;
  allowedVarianceRange: string;
  actualProposedChange: string;
  boundaryEvaluation: PccpBoundaryResult;
  verificationMethod: string;
  acceptanceCriteria: string;
  approvalStatus: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';
  regulatoryImpactRationale: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface FdaPccpPlan {
  id: string;
  deviceName: string;
  fdaProductCode: string; // e.g. "QAS" (Clinical Decision Support Software)
  samdClass: 'Class_I' | 'Class_II' | 'Class_III';
  version: string;
  authorizedProtocols: PccpModificationProtocol[];
  lastUpdated: string;
}

// ------------------------------------------------------------
// 3. Data Residency, GDPR, POPIA & Patient Rights (DSR)
// ------------------------------------------------------------

export type RegulatoryJurisdiction =
  | 'EU_GDPR'
  | 'ZA_POPIA'
  | 'GH_DPA'
  | 'US_HIPAA';

export type DataSubjectRequestType =
  | 'RIGHT_TO_ACCESS'        // GDPR Art 15 / POPIA Sec 23
  | 'RIGHT_TO_RECTIFICATION' // GDPR Art 16 / POPIA Sec 24
  | 'RIGHT_TO_ERASURE'       // GDPR Art 17
  | 'RIGHT_TO_RESTRICTION';  // GDPR Art 18

export type DsrStatus = 'SUBMITTED' | 'IDENTITY_VERIFIED' | 'PROCESSING' | 'FULFILLED' | 'REJECTED';

export interface DataResidencyConfig {
  jurisdiction: RegulatoryJurisdiction;
  jurisdictionLabel: string;
  primaryDataCenterRegion: string;
  backupDataCenterRegion: string;
  encryptionAtRest: string; // e.g. "AES-256-GCM"
  encryptionInTransit: string; // e.g. "TLS 1.3"
  crossBorderTransferAllowed: boolean;
  legalBasis: string;
  statutoryDpoContact: string;
}

export interface PatientAiConsent {
  patientId: string;
  patientName: string;
  consentGiven: boolean;
  scopes: {
    realTimeDiagnosticAssistance: boolean;
    retrospectiveQualityAudit: boolean;
    deIdentifiedModelTraining: boolean;
    crossInstitutionalResearch: boolean;
  };
  consentRecordedAt: string;
  consentedBy: string;
  expirationDate?: string;
}

export interface DataSubjectRequest {
  id: string;
  patientId: string;
  patientName: string;
  requestType: DataSubjectRequestType;
  jurisdiction: RegulatoryJurisdiction;
  status: DsrStatus;
  requestDetails: string;
  requestedAt: string;
  fulfilledAt?: string;
  certifiedBy?: string;
  auditEvidenceRef?: string;
}

// ------------------------------------------------------------
// 4. Regulatory Audit Export & Integrity Verification
// ------------------------------------------------------------

export type RegulatoryAuditFormat =
  | 'FHIR_R4_AUDIT_EVENT'
  | 'DICOM_PS_3_15_ATNA'
  | 'CSV_SUMMARY_AUDIT';

export interface RegulatoryExportManifest {
  exportId: string;
  targetAuthority: 'FDA_CDRH' | 'EU_NOTIFIED_BODY' | 'INTERNAL_COMPLIANCE' | 'NATIONAL_DATA_AUTHORITY';
  format: RegulatoryAuditFormat;
  dateRangeStart: string;
  dateRangeEnd: string;
  totalEventCount: number;
  sha256Checksum: string;
  exportedBy: string;
  exportedAt: string;
  fhirBundlePayload?: any; // FHIR R4 Bundle of type 'collection'
}
