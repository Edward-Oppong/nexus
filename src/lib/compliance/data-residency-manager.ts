// ============================================================
// src/lib/compliance/data-residency-manager.ts
// Phase 12: Data Residency & Patient Rights (GDPR / POPIA / DPA)
// Manages regional data sovereignty, consent scopes, and DSR fulfillment
// ============================================================

import {
  DataResidencyConfig,
  RegulatoryJurisdiction,
  PatientAiConsent,
  DataSubjectRequest,
  DataSubjectRequestType,
} from '../../domain/regulatory-compliance';

export const JURISDICTION_CONFIGS: Record<RegulatoryJurisdiction, DataResidencyConfig> = {
  EU_GDPR: {
    jurisdiction: 'EU_GDPR',
    jurisdictionLabel: 'European Union (GDPR 2016/679)',
    primaryDataCenterRegion: 'eu-central-1 (Frankfurt, Germany)',
    backupDataCenterRegion: 'eu-west-1 (Dublin, Ireland)',
    encryptionAtRest: 'AES-256-GCM with Customer-Managed Keys (KMS)',
    encryptionInTransit: 'TLS 1.3 / mTLS (P-384 ECDSA)',
    crossBorderTransferAllowed: false,
    legalBasis: 'Article 9(2)(h) — Provision of health or social care or treatment',
    statutoryDpoContact: 'dpo@nexus-clinical.eu',
  },
  ZA_POPIA: {
    jurisdiction: 'ZA_POPIA',
    jurisdictionLabel: 'South Africa (POPIA Act 4 of 2013)',
    primaryDataCenterRegion: 'af-south-1 (Cape Town, South Africa)',
    backupDataCenterRegion: 'af-south-1b (Johannesburg DR Zone)',
    encryptionAtRest: 'AES-256-GCM (Enclave Protected)',
    encryptionInTransit: 'TLS 1.3 (ChaCha20-Poly1305)',
    crossBorderTransferAllowed: false,
    legalBasis: 'Section 32 — Processing of Special Personal Information (Health Records)',
    statutoryDpoContact: 'information-officer@nexus-health.co.za',
  },
  GH_DPA: {
    jurisdiction: 'GH_DPA',
    jurisdictionLabel: 'Ghana (Data Protection Act 2012, Act 843)',
    primaryDataCenterRegion: 'accra-edge-01 (Korle Bu / MOH National Datacenter)',
    backupDataCenterRegion: 'kumasi-edge-02 (KATH Regional Node)',
    encryptionAtRest: 'AES-256-CBC with Local HSM Keys',
    encryptionInTransit: 'TLS 1.3 / IPsec VPN Tunnel',
    crossBorderTransferAllowed: false,
    legalBasis: 'Section 28 — Special Personal Data (Medical Treatment & Diagnosis)',
    statutoryDpoContact: 'dataprotection@moh.gov.gh',
  },
  US_HIPAA: {
    jurisdiction: 'US_HIPAA',
    jurisdictionLabel: 'United States (HIPAA / HITECH Security Rule)',
    primaryDataCenterRegion: 'us-east-1 (N. Virginia, USA)',
    backupDataCenterRegion: 'us-west-2 (Oregon, USA)',
    encryptionAtRest: 'AES-256 (FIPS 140-3 Validated)',
    encryptionInTransit: 'TLS 1.3',
    crossBorderTransferAllowed: true,
    legalBasis: '45 CFR § 164.506 — Treatment, Payment, and Health Care Operations (TPO)',
    statutoryDpoContact: 'privacy@nexus-clinical.com',
  },
};

export const INITIAL_PATIENT_CONSENTS: PatientAiConsent[] = [
  {
    patientId: 'syn-pat-00482',
    patientName: 'Amara Okafor',
    consentGiven: true,
    scopes: {
      realTimeDiagnosticAssistance: true,
      retrospectiveQualityAudit: true,
      deIdentifiedModelTraining: false, // Patient explicitly opted out of model training
      crossInstitutionalResearch: true,
    },
    consentRecordedAt: '2026-09-08T08:30:00Z',
    consentedBy: 'Dr. Kwame Asante, MD',
  },
  {
    patientId: 'syn-pat-00109',
    patientName: 'Eleni Kostas',
    consentGiven: true,
    scopes: {
      realTimeDiagnosticAssistance: true,
      retrospectiveQualityAudit: true,
      deIdentifiedModelTraining: true,
      crossInstitutionalResearch: true,
    },
    consentRecordedAt: '2026-09-09T11:00:00Z',
    consentedBy: 'Dr. Sarah Lin, MD',
  },
];

export const INITIAL_DSR_REQUESTS: DataSubjectRequest[] = [
  {
    id: 'DSR-2026-001',
    patientId: 'syn-pat-00482',
    patientName: 'Amara Okafor',
    requestType: 'RIGHT_TO_ACCESS',
    jurisdiction: 'GH_DPA',
    status: 'FULFILLED',
    requestDetails: 'Full export of all AI diagnostic inferences, clinical reasoning traces, and audit logs.',
    requestedAt: '2026-09-09T14:20:00Z',
    fulfilledAt: '2026-09-09T16:00:00Z',
    certifiedBy: 'Legal & Privacy Officer (K. Mensah)',
    auditEvidenceRef: 'export-dsr-482-signed.zip (SHA-256 verified)',
  },
  {
    id: 'DSR-2026-002',
    patientId: 'syn-pat-00482',
    patientName: 'Amara Okafor',
    requestType: 'RIGHT_TO_RESTRICTION',
    jurisdiction: 'GH_DPA',
    status: 'FULFILLED',
    requestDetails: 'Restrict usage of case data for future model fine-tuning (DPO datasets).',
    requestedAt: '2026-09-09T14:25:00Z',
    fulfilledAt: '2026-09-09T14:30:00Z',
    certifiedBy: 'System Auto-Enforcer (DPO Flag set to False)',
    auditEvidenceRef: 'human_feedback_records (dpo_export_eligible = false)',
  },
  {
    id: 'DSR-2026-003',
    patientId: 'syn-pat-00214',
    patientName: 'Tariq Al-Mansoor',
    requestType: 'RIGHT_TO_ERASURE',
    jurisdiction: 'EU_GDPR',
    status: 'PROCESSING',
    requestDetails: 'Request for de-identification and pseudonymization of historical outpatient consultation notes.',
    requestedAt: '2026-09-10T09:40:00Z',
    certifiedBy: 'Privacy Review Desk',
    auditEvidenceRef: 'pending-clinical-review',
  },
];

/**
 * Checks whether an AI inference task is legally permitted under patient's recorded consent scopes
 */
export function checkAiProcessingConsent(
  consent: PatientAiConsent,
  purpose: keyof PatientAiConsent['scopes']
): { allowed: boolean; reason: string } {
  if (!consent.consentGiven) {
    return {
      allowed: false,
      reason: 'Patient has not granted general AI decision support consent.',
    };
  }

  if (!consent.scopes[purpose]) {
    return {
      allowed: false,
      reason: `Patient has explicitly withheld consent for: ${purpose}.`,
    };
  }

  return {
    allowed: true,
    reason: `Consent verified for ${purpose}. Recorded by ${consent.consentedBy}.`,
  };
}

/**
 * Creates and registers a new patient Data Subject Request
 */
export function createDataSubjectRequest(
  patientId: string,
  patientName: string,
  requestType: DataSubjectRequestType,
  jurisdiction: RegulatoryJurisdiction,
  details: string
): DataSubjectRequest {
  return {
    id: `DSR-2026-${Math.floor(100 + Math.random() * 900)}`,
    patientId,
    patientName,
    requestType,
    jurisdiction,
    status: 'SUBMITTED',
    requestDetails: details,
    requestedAt: new Date().toISOString(),
  };
}
