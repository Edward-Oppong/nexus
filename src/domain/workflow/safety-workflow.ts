// ============================================================
// src/domain/workflow/safety-workflow.ts
// Phase 6G: Structured Clinical Safety Guardrails & Workflow Interrupts
// Principles:
// 1. Safety concerns are first-class structured entities, not free text.
// 2. SAFETY_CRITICAL concerns interrupt normal workflow and block decision recording.
// 3. Lifecycle: OPEN → ACKNOWLEDGED → RESOLVED. Safety concerns are never deleted.
// ============================================================

export type SafetyConcernSeverity =
  | 'INFORMATION'     // Contextual information
  | 'ATTENTION'       // Worth reviewing, non-blocking
  | 'URGENT_REVIEW'   // Requires prompt human attention
  | 'SAFETY_CRITICAL'; // Blocks decision recording; mandatory safety workflow

export type SafetyTriggerSource = 'SYSTEM' | 'NEXUS' | 'CLINICIAN' | 'INVESTIGATION';

export type SafetyConcernStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface SafetyConcern {
  id: string;
  caseId: string;
  severity: SafetyConcernSeverity;
  category: string; // e.g. 'Allergy Contraindication', 'Measurement Discrepancy'
  description: string;
  triggerSource: SafetyTriggerSource;
  recommendedAction?: string;
  status: SafetyConcernStatus;
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedByName?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  clinicalNote?: string;
}

/**
 * Checks if a case currently has any blocking safety-critical issues that prevent decision recording.
 */
export function hasBlockingSafetyIssue(concerns: SafetyConcern[]): boolean {
  return concerns.some(
    (c) => c.severity === 'SAFETY_CRITICAL' && c.status !== 'RESOLVED'
  );
}

/**
 * Transition: OPEN -> ACKNOWLEDGED
 */
export function acknowledgeConcern(
  concern: SafetyConcern,
  userId: string,
  userName: string,
  note?: string
): SafetyConcern {
  return {
    ...concern,
    status: 'ACKNOWLEDGED',
    acknowledgedBy: userId,
    acknowledgedByName: userName,
    acknowledgedAt: new Date().toISOString(),
    clinicalNote: note || concern.clinicalNote,
  };
}

/**
 * Transition: ACKNOWLEDGED / OPEN -> RESOLVED
 */
export function resolveConcern(
  concern: SafetyConcern,
  userId: string,
  userName: string,
  note: string
): SafetyConcern {
  return {
    ...concern,
    status: 'RESOLVED',
    resolvedBy: userId,
    resolvedByName: userName,
    resolvedAt: new Date().toISOString(),
    clinicalNote: note,
  };
}
