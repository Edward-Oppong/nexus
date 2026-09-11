// ============================================================
// src/lib/interoperability/mappers/patient.ts
// Phase 6H: Patient ↔ FHIR R4 Patient Mapper
//
// Pure functions. No side-effects. Trivially testable.
// The UI does not know this module exists.
// ============================================================

import type { FhirPatient, FhirIdentifier } from '../fhir/types';
import {
  NEXUS_PATIENT_ID_SYSTEM,
  WHO_SMART_PATIENT_PROFILE,
} from '../fhir/version';
import type { Patient } from '../../../domain/patient';

// ----------------------------------------------------------
// Nexus Patient → FHIR R4 Patient
// ----------------------------------------------------------

export function toFhirPatient(patient: Patient): FhirPatient {
  const identifiers: FhirIdentifier[] = [
    {
      use: 'secondary',
      system: NEXUS_PATIENT_ID_SYSTEM,
      value: patient.id,
    },
  ];

  if (patient.externalPatientId) {
    identifiers.unshift({
      use: 'official',
      system: `urn:nexus:mrn:${patient.organizationId}`,
      value: patient.externalPatientId,
    });
  }

  return {
    resourceType: 'Patient',
    id: patient.externalPatientId ?? patient.id,
    meta: {
      lastUpdated: patient.updatedAt,
      profile: [WHO_SMART_PATIENT_PROFILE],
    },
    identifier: identifiers,
    active: true,
    name: [
      {
        use: 'official',
        family: patient.familyName,
        given: [patient.givenName],
        text: `${patient.givenName} ${patient.familyName}`,
      },
    ],
    telecom: patient.phone
      ? [{ system: 'phone', value: patient.phone, use: 'mobile' }]
      : [],
    gender: mapSexToFhir(patient.sex),
    birthDate: patient.dateOfBirth,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>${patient.givenName} ${patient.familyName}</b></p></div>`,
    },
  };
}

// ----------------------------------------------------------
// FHIR R4 Patient → Nexus Patient (partial — missing organizationId)
// The caller must supply organizationId from context.
// ----------------------------------------------------------

export function fromFhirPatient(
  fhirPatient: FhirPatient,
  organizationId: string
): Omit<Patient, 'createdAt' | 'updatedAt'> {
  const officialName = fhirPatient.name?.find((n) => n.use === 'official') ?? fhirPatient.name?.[0];

  const nexusIdentifier = fhirPatient.identifier?.find(
    (id) => id.system === NEXUS_PATIENT_ID_SYSTEM
  );

  const mrnIdentifier = fhirPatient.identifier?.find(
    (id) => id.use === 'official' && id.system !== NEXUS_PATIENT_ID_SYSTEM
  );

  return {
    id: nexusIdentifier?.value ?? fhirPatient.id ?? crypto.randomUUID(),
    organizationId,
    externalPatientId: mrnIdentifier?.value,
    givenName: officialName?.given?.[0] ?? '',
    familyName: officialName?.family ?? '',
    dateOfBirth: fhirPatient.birthDate,
    sex: mapFhirGenderToSex(fhirPatient.gender),
    phone: fhirPatient.telecom?.find((t) => t.system === 'phone')?.value,
  };
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function mapSexToFhir(sex?: string): FhirPatient['gender'] {
  switch (sex) {
    case 'MALE':
      return 'male';
    case 'FEMALE':
      return 'female';
    case 'OTHER':
      return 'other';
    default:
      return 'unknown';
  }
}

function mapFhirGenderToSex(gender?: string): Patient['sex'] {
  switch (gender) {
    case 'male':
      return 'MALE';
    case 'female':
      return 'FEMALE';
    case 'other':
      return 'OTHER';
    default:
      return 'UNKNOWN';
  }
}
