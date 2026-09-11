// ============================================================
// src/domain/contradiction.ts
// Phase 6E: Clinical Contradiction Domain Model (Section 14)
// First-class entity for surfacing discrepancies without pretense of certainty.
// ============================================================

export interface ClinicalContradiction {
  id: string;
  caseId: string;
  findingAId?: string;
  findingBId?: string;
  observationAId?: string;
  observationBId?: string;
  description: string;
  severity: 'INFORMATION' | 'ATTENTION' | 'URGENT_REVIEW' | 'SAFETY_CRITICAL';
  status: 'OPEN' | 'RECONCILED' | 'DISMISSED';
  detectedBy: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
}
