// ============================================================
// src/domain/case.ts
// Phase 6D: Central Case Entity & State Lifecycle
// ============================================================

export type CaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ANALYZING'
  | 'PRELIMINARY'
  | 'REVIEW_REQUIRED'
  | 'CLINICIAN_REVIEW'
  | 'DECISION_RECORDED'
  | 'RESOLVED'
  // Exception states
  | 'UNCERTAIN'
  | 'CONTRADICTORY'
  | 'SAFETY_REVIEW'
  | 'INSUFFICIENT_DATA'
  | 'OUT_OF_SCOPE';

// CaseState is an alias for CaseStatus for backward compatibility
export type CaseState = CaseStatus;

export type CasePriority = 'ROUTINE' | 'HIGH' | 'URGENT';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface Case {
  id: string;
  organizationId: string;
  patientId: string;
  encounterId?: string;
  caseNumber: string; // e.g. "CASE-10482"
  title: string;      // Clinical presentation/problem, NOT premature diagnosis
  status: CaseStatus;
  priority: CasePriority;
  openedAt: string;
  closedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyntheticPatient {
  id: string;
  syntheticIdentifier: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  encounterNumber: string;
  encounterType: 'Outpatient encounter' | 'Inpatient admission' | 'Emergency evaluation' | 'Consultation';
  encounterDate: string;
  allergiesCount: number;
  activeMedicationsCount: number;
  allergies: Array<{ allergen: string; severity: 'Mild' | 'Moderate' | 'Severe'; reaction: string }>;
  medications: Array<{ name: string; dosage: string; frequency: string; route: string }>;
}

export interface CaseOverview {
  id: string;
  patient: SyntheticPatient;
  state: CaseState;
  priority: Priority;
  assignedClinician: string;
  assignedTeam: string[];
  lastUpdate: string;
  safetyIssueCount: number;
  gapsCount: number;
  hypothesesCount: number;
}
