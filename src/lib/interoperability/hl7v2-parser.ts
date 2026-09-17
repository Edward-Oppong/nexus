// ============================================================
// src/lib/interoperability/hl7v2-parser.ts
// Phase 13: HL7 v2.x Hospital Messaging Parser & Entity Extractor
// Ingests ER7 pipe-and-hat messages (ADT, ORU) and translates to Nexus findings
// ============================================================

import {
  Hl7Message,
  Hl7Segment,
  Hl7TriggerEvent,
  Hl7ExtractionResult,
  ExtractedHl7Observation,
  ExtractedHl7Diagnosis,
} from '../../domain/hl7v2';

export const SAMPLE_HL7_ADT_A01 = `MSH|^~\\&|KBTH_EHR|KORLE_BU_HOSPITAL|NEXUS_WORKSTATION|NEXUS_CARDIOLOGY|20260908143000||ADT^A01|MSG-20260908-0482|P|2.5.1
PID|1||syn-pat-00482^^^KBTH^MR||Okafor^Amara^^^Ms||19880415|F|||14 Independence Ave^Accra^^Ghana||+233-24-555-0192|||S||ACC-48201
PV1|1|I|MED_WARD_3^ROOM_12^BED_B|E|||10482^Asante^Kwame^^Dr|||CARDIOLOGY||||||||1048201|||||||||||||||||||||KBTH|||20260908140000
DG1|1|I10|I33.0|Acute and subacute infective endocarditis|20260908141500|A
DG1|2|I10|I34.0|Nonrheumatic mitral valve insufficiency|20260908141500|W`;

export const SAMPLE_HL7_ORU_R01 = `MSH|^~\\&|KBTH_LIS|KORLE_BU_MICROBIOLOGY|NEXUS_WORKSTATION|NEXUS_CARDIOLOGY|20260910091500||ORU^R01|MSG-20260910-8912|P|2.5.1
PID|1||syn-pat-00482^^^KBTH^MR||Okafor^Amara^^^Ms||19880415|F
PV1|1|I|MED_WARD_3^ROOM_12^BED_B||||10482^Asante^Kwame^^Dr
OBX|1|ST|600-7^Blood Culture Bacteria Identified^LN||Streptococcus viridans (alpha-hemolytic)|||||F|||20260910083000
OBX|2|NM|30341-2^Erythrocyte Sedimentation Rate^LN||88|mm/hr|0-20|H||F|||20260910083000
OBX|3|NM|1988-5^C-Reactive Protein^LN||74.5|mg/L|0.0-5.0|H||F|||20260910083000
OBX|4|ST|18767-4^Transthoracic Echocardiogram Interpretation^LN||Vegetation visualized on anterior mitral valve leaflet with severe regurgitant flow|---|Normal|A||F|||20260910090000`;

/**
 * Parses raw ER7 pipe-and-hat text into structured Hl7Message
 */
export function parseHl7Message(rawText: string): Hl7Message {
  const lines = rawText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  const segments: Hl7Segment[] = [];

  let messageType: Hl7TriggerEvent = 'ADT^A01';
  let sendingApp = 'EHR_SYSTEM';
  let sendingFacility = 'HOSPITAL';
  let receivingApp = 'NEXUS';
  let receivingFacility = 'CLINICAL_WORKSTATION';
  let messageDateTime = new Date().toISOString();
  let messageControlId = `MSG-${Date.now()}`;
  let processingId: 'P' | 'T' | 'D' = 'P';
  let versionId = '2.5.1';

  for (const line of lines) {
    const fields = line.split('|');
    const segName = fields[0];

    segments.push({
      name: segName,
      fields,
    });

    if (segName === 'MSH') {
      sendingApp = fields[2] || sendingApp;
      sendingFacility = fields[3] || sendingFacility;
      receivingApp = fields[4] || receivingApp;
      receivingFacility = fields[5] || receivingFacility;
      messageDateTime = fields[6] || messageDateTime;
      messageType = (fields[8] || messageType) as Hl7TriggerEvent;
      messageControlId = fields[9] || messageControlId;
      processingId = (fields[10] || 'P') as any;
      versionId = fields[11] || versionId;
    }
  }

  return {
    id: messageControlId,
    messageType,
    sendingApplication: sendingApp,
    sendingFacility,
    receivingApplication: receivingApp,
    receivingFacility,
    messageDateTime,
    messageControlId,
    processingId,
    versionId,
    segments,
    rawEr7Text: rawText,
  };
}

/**
 * Extracts structured clinical observations, diagnoses, and patient details from parsed HL7 message
 */
export function extractFindingsFromHl7(msg: Hl7Message): Hl7ExtractionResult {
  let patientId = 'syn-pat-00482';
  let patientName = 'Unknown Patient';
  let dateOfBirth = '';
  let gender = 'U';
  let encounterClass = 'I';
  let admissionDateTime = '';
  let assignedLocation = '';
  let attendingDoctor = '';

  const observations: ExtractedHl7Observation[] = [];
  const diagnoses: ExtractedHl7Diagnosis[] = [];

  for (const seg of msg.segments) {
    if (seg.name === 'PID') {
      // PID-3: Patient ID, PID-5: Name (Last^First^Middle)
      const pidField = seg.fields[3] || '';
      patientId = pidField.split('^')[0] || patientId;

      const nameField = seg.fields[5] || '';
      const [last, first] = nameField.split('^');
      patientName = first ? `${first} ${last}` : last || patientName;

      dateOfBirth = seg.fields[7] || '';
      gender = seg.fields[8] || gender;
    }

    if (seg.name === 'PV1') {
      encounterClass = seg.fields[2] || encounterClass;
      assignedLocation = seg.fields[3] || assignedLocation;
      attendingDoctor = seg.fields[7] || attendingDoctor;
      admissionDateTime = seg.fields[44] || admissionDateTime;
    }

    if (seg.name === 'OBX') {
      // OBX-3: Identifier, OBX-5: Value, OBX-6: Units, OBX-7: Ref Range, OBX-8: Abnormal Flag
      const testIdentifier = seg.fields[3] || '';
      const [code, label, system] = testIdentifier.split('^');
      const val = seg.fields[5] || '';
      const units = seg.fields[6] || '';
      const refRange = seg.fields[7] || '';
      const abnormalFlag = seg.fields[8] || '';
      const status = seg.fields[11] || 'F';
      const obsTime = seg.fields[14] || '';

      observations.push({
        identifierCode: code || 'UNKNOWN_CODE',
        identifierText: label || code || 'Observation',
        codingSystem: system || 'LN',
        observationValue: val,
        units,
        referenceRange: refRange,
        abnormalFlags: abnormalFlag,
        observationResultStatus: status,
        dateTimeOfObservation: obsTime,
      });
    }

    if (seg.name === 'DG1') {
      // DG1-3: Code^Description^CodingMethod, DG1-6: DiagnosisType
      const diagField = seg.fields[3] || '';
      const [diagCode, diagDesc, method] = diagField.split('^');
      const diagType = seg.fields[6] || 'A';

      diagnoses.push({
        diagnosisCode: diagCode || 'UNKNOWN',
        diagnosisDescription: diagDesc || diagCode || 'Diagnosis',
        codingMethod: method || 'I10',
        diagnosisType: diagType,
      });
    }
  }

  const extractedFindingIds = observations.map((_, i) => `hl7-obs-${msg.messageControlId}-${i + 1}`);

  return {
    messageControlId: msg.messageControlId,
    messageType: msg.messageType,
    patientId,
    patientName,
    dateOfBirth,
    gender,
    encounterClass,
    admissionDateTime,
    assignedLocation,
    attendingDoctor,
    observations,
    diagnoses,
    extractedFindingIds,
  };
}
