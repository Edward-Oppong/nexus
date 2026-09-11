// ============================================================
// src/lib/interoperability/normalization/units.ts
// Phase 6H: UCUM Unit Normalization & Standard Conversions
// ============================================================

import { FHIR_SYSTEMS } from '../fhir/version';

export interface NormalizedQuantity {
  value: number;
  unit: string;
  system: string;
  code: string; // UCUM standard code
}

const UNIT_SYNONYM_MAP: Record<string, { ucumCode: string; canonicalDisplay: string }> = {
  // Blood Pressure
  'mmhg': { ucumCode: 'mm[Hg]', canonicalDisplay: 'mmHg' },
  'mm[hg]': { ucumCode: 'mm[Hg]', canonicalDisplay: 'mmHg' },
  'millimeter of mercury': { ucumCode: 'mm[Hg]', canonicalDisplay: 'mmHg' },

  // Heart Rate / Respiratory Rate
  'bpm': { ucumCode: '/min', canonicalDisplay: 'beats/min' },
  'beats/min': { ucumCode: '/min', canonicalDisplay: 'beats/min' },
  'beats per minute': { ucumCode: '/min', canonicalDisplay: 'beats/min' },
  'breaths/min': { ucumCode: '/min', canonicalDisplay: 'breaths/min' },
  'breaths per minute': { ucumCode: '/min', canonicalDisplay: 'breaths/min' },
  '/min': { ucumCode: '/min', canonicalDisplay: '/min' },
  'min-1': { ucumCode: '/min', canonicalDisplay: '/min' },

  // Temperature
  'c': { ucumCode: 'Cel', canonicalDisplay: '°C' },
  '°c': { ucumCode: 'Cel', canonicalDisplay: '°C' },
  'cel': { ucumCode: 'Cel', canonicalDisplay: '°C' },
  'celsius': { ucumCode: 'Cel', canonicalDisplay: '°C' },
  'deg c': { ucumCode: 'Cel', canonicalDisplay: '°C' },
  'f': { ucumCode: '[degF]', canonicalDisplay: '°F' },
  '°f': { ucumCode: '[degF]', canonicalDisplay: '°F' },
  'fahrenheit': { ucumCode: '[degF]', canonicalDisplay: '°F' },
  'deg f': { ucumCode: '[degF]', canonicalDisplay: '°F' },

  // Saturation / Percentages
  '%': { ucumCode: '%', canonicalDisplay: '%' },
  'percent': { ucumCode: '%', canonicalDisplay: '%' },

  // Mass / Weight
  'kg': { ucumCode: 'kg', canonicalDisplay: 'kg' },
  'kilogram': { ucumCode: 'kg', canonicalDisplay: 'kg' },
  'g': { ucumCode: 'g', canonicalDisplay: 'g' },
  'gram': { ucumCode: 'g', canonicalDisplay: 'g' },
  'lbs': { ucumCode: '[lb_av]', canonicalDisplay: 'lb' },
  'lb': { ucumCode: '[lb_av]', canonicalDisplay: 'lb' },
  'pounds': { ucumCode: '[lb_av]', canonicalDisplay: 'lb' },

  // Length / Height
  'cm': { ucumCode: 'cm', canonicalDisplay: 'cm' },
  'centimeter': { ucumCode: 'cm', canonicalDisplay: 'cm' },
  'm': { ucumCode: 'm', canonicalDisplay: 'm' },
  'meter': { ucumCode: 'm', canonicalDisplay: 'm' },
  'in': { ucumCode: '[in_i]', canonicalDisplay: 'in' },
  'inch': { ucumCode: '[in_i]', canonicalDisplay: 'in' },

  // Laboratory concentrations
  'mg/dl': { ucumCode: 'mg/dL', canonicalDisplay: 'mg/dL' },
  'g/dl': { ucumCode: 'g/dL', canonicalDisplay: 'g/dL' },
  'mmol/l': { ucumCode: 'mmol/L', canonicalDisplay: 'mmol/L' },
  'umol/l': { ucumCode: 'umol/L', canonicalDisplay: 'µmol/L' },
  '10*3/ul': { ucumCode: '10*3/uL', canonicalDisplay: '10^3/µL' },
  'k/ul': { ucumCode: '10*3/uL', canonicalDisplay: '10^3/µL' },
  'cells/ul': { ucumCode: '/uL', canonicalDisplay: '/µL' },
  'pg/ml': { ucumCode: 'pg/mL', canonicalDisplay: 'pg/mL' },
  'ng/ml': { ucumCode: 'ng/mL', canonicalDisplay: 'ng/mL' },
};

/**
 * Normalizes raw value and unit string to standard UCUM representation,
 * converting customary units (e.g. °F -> °C, lbs -> kg) if autoConvert is true.
 */
export function normalizeQuantity(
  value: number,
  rawUnit?: string,
  autoConvert = true
): NormalizedQuantity {
  if (!rawUnit) {
    return {
      value,
      unit: '',
      system: FHIR_SYSTEMS.UCUM,
      code: '1',
    };
  }

  const cleanUnit = rawUnit.trim().toLowerCase();
  const match = UNIT_SYNONYM_MAP[cleanUnit];

  if (!match) {
    return {
      value,
      unit: rawUnit.trim(),
      system: FHIR_SYSTEMS.UCUM,
      code: rawUnit.trim(),
    };
  }

  // Handle conversion if requested
  if (autoConvert) {
    // Fahrenheit to Celsius
    if (match.ucumCode === '[degF]') {
      const celsiusValue = Math.round(((value - 32) * 5 / 9) * 10) / 10;
      return {
        value: celsiusValue,
        unit: '°C',
        system: FHIR_SYSTEMS.UCUM,
        code: 'Cel',
      };
    }

    // Pounds to Kilograms
    if (match.ucumCode === '[lb_av]') {
      const kgValue = Math.round((value * 0.45359237) * 10) / 10;
      return {
        value: kgValue,
        unit: 'kg',
        system: FHIR_SYSTEMS.UCUM,
        code: 'kg',
      };
    }

    // Inches to Centimeters
    if (match.ucumCode === '[in_i]') {
      const cmValue = Math.round((value * 2.54) * 10) / 10;
      return {
        value: cmValue,
        unit: 'cm',
        system: FHIR_SYSTEMS.UCUM,
        code: 'cm',
      };
    }
  }

  return {
    value,
    unit: match.canonicalDisplay,
    system: FHIR_SYSTEMS.UCUM,
    code: match.ucumCode,
  };
}
