// ============================================================
// src/lib/interoperability/mappers/audit-event.ts
// Phase 6H: Nexus Audit Log ↔ FHIR R4 AuditEvent Mapper
// ============================================================

import type { FhirAuditEvent } from '../fhir/types';
import { NEXUS_SYSTEMS, FHIR_SYSTEMS } from '../fhir/version';

export interface NexusAuditRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome?: 'success' | 'minor_failure' | 'serious_failure' | 'major_failure';
  outcomeDescription?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

function mapActionToFhirAction(action: string): 'C' | 'R' | 'U' | 'D' | 'E' {
  const upper = action.toUpperCase();
  if (upper.includes('CREATE') || upper.includes('ADD') || upper.includes('RECORD')) return 'C';
  if (upper.includes('READ') || upper.includes('VIEW') || upper.includes('GET')) return 'R';
  if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('AMEND') || upper.includes('REVIEW')) return 'U';
  if (upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('REVOKE')) return 'D';
  return 'E';
}

function mapOutcomeToFhir(outcome?: string): '0' | '4' | '8' | '12' {
  switch (outcome) {
    case 'success':
      return '0';
    case 'minor_failure':
      return '4';
    case 'serious_failure':
      return '8';
    case 'major_failure':
      return '12';
    default:
      return '0';
  }
}

/**
 * Maps an internal Nexus audit log entry to a FHIR R4 AuditEvent resource.
 */
export function toFhirAuditEvent(audit: NexusAuditRecord): FhirAuditEvent {
  return {
    resourceType: 'AuditEvent',
    id: audit.id,
    type: {
      system: 'http://dicom.nema.org/resources/ontology/DCM',
      code: '110100',
      display: 'Application Activity',
    },
    subtype: [
      {
        system: NEXUS_SYSTEMS.ACTION,
        code: audit.action,
        display: audit.action,
      },
    ],
    action: mapActionToFhirAction(audit.action),
    recorded: audit.createdAt,
    outcome: mapOutcomeToFhir(audit.outcome),
    outcomeDesc: audit.outcomeDescription,
    agent: [
      {
        who: audit.userId
          ? {
              reference: `Practitioner/${audit.userId}`,
              display: audit.userEmail,
            }
          : undefined,
        name: audit.userEmail || 'Nexus User',
        requestor: true,
        network: audit.ipAddress
          ? {
              address: audit.ipAddress,
              type: '2', // IP Address
            }
          : undefined,
      },
    ],
    source: {
      site: 'Nexus Workstation',
      observer: {
        display: 'Nexus Clinical Reasoning Architecture',
      },
    },
    entity: audit.resourceId
      ? [
          {
            what: {
              reference: `${audit.resourceType}/${audit.resourceId}`,
            },
            name: `${audit.resourceType} Record`,
          },
        ]
      : undefined,
  };
}

/**
 * Maps a FHIR R4 AuditEvent to an internal Nexus audit representation.
 */
export function fromFhirAuditEvent(fhirAudit: FhirAuditEvent): NexusAuditRecord {
  const agent = fhirAudit.agent?.[0];
  const userRef = agent?.who?.reference;
  const userId = userRef?.startsWith('Practitioner/')
    ? userRef.replace('Practitioner/', '')
    : userRef;

  const entity = fhirAudit.entity?.[0];
  const entityRef = entity?.what?.reference?.split('/') || [];
  const resourceType = entityRef.length === 2 ? entityRef[0] : 'Unknown';
  const resourceId = entityRef.length === 2 ? entityRef[1] : undefined;

  let outcome: NexusAuditRecord['outcome'] = 'success';
  if (fhirAudit.outcome === '4') outcome = 'minor_failure';
  else if (fhirAudit.outcome === '8') outcome = 'serious_failure';
  else if (fhirAudit.outcome === '12') outcome = 'major_failure';

  return {
    id: fhirAudit.id || `audit-${Date.now()}`,
    userId,
    userEmail: agent?.name,
    action: fhirAudit.subtype?.[0]?.code || fhirAudit.type.code || 'AUDIT_EVENT',
    resourceType,
    resourceId,
    ipAddress: agent?.network?.address,
    outcome,
    outcomeDescription: fhirAudit.outcomeDesc,
    createdAt: fhirAudit.recorded,
  };
}
