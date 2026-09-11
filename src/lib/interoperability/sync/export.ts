// ============================================================
// src/lib/interoperability/sync/export.ts
// Phase 6H: Outbound FHIR R4 Export Pipeline
// Assembles complete, valid FHIR Bundles from Nexus Case Data
// ============================================================

import type { FhirBundle, FhirBundleEntry } from '../fhir/types';
import { toFhirPatient } from '../mappers/patient';
import { toFhirEncounter } from '../mappers/encounter';
import { toFhirCondition } from '../mappers/condition';
import { toFhirObservation } from '../mappers/observation';
import { toFhirDiagnosticReport } from '../mappers/diagnostic-report';
import { toFhirServiceRequest } from '../mappers/service-request';
import { toFhirDocumentReference } from '../mappers/document-reference';
import { toFhirCareTeam } from '../mappers/care-team';
import type { Patient } from '../../../domain/patient';
import type { Case } from '../../../domain/case';
import type { ClinicalFinding } from '../../../domain/finding';
import type { Observation } from '../../../domain/observation';
import type { DiagnosticReport } from '../../../domain/diagnostic-report';
import type { Investigation, InvestigationOrder } from '../../../domain/investigation';
import type { ClinicalDocument } from '../../../domain/document';
import type { CaseMember } from '../../../domain/case-member';

export interface CaseExportData {
  patient: Patient;
  caseRecord: Case;
  findings?: ClinicalFinding[];
  observations?: Observation[];
  investigations?: (Investigation | InvestigationOrder)[];
  reports?: DiagnosticReport[];
  documents?: ClinicalDocument[];
  teamMembers?: CaseMember[];
}

export interface ExportBundleOptions {
  bundleType?: 'document' | 'collection' | 'transaction';
  exportId?: string;
}

/**
 * Compiles an entire case workspace into a standard FHIR R4 Bundle.
 */
export function buildCaseFhirBundle(
  data: CaseExportData,
  options: ExportBundleOptions = {}
): FhirBundle {
  const entries: FhirBundleEntry[] = [];
  const bundleType = options.bundleType || 'collection';
  const patientId = data.patient.id;
  const caseId = data.caseRecord.id;

  // 1. Patient
  const fhirPatient = toFhirPatient(data.patient);
  entries.push({
    fullUrl: `urn:uuid:${patientId}`,
    resource: fhirPatient,
    request: bundleType === 'transaction' ? { method: 'POST', url: 'Patient' } : undefined,
  });

  // 2. Encounter (Case)
  const fhirEncounter = toFhirEncounter(data.caseRecord, patientId);
  entries.push({
    fullUrl: `urn:uuid:${caseId}`,
    resource: fhirEncounter,
    request: bundleType === 'transaction' ? { method: 'POST', url: 'Encounter' } : undefined,
  });

  // 3. Clinical Findings (Conditions)
  if (data.findings && data.findings.length > 0) {
    for (const finding of data.findings) {
      const condition = toFhirCondition({
        id: finding.id,
        caseId: finding.caseId || caseId,
        patientId,
        title: finding.label,
        description: finding.description,
        category: finding.category,
        verificationStatus:
          finding.provenance?.verificationStatus === 'Verified'
            ? 'CLINICIAN_VERIFIED'
            : 'UNVERIFIED',
        clinicalStatus: 'ACTIVE',
        onsetDate: (finding as any).firstObservedAt || finding.createdAt,
      });
      entries.push({
        fullUrl: `urn:uuid:${finding.id}`,
        resource: condition,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'Condition' } : undefined,
      });
    }
  }

  // 4. Observations
  if (data.observations && data.observations.length > 0) {
    for (const obs of data.observations) {
      const fhirObs = toFhirObservation({
        id: obs.id,
        caseId: obs.caseId || caseId,
        patientId,
        category: obs.category,
        code: obs.code,
        label: obs.label,
        valueNumeric: obs.valueNumeric,
        valueText: obs.valueText,
        unit: obs.unit,
        observedAt: obs.observedAt,
      });
      entries.push({
        fullUrl: `urn:uuid:${obs.id}`,
        resource: fhirObs,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'Observation' } : undefined,
      });
    }
  }

  // 5. Investigations (ServiceRequests)
  if (data.investigations && data.investigations.length > 0) {
    for (const inv of data.investigations) {
      const anyInv = inv as any;
      const testName = anyInv.testName || anyInv.investigationType || 'Diagnostic Test';
      const sr = toFhirServiceRequest({
        id: anyInv.id,
        caseId: anyInv.caseId || caseId,
        patientId,
        testName,
        category: anyInv.category || 'Laboratory',
        loincCode: anyInv.code || anyInv.loincCode,
        priority:
          anyInv.priority === 'STAT' || anyInv.priority === 'Stat'
            ? 'Stat'
            : anyInv.priority === 'URGENT' || anyInv.priority === 'Urgent'
            ? 'Urgent'
            : 'Routine',
        status: 'ORDERED',
      });
      entries.push({
        fullUrl: `urn:uuid:${inv.id}`,
        resource: sr,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'ServiceRequest' } : undefined,
      });
    }
  }

  // 6. Diagnostic Reports
  if (data.reports && data.reports.length > 0) {
    for (const rep of data.reports) {
      const fhirReport = toFhirDiagnosticReport(rep, patientId);
      entries.push({
        fullUrl: `urn:uuid:${rep.id}`,
        resource: fhirReport,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'DiagnosticReport' } : undefined,
      });
    }
  }

  // 7. Clinical Documents (DocumentReferences)
  if (data.documents && data.documents.length > 0) {
    for (const doc of data.documents) {
      const docRef = toFhirDocumentReference(doc);
      entries.push({
        fullUrl: `urn:uuid:${doc.id}`,
        resource: docRef,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'DocumentReference' } : undefined,
      });
    }
  }

  // 8. Care Team
  if (data.teamMembers && data.teamMembers.length > 0) {
    const careTeam = toFhirCareTeam(caseId, patientId, data.teamMembers);
    entries.push({
      fullUrl: `urn:uuid:careteam-${caseId}`,
      resource: careTeam,
      request: bundleType === 'transaction' ? { method: 'POST', url: 'CareTeam' } : undefined,
    });
  }

  return {
    resourceType: 'Bundle',
    id: options.exportId || `export-${caseId}-${Date.now()}`,
    type: bundleType,
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries,
  };
}
