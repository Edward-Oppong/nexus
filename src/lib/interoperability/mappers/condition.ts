// ============================================================
// src/lib/interoperability/mappers/condition.ts
// Phase 6H: ClinicalFinding ↔ FHIR R4 Condition Mapper
//
// Nexus ClinicalFinding maps to FHIR Condition.
// Verification status in Nexus aligns directly with FHIR's
// verificationStatus value set (confirmed, unconfirmed, refuted).
// ============================================================

import type { FhirCondition, FhirCodeableConcept } from '../fhir/types';
import {
  NEXUS_FINDING_ID_SYSTEM,
  SNOMED_SYSTEM,
  CONDITION_CLINICAL_STATUS_SYSTEM,
  CONDITION_VERIFICATION_STATUS_SYSTEM,
} from '../fhir/version';

// Minimal finding shape for mapping
export interface NexusFindingInput {
  id: string;
  caseId: string;
  patientId?: string;
  encounterId?: string;
  title: string;
  description?: string;
  category?: string;
  snomedCode?: string;
  icd10Code?: string;
  verificationStatus: 'UNVERIFIED' | 'CLINICIAN_VERIFIED' | 'REFUTED' | 'AI_EXTRACTED';
  clinicalStatus?: 'ACTIVE' | 'RESOLVED' | 'INACTIVE';
  onsetDate?: string;
  abatementDate?: string;
  severity?: string;
  notes?: string;
}

// ----------------------------------------------------------
// Nexus Finding → FHIR R4 Condition
// ----------------------------------------------------------

export function toFhirCondition(finding: NexusFindingInput): FhirCondition {
  const code: FhirCodeableConcept = {
    text: finding.title,
  };

  if (finding.snomedCode) {
    code.coding = [
      { system: SNOMED_SYSTEM, code: finding.snomedCode, display: finding.title },
    ];
  }

  return {
    resourceType: 'Condition',
    id: finding.id,
    meta: { lastUpdated: new Date().toISOString() },
    identifier: [
      { use: 'secondary', system: NEXUS_FINDING_ID_SYSTEM, value: finding.id },
    ],
    clinicalStatus: mapClinicalStatus(finding.clinicalStatus),
    verificationStatus: mapVerificationStatus(finding.verificationStatus),
    code,
    subject: finding.patientId
      ? { reference: `Patient/${finding.patientId}` }
      : { display: 'Unknown patient' },
    encounter: finding.encounterId
      ? { reference: `Encounter/${finding.encounterId}` }
      : undefined,
    onsetDateTime: finding.onsetDate,
    abatementDateTime: finding.abatementDate,
    severity: finding.severity ? { text: finding.severity } : undefined,
    note: finding.description
      ? [{ text: finding.description }]
      : finding.notes
      ? [{ text: finding.notes }]
      : undefined,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${finding.title}</p></div>`,
    },
  };
}

// ----------------------------------------------------------
// FHIR R4 Condition → Nexus Finding (partial)
// ----------------------------------------------------------

export function fromFhirCondition(fhir: FhirCondition): Partial<NexusFindingInput> {
  const verificationCode = fhir.verificationStatus?.coding?.[0]?.code;
  const clinicalCode = fhir.clinicalStatus?.coding?.[0]?.code;

  return {
    id: fhir.id,
    title: fhir.code?.text ?? fhir.code?.coding?.[0]?.display ?? 'Unknown condition',
    snomedCode: fhir.code?.coding?.find((c) => c.system === SNOMED_SYSTEM)?.code,
    verificationStatus: mapFhirVerificationToNexus(verificationCode),
    clinicalStatus: mapFhirClinicalToNexus(clinicalCode),
    onsetDate: fhir.onsetDateTime,
    abatementDate: fhir.abatementDateTime,
    notes: fhir.note?.[0]?.text,
  };
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function mapClinicalStatus(status?: string): FhirCodeableConcept {
  const code = status === 'RESOLVED'
    ? 'resolved'
    : status === 'INACTIVE'
    ? 'inactive'
    : 'active';

  return {
    coding: [{ system: CONDITION_CLINICAL_STATUS_SYSTEM, code, display: capitalize(code) }],
    text: capitalize(code),
  };
}

function mapVerificationStatus(status: string): FhirCodeableConcept {
  let code: string;
  let display: string;

  switch (status) {
    case 'CLINICIAN_VERIFIED':
      code = 'confirmed';
      display = 'Confirmed';
      break;
    case 'REFUTED':
      code = 'refuted';
      display = 'Refuted';
      break;
    case 'AI_EXTRACTED':
    case 'UNVERIFIED':
    default:
      code = 'unconfirmed';
      display = 'Unconfirmed';
  }

  return {
    coding: [{ system: CONDITION_VERIFICATION_STATUS_SYSTEM, code, display }],
    text: display,
  };
}

function mapFhirVerificationToNexus(
  code?: string
): NexusFindingInput['verificationStatus'] {
  switch (code) {
    case 'confirmed':
      return 'CLINICIAN_VERIFIED';
    case 'refuted':
      return 'REFUTED';
    default:
      return 'UNVERIFIED';
  }
}

function mapFhirClinicalToNexus(code?: string): NexusFindingInput['clinicalStatus'] {
  switch (code) {
    case 'resolved':
      return 'RESOLVED';
    case 'inactive':
      return 'INACTIVE';
    default:
      return 'ACTIVE';
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
