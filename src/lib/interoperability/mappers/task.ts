// ============================================================
// src/lib/interoperability/mappers/task.ts
// Phase 6H: ClinicalTask ↔ FHIR R4 Task Mapper
// ============================================================

import type { ClinicalTask, TaskPriority, TaskStatus } from '../../../domain/workflow/task-workflow';
import type { FhirTask, FhirTaskStatus } from '../fhir/types';
import { NEXUS_SYSTEMS } from '../fhir/version';

function mapStatusToFhir(status: TaskStatus): FhirTaskStatus {
  switch (status) {
    case 'OPEN':
      return 'requested';
    case 'IN_PROGRESS':
      return 'in-progress';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'requested';
  }
}

function mapStatusFromFhir(status: FhirTaskStatus): TaskStatus {
  switch (status) {
    case 'in-progress':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
    case 'rejected':
    case 'failed':
      return 'CANCELLED';
    default:
      return 'OPEN';
  }
}

function mapPriorityToFhir(priority: TaskPriority): 'routine' | 'urgent' | 'stat' {
  switch (priority) {
    case 'URGENT':
      return 'stat';
    case 'HIGH':
      return 'urgent';
    case 'ROUTINE':
    default:
      return 'routine';
  }
}

function mapPriorityFromFhir(priority?: string): TaskPriority {
  switch (priority) {
    case 'stat':
      return 'URGENT';
    case 'urgent':
    case 'asap':
      return 'HIGH';
    case 'routine':
    default:
      return 'ROUTINE';
  }
}

/**
 * Maps a Nexus ClinicalTask to a FHIR R4 Task resource.
 */
export function toFhirTask(task: ClinicalTask): FhirTask {
  return {
    resourceType: 'Task',
    id: task.id,
    identifier: [
      {
        system: NEXUS_SYSTEMS.TASK,
        value: task.id,
      },
    ],
    status: mapStatusToFhir(task.status),
    intent: 'order',
    priority: mapPriorityToFhir(task.priority),
    code: {
      text: task.title,
    },
    description: task.description || task.title,
    for: task.patientIdentifier
      ? {
          reference: `Patient/${task.patientIdentifier}`,
        }
      : undefined,
    encounter: task.caseId
      ? {
          reference: `Encounter/${task.caseId}`,
        }
      : undefined,
    executionPeriod: task.dueAt
      ? {
          end: task.dueAt,
        }
      : undefined,
    authoredOn: task.createdAt,
    lastModified: task.completedAt || task.createdAt,
    requester: task.createdBy
      ? {
          reference: `Practitioner/${task.createdBy}`,
          display: task.createdByName,
        }
      : undefined,
    owner: task.assignedTo
      ? {
          reference: `Practitioner/${task.assignedTo}`,
          display: task.assignedToName,
        }
      : undefined,
  };
}

/**
 * Maps a FHIR R4 Task to a partial Nexus ClinicalTask.
 */
export function fromFhirTask(fhirTask: FhirTask): Partial<ClinicalTask> {
  const patientRef = fhirTask.for?.reference;
  const patientIdentifier = patientRef?.startsWith('Patient/')
    ? patientRef.replace('Patient/', '')
    : patientRef;

  const encRef = fhirTask.encounter?.reference;
  const caseId = encRef?.startsWith('Encounter/') ? encRef.replace('Encounter/', '') : encRef;

  const ownerRef = fhirTask.owner?.reference;
  const assignedTo = ownerRef?.startsWith('Practitioner/')
    ? ownerRef.replace('Practitioner/', '')
    : ownerRef;

  const reqRef = fhirTask.requester?.reference;
  const createdBy = reqRef?.startsWith('Practitioner/')
    ? reqRef.replace('Practitioner/', '')
    : reqRef;

  return {
    id: fhirTask.id || '',
    title: fhirTask.code?.text || fhirTask.description || 'Clinical Task',
    description: fhirTask.description,
    status: mapStatusFromFhir(fhirTask.status),
    priority: mapPriorityFromFhir(fhirTask.priority),
    dueAt: fhirTask.executionPeriod?.end,
    patientIdentifier,
    caseId,
    assignedTo,
    assignedToName: fhirTask.owner?.display,
    createdBy: createdBy || 'external',
    createdByName: fhirTask.requester?.display || 'External System',
    createdAt: fhirTask.authoredOn || new Date().toISOString(),
    completedAt: fhirTask.status === 'completed' ? fhirTask.lastModified : undefined,
  };
}
