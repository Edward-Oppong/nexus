// ============================================================
// src/features/cases/services/clinical-knowledge.ts
// Clinical Knowledge Base for Automated Reference Ranges,
// Test Value Interpretation, Unit Selection, and Triage Routing.
// v2.0 — unit-aware, subscript/superscript aware
// ============================================================

export interface ClinicalEvaluationResult {
  referenceRange: string;
  unit: string;
  interpretation: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
  isRecognized: boolean;
  unitOptions: string[];
}

interface UnitConfig {
  label: string;       // display label in the dropdown
  referenceRange: string;
  evaluate: (num: number) => 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
}

interface TestRule {
  pattern: RegExp;
  canonicalName: string;
  defaultUnit: string;
  referenceRange: string;
  /** Available units for this test, with per-unit thresholds */
  units: Record<string, UnitConfig>;
  evaluate: (valueStr: string, selectedUnit?: string) => {
    interpretation: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
    detectedUnit?: string;
  };
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
    evaluate: (val) => {
      const match = val.match(/(\d{2,3})\s*(?:\/|\s)\s*(\d{2,3})/);
      if (!match) return { interpretation: 'NORMAL' };
      const sys = parseInt(match[1], 10);
      const dia = parseInt(match[2], 10);
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
    evaluate: (val) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
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
    evaluate: (val) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
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
    evaluate: (val, sel) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (sel === 'µmol/L' || sel === 'umol/L') {
        if (num >= 265) return { interpretation: 'CRITICAL' };
        if (num > 115)  return { interpretation: 'HIGH' };
        if (num < 44)   return { interpretation: 'LOW' };
        return { interpretation: 'NORMAL' };
      }
      // mg/dL (default)
      if (num >= 3.0) return { interpretation: 'CRITICAL' };
      if (num > 1.3)  return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
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
    evaluate: (val, sel) => {
      const num = parseNum(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (sel === 'g/L') {
        if (num < 70 || num > 200) return { interpretation: 'CRITICAL' };
        if (num < 120) return { interpretation: 'LOW' };
        if (num > 175) return { interpretation: 'HIGH' };
        return { interpretation: 'NORMAL' };
      }
      if (num < 7.0 || num > 20.0) return { interpretation: 'CRITICAL' };
      if (num < 12.0) return { interpretation: 'LOW' };
      if (num > 17.5) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
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
 * Automatically evaluates a test name and value to determine:
 * 1. The standard reference range (unit-aware)
 * 2. Standard clinical units
 * 3. Interpretation (NORMAL, HIGH, LOW, CRITICAL, ABNORMAL)
 *
 * Pass selectedUnit to get unit-specific reference ranges and thresholds.
 * E.g. evaluateClinicalObservation('Glucose', '6.2', undefined, undefined, 'mmol/L')
 * correctly returns interpretation: 'NORMAL' and referenceRange: '3.9 – 5.6'
 */
export function evaluateClinicalObservation(
  name: string,
  value: string,
  existingRange?: string,
  existingInterpretation?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL',
  selectedUnit?: string
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
    const refRange = unitCfg?.referenceRange ?? matchedRule.referenceRange;

    const evalResult = trimmedValue
      ? matchedRule.evaluate(trimmedValue, effectiveUnit)
      : { interpretation: existingInterpretation || ('NORMAL' as const) };

    return {
      referenceRange: refRange,
      unit: effectiveUnit,
      interpretation: evalResult.interpretation,
      isRecognized: true,
      unitOptions,
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
 * presentation text, chief complaints, and discrete observations.
 */
export function inferCaseTriage(
  presentation: { title?: string; historyOfPresentIllness?: string },
  observations: Array<{ display: string; value: string; interpretation?: string }>
): {
  priority: 'ROUTINE' | 'HIGH' | 'URGENT';
  department: string;
  rationale: string;
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

  // Department routing inference
  let department = 'Internal Medicine / Acute Admissions';

  if (/(cardio|heart|murmur|chest pain|valve|vegetation|troponin|arrhythmia|bicuspid|stemi|nstemi|angina)/.test(fullText)) {
    if (/(infect|fever|culture|endocarditis)/.test(fullText)) {
      department = 'Cardiology / Infectious Disease Inpatient Consult';
    } else {
      department = 'Internal Medicine / Cardiology Consult';
    }
  } else if (/(pulmon|lung|breath|dyspnea|embolism|pleuritic|respiratory|pneumonia|spO2|hypoxia)/.test(fullText)) {
    department = 'Emergency Department / Acute Pulmonology';
  } else if (/(infect|fever|pyrexia|culture|sepsis|endocarditis|bacteremia|strep|staph|abscess)/.test(fullText)) {
    department = 'Infectious Disease / Inpatient Consult';
  } else if (/(neuro|stroke|seizure|syncope|headache|weakness|numbness|paralysis)/.test(fullText)) {
    department = 'Neurology / Acute Stroke Service';
  } else if (/(gastro|abdominal|vomiting|diarrhea|liver|jaundice|bleed)/.test(fullText)) {
    department = 'Gastroenterology / Acute Consult';
  } else if (/(renal|kidney|creatinine|dialysis|electrolyte|potassium|hyperkalemia)/.test(fullText)) {
    department = 'Nephrology / Renal Medicine';
  }

  return { priority, department, rationale };
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

