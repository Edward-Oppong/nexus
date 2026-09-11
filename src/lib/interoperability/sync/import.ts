// ============================================================
// src/lib/interoperability/sync/import.ts
// Phase 6H: Inbound FHIR R4 Import Pipeline
// ============================================================

import type {
  FhirBundle,
  FhirResource,
  FhirPatient,
  FhirObservation,
  FhirCondition,
  FhirDiagnosticReport,
  FhirDocumentReference,
} from '../fhir/types';
import { validateFhirResource } from '../fhir/validators';
import { fromFhirPatient } from '../mappers/patient';
import { fromFhirObservation } from '../mappers/observation';
import { fromFhirCondition } from '../mappers/condition';
import { fromFhirDiagnosticReport } from '../mappers/diagnostic-report';
import { fromFhirDocumentReference } from '../mappers/document-reference';
import { generateIdempotencyKey } from '../normalization/identifiers';
import type { Patient } from '../../../domain/patient';
import type { ClinicalFinding } from '../../../domain/finding';
import type { DiagnosticReport } from '../../../domain/diagnostic-report';
import type { ClinicalDocument } from '../../../domain/document';
import type { Observation } from '../../../domain/observation';

export interface ImportPipelineOptions {
  organizationId: string;
  sourceSystem: string;
  sourceId?: string;
  caseId?: string;
  patientId?: string;
  processedKeys?: Set<string>;
}

export interface ImportPipelineResult {
  recordsReceived: number;
  recordsImported: number;
  recordsSkipped: number;
  recordsFailed: number;
  patients: Partial<Patient>[];
  observations: Partial<Observation>[];
  findings: Partial<ClinicalFinding>[];
  reports: Partial<DiagnosticReport>[];
  documents: Partial<ClinicalDocument>[];
  errors: Array<{ resourceType: string; id?: string; error: string }>;
  idempotencyKeys: string[];
}

/**
 * Ingests a FHIR R4 resource or Bundle, applies idempotency checks,
 * normalizes data, and returns domain models ready for persistence.
 */
export function processInboundFhir(
  payload: FhirResource | FhirBundle,
  options: ImportPipelineOptions
): ImportPipelineResult {
  const result: ImportPipelineResult = {
    recordsReceived: 0,
    recordsImported: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    patients: [],
    observations: [],
    findings: [],
    reports: [],
    documents: [],
    errors: [],
    idempotencyKeys: [],
  };

  const processedSet = options.processedKeys || new Set<string>();

  // Unpack bundle or single resource
  const resources: FhirResource[] =
    payload.resourceType === 'Bundle'
      ? (payload.entry || []).map((e) => e.resource).filter((r): r is FhirResource => Boolean(r))
      : [payload];

  result.recordsReceived = resources.length;

  for (const resource of resources) {
    const resType = resource.resourceType;
    const resId = resource.id || 'unidentified';
    const key = generateIdempotencyKey(options.sourceSystem, resType, resId);

    // Idempotency check
    if (processedSet.has(key)) {
      result.recordsSkipped++;
      continue;
    }

    // Validation
    const validation = validateFhirResource(resource);
    if (!validation.isValid) {
      result.recordsFailed++;
      result.errors.push({
        resourceType: resType,
        id: resId,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      });
      continue;
    }

    try {
      switch (resource.resourceType) {
        case 'Patient': {
          const mapped = fromFhirPatient(resource as FhirPatient, options.organizationId);
          result.patients.push(mapped);
          result.recordsImported++;
          result.idempotencyKeys.push(key);
          processedSet.add(key);
          break;
        }

        case 'Observation': {
          const obs = fromFhirObservation(resource as FhirObservation);
          result.observations.push({
            id: obs.id || crypto.randomUUID(),
            caseId: options.caseId || '',
            category: 'VITAL_SIGN',
            label: obs.label || 'Observation',
            code: obs.code,
            valueNumeric: obs.valueNumeric,
            valueText: obs.valueText,
            unit: obs.unit,
            observedAt: obs.observedAt || new Date().toISOString(),
            provenanceId: 'prov-import',
            createdAt: new Date().toISOString(),
          });
          result.recordsImported++;
          result.idempotencyKeys.push(key);
          processedSet.add(key);
          break;
        }

        case 'Condition': {
          const findingInput = fromFhirCondition(resource as FhirCondition);
          result.findings.push({
            id: findingInput.id || crypto.randomUUID(),
            caseId: options.caseId || '',
            label: findingInput.title || 'External Finding',
            category: 'SIGN',
            provenance: {
              sourceContext: options.sourceSystem,
              recordedBy: 'Integration Import',
              recordedAt: new Date().toISOString(),
              provenanceType: 'IMPORTED',
              verificationStatus:
                findingInput.verificationStatus === 'CLINICIAN_VERIFIED'
                  ? 'Verified'
                  : 'Unverified',
            },
            createdAt: new Date().toISOString(),
          });
          result.recordsImported++;
          result.idempotencyKeys.push(key);
          processedSet.add(key);
          break;
        }

        case 'DiagnosticReport': {
          const report = fromFhirDiagnosticReport(resource as FhirDiagnosticReport);
          result.reports.push(report);
          result.recordsImported++;
          result.idempotencyKeys.push(key);
          processedSet.add(key);
          break;
        }

        case 'DocumentReference': {
          const doc = fromFhirDocumentReference(
            resource as FhirDocumentReference,
            options.organizationId,
            'system-import'
          );
          result.documents.push(doc as Partial<ClinicalDocument>);
          result.recordsImported++;
          result.idempotencyKeys.push(key);
          processedSet.add(key);
          break;
        }

        default:
          result.recordsSkipped++;
          break;
      }
    } catch (err: unknown) {
      result.recordsFailed++;
      result.errors.push({
        resourceType: resType,
        id: resId,
        error: err instanceof Error ? err.message : 'Unknown mapping error',
      });
    }
  }

  return result;
}
