// ============================================================
// src/lib/interoperability/normalization/codes.ts
// Phase 6H: Clinical Coding Normalization (LOINC, SNOMED, ICD-10)
// ============================================================

import { FHIR_SYSTEMS } from '../fhir/version';
import type { FhirCodeableConcept, FhirCoding } from '../fhir/types';

export interface NormalizedConcept {
  system: string;
  code: string;
  display: string;
  category?: 'vital-signs' | 'laboratory' | 'finding' | 'procedure';
}

// Canonical LOINC vital signs
export const CANONICAL_LOINC_VITALS: Record<string, NormalizedConcept> = {
  // Blood Pressure Systolic
  '8480-6': { system: FHIR_SYSTEMS.LOINC, code: '8480-6', display: 'Systolic blood pressure', category: 'vital-signs' },
  // Blood Pressure Diastolic
  '8462-4': { system: FHIR_SYSTEMS.LOINC, code: '8462-4', display: 'Diastolic blood pressure', category: 'vital-signs' },
  // Mean Arterial Pressure
  '8478-0': { system: FHIR_SYSTEMS.LOINC, code: '8478-0', display: 'Mean arterial pressure', category: 'vital-signs' },
  // Heart Rate / Pulse
  '8867-4': { system: FHIR_SYSTEMS.LOINC, code: '8867-4', display: 'Heart rate', category: 'vital-signs' },
  // Respiratory Rate
  '9279-1': { system: FHIR_SYSTEMS.LOINC, code: '9279-1', display: 'Respiratory rate', category: 'vital-signs' },
  // Body Temperature
  '8310-5': { system: FHIR_SYSTEMS.LOINC, code: '8310-5', display: 'Body temperature', category: 'vital-signs' },
  // Oxygen Saturation by Pulse Oximetry
  '2708-6': { system: FHIR_SYSTEMS.LOINC, code: '2708-6', display: 'Oxygen saturation in Arterial blood by Pulse oximetry', category: 'vital-signs' },
  '59408-5': { system: FHIR_SYSTEMS.LOINC, code: '59408-5', display: 'Oxygen saturation in Arterial blood by Pulse oximetry', category: 'vital-signs' },
  // Body Weight
  '29463-7': { system: FHIR_SYSTEMS.LOINC, code: '29463-7', display: 'Body weight', category: 'vital-signs' },
  // Body Height
  '8302-2': { system: FHIR_SYSTEMS.LOINC, code: '8302-2', display: 'Body height', category: 'vital-signs' },
  // Glasgow Coma Scale Total
  '9269-2': { system: FHIR_SYSTEMS.LOINC, code: '9269-2', display: 'Glasgow coma score total', category: 'vital-signs' },
};

// Common alias / short-name dictionary to canonical concepts
const ALIAS_MAP: Record<string, NormalizedConcept> = {
  'sbp': CANONICAL_LOINC_VITALS['8480-6'],
  'systolic': CANONICAL_LOINC_VITALS['8480-6'],
  'systolic bp': CANONICAL_LOINC_VITALS['8480-6'],
  'dbp': CANONICAL_LOINC_VITALS['8462-4'],
  'diastolic': CANONICAL_LOINC_VITALS['8462-4'],
  'diastolic bp': CANONICAL_LOINC_VITALS['8462-4'],
  'map': CANONICAL_LOINC_VITALS['8478-0'],
  'hr': CANONICAL_LOINC_VITALS['8867-4'],
  'pulse': CANONICAL_LOINC_VITALS['8867-4'],
  'heart rate': CANONICAL_LOINC_VITALS['8867-4'],
  'rr': CANONICAL_LOINC_VITALS['9279-1'],
  'resp rate': CANONICAL_LOINC_VITALS['9279-1'],
  'respiratory rate': CANONICAL_LOINC_VITALS['9279-1'],
  'temp': CANONICAL_LOINC_VITALS['8310-5'],
  'temperature': CANONICAL_LOINC_VITALS['8310-5'],
  'spo2': CANONICAL_LOINC_VITALS['2708-6'],
  'o2 sat': CANONICAL_LOINC_VITALS['2708-6'],
  'weight': CANONICAL_LOINC_VITALS['29463-7'],
  'height': CANONICAL_LOINC_VITALS['8302-2'],
  'gcs': CANONICAL_LOINC_VITALS['9269-2'],
};

/**
 * Normalizes an arbitrary text label, code, or CodeableConcept into a canonical clinical concept.
 */
export function normalizeCode(input: string | FhirCodeableConcept | FhirCoding): NormalizedConcept {
  if (typeof input === 'string') {
    const clean = input.trim().toLowerCase();
    if (ALIAS_MAP[clean]) {
      return ALIAS_MAP[clean];
    }
    if (CANONICAL_LOINC_VITALS[clean]) {
      return CANONICAL_LOINC_VITALS[clean];
    }
    return {
      system: 'urn:nexus:custom',
      code: clean.replace(/\s+/g, '-'),
      display: input.trim(),
    };
  }

  // If input is FhirCoding
  if ('system' in input && input.code) {
    const code = input.code;
    if (input.system === FHIR_SYSTEMS.LOINC && CANONICAL_LOINC_VITALS[code]) {
      return CANONICAL_LOINC_VITALS[code];
    }
    return {
      system: input.system || 'urn:nexus:custom',
      code,
      display: input.display || code,
    };
  }

  // If input is FhirCodeableConcept
  if ('coding' in input && input.coding && input.coding.length > 0) {
    for (const coding of input.coding) {
      if (coding.system === FHIR_SYSTEMS.LOINC && coding.code && CANONICAL_LOINC_VITALS[coding.code]) {
        return CANONICAL_LOINC_VITALS[coding.code];
      }
    }
    const primary = input.coding[0];
    return {
      system: primary.system || 'urn:nexus:custom',
      code: primary.code || 'unknown',
      display: primary.display || input.text || primary.code || 'Unknown',
    };
  }

  return {
    system: 'urn:nexus:custom',
    code: 'unknown',
    display: (input as FhirCodeableConcept).text || 'Unknown',
  };
}
