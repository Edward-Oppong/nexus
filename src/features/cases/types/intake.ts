// ============================================================
// src/features/cases/types/intake.ts
// Clinical Intake Data Types & Draft Schema (Phase 14 Production)
// Provenance-explicit, structured clinical observations, medications,
// and documents aligned with clinical decision-support standards.
// ============================================================

import { CasePriority } from '../../../domain/case';

export type AdministrativeSex = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export type ProvenanceType =
  | 'HUMAN_ENTERED'
  | 'DEVICE_MEASURED'
  | 'IMPORTED'
  | 'AI_EXTRACTED'
  | 'AI_GENERATED'
  | 'CLINICIAN_VERIFIED';

export interface IntakePatientInput {
  isNewPatient: boolean;
  existingPatientId?: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  administrativeSex: AdministrativeSex;
  externalPatientId: string; // MRN
  phone?: string;
}

export interface IntakeEncounterInput {
  encounterClass: 'IMP' | 'AMB' | 'EMER';
  department: string;
  priority: CasePriority;
}

export interface IntakePresentationInput {
  title: string; // Chief complaint / clinical problem title
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  physicalExamNotes: string;
}

export interface IntakeObservationInput {
  id: string;
  category: 'vital-signs' | 'laboratory' | 'exam' | 'imaging';
  code: string;
  display: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
  observedAt: string;
  source: string;
  provenanceType: ProvenanceType;
  actorName: string;
  sourceDocumentId?: string;
  sourcePage?: number;
  sourceSnippet?: string;
  verificationStatus: 'UNVERIFIED' | 'REVIEW_REQUIRED' | 'VERIFIED' | 'REJECTED';
}

export interface IntakeMedicationInput {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  status: 'ACTIVE' | 'ORDERED' | 'DISCONTINUED';
  source: string;
  provenanceType: ProvenanceType;
}

export interface IntakeAllergyInput {
  id: string;
  substance: string;
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  verificationStatus: 'UNCONFIRMED' | 'CONFIRMED';
  source: string;
  provenanceType: ProvenanceType;
}

export interface ExtractedFindingCandidate {
  id: string;
  category: 'vital-signs' | 'laboratory' | 'exam' | 'imaging' | 'medication' | 'diagnosis';
  label: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  interpretation?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
  sourceDocumentTitle: string;
  sourcePage: number;
  sourceSnippet: string;
  provenanceType: 'AI_EXTRACTED' | 'CLINICIAN_VERIFIED';
  verificationStatus: 'REVIEW_REQUIRED' | 'VERIFIED' | 'REJECTED';
  isAccepted?: boolean;
}

export interface IntakeDocumentInput {
  id: string;
  title: string;
  category: 'Consult Note' | 'Discharge Summary' | 'Laboratory Report' | 'Imaging Report' | 'Pathology';
  mimeType: string;
  fileSize?: number;
  uploadedAt: string;
  rawText?: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'image' | 'text';
  pageCount?: number;
  extractedFindings: ExtractedFindingCandidate[];
}

export interface CaseIntakeDraft {
  version: string;
  updatedAt: string;
  currentStep: number;
  patient: IntakePatientInput;
  encounter: IntakeEncounterInput;
  presentation: IntakePresentationInput;
  observations: IntakeObservationInput[];
  medications: IntakeMedicationInput[];
  allergies: IntakeAllergyInput[];
  documents: IntakeDocumentInput[];
}
