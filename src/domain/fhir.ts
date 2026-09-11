// ============================================================
// src/domain/fhir.ts
// Phase 6H: FHIR R4 Domain Types & Mapping Layer
//
// This module defines the FHIR R4 resource shapes that Nexus
// produces and consumes. The types are intentionally minimal
// — only the fields Nexus needs — but structurally correct
// so they are valid FHIR R4 JSON when serialized.
//
// Reference: https://hl7.org/fhir/R4/
// WHO SMART FHIR Base: https://smart.who.int/base/
// ============================================================

// ----------------------------------------------------------
// Core FHIR Primitives
// ----------------------------------------------------------

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;  // FHIR instant (ISO 8601)
  source?: string;
  profile?: string[];
  tag?: FhirCoding[];
}

export interface FhirCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FhirCodeableConcept;
  system?: string;  // URI namespace
  value?: string;
}

export interface FhirReference {
  reference?: string;  // e.g. "Patient/abc-123"
  type?: string;
  display?: string;
}

export interface FhirHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
}

export interface FhirContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirQuantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;  // UCUM: http://unitsofmeasure.org
  code?: string;
}

export interface FhirAnnotation {
  authorReference?: FhirReference;
  authorString?: string;
  time?: string;
  text: string;
}

export interface FhirNarrative {
  status: 'generated' | 'extensions' | 'additional' | 'empty';
  div: string;
}

// ----------------------------------------------------------
// FHIR R4 Resource: Patient
// FHIR ref: https://hl7.org/fhir/R4/patient.html
// Nexus mapping: Patient (src/domain/patient.ts)
// ----------------------------------------------------------
export interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;  // YYYY-MM-DD
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4 Resource: Observation
// FHIR ref: https://hl7.org/fhir/R4/observation.html
// Nexus mapping: ClinicalObservation (src/domain/observation.ts)
// ----------------------------------------------------------
export type FhirObservationStatus =
  | 'registered'
  | 'preliminary'
  | 'final'
  | 'amended'
  | 'corrected'
  | 'cancelled'
  | 'entered-in-error'
  | 'unknown';

export interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  dataAbsentReason?: FhirCodeableConcept;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirObservationStatus;
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: FhirPeriod;
  issued?: string;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  dataAbsentReason?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  note?: FhirAnnotation[];
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    text?: string;
  }>;
  component?: FhirObservationComponent[];
  performer?: FhirReference[];
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4 Resource: Condition
// FHIR ref: https://hl7.org/fhir/R4/condition.html
// Nexus mapping: ClinicalFinding (src/domain/finding.ts)
// ----------------------------------------------------------
export interface FhirCondition {
  resourceType: 'Condition';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  clinicalStatus: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  severity?: FhirCodeableConcept;
  code?: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  onsetDateTime?: string;
  note?: FhirAnnotation[];
  evidence?: Array<{
    code?: FhirCodeableConcept[];
    detail?: FhirReference[];
  }>;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4 Resource: DiagnosticReport
// FHIR ref: https://hl7.org/fhir/R4/diagnosticreport.html
// Nexus mapping: DiagnosticReport (src/domain/diagnostic-report.ts)
// ----------------------------------------------------------
export type FhirDiagnosticReportStatus =
  | 'registered'
  | 'partial'
  | 'preliminary'
  | 'final'
  | 'amended'
  | 'corrected'
  | 'appended'
  | 'cancelled'
  | 'entered-in-error';

export interface FhirDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirDiagnosticReportStatus;
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  issued?: string;
  performer?: FhirReference[];
  result?: FhirReference[];
  conclusion?: string;
  conclusionCode?: FhirCodeableConcept[];
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4 Resource: Provenance
// FHIR ref: https://hl7.org/fhir/R4/provenance.html
// Nexus mapping: ProvenanceRecord (src/domain/provenance.ts)
// ----------------------------------------------------------
export interface FhirProvenance {
  resourceType: 'Provenance';
  id?: string;
  meta?: FhirMeta;
  target: FhirReference[];  // What this provenance is about
  recorded: string;          // When was the activity recorded
  reason?: FhirCodeableConcept[];
  activity?: FhirCodeableConcept;
  agent: Array<{
    type?: FhirCodeableConcept;
    role?: FhirCodeableConcept[];
    who: FhirReference;
    onBehalfOf?: FhirReference;
  }>;
  entity?: Array<{
    role: 'derivation' | 'revision' | 'quotation' | 'source' | 'removal';
    what: FhirReference;
  }>;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4 Resource: DocumentReference
// FHIR ref: https://hl7.org/fhir/R4/documentreference.html
// Nexus mapping: ClinicalDocument (clinical_documents table)
// ----------------------------------------------------------
export interface FhirDocumentReference {
  resourceType: 'DocumentReference';
  id?: string;
  meta?: FhirMeta;
  status: 'current' | 'superseded' | 'entered-in-error';
  type?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  subject?: FhirReference;
  date?: string;
  author?: FhirReference[];
  description?: string;
  content: Array<{
    attachment: {
      contentType?: string;
      url?: string;
      size?: number;
      title?: string;
      creation?: string;
    };
  }>;
  context?: {
    encounter?: FhirReference[];
    period?: FhirPeriod;
    facilityType?: FhirCodeableConcept;
  };
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4 Bundle
// FHIR ref: https://hl7.org/fhir/R4/bundle.html
// Used by the fhir-export edge function for full patient summaries
// ----------------------------------------------------------
export type FhirBundleType =
  | 'document'
  | 'message'
  | 'transaction'
  | 'transaction-response'
  | 'batch'
  | 'batch-response'
  | 'history'
  | 'searchset'
  | 'collection';

export type FhirResource =
  | FhirPatient
  | FhirObservation
  | FhirCondition
  | FhirDiagnosticReport
  | FhirProvenance
  | FhirDocumentReference;

export interface FhirBundleEntry {
  fullUrl?: string;
  resource?: FhirResource;
  request?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
  };
  response?: {
    status: string;
    location?: string;
  };
}

export interface FhirBundle {
  resourceType: 'Bundle';
  id?: string;
  meta?: FhirMeta;
  type: FhirBundleType;
  timestamp?: string;
  total?: number;
  entry?: FhirBundleEntry[];
}

// ----------------------------------------------------------
// Nexus FHIR Mapping Utilities
// These functions produce FHIR-compliant resources from
// Nexus domain objects. They are pure functions with no
// side-effects, making them trivially testable.
// ----------------------------------------------------------

import type { Patient } from './patient';
import type { ProvenanceRecord } from './provenance';

// SNOMED CT system URI
export const SNOMED_SYSTEM = 'http://snomed.info/sct';
// LOINC system URI
export const LOINC_SYSTEM = 'http://loinc.org';
// UCUM units system
export const UCUM_SYSTEM = 'http://unitsofmeasure.org';
// Nexus identifier namespace
export const NEXUS_SYSTEM = 'urn:nexus:clinical';

/**
 * Map a Nexus Patient to a FHIR R4 Patient resource.
 * The Nexus UUID becomes the FHIR logical ID.
 */
export function mapPatientToFhir(patient: Patient): FhirPatient {
  return {
    resourceType: 'Patient',
    id: patient.id,
    meta: {
      lastUpdated: patient.updatedAt,
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
    identifier: patient.externalPatientId
      ? [
          {
            use: 'official',
            system: NEXUS_SYSTEM + ':mrn',
            value: patient.externalPatientId,
          },
        ]
      : [],
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
    gender:
      patient.sex === 'MALE'
        ? 'male'
        : patient.sex === 'FEMALE'
        ? 'female'
        : patient.sex === 'OTHER'
        ? 'other'
        : 'unknown',
    birthDate: patient.dateOfBirth,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${patient.givenName} ${patient.familyName}</p></div>`,
    },
  };
}

/**
 * Map a Nexus ProvenanceRecord to a FHIR R4 Provenance resource.
 * The target references must be provided as FHIR references
 * (e.g. "Observation/uuid") by the calling context.
 */
export function mapProvenanceToFhir(
  provenance: ProvenanceRecord,
  targets: FhirReference[],
  actorDisplay?: string
): FhirProvenance {
  const agentTypeSystem = 'http://terminology.hl7.org/CodeSystem/provenance-participant-type';

  const agentType: FhirCodeableConcept =
    provenance.provenanceType === 'AI_EXTRACTED' || provenance.provenanceType === 'AI_GENERATED'
      ? {
          coding: [{ system: agentTypeSystem, code: 'assembler', display: 'Assembler' }],
          text: 'AI System',
        }
      : provenance.provenanceType === 'DEVICE_MEASURED'
      ? {
          coding: [{ system: agentTypeSystem, code: 'device', display: 'Device' }],
          text: 'Medical Device',
        }
      : {
          coding: [{ system: agentTypeSystem, code: 'author', display: 'Author' }],
          text: 'Clinician',
        };

  return {
    resourceType: 'Provenance',
    id: provenance.id,
    meta: {
      lastUpdated: provenance.createdAt,
    },
    target: targets,
    recorded: provenance.capturedAt ?? provenance.createdAt,
    activity: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
          code: provenance.provenanceType === 'IMPORTED' ? 'CREATE' : 'UPDATE',
        },
      ],
      text: provenance.provenanceType,
    },
    agent: [
      {
        type: agentType,
        who: provenance.actorUserId
          ? { reference: `Practitioner/${provenance.actorUserId}`, display: actorDisplay }
          : { display: provenance.modelName ?? provenance.sourceSystem ?? 'Unknown' },
      },
    ],
    entity: provenance.sourceReference
      ? [
          {
            role: 'source',
            what: {
              reference: provenance.sourceReference,
              display: provenance.sourceSystem,
            },
          },
        ]
      : undefined,
  };
}

/**
 * Assemble a FHIR R4 Transaction Bundle from a set of resources.
 * This is the standard payload for transferring a complete
 * patient record to an external FHIR server.
 */
export function buildFhirBundle(
  type: FhirBundleType,
  resources: FhirResource[],
  bundleId?: string
): FhirBundle {
  const timestamp = new Date().toISOString();
  return {
    resourceType: 'Bundle',
    id: bundleId ?? crypto.randomUUID(),
    meta: {
      lastUpdated: timestamp,
      profile: ['http://hl7.org/fhir/StructureDefinition/Bundle'],
    },
    type,
    timestamp,
    total: resources.length,
    entry: resources.map((resource) => ({
      fullUrl: `urn:uuid:${resource.id ?? crypto.randomUUID()}`,
      resource,
      request:
        type === 'transaction'
          ? {
              method: 'PUT',
              url: `${resource.resourceType}/${resource.id}`,
            }
          : undefined,
    })),
  };
}
