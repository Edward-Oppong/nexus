// ============================================================
// src/features/cases/services/clinical-knowledge.ts
// Clinical Knowledge Base for Automated Reference Ranges,
// Test Value Interpretation, Unit Selection, and Triage Routing.
// v3.0 — Demographic-aware (Age & Sex), non-biased 2021 CKD-EPI,
// and unit-aware clinical evaluation engine.
// ============================================================

export interface PatientDemographicContext {
  ageYears?: number;
  dateOfBirth?: string;
  administrativeSex?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
}

export interface ClinicalEvaluationResult {
  referenceRange: string;
  unit: string;
  interpretation: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
  isRecognized: boolean;
  unitOptions: string[];
  demographicAdjustmentApplied?: boolean;
}

interface UnitConfig {
  label: string;       // display label in the dropdown
  referenceRange: string;
  evaluate: (num: number, demographics?: PatientDemographicContext) => 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
}

interface TestRule {
  pattern: RegExp;
  canonicalName: string;
  defaultUnit: string;
  referenceRange: string;
  /** Available units for this test, with per-unit thresholds */
  units: Record<string, UnitConfig>;
  /** Optional dynamic reference range calculator tailored to age and sex */
  getDemographicRange?: (unit: string, demographics?: PatientDemographicContext) => string;
  evaluate: (
    valueStr: string,
    selectedUnit?: string,
    demographics?: PatientDemographicContext
  ) => {
    interpretation: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
    detectedUnit?: string;
    demographicAdjustmentApplied?: boolean;
  };
}

/**
 * Calculates patient age in years from either a birth date string or direct age number.
 */
export function calculateAgeInYears(dobOrAge?: string | number): number | undefined {
  if (typeof dobOrAge === 'number') {
    return dobOrAge >= 0 ? dobOrAge : undefined;
  }
  if (!dobOrAge || typeof dobOrAge !== 'string') return undefined;

  const trimmed = dobOrAge.trim();
  if (!trimmed) return undefined;

  // Try parsing ISO / standard date string
  const birth = new Date(trimmed);
  if (!isNaN(birth.getTime()) && birth.getFullYear() > 1900 && birth.getFullYear() <= new Date().getFullYear()) {
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : undefined;
  }

  const numericOnly = parseFloat(trimmed);
  return !isNaN(numericOnly) && numericOnly >= 0 && numericOnly < 130 ? numericOnly : undefined;
}

/**
 * 2021 CKD-EPI Creatinine Equation without Race (Modern Clinical Standard).
 * Reference: Inker LA, Eneanya ND, Coresh J, et al. New Creatinine- and Cystatin C-Based Equations
 * to Estimate GFR without Race. N Engl J Med 2021; 385:1737-1749.
 *
 * Eliminates race-based adjustment coefficients to prevent documented bias in renal diagnosis,
 * medication dosing thresholds, and transplant qualification.
 */
export function calculateEgfr2021(
  scrMgDl: number,
  ageYears: number,
  sex: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'
): number | null {
  if (scrMgDl <= 0 || ageYears <= 0) return null;

  const isFemale = sex === 'FEMALE';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const genderMultiplier = isFemale ? 1.012 : 1.0;

  const scrRatio = scrMgDl / kappa;
  const minRatio = Math.min(scrRatio, 1);
  const maxRatio = Math.max(scrRatio, 1);

  const egfr =
    142 *
    Math.pow(minRatio, alpha) *
    Math.pow(maxRatio, -1.2) *
    Math.pow(0.9938, ageYears) *
    genderMultiplier;

  return Math.round(egfr * 10) / 10;
}

// Helper: extract numeric portion from a value string
function parseNum(val: string): number {
  return parseFloat(val.replace(/[^\d.\-]/g, ''));
}

const CLINICAL_TEST_RULES: TestRule[] = [
  // ── VITAL SIGNS ──────────────────────────────────────────────
  {
    pattern: /(?:blood\s*pressure|bp|systolic|diastolic)/i,
    canonicalName: 'Blood Pressure',
    defaultUnit: 'mmHg',
    referenceRange: '90/60 – 120/80',
    units: {
      'mmHg': { label: 'mmHg', referenceRange: '90/60 – 120/80', evaluate: () => 'NORMAL' },
    },
    getDemographicRange: (_unit, demographics) => {
      const age = demographics?.ageYears ?? calculateAgeInYears(demographics?.dateOfBirth);
      if (age !== undefined && age < 12) {
        return '80/50 – 110/70 (Pediatric)';
      }
      return '90/60 – 120/80 (Adult)';
    },
    evaluate: (val, _sel, demographics) => {
      const match = val.match(/(\d{2,3})\s*(?:\/|\s)\s*(\d{2,3})/);
      if (!match) return { interpretation: 'NORMAL' };
      const sys = parseInt(match[1], 10);
      const dia = parseInt(match[2], 10);
      const age = demographics?.ageYears ?? calculateAgeInYears(demographics?.dateOfBirth);
      const isPediatric = age !== undefined && age < 12;

      if (isPediatric) {
        if (sys >= 140 || dia >= 90 || sys < 70) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: true };
        if (sys >= 115 || dia >= 75) return { interpretation: 'HIGH', demographicAdjustmentApplied: true };
        if (sys < 80 || dia < 50) return { interpretation: 'LOW', demographicAdjustmentApplied: true };
        return { interpretation: 'NORMAL', demographicAdjustmentApplied: true };
      }

      if (sys >= 180 || dia >= 110 || sys < 80) return { interpretation: 'CRITICAL' };
      if (sys >= 140 || dia >= 90) return { interpretation: 'HIGH' };
      if (sys < 90 || dia < 60) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    // Accepts: HR, Heart Rate, Pulse, bpm
    pattern: /(?:heart\s*rate|pulse|hr\b|bpm)/i,
    canonicalName: 'Heart Rate',
    defaultUnit: 'bpm',
    referenceRange: '60 – 100',
    units: { 'bpm': { label: 'bpm', referenceRange: '60 – 100', evaluate: (n) => n >= 130 || n < 45 ? 'CRITICAL' : n > 100 ? 'HIGH' : n < 60 ? 'LOW' : 'NORMAL' } },
    getDemographicRange: (_unit, demographics) => {
      const age = demographics?.ageYears ?? calculateAgeInYears(demographics?.dateOfBirth);
      if (age !== undefined) {
        if (age < 1) return '100 – 160 (Infant)';
        if (age < 6) return '80 – 130 (Early Child)';
        if (age < 12) return '70 – 110 (Child)';
      }
      return '60 – 100 (Adult)';
    },
    evaluate: (val, _sel, demographics) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const age = demographics?.ageYears ?? calculateAgeInYears(demographics?.dateOfBirth);
      if (age !== undefined && age < 1) {
        if (num >= 180 || num < 70) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: true };
        if (num > 160) return { interpretation: 'HIGH', demographicAdjustmentApplied: true };
        if (num < 100) return { interpretation: 'LOW', demographicAdjustmentApplied: true };
        return { interpretation: 'NORMAL', demographicAdjustmentApplied: true };
      }
      if (age !== undefined && age < 12) {
        if (num >= 160 || num < 50) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: true };
        if (num > 120) return { interpretation: 'HIGH', demographicAdjustmentApplied: true };
        if (num < 70) return { interpretation: 'LOW', demographicAdjustmentApplied: true };
        return { interpretation: 'NORMAL', demographicAdjustmentApplied: true };
      }
      if (num >= 130 || num < 45) return { interpretation: 'CRITICAL' };
      if (num > 100) return { interpretation: 'HIGH' };
      if (num < 60) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:temp(?:erature)?|triage\s*temp|pyrexia)/i,
    canonicalName: 'Body Temperature',
    defaultUnit: '°C',
    referenceRange: '36.5 – 37.5',
    units: {
      '°C': { label: '°C', referenceRange: '36.5 – 37.5', evaluate: (n) => n >= 39.5 || n < 35 ? 'CRITICAL' : n >= 38 ? 'HIGH' : n < 36 ? 'LOW' : 'NORMAL' },
      '°F': { label: '°F', referenceRange: '97.7 – 99.5', evaluate: (n) => n >= 103.1 || n < 95 ? 'CRITICAL' : n >= 100.4 ? 'HIGH' : n < 96.8 ? 'LOW' : 'NORMAL' },
    },
    evaluate: (val, selectedUnit) => {
      let num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const inFahrenheit = selectedUnit === '°F' || (selectedUnit !== '°C' && num > 45);
      if (inFahrenheit) num = (num - 32) * (5 / 9);
      if (num >= 39.5 || num < 35.0) return { interpretation: 'CRITICAL' };
      if (num >= 38.0) return { interpretation: 'HIGH' };
      if (num < 36.0) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    // Accepts: SpO2, SpO₂, O2 sat, Oxygen sat, spo2
    pattern: /(?:sp\s*o[2₂]|oxygen\s*sat(?:uration)?|o2\s*sat|spo2)/i,
    canonicalName: 'Oxygen Saturation (SpO₂)',
    defaultUnit: '%',
    referenceRange: '95 – 100',
    units: { '%': { label: '%', referenceRange: '95 – 100', evaluate: (n) => n < 90 ? 'CRITICAL' : n < 95 ? 'LOW' : 'NORMAL' } },
    evaluate: (val) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num < 90) return { interpretation: 'CRITICAL' };
      if (num < 95) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:respiratory\s*rate|resp\s*rate|rr\b|breaths)/i,
    canonicalName: 'Respiratory Rate',
    defaultUnit: 'breaths/min',
    referenceRange: '12 – 20',
    units: { 'breaths/min': { label: 'breaths/min', referenceRange: '12 – 20', evaluate: (n) => n >= 30 || n < 8 ? 'CRITICAL' : n > 20 ? 'HIGH' : n < 12 ? 'LOW' : 'NORMAL' } },
    getDemographicRange: (_unit, demographics) => {
      const age = demographics?.ageYears ?? calculateAgeInYears(demographics?.dateOfBirth);
      if (age !== undefined) {
        if (age < 1) return '30 – 50 (Infant)';
        if (age < 6) return '20 – 30 (Child)';
        if (age < 12) return '16 – 24 (School Age)';
      }
      return '12 – 20 (Adult)';
    },
    evaluate: (val, _sel, demographics) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const age = demographics?.ageYears ?? calculateAgeInYears(demographics?.dateOfBirth);
      if (age !== undefined && age < 1) {
        if (num >= 60 || num < 20) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: true };
        if (num > 50) return { interpretation: 'HIGH', demographicAdjustmentApplied: true };
        if (num < 30) return { interpretation: 'LOW', demographicAdjustmentApplied: true };
        return { interpretation: 'NORMAL', demographicAdjustmentApplied: true };
      }
      if (age !== undefined && age < 12) {
        if (num >= 45 || num < 12) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: true };
        if (num > 30) return { interpretation: 'HIGH', demographicAdjustmentApplied: true };
        if (num < 16) return { interpretation: 'LOW', demographicAdjustmentApplied: true };
        return { interpretation: 'NORMAL', demographicAdjustmentApplied: true };
      }
      if (num >= 30 || num < 8) return { interpretation: 'CRITICAL' };
      if (num > 20) return { interpretation: 'HIGH' };
      if (num < 12) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },

  // ── BIOCHEMISTRY & INFLAMMATORY MARKERS ──────────────────────
  {
    pattern: /(?:c-?reactive\s*protein|crp)/i,
    canonicalName: 'C-Reactive Protein (CRP)',
    defaultUnit: 'mg/L',
    referenceRange: '< 5.0',
    units: {
      'mg/L':  { label: 'mg/L',  referenceRange: '< 5.0',   evaluate: (n) => n >= 100 ? 'CRITICAL' : n > 5.0 ? 'HIGH' : 'NORMAL' },
      'mg/dL': { label: 'mg/dL', referenceRange: '< 0.5',   evaluate: (n) => n >= 10  ? 'CRITICAL' : n > 0.5 ? 'HIGH' : 'NORMAL' },
    },
    evaluate: (val, sel) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const cfg = sel === 'mg/dL' ? { crit: 10, high: 0.5 } : { crit: 100, high: 5 };
      if (num >= cfg.crit) return { interpretation: 'CRITICAL' };
      if (num > cfg.high) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:d-?dimer|dimer)/i,
    canonicalName: 'D-Dimer',
    defaultUnit: 'ng/mL',
    referenceRange: '< 500',
    units: {
      'ng/mL':  { label: 'ng/mL',  referenceRange: '< 500',   evaluate: (n) => n >= 1500 ? 'CRITICAL' : n > 500 ? 'HIGH' : 'NORMAL' },
      'µg/mL':  { label: 'µg/mL',  referenceRange: '< 0.5',   evaluate: (n) => n >= 1.5  ? 'CRITICAL' : n > 0.5 ? 'HIGH' : 'NORMAL' },
    },
    evaluate: (val, sel) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const factor = sel === 'µg/mL' ? 1000 : 1;
      const v = num * factor;
      if (v >= 1500) return { interpretation: 'CRITICAL' };
      if (v > 500)   return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:troponin(?:\s*[it])?|ctni|ctnt)/i,
    canonicalName: 'Troponin',
    defaultUnit: 'ng/mL',
    referenceRange: '< 0.04',
    units: {
      'ng/mL': { label: 'ng/mL', referenceRange: '< 0.04', evaluate: (n) => n >= 0.1 ? 'CRITICAL' : n > 0.04 ? 'HIGH' : 'NORMAL' },
      'pg/mL': { label: 'pg/mL', referenceRange: '< 40',   evaluate: (n) => n >= 100 ? 'CRITICAL' : n > 40  ? 'HIGH' : 'NORMAL' },
    },
    evaluate: (val, sel) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const hi = sel === 'pg/mL' ? 40 : 0.04;
      const crit = sel === 'pg/mL' ? 100 : 0.1;
      if (num >= crit) return { interpretation: 'CRITICAL' };
      if (num > hi) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    // Accepts: K+, Potassium
    pattern: /(?:potassium|k\s*\+|\bk\b)/i,
    canonicalName: 'Potassium (K⁺)',
    defaultUnit: 'mmol/L',
    referenceRange: '3.5 – 5.0',
    units: {
      'mmol/L': { label: 'mmol/L', referenceRange: '3.5 – 5.0', evaluate: (n) => n >= 6.0 || n <= 2.8 ? 'CRITICAL' : n > 5.0 ? 'HIGH' : n < 3.5 ? 'LOW' : 'NORMAL' },
      'mEq/L':  { label: 'mEq/L',  referenceRange: '3.5 – 5.0', evaluate: (n) => n >= 6.0 || n <= 2.8 ? 'CRITICAL' : n > 5.0 ? 'HIGH' : n < 3.5 ? 'LOW' : 'NORMAL' },
    },
    evaluate: (val) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 6.0 || num <= 2.8) return { interpretation: 'CRITICAL' };
      if (num > 5.0) return { interpretation: 'HIGH' };
      if (num < 3.5) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    // Accepts: Na+, Sodium
    pattern: /(?:sodium|na\s*\+|\bna\b)/i,
    canonicalName: 'Sodium (Na⁺)',
    defaultUnit: 'mmol/L',
    referenceRange: '135 – 145',
    units: {
      'mmol/L': { label: 'mmol/L', referenceRange: '135 – 145', evaluate: (n) => n >= 155 || n <= 125 ? 'CRITICAL' : n > 145 ? 'HIGH' : n < 135 ? 'LOW' : 'NORMAL' },
      'mEq/L':  { label: 'mEq/L',  referenceRange: '135 – 145', evaluate: (n) => n >= 155 || n <= 125 ? 'CRITICAL' : n > 145 ? 'HIGH' : n < 135 ? 'LOW' : 'NORMAL' },
    },
    evaluate: (val) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 155 || num <= 125) return { interpretation: 'CRITICAL' };
      if (num > 145) return { interpretation: 'HIGH' };
      if (num < 135) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    // Accepts: Creatinine, Cr, Serum Creatinine, Creatine (common typo)
    pattern: /(?:creatinine|creatine|serum\s*creatinine|\bcr\b)/i,
    canonicalName: 'Serum Creatinine',
    defaultUnit: 'mg/dL',
    referenceRange: '0.7 – 1.3',
    units: {
      'mg/dL':  { label: 'mg/dL',  referenceRange: '0.7 – 1.3',   evaluate: (n) => n >= 3.0 ? 'CRITICAL' : n > 1.3 ? 'HIGH' : n < 0.5 ? 'LOW' : 'NORMAL' },
      'µmol/L': { label: 'µmol/L', referenceRange: '62 – 115',    evaluate: (n) => n >= 265 ? 'CRITICAL' : n > 115 ? 'HIGH' : n < 44  ? 'LOW' : 'NORMAL' },
      'umol/L': { label: 'umol/L', referenceRange: '62 – 115',    evaluate: (n) => n >= 265 ? 'CRITICAL' : n > 115 ? 'HIGH' : n < 44  ? 'LOW' : 'NORMAL' },
    },
    getDemographicRange: (unit, demographics) => {
      const isFemale = demographics?.administrativeSex === 'FEMALE';
      const isUmol = unit === 'µmol/L' || unit === 'umol/L';
      if (isUmol) {
        return isFemale ? '44 – 97 (Female)' : '62 – 115 (Male)';
      }
      return isFemale ? '0.5 – 1.1 (Female)' : '0.7 – 1.3 (Male)';
    },
    evaluate: (val, sel, demographics) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const isFemale = demographics?.administrativeSex === 'FEMALE';
      const isUmol = sel === 'µmol/L' || sel === 'umol/L';

      if (isUmol) {
        const crit = isFemale ? 220 : 265;
        const high = isFemale ? 97 : 115;
        const low = isFemale ? 40 : 53;
        if (num >= crit) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
        if (num > high)  return { interpretation: 'HIGH', demographicAdjustmentApplied: !!demographics?.administrativeSex };
        if (num < low)   return { interpretation: 'LOW', demographicAdjustmentApplied: !!demographics?.administrativeSex };
        return { interpretation: 'NORMAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      }

      // mg/dL (default)
      const crit = isFemale ? 2.5 : 3.0;
      const high = isFemale ? 1.1 : 1.3;
      const low = isFemale ? 0.4 : 0.6;
      if (num >= crit) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      if (num > high)  return { interpretation: 'HIGH', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      if (num < low)   return { interpretation: 'LOW', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      return { interpretation: 'NORMAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
    },
  },
  {
    // Accepts: Glucose, Blood Sugar, FBG, RBS, Blood Glucose
    pattern: /(?:glucose|blood\s*sugar|fbg|rbs|blood\s*glucose)/i,
    canonicalName: 'Blood Glucose',
    defaultUnit: 'mg/dL',
    referenceRange: '70 – 100',
    units: {
      'mg/dL':  { label: 'mg/dL',  referenceRange: '70 – 100',  evaluate: (n) => n >= 300 || n <= 50 ? 'CRITICAL' : n > 140 ? 'HIGH' : n < 70 ? 'LOW' : 'NORMAL' },
      'mmol/L': { label: 'mmol/L', referenceRange: '3.9 – 5.6', evaluate: (n) => n >= 16.7 || n <= 2.8 ? 'CRITICAL' : n > 7.8 ? 'HIGH' : n < 3.9 ? 'LOW' : 'NORMAL' },
    },
    evaluate: (val, sel) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (sel === 'mmol/L') {
        if (num >= 16.7 || num <= 2.8) return { interpretation: 'CRITICAL' };
        if (num > 7.8) return { interpretation: 'HIGH' };
        if (num < 3.9) return { interpretation: 'LOW' };
        return { interpretation: 'NORMAL' };
      }
      // mg/dL (default)
      if (num >= 300 || num <= 50) return { interpretation: 'CRITICAL' };
      if (num > 140) return { interpretation: 'HIGH' };
      if (num < 70)  return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },

  // ── HEMATOLOGY ───────────────────────────────────────────────
  {
    // Accepts: Haemoglobin, Hemoglobin, Hgb, Hb, HbA1c, HbA₁c
    pattern: /(?:ha?emoglobin|hgb|\bhb\b|hba\s*[1₁]c?)/i,
    canonicalName: 'Haemoglobin (Hb)',
    defaultUnit: 'g/dL',
    referenceRange: '12.0 – 17.5',
    units: {
      'g/dL': { label: 'g/dL', referenceRange: '12.0 – 17.5', evaluate: (n) => n < 7.0 || n > 20.0 ? 'CRITICAL' : n < 12.0 ? 'LOW' : n > 17.5 ? 'HIGH' : 'NORMAL' },
      'g/L':  { label: 'g/L',  referenceRange: '120 – 175',   evaluate: (n) => n < 70  || n > 200  ? 'CRITICAL' : n < 120  ? 'LOW' : n > 175  ? 'HIGH' : 'NORMAL' },
    },
    getDemographicRange: (unit, demographics) => {
      const isFemale = demographics?.administrativeSex === 'FEMALE';
      const isGramPerLiter = unit === 'g/L';
      if (isGramPerLiter) {
        return isFemale ? '120 – 155 (Female)' : '135 – 175 (Male)';
      }
      return isFemale ? '12.0 – 15.5 (Female)' : '13.5 – 17.5 (Male)';
    },
    evaluate: (val, sel, demographics) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const isFemale = demographics?.administrativeSex === 'FEMALE';
      const isGramPerLiter = sel === 'g/L';

      if (isGramPerLiter) {
        const critLow = 70;
        const critHigh = 200;
        const normLow = isFemale ? 120 : 135;
        const normHigh = isFemale ? 155 : 175;
        if (num < critLow || num > critHigh) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
        if (num < normLow)  return { interpretation: 'LOW', demographicAdjustmentApplied: !!demographics?.administrativeSex };
        if (num > normHigh) return { interpretation: 'HIGH', demographicAdjustmentApplied: !!demographics?.administrativeSex };
        return { interpretation: 'NORMAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      }

      const critLow = 7.0;
      const critHigh = 20.0;
      const normLow = isFemale ? 12.0 : 13.5;
      const normHigh = isFemale ? 15.5 : 17.5;
      if (num < critLow || num > critHigh) return { interpretation: 'CRITICAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      if (num < normLow)  return { interpretation: 'LOW', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      if (num > normHigh) return { interpretation: 'HIGH', demographicAdjustmentApplied: !!demographics?.administrativeSex };
      return { interpretation: 'NORMAL', demographicAdjustmentApplied: !!demographics?.administrativeSex };
    },
  },
  {
    // Accepts: WBC, White Blood Cell, Leukocyte, White cell count
    // Also: 8.7 ×10⁹/L or 8.7 x10^9/L or 8.7 x109/L
    pattern: /(?:white\s*blood|wbc|leukocyte|white\s*cell)/i,
    canonicalName: 'White Blood Cell Count (WBC)',
    defaultUnit: '×10⁹/L',
    referenceRange: '4.0 – 11.0',
    units: {
      '×10⁹/L': { label: '×10⁹/L', referenceRange: '4.0 – 11.0',    evaluate: (n) => n >= 20 || n < 2 ? 'CRITICAL' : n > 11 ? 'HIGH' : n < 4 ? 'LOW' : 'NORMAL' },
      '10³/µL': { label: '10³/µL', referenceRange: '4.0 – 11.0',    evaluate: (n) => n >= 20 || n < 2 ? 'CRITICAL' : n > 11 ? 'HIGH' : n < 4 ? 'LOW' : 'NORMAL' },
      'cells/µL': { label: 'cells/µL', referenceRange: '4000 – 11000', evaluate: (n) => n >= 20000 || n < 2000 ? 'CRITICAL' : n > 11000 ? 'HIGH' : n < 4000 ? 'LOW' : 'NORMAL' },
    },
    evaluate: (val, sel) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      const v = (sel === 'cells/µL') ? num / 1000 : num;
      if (v >= 20.0 || v < 2.0) return { interpretation: 'CRITICAL' };
      if (v > 11.0) return { interpretation: 'HIGH' };
      if (v < 4.0)  return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:platelet|plt)/i,
    canonicalName: 'Platelet Count',
    defaultUnit: '×10⁹/L',
    referenceRange: '150 – 450',
    units: {
      '×10⁹/L': { label: '×10⁹/L',  referenceRange: '150 – 450',   evaluate: (n) => n < 50 ? 'CRITICAL' : n < 150 ? 'LOW' : n > 450 ? 'HIGH' : 'NORMAL' },
      '10³/µL': { label: '10³/µL', referenceRange: '150 – 450',   evaluate: (n) => n < 50 ? 'CRITICAL' : n < 150 ? 'LOW' : n > 450 ? 'HIGH' : 'NORMAL' },
    },
    evaluate: (val) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num < 50) return { interpretation: 'CRITICAL' };
      if (num < 150) return { interpretation: 'LOW' };
      if (num > 450) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },

  // ── MICROBIOLOGY & CULTURES ──────────────────────────────────
  {
    pattern: /(?:blood\s*culture|culture|bld-?cult|urine\s*culture)/i,
    canonicalName: 'Cultures & Microbiology',
    defaultUnit: '',
    referenceRange: 'Negative / No growth',
    units: {},
    evaluate: (val) => {
      const lower = val.toLowerCase();
      if (lower.includes('positive') || lower.includes('growth') || lower.includes('strep') || lower.includes('staph') || lower.includes('bacter') || lower.includes('organisms')) return { interpretation: 'CRITICAL' };
      if (lower.includes('negative') || lower.includes('no growth') || lower.includes('clear')) return { interpretation: 'NORMAL' };
      return { interpretation: 'ABNORMAL' };
    },
  },

  // ── IMAGING & CARDIAC STUDIES ────────────────────────────────
  {
    pattern: /(?:tee|echo|echocardiogram|ultrasound|\bct\b|mri|x-?ray|radiology)/i,
    canonicalName: 'Diagnostic Imaging / Echo',
    defaultUnit: '',
    referenceRange: 'Normal morphology',
    units: {},
    evaluate: (val) => {
      const lower = val.toLowerCase();
      if (/(vegetation|embolism|infarct|stenosis|regurgitation|thrombus|effusion|hemorrhage)/.test(lower)) return { interpretation: 'CRITICAL' };
      if (lower.includes('normal') || lower.includes('unremarkable') || lower.includes('intact')) return { interpretation: 'NORMAL' };
      return { interpretation: 'ABNORMAL' };
    },
  },
];



/**
 * Returns the available unit options for a given test name.
 * Returns [] for unrecognized tests or tests with only one unit.
 */
export function getTestUnitOptions(name: string): string[] {
  const trimmed = (name || '').trim();
  if (!trimmed) return [];
  const matchedRule = CLINICAL_TEST_RULES.find((r) => r.pattern.test(trimmed));
  if (!matchedRule) return [];
  return Object.keys(matchedRule.units);
}

/**
 * Returns the canonical test name for a given input name.
 * Useful for normalizing subscript/superscript variants.
 */
export function getCanonicalTestName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return trimmed;
  const matchedRule = CLINICAL_TEST_RULES.find((r) => r.pattern.test(trimmed));
  return matchedRule ? matchedRule.canonicalName : trimmed;
}

/**
 * Standard institutional clinical specialties for non-biased triage routing.
 */
export const STANDARD_CLINICAL_SPECIALTIES = [
  'Emergency Medicine',
  'Acute Internal Medicine',
  'Cardiology',
  'Respiratory Medicine & Pulmonology',
  'Infectious Diseases',
  'Neurology & Stroke Care',
  'Gastroenterology & Hepatology',
  'Nephrology & Renal Medicine',
  'Endocrinology & Diabetes',
  'General Surgery & Acute Care',
] as const;

/**
 * Automatically evaluates a test name and value to determine:
 * 1. The standard reference range (demographic and unit-aware)
 * 2. Standard clinical units
 * 3. Interpretation (NORMAL, HIGH, LOW, CRITICAL, ABNORMAL)
 *
 * Pass selectedUnit and demographics (age/sex) to obtain accurate,
 * non-biased reference ranges and clinical interpretations.
 */
export function evaluateClinicalObservation(
  name: string,
  value: string,
  existingRange?: string,
  existingInterpretation?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL',
  selectedUnit?: string,
  demographics?: PatientDemographicContext
): ClinicalEvaluationResult {
  const trimmedName = (name || '').trim();
  const trimmedValue = (value || '').trim();

  // If no name entered yet
  if (!trimmedName) {
    return {
      referenceRange: existingRange || '',
      unit: selectedUnit || '',
      interpretation: existingInterpretation || 'NORMAL',
      isRecognized: false,
      unitOptions: [],
    };
  }

  // Find matching rule
  const matchedRule = CLINICAL_TEST_RULES.find((rule) => rule.pattern.test(trimmedName));

  if (matchedRule) {
    const unitOptions = Object.keys(matchedRule.units);
    const effectiveUnit = selectedUnit && matchedRule.units[selectedUnit]
      ? selectedUnit
      : matchedRule.defaultUnit;
    const unitCfg = matchedRule.units[effectiveUnit];
    const dynamicRange = matchedRule.getDemographicRange
      ? matchedRule.getDemographicRange(effectiveUnit, demographics)
      : undefined;
    const refRange = dynamicRange || unitCfg?.referenceRange || matchedRule.referenceRange;

    const evalResult = trimmedValue
      ? matchedRule.evaluate(trimmedValue, effectiveUnit, demographics)
      : { interpretation: existingInterpretation || ('NORMAL' as const), demographicAdjustmentApplied: false };

    return {
      referenceRange: refRange,
      unit: effectiveUnit,
      interpretation: evalResult.interpretation,
      isRecognized: true,
      unitOptions,
      demographicAdjustmentApplied: evalResult.demographicAdjustmentApplied,
    };
  }

  // Generic heuristic fallback for unknown lab/exam names
  const lowerVal = trimmedValue.toLowerCase();
  let fallbackInterp: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL' = existingInterpretation || 'NORMAL';

  if (/(critical|severe|urgent|malignant|infarct|vegetation|positive for|embolism)/.test(lowerVal)) {
    fallbackInterp = 'CRITICAL';
  } else if (/(high|elevated|increased|abnormal)/.test(lowerVal)) {
    fallbackInterp = 'HIGH';
  } else if (/(low|decreased|reduced|deficient)/.test(lowerVal)) {
    fallbackInterp = 'LOW';
  } else if (/(normal|negative|clear|within normal)/.test(lowerVal)) {
    fallbackInterp = 'NORMAL';
  }

  return {
    referenceRange: existingRange || 'Normal clinical limits',
    unit: selectedUnit || '',
    interpretation: fallbackInterp,
    isRecognized: false,
    unitOptions: [],
  };
}


/**
 * Automatically derives triage priority and department routing from
 * presentation text, chief complaints, discrete observations, and optional institutional department options.
 */
export function inferCaseTriage(
  presentation: { title?: string; historyOfPresentIllness?: string },
  observations: Array<{ display?: string; value?: string; interpretation?: string; code?: string; unit?: string }>,
  availableDepartments?: string[],
  demographics?: PatientDemographicContext
): {
  priority: 'ROUTINE' | 'HIGH' | 'URGENT';
  department: string;
  rationale: string;
  esiEvaluation: EsiTriageEvaluation;
} {
  const fullText = `${presentation.title || ''} ${presentation.historyOfPresentIllness || ''}`.toLowerCase();

  // Check for critical observation findings
  const hasCriticalObservation = observations.some(
    (o) => o.interpretation === 'CRITICAL'
  );
  const hasHighObservation = observations.some(
    (o) => o.interpretation === 'HIGH' || o.interpretation === 'LOW'
  );

  // Red-flag triage keywords
  const statTriggers = [
    'stat', 'shock', 'anaphylaxis', 'embolism', 'cardiac arrest', 'severe chest pain',
    'vegetation', 'sepsis', 'hypoxia', 'altered mental', 'unconscious', 'respiratory failure'
  ];
  const highTriggers = [
    'fever', 'pyrexia', 'tachycardia', 'dyspnea', 'murmur', 'weight loss',
    'acute', 'pleuritic', 'bleeding', 'elevated'
  ];

  const matchedStat = statTriggers.find((t) => fullText.includes(t));
  const matchedHigh = highTriggers.find((t) => fullText.includes(t));

  let priority: 'ROUTINE' | 'HIGH' | 'URGENT' = 'ROUTINE';
  let rationale = 'Routine evaluation; hemodynamics and observation metrics stable.';

  if (hasCriticalObservation || matchedStat) {
    priority = 'URGENT';
    rationale = hasCriticalObservation
      ? 'Stat emergent priority triggered by critical diagnostic finding.'
      : `High acuity priority triggered by clinical indicator: "${matchedStat}".`;
  } else if (hasHighObservation || matchedHigh) {
    priority = 'HIGH';
    rationale = hasHighObservation
      ? 'Elevated priority assigned due to abnormal clinical observations.'
      : `Priority elevated based on active clinical symptoms ("${matchedHigh}").`;
  }

  // De-biased Specialty Routing (independent of demo hospital labels)
  let targetSpecialty: string = 'Acute Internal Medicine';

  if (/(cardio|heart|murmur|chest pain|valve|vegetation|troponin|arrhythmia|bicuspid|stemi|nstemi|angina)/.test(fullText)) {
    targetSpecialty = 'Cardiology';
  } else if (/(pulmon|lung|breath|dyspnea|embolism|pleuritic|respiratory|pneumonia|spo2|hypoxia)/.test(fullText)) {
    targetSpecialty = 'Respiratory Medicine & Pulmonology';
  } else if (/(infect|fever|pyrexia|culture|sepsis|endocarditis|bacteremia|strep|staph|abscess)/.test(fullText)) {
    targetSpecialty = 'Infectious Diseases';
  } else if (/(neuro|stroke|seizure|syncope|headache|weakness|numbness|paralysis)/.test(fullText)) {
    targetSpecialty = 'Neurology & Stroke Care';
  } else if (/(gastro|abdominal|vomiting|diarrhea|liver|jaundice|bleed)/.test(fullText)) {
    targetSpecialty = 'Gastroenterology & Hepatology';
  } else if (/(renal|kidney|creatinine|dialysis|electrolyte|potassium|hyperkalemia|egfr)/.test(fullText)) {
    targetSpecialty = 'Nephrology & Renal Medicine';
  }

  // If priority is URGENT, escalate route to Emergency Medicine unless specialist consult requested
  let department = priority === 'URGENT' && !/(inpatient|consult|ward)/.test(fullText)
    ? 'Emergency Medicine'
    : targetSpecialty;

  // If organization provided custom departments, map to the closest matching institutional department
  if (availableDepartments && availableDepartments.length > 0) {
    const matchedCustom = availableDepartments.find((d) =>
      d.toLowerCase().includes(department.toLowerCase()) ||
      department.toLowerCase().includes(d.toLowerCase())
    );
    if (matchedCustom) department = matchedCustom;
  }

  // Calculate ESI Triage Level
  const esiEvaluation = evaluateEsiTriage({
    presentation,
    observations,
    patientDemographics: demographics,
  });

  return { priority, department, rationale, esiEvaluation };
}

// ============================================================
// EMERGENCY SEVERITY INDEX (ESI v4) FIVE-TIER TRIAGE ENGINE
// Standardized triage algorithm according to AHRQ & ACEP guidelines.
// ============================================================

export type EsiLevel = 1 | 2 | 3 | 4 | 5;

export interface EsiTriageEvaluation {
  level: EsiLevel;
  levelName: string;
  badgeColor: string;
  rationale: string;
  isLifeSavingRequired: boolean;
  isHighRisk: boolean;
  anticipatedResources: 'MANY' | '>=2' | '1' | '0';
  dangerZoneTriggered?: boolean;
  bypassDiagnosticImaging?: boolean;
  aclsDirectives?: string[];
  recommendedActions: string[];
}

export interface EvaluateEsiInput {
  presentation: {
    title?: string;
    historyOfPresentIllness?: string;
    pastMedicalHistory?: string;
    physicalExamNotes?: string;
  };
  observations: Array<{
    code?: string;
    display?: string;
    value?: string;
    unit?: string;
    interpretation?: string;
  }>;
  patientDemographics?: PatientDemographicContext;
}

/**
 * Evaluates patient presentation, vital signs, and anticipated clinical resources
 * strictly against the official Emergency Severity Index (ESI) Flowchart.
 */
export function evaluateEsiTriage(input: EvaluateEsiInput): EsiTriageEvaluation {
  const { presentation, observations, patientDemographics } = input;
  const fullText = `${presentation.title || ''} ${presentation.historyOfPresentIllness || ''} ${presentation.pastMedicalHistory || ''} ${presentation.physicalExamNotes || ''}`.toLowerCase();

  // Extract vital signs from observations and free-text notes
  let sbp: number | undefined;
  let dbp: number | undefined;
  let hr: number | undefined;
  let rr: number | undefined;
  let spo2: number | undefined;
  let temp: number | undefined;

  // 1. Check structured observations
  for (const obs of observations) {
    const label = `${obs.display || ''} ${obs.code || ''}`.toLowerCase();
    const val = obs.value || '';
    const num = parseFloat(val.replace(/[^\d.\-]/g, ''));

    if (/(blood pressure|bp|systolic)/.test(label)) {
      const match = val.match(/(\d{2,3})\s*(?:\/|\s)\s*(\d{2,3})/);
      if (match) {
        sbp = parseInt(match[1], 10);
        dbp = parseInt(match[2], 10);
      } else if (!isNaN(num) && num > 30 && num < 300) {
        sbp = num;
      }
    } else if (/(heart rate|pulse|hr)/.test(label) && !isNaN(num)) {
      hr = num;
    } else if (/(respiratory rate|rr|resp rate|breaths)/.test(label) && !isNaN(num)) {
      rr = num;
    } else if (/(spo2|oxygen saturation|o2 sat)/.test(label) && !isNaN(num)) {
      spo2 = num;
    } else if (/(temperature|temp)/.test(label) && !isNaN(num)) {
      temp = num;
    }
  }

  // 2. Check free-text if not found in structured observations
  if (sbp === undefined) {
    const bpMatch = fullText.match(/\b(?:bp|blood pressure)[:\s]*(\d{2,3})\s*\/\s*(\d{2,3})/i);
    if (bpMatch) {
      sbp = parseInt(bpMatch[1], 10);
      dbp = parseInt(bpMatch[2], 10);
    }
  }
  if (hr === undefined) {
    const hrMatch = fullText.match(/\b(?:hr|heart rate|pulse)[:\s]*(\d{2,3})\b/i);
    if (hrMatch) hr = parseInt(hrMatch[1], 10);
  }
  if (rr === undefined) {
    const rrMatch = fullText.match(/\b(?:rr|resp(?:iratory)? rate)[:\s]*(\d{1,2})\b/i);
    if (rrMatch) rr = parseInt(rrMatch[1], 10);
  }
  if (spo2 === undefined) {
    const spo2Match = fullText.match(/\b(?:spo2|o2 sat(?:uration)?)[:\s]*(\d{2,3})%?/i);
    if (spo2Match) spo2 = parseInt(spo2Match[1], 10);
  }
  if (temp === undefined) {
    const tempMatch = fullText.match(/\b(?:t|temp(?:erature)?)[:\s]*(\d{2}(?:\.\d)?)\s*°?c\b/i);
    if (tempMatch) temp = parseFloat(tempMatch[1]);
  }

  const age = patientDemographics?.ageYears ?? calculateAgeInYears(patientDemographics?.dateOfBirth);

  // Detect catastrophic conditions / state of consciousness
  const isAgonal = /\b(agonal|apneic|apnea|gasping|gasping for breath|barely breathing)\b/i.test(fullText);
  const isUnresponsive = /\b(unresponsive|collapsed?|sudden collapse|unconscious|pulseless|asystole|ventricular fibrillation|vf arrest|cardiac arrest|resuscitation)\b/i.test(fullText);
  const isProfoundHypotension = sbp !== undefined && sbp < 70;
  const isProfoundHypoxia = spo2 !== undefined && spo2 < 80;
  const isCriticalBradypnea = rr !== undefined && rr <= 8;

  // ─────────────────────────────────────────────────────────────
  // DECISION POINT A: Requires Immediate Life-Saving Intervention? -> ESI 1
  // ─────────────────────────────────────────────────────────────
  if (
    isProfoundHypoxia ||
    isProfoundHypotension ||
    isCriticalBradypnea ||
    isAgonal ||
    (isUnresponsive && (sbp !== undefined ? sbp < 85 : true))
  ) {
    return {
      level: 1,
      levelName: 'ESI 1: Resuscitation',
      badgeColor: '#DC2626', // Red
      rationale:
        'Immediate life-saving intervention required: hemodynamic collapse or severe respiratory failure ' +
        `(SBP: ${sbp ?? 'critically low'}, SpO2: ${spo2 ?? 'critically low'}%, RR: ${rr ?? 'agonal/critical'}, status: ${isAgonal ? 'agonal respirations' : 'unresponsive/collapse'}).`,
      isLifeSavingRequired: true,
      isHighRisk: true,
      anticipatedResources: 'MANY',
      bypassDiagnosticImaging: true,
      aclsDirectives: [
        'Immediate High-Quality CPR & Continuous ECG Telemetry',
        'Direct Defibrillation Pathway for shockable rhythms (VF/pVT)',
        'Emergency Airway Management with Rapid Sequence Intubation',
        'IV/IO Access & Resuscitative Vasopressors (Epinephrine 1mg Q3-5min)',
        'Bedside Focused Cardiac & Pulmonary Ultrasound (POCUS / RUSH Protocol)',
      ],
      recommendedActions: [
        'Immediate Resuscitation Bay / Trauma-Arrest Bay transfer',
        'Airway management: bag-valve-mask (BVM) / immediate endotracheal intubation',
        'Initiate ACLS/PALS resuscitation protocol: CPR and immediate defibrillation for shockable rhythms (VF/pVT)',
        'Obtain large-bore IV/IO access x 2 and prepare vasopressors (Epinephrine 1mg IV/IO q3-5min)',
        'Bedside Point-of-Care Ultrasound (POCUS) to assess cardiac contractility, pericardial effusion, and pneumothorax',
        'Bypass delayed diagnostic imaging (HRCT/routine radiology) — prioritize acute stabilization',
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // DECISION POINT B: High-Risk Situation, Confused/Lethargic, or Severe Distress? -> ESI 2
  // ─────────────────────────────────────────────────────────────
  const isAcuteStroke = /\b(facial droop|slurred speech|hemiparesis|hemiplegia|left-sided weakness|right-sided weakness|arm drift|acute ischemic stroke|stroke)\b/i.test(fullText);
  const isAcuteCoronary = /\b(stemi|st elevation|crushing chest pain|substernal chest pain|unstable angina)\b/i.test(fullText);
  const isAlteredMental = /\b(altered mental|acute confusion|disoriented|lethargic|obtunded|stupor)\b/i.test(fullText);
  const isSevereDistress = /\b(severe distress|stridor|anaphylaxis|severe dyspnea|severe pain 10\/10|testicular torsion)\b/i.test(fullText);

  if (isAcuteStroke || isAcuteCoronary || isAlteredMental || isSevereDistress) {
    const trigger = isAcuteStroke
      ? 'acute focal neurological deficit (suspected acute ischemic stroke)'
      : isAcuteCoronary
      ? 'acute coronary syndrome / ischemic chest pain'
      : isAlteredMental
      ? 'altered mental status / acute confusion'
      : 'severe acute distress / high-risk clinical syndrome';

    return {
      level: 2,
      levelName: 'ESI 2: Emergent',
      badgeColor: '#EA580C', // Orange
      rationale: `Emergent high-risk presentation triggered by ${trigger}. Time-critical evaluation required.`,
      isLifeSavingRequired: false,
      isHighRisk: true,
      anticipatedResources: 'MANY',
      recommendedActions: isAcuteStroke
        ? [
            'Immediate Code Stroke activation — target door-to-imaging < 20-25 minutes',
            'Stat non-contrast head CT / CT angiogram to exclude hemorrhage and evaluate for LVO',
            'Point-of-care capillary blood glucose (to exclude hypoglycemia mimic)',
            'NIHSS stroke assessment and determine exact last known well timestamp',
            'Evaluate for IV thrombolysis (tPA / Tenecteplase) within 4.5h window or endovascular thrombectomy',
          ]
        : [
            'Stat bedside evaluation and continuous cardiac telemetry monitoring',
            'Stat 12-lead ECG within 10 minutes of presentation',
            'Large-bore IV access and stat emergency laboratory panel',
          ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // DECISION POINT C & D: Resource Anticipation & Danger Zone Vitals Check
  // ─────────────────────────────────────────────────────────────

  // Detect Zero Resources (ESI 5):
  // Medication refill, stitch removal, mild stable rash, non-urgent prescription request without acute symptoms
  const isMedicationRefill = /\b(medication refill|prescription refill|ran out of|routine refill|refill|blood pressure check|asymptomatic|stitch removal|suture removal)\b/i.test(fullText) &&
    !/\b(pain|shortness of breath|chest pain|fever|bleed|trauma|fracture|sprain|vomit)\b/i.test(fullText);

  if (isMedicationRefill) {
    return {
      level: 5,
      levelName: 'ESI 5: Non-Urgent',
      badgeColor: '#10B981', // Green
      rationale: 'Non-urgent clinical encounter requiring zero diagnostic or therapeutic hospital resources (physician examination / prescription refill only).',
      isLifeSavingRequired: false,
      isHighRisk: false,
      anticipatedResources: '0',
      recommendedActions: [
        'Outpatient medication reconciliation and prescription renewal',
        'Routine blood pressure re-check and primary care follow-up coordination',
      ],
    };
  }

  // Detect Single Resource (ESI 4):
  // Isolated extremities injury (ankle sprain, wrist sprain, simple laceration, simple cellulitis needing oral meds only, uncomplicated URI)
  const isSingleResource = /\b(ankle sprain|twisted ankle|wrist sprain|foot injury|finger injury|minor laceration|simple cut|suture|x-ray only|isolated limb)\b/i.test(fullText) ||
    (/\b(malleolus|swelling|bear weight|ottawa ankle)\b/i.test(fullText) && !/\b(abdominal|chest|fever|dyspnea|stroke|altered)\b/i.test(fullText));

  if (isSingleResource) {
    return {
      level: 4,
      levelName: 'ESI 4: Less Urgent',
      badgeColor: '#3B82F6', // Blue
      rationale: 'Stable clinical presentation anticipating exactly one diagnostic or therapeutic resource (e.g. plain radiography or simple wound care).',
      isLifeSavingRequired: false,
      isHighRisk: false,
      anticipatedResources: '1',
      recommendedActions: [
        'Apply Ottawa Ankle / Knee Rules to determine plain radiography necessity',
        'Targeted plain film X-ray of affected joint or extremity',
        'RICE therapy (Rest, Ice, Compression, Elevation) and supportive bracing/crutches as indicated',
      ],
    };
  }

  // Multi-Resource Case (ESI 3 or Danger-Zone upgraded to ESI 2):
  // Acute abdominal pain (appendicitis, cholecystitis, diverticulitis), complex infections, systemic symptoms
  // requiring >= 2 resources (e.g. IV access/fluids + labs + CT scan/ultrasound + surgical consult)
  
  // Danger Zone Limits Check:
  // Adult (> 8yo): HR > 100, RR > 20, SpO2 < 92%
  // Pediatric (3-8yo): HR > 140, RR > 30, SpO2 < 92%
  // Pediatric (1-3yo): HR > 160, RR > 40, SpO2 < 92%
  // Infant (<1yo): HR > 180, RR > 50, SpO2 < 92%
  let dangerZone = false;
  let dangerReason = '';

  const isPediatric = age !== undefined && age <= 8;
  const isInfant = age !== undefined && age < 1;

  if (spo2 !== undefined && spo2 < 92) {
    dangerZone = true;
    dangerReason = `Hypoxia with SpO2 ${spo2}% on room air (< 92%)`;
  } else if (isInfant) {
    if (hr !== undefined && hr > 180) { dangerZone = true; dangerReason = `Infant tachycardia HR ${hr} (> 180)`; }
    else if (rr !== undefined && rr > 50) { dangerZone = true; dangerReason = `Infant tachypnea RR ${rr} (> 50)`; }
  } else if (isPediatric) {
    if (hr !== undefined && hr > 140) { dangerZone = true; dangerReason = `Pediatric tachycardia HR ${hr} (> 140)`; }
    else if (rr !== undefined && rr > 30) { dangerZone = true; dangerReason = `Pediatric tachypnea RR ${rr} (> 30)`; }
  } else {
    // Adult / Older Child
    if (hr !== undefined && hr > 100) { dangerZone = true; dangerReason = `Adult tachycardia HR ${hr} bpm (> 100)`; }
    else if (rr !== undefined && rr > 20) { dangerZone = true; dangerReason = `Adult tachypnea RR ${rr} breaths/min (> 20)`; }
  }

  if (dangerZone) {
    return {
      level: 2,
      levelName: 'ESI 2: Emergent (Danger Zone Upgrade)',
      badgeColor: '#EA580C',
      rationale: `Vital sign danger zone threshold breached (${dangerReason}). Upgraded from ESI 3 to ESI 2 per clinical triage protocol.`,
      isLifeSavingRequired: false,
      isHighRisk: true,
      anticipatedResources: '>=2',
      dangerZoneTriggered: true,
      recommendedActions: [
        'Urgent physician evaluation and immediate vital signs re-assessment',
        'Continuous pulse oximetry and hemodynamic monitoring',
        'Stat laboratory and imaging workup with active resuscitation readiness',
      ],
    };
  }

  // Stable ESI 3:
  return {
    level: 3,
    levelName: 'ESI 3: Urgent',
    badgeColor: '#EAB308', // Amber/Yellow
    rationale: 'Urgent evaluation anticipating ≥ 2 diagnostic/therapeutic resources (e.g., IV access/labs, diagnostic imaging, specialist consultation); hemodynamically stable within normal vital limits.',
    isLifeSavingRequired: false,
    isHighRisk: false,
    anticipatedResources: '>=2',
    dangerZoneTriggered: false,
    recommendedActions: [
      'Establish peripheral IV access and draw targeted diagnostic laboratory panel',
      'Order indicated diagnostic imaging (e.g. Abdominal Ultrasound / CT for acute abdominal pain)',
      'Administer analgesia and antiemetics as clinically indicated',
      'Maintain serial vital sign surveillance to monitor for danger-zone decompensation',
    ],
  };
}

/**
 * Parses freeform clinical lists (past medical history, symptoms, physical signs)
 * delimited by commas, semicolons, periods/full-stops, newlines, or numbered/bullet lists.
 * E.g. "Hypertension, T2DM. Prior MI; Asthma\nCKD" -> ['Hypertension', 'T2DM', 'Prior MI', 'Asthma', 'CKD']
 */
export function parseDelimitedList(text?: string | null): string[] {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Split on commas, semicolons, newlines, or periods followed by space/line end
  const rawParts = trimmed.split(/[,;\n\r]+|\.(?:\s+|$)/);

  const cleaned = rawParts
    .map((item) =>
      item
        .trim()
        .replace(/^[-*•\d+.)]\s*/, '') // strip bullets/numbering like "1. ", "- ", "* "
        .replace(/^[–—]\s*/, '')
        .trim()
    )
    .filter((item) => item.length > 1 && !/^(and|or|with|the)$/i.test(item));

  // If punctuation didn't match and we only have 1 large chunk, check if multiple lines or double spaces exist
  if (cleaned.length <= 1 && trimmed.includes('  ')) {
    return trimmed
      .split(/\s{2,}/)
      .map((i) => i.trim())
      .filter((i) => i.length > 1);
  }

  return cleaned.length > 0 ? cleaned : [trimmed];
}

