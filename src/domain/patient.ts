// ============================================================
// src/domain/patient.ts
// Phase 6D: Longitudinal Patient Domain Model
// A patient is a continuous longitudinal person, distinct from encounters and cases.
// ============================================================

export interface Patient {
  id: string;
  organizationId: string;
  externalPatientId?: string; // Hospital MRN; unique per organization
  givenName: string;
  familyName: string;
  dateOfBirth?: string;
  sex?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSummary extends Patient {
  activeEncountersCount?: number;
  openCasesCount?: number;
}
