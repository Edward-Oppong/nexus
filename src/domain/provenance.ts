// ============================================================
// src/domain/provenance.ts
// Phase 6E: Provenance Record Domain Model (Section 7 & 16)
// Establishes the authoritative chain of clinical data origin.
// FHIR R4 Alignment: Provenance Resource
// ============================================================

export type ProvenanceType =
  | 'HUMAN_ENTERED'
  | 'DEVICE_MEASURED'
  | 'IMPORTED'
  | 'AI_EXTRACTED'
  | 'AI_GENERATED'
  | 'CLINICIAN_VERIFIED';

export interface ProvenanceRecord {
  id: string;
  provenanceType: ProvenanceType;
  sourceSystem?: string;     // e.g. "Nexus Bedside", "Mindray BeneVision", "Epic EHR"
  sourceReference?: string;  // Document or record reference
  actorUserId?: string;      // Clinician who entered/verified
  modelName?: string;        // AI Model name if AI-extracted/generated
  modelVersion?: string;     // Model version for regulatory and clinical audit
  capturedAt?: string;
  notes?: string;
  createdAt: string;
}
