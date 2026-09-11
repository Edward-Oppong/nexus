// ============================================================
// src/domain/workflow/decision-workflow.ts
// Phase 6G: Clinical Decision Architecture & Immutability Engine
// Key Architectural Principle:
// Nexus assessment != Clinical decision.
// Nexus proposes. The clinician owns and records the decision.
// Decisions are strictly append-only: amendments create a linked chain.
// ============================================================

export type DecisionType =
  | 'CLINICAL_ASSESSMENT'
  | 'INVESTIGATION_PLAN'
  | 'FOLLOW_UP'
  | 'REFERRAL'
  | 'CASE_RESOLUTION'
  | 'OTHER';

export type DecisionStatus = 'ACTIVE' | 'AMENDED' | 'VOID';

export const DECISION_TYPE_LABELS: Record<DecisionType, string> = {
  CLINICAL_ASSESSMENT: 'Clinical Assessment & Diagnostic Formulation',
  INVESTIGATION_PLAN: 'Investigation & Diagnostic Workup Plan',
  FOLLOW_UP: 'Therapeutic Follow-up & Monitoring Protocol',
  REFERRAL: 'Subspecialty Referral & Transfer of Care',
  CASE_RESOLUTION: 'Case Resolution & Clinical Discharge',
  OTHER: 'Other Clinical Directive',
};

export interface Decision {
  id: string;
  caseId: string;
  decisionType: DecisionType;
  summary: string;
  rationale?: string;
  recordedBy: string;
  recordedByRole?: string;
  status: DecisionStatus;
  recordedAt: string;
  amendedFrom?: string;             // Points to predecessor decision
  amendmentReason?: string;
  relatedAssessmentId?: string;     // Grounding link to Nexus Assessment
  supportingEvidenceIds?: string[]; // Grounding link to guidelines
  supportingFindingIds?: string[];  // Grounding link to patient findings
  legalDisclaimerAcknowledged: boolean;
}

export interface NewDecisionDraft {
  caseId: string;
  decisionType: DecisionType;
  summary: string;
  rationale?: string;
  relatedAssessmentId?: string;
  supportingEvidenceIds?: string[];
  supportingFindingIds?: string[];
  legalDisclaimerAcknowledged: boolean;
}

/**
 * Creates an immutable amendment to an existing decision.
 * The original decision becomes 'AMENDED' (never deleted or overwritten),
 * and the new decision points to it via `amendedFrom`.
 */
export function amendDecision(
  priorDecision: Decision,
  amendment: {
    summary: string;
    rationale?: string;
    decisionType?: DecisionType;
    amendmentReason: string;
  },
  recordedBy: string,
  recordedByRole?: string
): { amendedPrior: Decision; activeNew: Decision } {
  const timestamp = new Date().toISOString();

  const amendedPrior: Decision = {
    ...priorDecision,
    status: 'AMENDED',
  };

  const activeNew: Decision = {
    id: `dec-${Date.now()}`,
    caseId: priorDecision.caseId,
    decisionType: amendment.decisionType || priorDecision.decisionType,
    summary: amendment.summary,
    rationale: amendment.rationale || priorDecision.rationale,
    recordedBy,
    recordedByRole: recordedByRole || priorDecision.recordedByRole,
    status: 'ACTIVE',
    recordedAt: timestamp,
    amendedFrom: priorDecision.id,
    amendmentReason: amendment.amendmentReason,
    relatedAssessmentId: priorDecision.relatedAssessmentId,
    supportingEvidenceIds: priorDecision.supportingEvidenceIds,
    supportingFindingIds: priorDecision.supportingFindingIds,
    legalDisclaimerAcknowledged: true,
  };

  return { amendedPrior, activeNew };
}

/**
 * Traverses decision history by following amendedFrom backwards.
 */
export function getDecisionHistoryChain(decisions: Decision[], activeDecisionId: string): Decision[] {
  const chain: Decision[] = [];
  const map = new Map(decisions.map((d) => [d.id, d]));

  let current = map.get(activeDecisionId);
  while (current) {
    chain.push(current);
    if (!current.amendedFrom) break;
    current = map.get(current.amendedFrom);
  }

  return chain;
}
