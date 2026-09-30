// ============================================================
// src/data/cases/mockWorkflowData.ts
// All mock workflow data has been removed.
// Safety concerns, review queue items, decisions, and tasks
// are now created by the user through the application workflow.
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
