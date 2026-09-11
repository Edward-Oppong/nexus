// ============================================================
// src/domain/workflow/task-workflow.ts
// Phase 6G: Clinical Tasks & Follow-up Workflow Engine
// Governs human-directed and Nexus-suggested tasks.
// Prevents uncontrolled background task accumulation.
// ============================================================

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'ROUTINE' | 'HIGH' | 'URGENT';

export interface ClinicalTask {
  id: string;
  caseId?: string;
  patientIdentifier?: string;
  assignedTo?: string;
  assignedToName?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  relatedFindingId?: string;
  relatedAssessmentId?: string;
}

export function createClinicalTask(
  draft: Omit<ClinicalTask, 'id' | 'createdAt' | 'status'>
): ClinicalTask {
  return {
    ...draft,
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };
}

export function completeClinicalTask(
  task: ClinicalTask,
  completedBy: string
): ClinicalTask {
  return {
    ...task,
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    completedBy,
  };
}

export function cancelClinicalTask(
  task: ClinicalTask
): ClinicalTask {
  return {
    ...task,
    status: 'CANCELLED',
  };
}
