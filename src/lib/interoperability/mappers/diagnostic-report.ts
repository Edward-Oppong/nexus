// ============================================================
// src/lib/interoperability/mappers/diagnostic-report.ts
// Phase 6H: DiagnosticReport ↔ FHIR R4 DiagnosticReport Mapper
// ============================================================

import type { FhirDiagnosticReport } from '../fhir/types';
import { LOINC_SYSTEM, LOINC_CODES } from '../fhir/version';
import type { DiagnosticReport } from '../../../domain/diagnostic-report';

export function toFhirDiagnosticReport(
  report: DiagnosticReport,
  patientId?: string
): FhirDiagnosticReport {
  return {
    resourceType: 'DiagnosticReport',
    id: report.id,
    meta: { lastUpdated: report.createdAt },
    status: mapStatusToFhir(report.status),
    category: [{ coding: [mapCategoryCode(report.reportType)], text: report.reportType }],
    code: {
      coding: [mapReportTypeToLoinc(report.reportType)],
      text: report.title,
    },
    subject: patientId ? { reference: `Patient/${patientId}` } : undefined,
    encounter: report.caseId ? { reference: `Encounter/${report.caseId}` } : undefined,
    issued: report.createdAt,
    conclusion: report.conclusion,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${report.title}: ${report.conclusion ?? 'No conclusion recorded'}</p></div>`,
    },
  };
}

export function fromFhirDiagnosticReport(fhir: FhirDiagnosticReport): Partial<DiagnosticReport> {
  return {
    id: fhir.id,
    title: fhir.code?.text ?? fhir.code?.coding?.[0]?.display ?? 'Diagnostic Report',
    conclusion: fhir.conclusion,
    status: mapFhirStatusToNexus(fhir.status),
    authoredAt: fhir.effectiveDateTime ?? fhir.issued,
    createdAt: fhir.issued ?? new Date().toISOString(),
    reportType: mapFhirCategoryToNexus(fhir.category?.[0]?.text),
  };
}

function mapStatusToFhir(status: string): FhirDiagnosticReport['status'] {
  const map: Record<string, FhirDiagnosticReport['status']> = {
    PRELIMINARY: 'preliminary',
    FINAL: 'final',
    AMENDED: 'amended',
  };
  return map[status] ?? 'preliminary';
}

function mapFhirStatusToNexus(status: FhirDiagnosticReport['status']): DiagnosticReport['status'] {
  const map: Record<string, DiagnosticReport['status']> = {
    preliminary: 'PRELIMINARY',
    final: 'FINAL',
    amended: 'AMENDED',
  };
  return map[status] ?? 'PRELIMINARY';
}

function mapCategoryCode(type: string) {
  const diagCatSystem = 'http://terminology.hl7.org/CodeSystem/v2-0074';
  const map: Record<string, { system: string; code: string; display: string }> = {
    RADIOLOGY: { system: diagCatSystem, code: 'RAD', display: 'Radiology' },
    PATHOLOGY: { system: diagCatSystem, code: 'PAT', display: 'Pathology' },
    CARDIOLOGY: { system: diagCatSystem, code: 'CUS', display: 'Cardiac Ultrasound' },
    MICROBIOLOGY: { system: diagCatSystem, code: 'MB', display: 'Microbiology' },
    OTHER: { system: diagCatSystem, code: 'OTH', display: 'Other' },
  };
  return map[type] ?? map.OTHER;
}

function mapReportTypeToLoinc(type: string) {
  const map: Record<string, { system: string; code: string; display: string }> = {
    RADIOLOGY: { system: LOINC_SYSTEM, code: LOINC_CODES.RADIOLOGY_REPORT, display: 'Radiology Report' },
    PATHOLOGY: { system: LOINC_SYSTEM, code: '22034-3', display: 'Pathology Report' },
    CARDIOLOGY: { system: LOINC_SYSTEM, code: '10193-1', display: 'Cardiology Report' },
    MICROBIOLOGY: { system: LOINC_SYSTEM, code: '29576-7', display: 'Microbiology Report' },
    OTHER: { system: LOINC_SYSTEM, code: LOINC_CODES.LAB_REPORT, display: 'Laboratory Report' },
  };
  return map[type] ?? map.OTHER;
}

function mapFhirCategoryToNexus(text?: string): DiagnosticReport['reportType'] {
  if (!text) return 'OTHER';
  const t = text.toUpperCase();
  if (t.includes('RADIOL')) return 'RADIOLOGY';
  if (t.includes('PATHOL')) return 'PATHOLOGY';
  if (t.includes('CARDIOL')) return 'CARDIOLOGY';
  if (t.includes('MICROB')) return 'MICROBIOLOGY';
  return 'OTHER';
}
