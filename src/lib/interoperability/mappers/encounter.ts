// ============================================================
// src/lib/interoperability/mappers/encounter.ts
// Phase 6H: Encounter ↔ FHIR R4 Encounter Mapper
// ============================================================

import type { FhirEncounter } from '../fhir/types';
import { NEXUS_ENCOUNTER_ID_SYSTEM, ENCOUNTER_CLASS_SYSTEM } from '../fhir/version';
import type { Encounter, EncounterStatus, EncounterType } from '../../../domain/encounter';
import type { Case } from '../../../domain/case';

export function toFhirEncounter(
  encounter: Encounter | Case,
  patientId?: string
): FhirEncounter {
  const encAny = encounter as any;
  const pId = patientId ?? encAny.patientId ?? 'unknown';
  const startedAt = encAny.startedAt ?? encAny.openedAt ?? encAny.createdAt ?? new Date().toISOString();
  const endedAt = encAny.endedAt ?? encAny.closedAt;
  const rawType = encAny.encounterType ?? encAny.type ?? 'INPATIENT';

  return {
    resourceType: 'Encounter',
    id: encounter.id,
    meta: { lastUpdated: encounter.updatedAt },
    identifier: [
      { use: 'secondary', system: NEXUS_ENCOUNTER_ID_SYSTEM, value: encounter.id },
    ],
    status: mapEncounterStatus(encAny.status),
    class: {
      system: ENCOUNTER_CLASS_SYSTEM,
      code: mapEncounterClass(rawType),
      display: rawType,
    },
    subject: { reference: `Patient/${pId}` },
    period: {
      start: startedAt,
      end: endedAt ?? undefined,
    },
    serviceProvider: encounter.organizationId
      ? { reference: `Organization/${encounter.organizationId}` }
      : undefined,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>Encounter: ${rawType}</p></div>`,
    },
  };
}

export function fromFhirEncounter(
  fhir: FhirEncounter,
  organizationId: string
): Partial<Encounter> {
  const encType = (fhir.type?.[0]?.text ?? fhir.class?.display ?? 'INPATIENT').toUpperCase();
  const validTypes: Record<string, EncounterType> = {
    OUTPATIENT: 'OUTPATIENT',
    INPATIENT: 'INPATIENT',
    EMERGENCY: 'EMERGENCY',
    TELEHEALTH: 'TELEHEALTH',
    DIAGNOSTIC: 'DIAGNOSTIC',
  };
  const type: EncounterType = validTypes[encType] ?? 'INPATIENT';

  return {
    id: fhir.id,
    organizationId,
    status: mapFhirStatusToNexus(fhir.status),
    type,
    startedAt: fhir.period?.start ?? new Date().toISOString(),
    endedAt: fhir.period?.end,
  };
}

function mapEncounterStatus(status?: string): FhirEncounter['status'] {
  const map: Record<string, FhirEncounter['status']> = {
    ACTIVE: 'in-progress',
    PLANNED: 'planned',
    COMPLETED: 'finished',
    CANCELLED: 'cancelled',
  };
  return map[status ?? ''] ?? 'in-progress';
}

function mapFhirStatusToNexus(status: FhirEncounter['status']): EncounterStatus {
  const map: Record<string, EncounterStatus> = {
    'in-progress': 'ACTIVE',
    planned: 'PLANNED',
    finished: 'COMPLETED',
    cancelled: 'CANCELLED',
  };
  return map[status] ?? 'ACTIVE';
}

function mapEncounterClass(type?: string): string {
  if (!type) return 'AMB';
  const t = type.toUpperCase();
  if (t.includes('INPATIENT') || t.includes('ADMISSION')) return 'IMP';
  if (t.includes('EMERGENCY') || t.includes('A&E')) return 'EMER';
  return 'AMB';
}
