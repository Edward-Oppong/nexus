// ============================================================
// src/lib/interoperability/mappers/service-request.ts
// Phase 6H: Investigation ↔ FHIR R4 ServiceRequest Mapper
//
// Nexus investigations (test orders) map to FHIR ServiceRequest.
// When results are received, they map to DiagnosticReport.
// This preserves the order→result chain for lab and imaging.
// ============================================================

import type { FhirServiceRequest } from '../fhir/types';
import { LOINC_SYSTEM } from '../fhir/version';

export interface NexusInvestigationInput {
  id: string;
  caseId: string;
  patientId?: string;
  encounterId?: string;
  testName: string;
  category: 'Laboratory' | 'Imaging' | 'Cardiovascular' | 'Microbiology' | 'Other';
  loincCode?: string;
  priority: 'Stat' | 'Urgent' | 'Routine';
  indication?: string;
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'REPORTED' | 'CANCELLED';
  requestedBy?: string;
  requestedAt?: string;
}

export function toFhirServiceRequest(inv: NexusInvestigationInput): FhirServiceRequest {
  return {
    resourceType: 'ServiceRequest',
    id: inv.id,
    meta: { lastUpdated: inv.requestedAt ?? new Date().toISOString() },
    status: mapStatusToFhir(inv.status),
    intent: 'order',
    priority: mapPriorityToFhir(inv.priority),
    category: [
      {
        text: inv.category,
        coding: [{ system: 'http://snomed.info/sct', ...mapCategoryCode(inv.category) }],
      },
    ],
    code: inv.loincCode
      ? { coding: [{ system: LOINC_SYSTEM, code: inv.loincCode, display: inv.testName }], text: inv.testName }
      : { text: inv.testName },
    subject: inv.patientId ? { reference: `Patient/${inv.patientId}` } : { display: 'Unknown' },
    encounter: inv.encounterId ? { reference: `Encounter/${inv.encounterId}` } : undefined,
    occurrenceDateTime: inv.requestedAt,
    requester: inv.requestedBy ? { reference: `Practitioner/${inv.requestedBy}` } : undefined,
    reasonCode: inv.indication ? [{ text: inv.indication }] : undefined,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${inv.testName} (${inv.category})</p></div>`,
    },
  };
}

export function fromFhirServiceRequest(fhir: FhirServiceRequest): Partial<NexusInvestigationInput> {
  return {
    id: fhir.id,
    testName: fhir.code?.text ?? fhir.code?.coding?.[0]?.display ?? 'Unknown',
    loincCode: fhir.code?.coding?.find((c) => c.system === LOINC_SYSTEM)?.code,
    priority: mapFhirPriorityToNexus(fhir.priority),
    status: mapFhirStatusToNexus(fhir.status),
    indication: fhir.reasonCode?.[0]?.text,
    requestedAt: fhir.occurrenceDateTime,
  };
}

function mapStatusToFhir(status: string): FhirServiceRequest['status'] {
  const map: Record<string, FhirServiceRequest['status']> = {
    PENDING: 'draft',
    ORDERED: 'active',
    RECEIVED: 'active',
    REPORTED: 'completed',
    CANCELLED: 'revoked',
  };
  return map[status] ?? 'unknown';
}

function mapFhirStatusToNexus(status: FhirServiceRequest['status']): NexusInvestigationInput['status'] {
  const map: Record<string, NexusInvestigationInput['status']> = {
    draft: 'PENDING',
    active: 'ORDERED',
    completed: 'REPORTED',
    revoked: 'CANCELLED',
  };
  return map[status] ?? 'PENDING';
}

function mapPriorityToFhir(priority: string): FhirServiceRequest['priority'] {
  const map: Record<string, FhirServiceRequest['priority']> = {
    Stat: 'stat',
    Urgent: 'urgent',
    Routine: 'routine',
  };
  return map[priority] ?? 'routine';
}

function mapFhirPriorityToNexus(priority?: string): NexusInvestigationInput['priority'] {
  if (priority === 'stat') return 'Stat';
  if (priority === 'urgent') return 'Urgent';
  return 'Routine';
}

function mapCategoryCode(category: string): { code: string; display: string } {
  const map: Record<string, { code: string; display: string }> = {
    Laboratory: { code: '108252007', display: 'Laboratory procedure' },
    Imaging: { code: '363679005', display: 'Imaging' },
    Cardiovascular: { code: '40701008', display: 'Cardiac diagnostic procedure' },
    Microbiology: { code: '19851009', display: 'Microbiology procedure' },
    Other: { code: '71388002', display: 'Procedure' },
  };
  return map[category] ?? map.Other;
}
