// ============================================================
// src/lib/interoperability/mappers/observation.ts
// Phase 6H: Observation ↔ FHIR R4 Observation Mapper
//
// Preserves: device, measurement, unit, timestamp, source,
// provenance — NOT just "patient has abnormal SpO2."
// ============================================================

import type { FhirObservation, FhirCodeableConcept, FhirQuantity } from '../fhir/types';
import {
  NEXUS_OBSERVATION_ID_SYSTEM,
  LOINC_SYSTEM,
  UCUM_SYSTEM,
  SNOMED_SYSTEM,
  OBSERVATION_CATEGORY_SYSTEM,
  OBSERVATION_CATEGORIES,
  LOINC_CODES,
} from '../fhir/version';

// Minimal Nexus observation shape for the mapper
export interface NexusObservationInput {
  id: string;
  caseId: string;
  patientId?: string;
  encounterId?: string;
  category: string;
  code?: string;
  label: string;
  valueNumeric?: number;
  valueText?: string;
  unit?: string;
  observedAt: string;
  deviceId?: string;
  deviceName?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  interpretation?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW';
  notes?: string;
}

// ----------------------------------------------------------
// Nexus Observation → FHIR R4 Observation
// ----------------------------------------------------------

export function toFhirObservation(obs: NexusObservationInput): FhirObservation {
  const categoryCode = mapCategoryToFhir(obs.category);
  const loincCode = obs.code ?? mapLabelToLoinc(obs.label);

  const code: FhirCodeableConcept = loincCode
    ? {
        coding: [{ system: LOINC_SYSTEM, code: loincCode, display: obs.label }],
        text: obs.label,
      }
    : { text: obs.label };

  const value: Partial<FhirObservation> =
    obs.valueNumeric !== undefined
      ? {
          valueQuantity: {
            value: obs.valueNumeric,
            unit: obs.unit,
            system: UCUM_SYSTEM,
            code: obs.unit,
          } as FhirQuantity,
        }
      : obs.valueText
      ? { valueString: obs.valueText }
      : { dataAbsentReason: { text: 'Not recorded' } };

  return {
    resourceType: 'Observation',
    id: obs.id,
    meta: {
      lastUpdated: obs.observedAt,
    },
    identifier: [
      {
        system: NEXUS_OBSERVATION_ID_SYSTEM,
        value: obs.id,
      },
    ],
    status: 'final',
    category: [
      {
        coding: [
          {
            system: OBSERVATION_CATEGORY_SYSTEM,
            code: categoryCode,
            display: categoryCode,
          },
        ],
      },
    ],
    code,
    subject: obs.patientId ? { reference: `Patient/${obs.patientId}` } : undefined,
    encounter: obs.encounterId ? { reference: `Encounter/${obs.encounterId}` } : undefined,
    effectiveDateTime: obs.observedAt,
    issued: obs.observedAt,
    performer: obs.deviceName
      ? [{ display: obs.deviceName }]
      : undefined,
    interpretation: obs.interpretation
      ? [mapInterpretation(obs.interpretation)]
      : undefined,
    referenceRange:
      obs.referenceRangeLow !== undefined || obs.referenceRangeHigh !== undefined
        ? [
            {
              low: obs.referenceRangeLow !== undefined
                ? { value: obs.referenceRangeLow, unit: obs.unit, system: UCUM_SYSTEM }
                : undefined,
              high: obs.referenceRangeHigh !== undefined
                ? { value: obs.referenceRangeHigh, unit: obs.unit, system: UCUM_SYSTEM }
                : undefined,
            },
          ]
        : undefined,
    note: obs.notes ? [{ text: obs.notes }] : undefined,
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${obs.label}: ${obs.valueNumeric ?? obs.valueText ?? 'N/A'} ${obs.unit ?? ''}</p></div>`,
    },
    ...value,
  };
}

// ----------------------------------------------------------
// FHIR R4 Observation → Nexus Observation (partial)
// ----------------------------------------------------------

export function fromFhirObservation(fhir: FhirObservation): Partial<NexusObservationInput> {
  const label =
    fhir.code?.text ??
    fhir.code?.coding?.[0]?.display ??
    fhir.code?.coding?.[0]?.code ??
    'Unknown observation';

  const category =
    fhir.category?.[0]?.coding?.[0]?.code ?? 'vital-signs';

  return {
    id: fhir.id,
    label,
    code: fhir.code?.coding?.find((c) => c.system === LOINC_SYSTEM)?.code,
    category: mapFhirCategoryToNexus(category),
    valueNumeric: fhir.valueQuantity?.value,
    valueText: fhir.valueString,
    unit: fhir.valueQuantity?.unit ?? fhir.valueQuantity?.code,
    observedAt: fhir.effectiveDateTime ?? fhir.issued ?? new Date().toISOString(),
    notes: fhir.note?.[0]?.text,
    referenceRangeLow: fhir.referenceRange?.[0]?.low?.value,
    referenceRangeHigh: fhir.referenceRange?.[0]?.high?.value,
  };
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function mapCategoryToFhir(category: string): string {
  const map: Record<string, string> = {
    Vital: OBSERVATION_CATEGORIES.VITAL_SIGNS,
    Vitals: OBSERVATION_CATEGORIES.VITAL_SIGNS,
    VITAL_SIGNS: OBSERVATION_CATEGORIES.VITAL_SIGNS,
    Laboratory: OBSERVATION_CATEGORIES.LABORATORY,
    Lab: OBSERVATION_CATEGORIES.LABORATORY,
    LAB: OBSERVATION_CATEGORIES.LABORATORY,
    Imaging: OBSERVATION_CATEGORIES.IMAGING,
    Survey: OBSERVATION_CATEGORIES.SURVEY,
    Exam: OBSERVATION_CATEGORIES.EXAM,
  };
  return map[category] ?? OBSERVATION_CATEGORIES.EXAM;
}

function mapFhirCategoryToNexus(fhirCategory: string): string {
  const map: Record<string, string> = {
    [OBSERVATION_CATEGORIES.VITAL_SIGNS]: 'Vital',
    [OBSERVATION_CATEGORIES.LABORATORY]: 'Laboratory',
    [OBSERVATION_CATEGORIES.IMAGING]: 'Imaging',
    [OBSERVATION_CATEGORIES.EXAM]: 'Exam',
  };
  return map[fhirCategory] ?? 'Exam';
}

function mapInterpretation(interp: string): FhirCodeableConcept {
  const interpretationSystem =
    'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation';
  const map: Record<string, { code: string; display: string }> = {
    NORMAL: { code: 'N', display: 'Normal' },
    HIGH: { code: 'H', display: 'High' },
    LOW: { code: 'L', display: 'Low' },
    CRITICAL_HIGH: { code: 'HH', display: 'Critical High' },
    CRITICAL_LOW: { code: 'LL', display: 'Critical Low' },
  };
  const entry = map[interp] ?? { code: 'N', display: 'Normal' };
  return {
    coding: [{ system: interpretationSystem, ...entry }],
    text: entry.display,
  };
}

function mapLabelToLoinc(label: string): string | undefined {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('temperature')) return LOINC_CODES.BODY_TEMPERATURE;
  if (lowerLabel.includes('heart rate') || lowerLabel.includes('pulse')) return LOINC_CODES.HEART_RATE;
  if (lowerLabel.includes('respiratory') || lowerLabel.includes('rr')) return LOINC_CODES.RESPIRATORY_RATE;
  if (lowerLabel.includes('systolic')) return LOINC_CODES.BLOOD_PRESSURE_SYSTOLIC;
  if (lowerLabel.includes('diastolic')) return LOINC_CODES.BLOOD_PRESSURE_DIASTOLIC;
  if (lowerLabel.includes('oxygen') || lowerLabel.includes('spo2')) return LOINC_CODES.OXYGEN_SATURATION;
  if (lowerLabel.includes('weight')) return LOINC_CODES.BODY_WEIGHT;
  if (lowerLabel.includes('height')) return LOINC_CODES.BODY_HEIGHT;
  if (lowerLabel.includes('hemoglobin') || lowerLabel.includes('hb')) return LOINC_CODES.HEMOGLOBIN;
  if (lowerLabel.includes('glucose')) return LOINC_CODES.GLUCOSE;
  if (lowerLabel.includes('creatinine')) return LOINC_CODES.CREATININE;
  if (lowerLabel.includes('sodium')) return LOINC_CODES.SODIUM;
  if (lowerLabel.includes('potassium')) return LOINC_CODES.POTASSIUM;
  return undefined;
}
