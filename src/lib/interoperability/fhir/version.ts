// ============================================================
// src/lib/interoperability/fhir/version.ts
// Phase 6H: FHIR R4 Version Constants & System URIs
//
// Centralizing these prevents typo-driven bugs where a SNOMED
// code has the wrong system URI. All FHIR system URIs must
// come from this file, not from inline strings.
// ============================================================

// FHIR specification version
export const FHIR_VERSION = 'R4';
export const FHIR_VERSION_URI = 'http://hl7.org/fhir/R4';

// ----------------------------------------------------------
// Standard code system URIs
// ----------------------------------------------------------

// SNOMED CT — clinical findings, procedures, body sites
export const SNOMED_SYSTEM = 'http://snomed.info/sct';

// LOINC — laboratory tests, observations
export const LOINC_SYSTEM = 'http://loinc.org';

// UCUM — units of measure
export const UCUM_SYSTEM = 'http://unitsofmeasure.org';

// ICD-10-CM — diagnoses and conditions
export const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10';

// RxNorm — medications
export const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

// HL7 v3 NullFlavor (for absent/unknown values)
export const HL7_NULL_FLAVOR = 'http://terminology.hl7.org/CodeSystem/v3-NullFlavor';

// HL7 FHIR resource types
export const HL7_RESOURCE_TYPES = 'http://hl7.org/fhir/resource-types';

// Observation categories
export const OBSERVATION_CATEGORY_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/observation-category';

// Condition clinical status
export const CONDITION_CLINICAL_STATUS_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/condition-clinical';

// Condition verification status
export const CONDITION_VERIFICATION_STATUS_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/condition-ver-status';

// Encounter class (ambulatory, inpatient, emergency)
export const ENCOUNTER_CLASS_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v3-ActCode';

// Provenance participant type
export const PROVENANCE_PARTICIPANT_TYPE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/provenance-participant-type';

// Data operation (for Provenance.activity)
export const DATA_OPERATION_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v3-DataOperation';

// AuditEvent type
export const AUDIT_EVENT_TYPE_SYSTEM =
  'http://dicom.nema.org/resources/ontology/DCM';

// AuditEvent ID system (IETF RFC 3881)
export const AUDIT_EVENT_ID_SYSTEM = 'http://hl7.org/fhir/ValueSet/audit-event-type';

// ----------------------------------------------------------
// Nexus-specific namespaces
// ----------------------------------------------------------

// Nexus base namespace (used as FHIR identifier systems)
export const NEXUS_BASE = 'urn:nexus:clinical';

// Nexus-specific identifier systems
export const NEXUS_PATIENT_ID_SYSTEM = `${NEXUS_BASE}:patient`;
export const NEXUS_CASE_ID_SYSTEM = `${NEXUS_BASE}:case`;
export const NEXUS_ENCOUNTER_ID_SYSTEM = `${NEXUS_BASE}:encounter`;
export const NEXUS_OBSERVATION_ID_SYSTEM = `${NEXUS_BASE}:observation`;
export const NEXUS_FINDING_ID_SYSTEM = `${NEXUS_BASE}:finding`;
export const NEXUS_DOCUMENT_ID_SYSTEM = `${NEXUS_BASE}:document`;
export const NEXUS_TASK_ID_SYSTEM = `${NEXUS_BASE}:task`;

// ----------------------------------------------------------
// WHO SMART Base profile URIs
// https://smart.who.int/base/
// ----------------------------------------------------------
export const WHO_SMART_BASE = 'https://smart.who.int/base/StructureDefinition';
export const WHO_SMART_PATIENT_PROFILE = `${WHO_SMART_BASE}/SGPatient`;
export const WHO_SMART_OBSERVATION_PROFILE = `${WHO_SMART_BASE}/SGObservation`;

// ----------------------------------------------------------
// LOINC codes for common clinical concepts used in Nexus
// ----------------------------------------------------------
export const LOINC_CODES = {
  // Vital signs panel
  VITAL_SIGNS_PANEL: '85353-1',
  BODY_TEMPERATURE: '8310-5',
  HEART_RATE: '8867-4',
  RESPIRATORY_RATE: '9279-1',
  BLOOD_PRESSURE_SYSTOLIC: '8480-6',
  BLOOD_PRESSURE_DIASTOLIC: '8462-4',
  OXYGEN_SATURATION: '59408-5',
  BODY_WEIGHT: '29463-7',
  BODY_HEIGHT: '8302-2',
  BMI: '39156-5',
  GCS_TOTAL: '9269-2',

  // Common lab tests
  HEMOGLOBIN: '718-7',
  WBC_COUNT: '6690-2',
  PLATELET_COUNT: '777-3',
  CREATININE: '2160-0',
  GLUCOSE: '2345-7',
  SODIUM: '2951-2',
  POTASSIUM: '2823-3',
  MALARIA_RDT: '51587-3',
  HIV_STATUS: '7917-8',

  // Document types
  DISCHARGE_SUMMARY: '18842-5',
  CONSULTATION_NOTE: '11488-4',
  REFERRAL_NOTE: '57133-1',
  LAB_REPORT: '11502-2',
  RADIOLOGY_REPORT: '18748-4',
} as const;

// ----------------------------------------------------------
// SNOMED CT codes for common clinical concepts
// ----------------------------------------------------------
export const SNOMED_CODES = {
  // Observation categories
  VITAL_SIGN: '118227000',
  LABORATORY_TEST: '15220000',
  PHYSICAL_EXAMINATION: '5880005',

  // Common findings
  FEVER: '386661006',
  TACHYCARDIA: '3424008',
  HYPOTENSION: '45007003',
  HYPOXIA: '389086002',
  JAUNDICE: '18165001',
  EDEMA: '423666004',
  PALLOR: '398979000',

  // Practitioner role
  DOCTOR: '309343006',
  NURSE: '106292003',
  PHARMACIST: '46255001',
} as const;

// ----------------------------------------------------------
// Observation category codes (HL7 FHIR value set)
// ----------------------------------------------------------
export const OBSERVATION_CATEGORIES = {
  VITAL_SIGNS: 'vital-signs',
  LABORATORY: 'laboratory',
  IMAGING: 'imaging',
  SURVEY: 'survey',
  EXAM: 'exam',
  SOCIAL_HISTORY: 'social-history',
} as const;

export const FHIR_SYSTEMS = {
  SNOMED: SNOMED_SYSTEM,
  LOINC: LOINC_SYSTEM,
  UCUM: UCUM_SYSTEM,
  ICD10: ICD10_SYSTEM,
  RXNORM: RXNORM_SYSTEM,
  OBSERVATION_CATEGORY: OBSERVATION_CATEGORY_SYSTEM,
  CONDITION_CLINICAL: CONDITION_CLINICAL_STATUS_SYSTEM,
  CONDITION_VER_STATUS: CONDITION_VERIFICATION_STATUS_SYSTEM,
  ENCOUNTER_CLASS: ENCOUNTER_CLASS_SYSTEM,
  PROVENANCE_PARTICIPANT: PROVENANCE_PARTICIPANT_TYPE_SYSTEM,
  AUDIT_EVENT_TYPE: AUDIT_EVENT_TYPE_SYSTEM,
} as const;

export const NEXUS_SYSTEMS = {
  BASE: NEXUS_BASE,
  PATIENT: NEXUS_PATIENT_ID_SYSTEM,
  CASE: NEXUS_CASE_ID_SYSTEM,
  ENCOUNTER: NEXUS_ENCOUNTER_ID_SYSTEM,
  OBSERVATION: NEXUS_OBSERVATION_ID_SYSTEM,
  FINDING: NEXUS_FINDING_ID_SYSTEM,
  DOCUMENT: NEXUS_DOCUMENT_ID_SYSTEM,
  TASK: NEXUS_TASK_ID_SYSTEM,
  USER: `${NEXUS_BASE}:user`,
  ROLE: `${NEXUS_BASE}:role`,
  PROVENANCE: `${NEXUS_BASE}:provenance`,
  ACTION: `${NEXUS_BASE}:action`,
} as const;

