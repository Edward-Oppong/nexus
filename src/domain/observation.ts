// ============================================================
// src/domain/observation.ts
// Phase 6E: Clinical Observations Domain Model (Section 2 & 3)
// Represents a measured or recorded clinical parameter.
// FHIR R4 Alignment: Observation Resource
// ============================================================

export type ObservationCategory =
  | 'VITAL_SIGN'
  | 'LABORATORY'
  | 'IMAGING'
  | 'DEVICE'
  | 'PHYSICAL_EXAM'
  | 'OTHER';

export interface Observation {
  id: string;
  caseId: string;
  category: ObservationCategory;
  code?: string; // LOINC or SNOMED CT code
  label: string; // e.g. "Body Temperature", "SpO2"
  valueNumeric?: number;
  valueText?: string;
  unit?: string; // UCUM unit code: "°C", "%", "mmHg"
  referenceLow?: number;
  referenceHigh?: number;
  observedAt: string;
  provenanceId: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}
