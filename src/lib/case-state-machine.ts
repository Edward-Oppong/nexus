// ============================================================
// src/lib/case-state-machine.ts
// Phase 6D: Centralized Case State Machine Rules & Validation
// Strictly prevents illegal clinical status transitions.
// ============================================================

import { CaseStatus } from '../domain/case';

export const ALLOWED_CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: [
    'ANALYZING',
    'INSUFFICIENT_DATA',
    'CONTRADICTORY',
    'SAFETY_REVIEW',
    'OUT_OF_SCOPE',
  ],
  ANALYZING: [
    'PRELIMINARY',
    'CONTRADICTORY',
    'INSUFFICIENT_DATA',
    'ACTIVE',
  ],
  PRELIMINARY: [
    'REVIEW_REQUIRED',
    'CONTRADICTORY',
    'INSUFFICIENT_DATA',
  ],
  REVIEW_REQUIRED: [
    'CLINICIAN_REVIEW',
    'SAFETY_REVIEW',
    'INSUFFICIENT_DATA',
  ],
  CLINICIAN_REVIEW: [
    'DECISION_RECORDED',
    'REVIEW_REQUIRED',
    'ACTIVE',
  ],
  DECISION_RECORDED: [
    'RESOLVED',
    'CLINICIAN_REVIEW',
  ],
  RESOLVED: [
    'ACTIVE', // Re-opened under formal review
  ],
  // Exceptional / Attention states
  UNCERTAIN: [
    'ACTIVE',
    'REVIEW_REQUIRED',
    'CLINICIAN_REVIEW',
  ],
  CONTRADICTORY: [
    'SAFETY_REVIEW',
    'CLINICIAN_REVIEW',
    'ACTIVE',
  ],
  SAFETY_REVIEW: [
    'CLINICIAN_REVIEW',
    'ACTIVE',
  ],
  INSUFFICIENT_DATA: [
    'ACTIVE',
    'CLINICIAN_REVIEW',
  ],
  OUT_OF_SCOPE: [
    'ACTIVE',
  ],
};

/**
 * Validates whether transitioning from current to target status is clinically valid.
 */
export function validateCaseTransition(current: CaseStatus, target: CaseStatus): { isValid: boolean; error?: string } {
  if (current === target) {
    return { isValid: true };
  }

  const allowed = ALLOWED_CASE_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return {
      isValid: false,
      error: `Illegal clinical transition: Cannot move case from "${current}" to "${target}". Permitted transitions: ${allowed?.join(', ') || 'none'}.`,
    };
  }

  return { isValid: true };
}

/**
 * Descriptions for clinical states (Section 4)
 */
export const CASE_STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  DRAFT: 'Case initialized but not yet active in clinical intake.',
  ACTIVE: 'Active clinical assessment underway; data gathering in progress.',
  ANALYZING: 'Nexus background reasoning evaluating findings and biomarker trends.',
  PRELIMINARY: 'Initial candidate findings synthesized; awaiting clinician triage.',
  REVIEW_REQUIRED: 'Nexus candidate findings require clinician review before case can proceed.',
  CLINICIAN_REVIEW: 'Attending clinician reviewing candidate hypotheses and safety considerations.',
  DECISION_RECORDED: 'Authoritative clinical decision recorded by physician; awaiting resolution.',
  RESOLVED: 'Clinical encounter concluded and management plan executed.',
  UNCERTAIN: 'Diagnostic ambiguity; competing hypotheses have similar plausibility.',
  CONTRADICTORY: 'Conflicting clinical or laboratory findings identified requiring human reconciliation.',
  SAFETY_REVIEW: 'Urgent red flag or safety alert raised requiring immediate sign-off.',
  INSUFFICIENT_DATA: 'Clinical presentation lacks requisite baseline information to evaluate hypotheses.',
  OUT_OF_SCOPE: 'Clinical question requires tertiary specialization outside current protocol bounds.',
};
