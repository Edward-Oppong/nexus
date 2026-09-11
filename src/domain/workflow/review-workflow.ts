// ============================================================
// src/domain/workflow/review-workflow.ts
// Phase 6G: Human-in-the-Loop Review Queue & Adjudication Engine
// Enforces:
// 1. Dedicated ReviewQueue types & states
// 2. Accept / Edit (diff preview, preserved original) / Reject (mandatory reason)
// 3. WHO SMART / FDA CDS non-delegable clinician oversight
// ============================================================

import { ReviewAction } from '../nexus-assessment';

export type ReviewItemType =
  | 'NEXUS_ASSESSMENT'
  | 'AI_FINDING'
  | 'INVESTIGATION_RESULT'
  | 'CONTRADICTION'
  | 'SAFETY_CONCERN'
  | 'DECISION_AMENDMENT';

export type ReviewStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'DISMISSED';

export type ReviewPriority = 'ROUTINE' | 'HIGH' | 'URGENT';

export type RejectReasonCategory =
  | 'INCORRECT'
  | 'UNSUPPORTED'
  | 'EVIDENCE_NOT_APPLICABLE'
  | 'DUPLICATE'
  | 'OUTSIDE_SCOPE'
  | 'OTHER';

export const REJECT_REASON_LABELS: Record<RejectReasonCategory, string> = {
  INCORRECT: 'Factually incorrect or discordant with patient',
  UNSUPPORTED: 'Unsupported by case findings or laboratory data',
  EVIDENCE_NOT_APPLICABLE: 'Cited clinical evidence is not applicable to patient context',
  DUPLICATE: 'Duplicate of existing verified clinical finding',
  OUTSIDE_SCOPE: 'Outside acute diagnostic scope',
  OTHER: 'Other clinical reason',
};

export interface ReviewItem {
  id: string;
  caseId: string;
  caseTitle?: string;
  patientIdentifier: string;
  itemType: ReviewItemType;
  priority: ReviewPriority;
  title: string;
  description: string;
  sourceContext: string;
  status: ReviewStatus;
  createdAt: string;
  assignedTo?: string;
  targetId?: string; // ID of the finding, assessment, or contradiction being reviewed
  payload?: any;
}

export interface ClinicalReviewRecord {
  id: string;
  assessmentId?: string;
  findingId?: string;
  caseId: string;
  reviewerId: string;
  reviewerName: string;
  action: ReviewAction;
  originalContent: string;
  revisedContent?: string;
  reasonCategory?: RejectReasonCategory;
  reason?: string;
  reviewedAt: string;
}

/**
 * Validates whether an adjudication action meets FDA CDS auditability requirements.
 */
export function validateReviewAction(
  action: ReviewAction,
  originalContent: string,
  revisedContent?: string,
  reasonCategory?: RejectReasonCategory,
  reason?: string
): { valid: boolean; error?: string } {
  if (action === 'REJECT') {
    if (!reason || reason.trim().length === 0) {
      return {
        valid: false,
        error: 'Clinical explanation is mandatory when rejecting an AI-generated finding.',
      };
    }
    if (!reasonCategory) {
      return {
        valid: false,
        error: 'Please select a reason category for quality and regulatory tracking.',
      };
    }
  }

  if (action === 'EDIT') {
    if (!revisedContent || revisedContent.trim().length === 0) {
      return {
        valid: false,
        error: 'Revised clinician text cannot be empty when editing a finding.',
      };
    }
    if (revisedContent.trim() === originalContent.trim()) {
      return {
        valid: false,
        error: 'Revised content is identical to the original. Use Accept if no changes are required.',
      };
    }
  }

  return { valid: true };
}

/**
 * Permission checks for review capabilities.
 */
export function canPerformReviewAction(
  action: ReviewAction,
  hasPermission?: (permission: string) => boolean
): boolean {
  if (!hasPermission) return true; // Default permissive in dev/test
  switch (action) {
    case 'ACCEPT':
      return hasPermission('nexus.accept') || hasPermission('nexus.review');
    case 'EDIT':
      return hasPermission('nexus.edit') || hasPermission('nexus.review');
    case 'REJECT':
      return hasPermission('nexus.reject') || hasPermission('nexus.review');
    default:
      return hasPermission('nexus.review');
  }
}
