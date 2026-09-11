// ============================================================
// src/domain/workflow/case-transitions.ts
// Phase 6G: Centralized Case State Machine & Precondition Engine
// Formalizes the clinical lifecycle:
// DRAFT → ACTIVE → ANALYZING → PRELIMINARY → REVIEW_REQUIRED
// → CLINICIAN_REVIEW → DECISION_RECORDED → RESOLVED
// With exception states: INSUFFICIENT_DATA, CONTRADICTORY, SAFETY_REVIEW, OUT_OF_SCOPE
// ============================================================

export type ClinicalCaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ANALYZING'
  | 'PRELIMINARY'
  | 'REVIEW_REQUIRED'
  | 'CLINICIAN_REVIEW'
  | 'DECISION_RECORDED'
  | 'RESOLVED'
  // Exception states
  | 'INSUFFICIENT_DATA'
  | 'CONTRADICTORY'
  | 'SAFETY_REVIEW'
  | 'OUT_OF_SCOPE';

export interface TransitionValidationContext {
  userRole?: string;
  hasPermission?: (permission: string) => boolean;
  hasUnresolvedSafetyCritical: boolean;
  hasUnreviewedFindings: boolean;
  hasActiveDecision: boolean;
  hasPendingInvestigations: boolean;
}

export interface TransitionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredAction?: string;
}

// Allowed state graph
const VALID_TRANSITIONS: Record<ClinicalCaseStatus, ClinicalCaseStatus[]> = {
  DRAFT: ['ACTIVE', 'OUT_OF_SCOPE'],
  ACTIVE: ['ANALYZING', 'PRELIMINARY', 'INSUFFICIENT_DATA', 'CONTRADICTORY', 'SAFETY_REVIEW', 'OUT_OF_SCOPE'],
  ANALYZING: ['PRELIMINARY', 'REVIEW_REQUIRED', 'INSUFFICIENT_DATA', 'CONTRADICTORY', 'SAFETY_REVIEW'],
  PRELIMINARY: ['REVIEW_REQUIRED', 'CLINICIAN_REVIEW', 'ANALYZING', 'SAFETY_REVIEW'],
  REVIEW_REQUIRED: ['CLINICIAN_REVIEW', 'ANALYZING', 'SAFETY_REVIEW'],
  CLINICIAN_REVIEW: ['DECISION_RECORDED', 'ANALYZING', 'REVIEW_REQUIRED', 'SAFETY_REVIEW'],
  DECISION_RECORDED: ['RESOLVED', 'CLINICIAN_REVIEW', 'ANALYZING'],
  RESOLVED: ['ACTIVE', 'CLINICIAN_REVIEW'], // Re-opened case
  // Exception recovery paths
  INSUFFICIENT_DATA: ['ACTIVE', 'ANALYZING', 'PRELIMINARY'],
  CONTRADICTORY: ['CLINICIAN_REVIEW', 'ACTIVE', 'ANALYZING'],
  SAFETY_REVIEW: ['CLINICIAN_REVIEW', 'ACTIVE', 'PRELIMINARY', 'REVIEW_REQUIRED'],
  OUT_OF_SCOPE: ['DRAFT', 'ACTIVE'],
};

/**
 * Evaluates whether a case can legally transition from currentStatus to targetStatus
 * enforcing FDA CDS and WHO SMART clinical workflow guardrails.
 */
export function canTransitionCase(
  currentStatus: ClinicalCaseStatus,
  targetStatus: ClinicalCaseStatus,
  context: TransitionValidationContext
): TransitionCheckResult {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // 1. Check if edge exists in state machine
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Illegal clinical workflow transition from ${currentStatus} to ${targetStatus}.`,
    };
  }

  // 2. Evaluate clinical preconditions
  if (targetStatus === 'DECISION_RECORDED') {
    // Permission check
    if (context.hasPermission && !context.hasPermission('decision.create')) {
      return {
        allowed: false,
        reason: 'Insufficient privileges: Recording a formal clinical decision requires the decision.create permission.',
      };
    }

    // CRITICAL PRECONDITION: Blocking safety concern
    if (context.hasUnresolvedSafetyCritical) {
      return {
        allowed: false,
        reason: 'Workflow Interrupted: Cannot record decision. This case has an unresolved SAFETY_CRITICAL concern that must be acknowledged or resolved first.',
        requiredAction: 'Resolve active safety concerns prior to clinical decision recording.',
      };
    }
  }

  if (targetStatus === 'RESOLVED') {
    if (!context.hasActiveDecision) {
      return {
        allowed: false,
        reason: 'Cannot resolve case without an active, recorded clinical decision.',
        requiredAction: 'Record an active clinical decision before case resolution.',
      };
    }

    if (context.hasUnresolvedSafetyCritical) {
      return {
        allowed: false,
        reason: 'Cannot resolve case with active SAFETY_CRITICAL concerns.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Returns all legally reachable states from current state given current context.
 */
export function getAllowedTransitions(
  currentStatus: ClinicalCaseStatus,
  context: TransitionValidationContext
): ClinicalCaseStatus[] {
  const candidates = VALID_TRANSITIONS[currentStatus] || [];
  return candidates.filter((target) => canTransitionCase(currentStatus, target, context).allowed);
}
