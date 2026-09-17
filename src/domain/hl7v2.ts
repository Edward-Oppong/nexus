// ============================================================
// src/domain/hl7v2.ts
// Phase 13: HL7 v2.x Hospital Messaging Pure Domain Models
// Standard ER7 Pipe-and-Hat Segments & Trigger Events
// Pure TypeScript — zero external dependencies
// ============================================================

export type Hl7TriggerEvent = 'ADT^A01' | 'ADT^A08' | 'ADT^A03' | 'ORU^R01' | 'ORM^O01';

export interface Hl7Segment {
  name: string; // e.g., "MSH", "PID", "PV1", "OBX", "DG1"
  fields: string[]; // 1-indexed according to standard HL7 v2 conventions
}

export interface Hl7Message {
  id: string;
  messageType: Hl7TriggerEvent;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  messageDateTime: string;
  messageControlId: string;
  processingId: 'P' | 'T' | 'D'; // Production, Test, Debug
  versionId: string; // e.g., "2.5.1"
  segments: Hl7Segment[];
  rawEr7Text: string;
}

export interface ExtractedHl7Observation {
  identifierCode: string;
  identifierText: string;
  codingSystem: string; // e.g. "LN" (LOINC)
  observationValue: string;
  units?: string;
  referenceRange?: string;
  abnormalFlags?: string; // "H", "L", "A", "LL", "HH"
  observationResultStatus: string; // "F" (Final), "C" (Corrected)
  dateTimeOfObservation?: string;
}

export interface ExtractedHl7Diagnosis {
  diagnosisCode: string;
  diagnosisDescription: string;
  codingMethod: string; // "I10" (ICD-10), "I11" (ICD-11)
  diagnosisType: string; // "A" (Admitting), "W" (Working), "F" (Final)
}

export interface Hl7ExtractionResult {
  messageControlId: string;
  messageType: Hl7TriggerEvent;
  patientId: string;
  patientName: string;
  dateOfBirth?: string;
  gender?: string;
  encounterClass?: string; // "I" (Inpatient), "E" (Emergency), "O" (Outpatient)
  admissionDateTime?: string;
  assignedLocation?: string;
  attendingDoctor?: string;
  observations: ExtractedHl7Observation[];
  diagnoses: ExtractedHl7Diagnosis[];
  extractedFindingIds: string[];
}
