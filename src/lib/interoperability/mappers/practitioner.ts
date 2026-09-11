// ============================================================
// src/lib/interoperability/mappers/practitioner.ts
// Phase 6H: Profile ↔ FHIR R4 Practitioner Mapper
// ============================================================

import type { Profile } from '../../../domain/auth';
import type { FhirPractitioner } from '../fhir/types';
import { NEXUS_SYSTEMS } from '../fhir/version';

/**
 * Maps a Nexus Profile to a FHIR R4 Practitioner.
 */
export function toFhirPractitioner(profile: Profile): FhirPractitioner {
  const nameParts = profile.fullName.trim().split(/\s+/);
  const family = nameParts.length > 1 ? nameParts[nameParts.length - 1] : profile.fullName;
  const given = nameParts.length > 1 ? nameParts.slice(0, -1) : [];

  return {
    resourceType: 'Practitioner',
    id: profile.id,
    identifier: [
      {
        system: NEXUS_SYSTEMS.USER,
        value: profile.id,
        use: 'official',
      },
      ...(profile.licenseIdentifier
        ? [
            {
              system: 'urn:oid:2.16.840.1.113883.4.7',
              value: profile.licenseIdentifier,
              use: 'official' as const,
            },
          ]
        : []),
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: profile.fullName,
        family,
        given,
      },
    ],
    telecom: profile.email
      ? [
          {
            system: 'email',
            value: profile.email,
            use: 'work',
          },
        ]
      : undefined,
    qualification: profile.profession
      ? [
          {
            code: {
              text: profile.profession,
            },
          },
        ]
      : undefined,
  };
}

/**
 * Maps a FHIR R4 Practitioner to a Nexus Profile partial.
 */
export function fromFhirPractitioner(practitioner: FhirPractitioner): Partial<Profile> {
  const name = practitioner.name?.[0];
  let fullName = name?.text;
  if (!fullName && name) {
    fullName = [...(name.given || []), name.family].filter(Boolean).join(' ');
  }

  const emailTelecom = practitioner.telecom?.find((t) => t.system === 'email');
  const licenseIdentifier = practitioner.identifier?.find((i) => i.value)?.value;
  const profession = practitioner.qualification?.[0]?.code?.text;

  return {
    id: practitioner.id || '',
    fullName: fullName || 'Unknown Clinician',
    email: emailTelecom?.value || '',
    profession: profession || undefined,
    licenseIdentifier: licenseIdentifier || undefined,
  };
}
