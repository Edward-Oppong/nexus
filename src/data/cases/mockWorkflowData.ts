// ============================================================
// src/data/cases/mockWorkflowData.ts
// Workflow initial state definitions for Review Queue, Safety Concerns,
// Immutable Decisions, and Clinical Tasks (Empty for testing)
// ============================================================

import {
  ReviewItem,
  ClinicalReviewRecord,
  SafetyConcern,
  Decision,
  ClinicalTask,
} from '../../domain/workflow';

export const INITIAL_SAFETY_CONCERNS: SafetyConcern[] = [];
export const INITIAL_REVIEW_QUEUE: ReviewItem[] = [];
export const INITIAL_DECISIONS: Decision[] = [];
export const INITIAL_TASKS: ClinicalTask[] = [];
