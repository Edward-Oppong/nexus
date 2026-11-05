// ============================================================
// src/lib/interoperability/fhir/fhir-case-exporter.ts
// Converts an active FullSyntheticCase into a valid FHIR R4
// Transaction / Document Bundle conforming to HL7 FHIR R4 & WHO SMART.
// ============================================================

import { FullSyntheticCase } from '../../../data/cases/mockCasesData';
import {
  FhirBundle,
  FhirPatient,
  FhirObservation,
  FhirCondition,
  FhirDiagnosticReport,
  FhirResource,
  buildFhirBundle,
} from '../../../domain/fhir';

export function exportCaseToFhirR4Bundle(fullCase: FullSyntheticCase): FhirBundle {
  const now = new Date().toISOString();
  const caseId = fullCase.overview.id;
  const patient = fullCase.overview.patient;
  const patientRef = `urn:uuid:patient-${patient.id || 'anonymous'}`;

  const resources: FhirResource[] = [];

  // 1. Patient Resource
  const fhirPatient: FhirPatient = {
    resourceType: 'Patient',
    id: patient.id || crypto.randomUUID(),
    identifier: [
      {
        system: 'urn:nexus:patient-identifier',
        value: patient.syntheticIdentifier,
      },
    ],
    gender: (patient.gender?.toLowerCase() === 'female' ? 'female' : patient.gender?.toLowerCase() === 'male' ? 'male' : 'other') as any,
    active: true,
  };
  resources.push(fhirPatient);

  // 2. Observations (Vitals & Labs)
  (fullCase.vitalSigns || []).forEach((v, idx) => {
    const obs: FhirObservation = {
      resourceType: 'Observation',
      id: `obs-vital-${idx}-${caseId.slice(0, 8)}`,
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            },
          ],
        },
      ],
      code: {
        text: v.parameter,
      },
      subject: {
        reference: patientRef,
        display: patient.syntheticIdentifier,
      },
      effectiveDateTime: v.recordedAt || now,
      valueString: `${v.value} ${v.unit}`.trim(),
    };
    resources.push(obs);
  });

  (fullCase.findings || []).forEach((f) => {
    const obs: FhirObservation = {
      resourceType: 'Observation',
      id: `obs-finding-${f.id}`,
      status: f.provenance.verificationStatus === 'VERIFIED' || f.provenance.verificationStatus === 'Verified' ? 'final' : 'preliminary',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: f.category?.toLowerCase() || 'exam',
              display: f.category || 'Exam',
            },
          ],
        },
      ],
      code: {
        text: f.label,
      },
      subject: {
        reference: patientRef,
        display: patient.syntheticIdentifier,
      },
      effectiveDateTime: f.provenance.recordedAt || now,
      note: f.description ? [{ text: f.description }] : undefined,
    };
    resources.push(obs);
  });

  // 3. Conditions (Candidate & Adjudicated Hypotheses)
  (fullCase.hypotheses || []).forEach((h) => {
    const condition: FhirCondition = {
      resourceType: 'Condition',
      id: `cond-${h.id}`,
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: h.clinicalReviewStatus === 'Accepted' ? 'active' : 'provisional',
            display: h.clinicalReviewStatus === 'Accepted' ? 'Active' : 'Provisional',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: h.clinicalReviewStatus === 'Accepted' ? 'confirmed' : h.clinicalReviewStatus === 'Rejected' ? 'refuted' : 'provisional',
            display: h.clinicalReviewStatus === 'Accepted' ? 'Confirmed' : h.clinicalReviewStatus === 'Rejected' ? 'Refuted' : 'Provisional',
          },
        ],
      },
      code: {
        text: h.title,
      },
      subject: {
        reference: patientRef,
        display: patient.syntheticIdentifier,
      },
      note: h.rationale ? [{ text: h.rationale }] : undefined,
    };
    resources.push(condition);
  });

  // 4. DiagnosticReports (Investigations & Laboratory Orders)
  (fullCase.investigations || []).forEach((inv) => {
    const report: FhirDiagnosticReport = {
      resourceType: 'DiagnosticReport',
      id: `dr-${inv.id}`,
      status: inv.status === 'Result available' ? 'final' : 'preliminary',
      code: {
        text: inv.testName,
      },
      subject: {
        reference: patientRef,
        display: patient.syntheticIdentifier,
      },
      effectiveDateTime: inv.requestedAt || now,
      conclusion: inv.clinicalIndication ? `Indication: ${inv.clinicalIndication}` : undefined,
    };
    resources.push(report);
  });

  return buildFhirBundle('document', resources, `bundle-${caseId}-${Date.now()}`);
}

export function downloadFhirBundle(bundle: FhirBundle, caseNumber: string = 'case') {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/fhir+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FHIR-R4-Bundle-${caseNumber}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
