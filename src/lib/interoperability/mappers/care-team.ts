// ============================================================
// src/lib/interoperability/mappers/care-team.ts
// Phase 6H: CaseMembers ↔ FHIR R4 CareTeam Mapper
// ============================================================

import type { CaseMember, CaseRole } from '../../../domain/case-member';
import type { FhirCareTeam, FhirCodeableConcept } from '../fhir/types';
import { NEXUS_SYSTEMS } from '../fhir/version';

function roleToFhirConcept(role: CaseRole): FhirCodeableConcept {
  const roleDisplayMap: Record<CaseRole, string> = {
    LEAD: 'Lead Clinician',
    CONTRIBUTOR: 'Contributor',
    REVIEWER: 'Reviewer',
    OBSERVER: 'Observer',
  };

  return {
    coding: [
      {
        system: NEXUS_SYSTEMS.ROLE,
        code: role.toLowerCase(),
        display: roleDisplayMap[role],
      },
    ],
    text: roleDisplayMap[role],
  };
}

function fhirConceptToRole(concept?: FhirCodeableConcept): CaseRole {
  const code = concept?.coding?.[0]?.code?.toUpperCase();
  if (code === 'LEAD') return 'LEAD';
  if (code === 'REVIEWER') return 'REVIEWER';
  if (code === 'OBSERVER') return 'OBSERVER';
  return 'CONTRIBUTOR';
}

/**
 * Maps an array of Nexus CaseMembers for a case to a FHIR CareTeam.
 */
export function toFhirCareTeam(
  caseId: string,
  patientId: string,
  members: CaseMember[],
  teamName?: string
): FhirCareTeam {
  return {
    resourceType: 'CareTeam',
    id: `careteam-${caseId}`,
    identifier: [
      {
        system: NEXUS_SYSTEMS.CASE,
        value: caseId,
      },
    ],
    status: 'active',
    name: teamName || `Clinical Team for Case ${caseId.slice(0, 8)}`,
    subject: {
      reference: `Patient/${patientId}`,
    },
    participant: members.map((m) => ({
      role: [roleToFhirConcept(m.caseRole)],
      member: {
        reference: `Practitioner/${m.userId}`,
        display: m.fullName || m.email || m.userId,
      },
      period: {
        start: m.joinedAt,
      },
    })),
  };
}

/**
 * Extracts partial CaseMember definitions from a FHIR CareTeam.
 */
export function fromFhirCareTeam(careTeam: FhirCareTeam, caseId: string): Partial<CaseMember>[] {
  if (!careTeam.participant) return [];

  return careTeam.participant.map((p) => {
    const ref = p.member?.reference || '';
    const userId = ref.startsWith('Practitioner/') ? ref.replace('Practitioner/', '') : ref;
    const roleConcept = p.role?.[0];

    return {
      caseId,
      userId,
      fullName: p.member?.display,
      caseRole: fhirConceptToRole(roleConcept),
      joinedAt: p.period?.start || new Date().toISOString(),
    };
  });
}
