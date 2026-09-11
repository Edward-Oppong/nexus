// ============================================================
// src/lib/interoperability/mappers/provenance.ts
// Phase 6H: ProvenanceRecord ↔ FHIR R4 Provenance Mapper
// ============================================================

import type { ProvenanceRecord, ProvenanceType } from '../../../domain/provenance';
import type { FhirProvenance, FhirCodeableConcept } from '../fhir/types';
import { NEXUS_SYSTEMS, FHIR_SYSTEMS } from '../fhir/version';

function mapProvenanceTypeToActivity(type: ProvenanceType): FhirCodeableConcept {
  const map: Record<ProvenanceType, { code: string; display: string }> = {
    HUMAN_ENTERED: { code: 'ENTER', display: 'Human Data Entry' },
    DEVICE_MEASURED: { code: 'MEASURE', display: 'Device Measurement' },
    IMPORTED: { code: 'TRANSMIT', display: 'Data Integration Import' },
    AI_EXTRACTED: { code: 'EXTRACT', display: 'Algorithmic/AI Extraction' },
    AI_GENERATED: { code: 'COMPOSE', display: 'Automated Synthesis' },
    CLINICIAN_VERIFIED: { code: 'VERIFY', display: 'Clinician Verification' },
  };

  const item = map[type] || { code: 'ENTER', display: 'Human Entry' };
  return {
    coding: [
      {
        system: NEXUS_SYSTEMS.PROVENANCE,
        code: item.code,
        display: item.display,
      },
    ],
    text: item.display,
  };
}

/**
 * Maps a Nexus ProvenanceRecord with a target FHIR resource to FHIR Provenance.
 */
export function toFhirProvenance(
  record: ProvenanceRecord,
  targetResourceRef: string
): FhirProvenance {
  const agents: FhirProvenance['agent'] = [];

  if (record.actorUserId) {
    agents.push({
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
            code: 'author',
            display: 'Author',
          },
        ],
      },
      who: {
        reference: `Practitioner/${record.actorUserId}`,
      },
    });
  }

  if (record.modelName) {
    agents.push({
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
            code: 'assembler',
            display: 'Software Agent',
          },
        ],
      },
      who: {
        display: `${record.modelName}${record.modelVersion ? ` v${record.modelVersion}` : ''}`,
      },
    });
  }

  if (record.sourceSystem && agents.length === 0) {
    agents.push({
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
            code: 'informant',
            display: 'Source System',
          },
        ],
      },
      who: {
        display: record.sourceSystem,
      },
    });
  }

  // Ensure at least one agent is present for FHIR R4 compliance
  if (agents.length === 0) {
    agents.push({
      who: {
        display: 'Nexus Clinical Workstation',
      },
    });
  }

  return {
    resourceType: 'Provenance',
    id: record.id,
    target: [
      {
        reference: targetResourceRef,
      },
    ],
    recorded: record.capturedAt || record.createdAt,
    activity: mapProvenanceTypeToActivity(record.provenanceType),
    agent: agents,
    entity: record.sourceReference
      ? [
          {
            role: 'source',
            what: {
              reference: record.sourceReference,
              display: record.sourceSystem,
            },
          },
        ]
      : undefined,
  };
}

/**
 * Maps a FHIR Provenance resource to a Nexus ProvenanceRecord.
 */
export function fromFhirProvenance(fhirProv: FhirProvenance): ProvenanceRecord {
  const authorAgent = fhirProv.agent?.find(
    (a) => a.type?.coding?.some((c) => c.code === 'author')
  ) || fhirProv.agent?.[0];

  const softwareAgent = fhirProv.agent?.find(
    (a) => a.type?.coding?.some((c) => c.code === 'assembler')
  );

  const actorUserId = authorAgent?.who?.reference?.replace('Practitioner/', '');
  const sourceRef = fhirProv.entity?.[0]?.what?.reference;
  const sourceSystem = fhirProv.entity?.[0]?.what?.display || 'External FHIR System';

  let provenanceType: ProvenanceType = 'IMPORTED';
  const actCode = fhirProv.activity?.coding?.[0]?.code;
  if (actCode === 'ENTER') provenanceType = 'HUMAN_ENTERED';
  else if (actCode === 'MEASURE') provenanceType = 'DEVICE_MEASURED';
  else if (actCode === 'EXTRACT') provenanceType = 'AI_EXTRACTED';
  else if (actCode === 'VERIFY') provenanceType = 'CLINICIAN_VERIFIED';

  return {
    id: fhirProv.id || `prov-${Date.now()}`,
    provenanceType,
    sourceSystem,
    sourceReference: sourceRef,
    actorUserId,
    modelName: softwareAgent?.who?.display,
    capturedAt: fhirProv.recorded,
    createdAt: fhirProv.recorded,
  };
}
