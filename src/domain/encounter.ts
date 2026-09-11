// ============================================================
// src/domain/encounter.ts
// Phase 6D: Clinical Encounter Domain Model
// Answers: "When and in what context did the patient interact with the healthcare system?"
// ============================================================

export type EncounterType =
  | 'OUTPATIENT'
  | 'INPATIENT'
  | 'EMERGENCY'
  | 'TELEHEALTH'
  | 'DIAGNOSTIC'
  | 'OTHER';

export type EncounterStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ENTERED_IN_ERROR';

export interface Encounter {
  id: string;
  patientId: string;
  organizationId: string;
  type: EncounterType;
  status: EncounterStatus;
  startedAt: string;
  endedAt?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}
