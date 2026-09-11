// ============================================================
// src/domain/investigation.ts
// Phase 6E: Diagnostic Investigation & Order Domain Model (Section 8 & 9)
// Represents requests for diagnostic tests or procedures.
// FHIR R4 Alignment: ServiceRequest Resource
// ============================================================

export type CanonicalInvestigationStatus =
  | 'REQUESTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type InvestigationStatus = CanonicalInvestigationStatus | 'Requested' | 'In progress' | 'Result available' | 'Cancelled';

export type InvestigationPriority = 'ROUTINE' | 'URGENT' | 'STAT';

export interface Investigation {
  id: string;
  caseId: string;
  investigationType: string;
  code?: string;
  reason?: string;
  priority: InvestigationPriority;
  status: CanonicalInvestigationStatus;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
}

export interface ReasoningImpact {
  hypothesisId: string;
  hypothesisTitle: string;
  impact: 'Strengthened' | 'Weakened' | 'Unchanged';
  detail: string;
}

export interface InvestigationResult {
  id?: string;
  investigationId?: string;
  resultType?: string;
  label?: string;
  completedAt: string;
  laboratoryPersonnel: string;
  testParameter: string;
  value: string;
  valueNumeric?: number;
  valueText?: string;
  unit: string;
  referenceRange: string;
  status: 'Abnormal' | 'Critical' | 'Normal' | 'Borderline';
  interpretation: string;
  impactOnReasoning: ReasoningImpact[];
  provenanceId?: string;
  reportedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface InvestigationOrder {
  id: string;
  caseId: string;
  testName: string;
  category: 'Laboratory' | 'Imaging' | 'Cardiovascular' | 'Microbiology';
  priority: 'Stat' | 'Urgent' | 'Routine';
  requestedBy: string;
  requestedAt: string;
  clinicalIndication: string;
  status: InvestigationStatus;
  result?: InvestigationResult;
}
