// ============================================================
// src/features/cases/services/clinical-knowledge.ts
// Clinical Knowledge Base for Automated Reference Ranges,
// Test Value Interpretation, and Intelligent Triage Routing.
// ============================================================

export interface ClinicalEvaluationResult {
  referenceRange: string;
  unit: string;
  interpretation: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
  isRecognized: boolean;
}

interface TestRule {
  pattern: RegExp;
  canonicalName: string;
  defaultUnit: string;
  referenceRange: string;
  evaluate: (valueStr: string) => {
    interpretation: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL';
    detectedUnit?: string;
  };
}

const CLINICAL_TEST_RULES: TestRule[] = [
  // ── VITAL SIGNS ──────────────────────────────────────────────
  {
    pattern: /(?:blood\s*pressure|bp|systolic|diastolic)/i,
    canonicalName: 'Blood Pressure',
    defaultUnit: 'mmHg',
    referenceRange: '90/60 - 120/80',
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
    pattern: /(?:heart\s*rate|pulse|hr|bpm)/i,
    canonicalName: 'Heart Rate',
    defaultUnit: 'bpm',
    referenceRange: '60 - 100',
    evaluate: (val) => {
      const num = parseFloat(val);
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
    referenceRange: '36.5 - 37.5',
    evaluate: (val) => {
      let num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      // Convert Fahrenheit if > 45
      if (num > 45) {
        num = (num - 32) * (5 / 9);
      }
      if (num >= 39.5 || num < 35.0) return { interpretation: 'CRITICAL' };
      if (num >= 38.0) return { interpretation: 'HIGH' };
      if (num < 36.0) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:sp\s*o2|oxygen\s*sat(?:uration)?|o2\s*sat)/i,
    canonicalName: 'Oxygen Saturation (SpO2)',
    defaultUnit: '%',
    referenceRange: '95 - 100',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num < 90) return { interpretation: 'CRITICAL' };
      if (num < 95) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:respiratory\s*rate|resp\s*rate|rr)/i,
    canonicalName: 'Respiratory Rate',
    defaultUnit: 'breaths/min',
    referenceRange: '12 - 20',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 30 || num < 8) return { interpretation: 'CRITICAL' };
      if (num > 20) return { interpretation: 'HIGH' };
      if (num < 12) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },

  // ── BIOCHEMISTRY & INFLAMMATORY MARKERS ──────────────────────
  {
    pattern: /(?:c-reactive\s*protein|crp|c\s*reactive)/i,
    canonicalName: 'C-Reactive Protein',
    defaultUnit: 'mg/L',
    referenceRange: '< 5.0',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 100) return { interpretation: 'CRITICAL' };
      if (num > 5.0) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:d-dimer|dimer)/i,
    canonicalName: 'D-Dimer',
    defaultUnit: 'ng/mL',
    referenceRange: '< 500',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 1500) return { interpretation: 'CRITICAL' };
      if (num > 500) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:troponin(?:\s*[it])?|ctni|ctnt)/i,
    canonicalName: 'Troponin',
    defaultUnit: 'ng/mL',
    referenceRange: '< 0.04',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 0.1) return { interpretation: 'CRITICAL' };
      if (num > 0.04) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:potassium|k\+)/i,
    canonicalName: 'Potassium (K+)',
    defaultUnit: 'mmol/L',
    referenceRange: '3.5 - 5.0',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 6.0 || num <= 2.8) return { interpretation: 'CRITICAL' };
      if (num > 5.0) return { interpretation: 'HIGH' };
      if (num < 3.5) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:sodium|na\+)/i,
    canonicalName: 'Sodium (Na+)',
    defaultUnit: 'mmol/L',
    referenceRange: '135 - 145',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 155 || num <= 125) return { interpretation: 'CRITICAL' };
      if (num > 145) return { interpretation: 'HIGH' };
      if (num < 135) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:creatinine|cr|serum\s*creatinine)/i,
    canonicalName: 'Serum Creatinine',
    defaultUnit: 'mg/dL',
    referenceRange: '0.7 - 1.3',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 3.0) return { interpretation: 'CRITICAL' };
      if (num > 1.3) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:glucose|blood\s*sugar|fbg|rbs)/i,
    canonicalName: 'Blood Glucose',
    defaultUnit: 'mg/dL',
    referenceRange: '70 - 100',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 300 || num <= 50) return { interpretation: 'CRITICAL' };
      if (num > 140) return { interpretation: 'HIGH' };
      if (num < 70) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },

  // ── HEMATOLOGY ───────────────────────────────────────────────
  {
    pattern: /(?:ha?emoglobin|hgb|hb)/i,
    canonicalName: 'Haemoglobin (Hb)',
    defaultUnit: 'g/dL',
    referenceRange: '12.0 - 17.5',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num < 7.0 || num > 20.0) return { interpretation: 'CRITICAL' };
      if (num < 12.0) return { interpretation: 'LOW' };
      if (num > 17.5) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:white\s*blood|wbc|leukocyte)/i,
    canonicalName: 'White Blood Cell Count (WBC)',
    defaultUnit: '×10⁹/L',
    referenceRange: '4.0 - 11.0',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num >= 20.0 || num < 2.0) return { interpretation: 'CRITICAL' };
      if (num > 11.0) return { interpretation: 'HIGH' };
      if (num < 4.0) return { interpretation: 'LOW' };
      return { interpretation: 'NORMAL' };
    },
  },
  {
    pattern: /(?:platelet|plt)/i,
    canonicalName: 'Platelet Count',
    defaultUnit: '×10⁹/L',
    referenceRange: '150 - 450',
    evaluate: (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return { interpretation: 'NORMAL' };
      if (num < 50) return { interpretation: 'CRITICAL' };
      if (num < 150) return { interpretation: 'LOW' };
      if (num > 450) return { interpretation: 'HIGH' };
      return { interpretation: 'NORMAL' };
    },
  },

  // ── MICROBIOLOGY & CULTURES ──────────────────────────────────
  {
    pattern: /(?:blood\s*culture|culture|bld-cult|urine\s*culture)/i,
    canonicalName: 'Cultures & Microbiology',
    defaultUnit: '',
    referenceRange: 'Negative / No growth',
    evaluate: (val) => {
      const lower = val.toLowerCase();
      if (
        lower.includes('positive') ||
        lower.includes('pos ') ||
        lower.includes('pos/') ||
        lower.includes('growth') ||
        lower.includes('strep') ||
        lower.includes('staph') ||
        lower.includes('bacter') ||
        lower.includes('organisms')
      ) {
        return { interpretation: 'CRITICAL' };
      }
      if (lower.includes('negative') || lower.includes('no growth') || lower.includes('clear')) {
        return { interpretation: 'NORMAL' };
      }
      return { interpretation: 'ABNORMAL' };
    },
  },

  // ── IMAGING & CARDIAC STUDIES ────────────────────────────────
  {
    pattern: /(?:tee|echo|echocardiogram|ultrasound|ct|mri|x-ray|radiology)/i,
    canonicalName: 'Diagnostic Imaging / Echo',
    defaultUnit: '',
    referenceRange: 'Normal morphology',
    evaluate: (val) => {
      const lower = val.toLowerCase();
      if (
        lower.includes('vegetation') ||
        lower.includes('embolism') ||
        lower.includes('infarct') ||
        lower.includes('stenosis') ||
        lower.includes('regurgitation') ||
        lower.includes('thrombus') ||
        lower.includes('effusion') ||
        lower.includes('hemorrhage')
      ) {
        return { interpretation: 'CRITICAL' };
      }
      if (lower.includes('normal') || lower.includes('unremarkable') || lower.includes('intact')) {
        return { interpretation: 'NORMAL' };
      }
      return { interpretation: 'ABNORMAL' };
    },
  },
];

/**
 * Automatically evaluates a test name and value to determine:
 * 1. The standard reference range
 * 2. Standard clinical units
 * 3. Interpretation (NORMAL, HIGH, LOW, CRITICAL, ABNORMAL)
 */
export function evaluateClinicalObservation(
  name: string,
  value: string,
  existingRange?: string,
  existingInterpretation?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'ABNORMAL'
): ClinicalEvaluationResult {
  const trimmedName = (name || '').trim();
  const trimmedValue = (value || '').trim();

  // If no name entered yet
  if (!trimmedName) {
    return {
      referenceRange: existingRange || '',
      unit: '',
      interpretation: existingInterpretation || 'NORMAL',
      isRecognized: false,
    };
  }

  // Find matching rule
  const matchedRule = CLINICAL_TEST_RULES.find((rule) => rule.pattern.test(trimmedName));

  if (matchedRule) {
    const evalResult = trimmedValue
      ? matchedRule.evaluate(trimmedValue)
      : { interpretation: existingInterpretation || 'NORMAL' };

    return {
      referenceRange: matchedRule.referenceRange,
      unit: evalResult.detectedUnit || matchedRule.defaultUnit,
      interpretation: evalResult.interpretation,
      isRecognized: true,
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
    unit: '',
    interpretation: fallbackInterp,
    isRecognized: false,
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
