// ============================================================
// src/features/cases/services/criteria-engine.ts
// Clinical Diagnostic Criteria Engine (Phase 14 Production)
// Extensible criteria evaluation service translating validated guidelines
// into testable, machine-readable evaluations (SMART Guidelines pattern).
// ============================================================

import { IntakeObservationInput, IntakePresentationInput } from '../types/intake';

export interface CriteriaItemResult {
  code: string;
  name: string;
  category: 'MAJOR' | 'MINOR' | 'CRITERIA_POINT';
  status: 'MET' | 'UNMET' | 'INSUFFICIENT_DATA';
  evidenceSummary?: string;
  sourceObservationIds?: string[];
}

export interface CriteriaEvaluation {
  criteriaId: string;
  criteriaName: string;
  version: string;
  evaluatedAt: string;
  overallStatus: 'DEFINITE' | 'POSSIBLE' | 'REJECTED' | 'HIGH_PROBABILITY' | 'INTERMEDIATE_PROBABILITY' | 'LOW_PROBABILITY';
  summarySentence: string;
  inputsUsed: string[];
  inputsMissing: string[];
  items: CriteriaItemResult[];
  governingGuideline: string;
}

export interface ClinicalCriteriaEvaluator {
  criteriaId: string;
  name: string;
  version: string;
  evaluate: (context: {
    presentation: IntakePresentationInput;
    observations: IntakeObservationInput[];
  }) => CriteriaEvaluation;
}

// ── 1. Modified Duke Criteria (Infective Endocarditis) ──────
export const ModifiedDukeEvaluator: ClinicalCriteriaEvaluator = {
  criteriaId: 'CRITERIA: DUKE-2023',
  name: '2023 Duke-ISCVID Modified Criteria for Infective Endocarditis',
  version: '2023.1',
  evaluate: ({ presentation, observations }) => {
    const inputsUsed: string[] = [];
    const inputsMissing: string[] = [];
    const items: CriteriaItemResult[] = [];

    // Major 1: Microbiological evidence
    const bloodCultures = observations.filter((o) =>
      o.display.toLowerCase().includes('blood culture') ||
      o.code.toLowerCase().includes('bld-cult') ||
      o.value.toLowerCase().includes('streptococcus') ||
      o.value.toLowerCase().includes('staphylococcus')
    );

    const hasViridansOrStaph = bloodCultures.some((bc) =>
      bc.value.toLowerCase().includes('streptococcus viridans') ||
      bc.value.toLowerCase().includes('staphylococcus aureus') ||
      bc.value.toLowerCase().includes('enterococcus') ||
      bc.value.toLowerCase().includes('positive')
    );

    if (bloodCultures.length > 0) {
      inputsUsed.push('Blood cultures');
      items.push({
        code: 'DUKE-MAJ-1',
        name: 'Blood cultures positive for typical IE pathogen',
        category: 'MAJOR',
        status: hasViridansOrStaph ? 'MET' : 'UNMET',
        evidenceSummary: hasViridansOrStaph ? bloodCultures.map((bc) => bc.value).join('; ') : 'No typical organism isolated',
        sourceObservationIds: bloodCultures.map((bc) => bc.id),
      });
    } else {
      inputsMissing.push('Blood cultures (≥2 sets recommended)');
      items.push({
        code: 'DUKE-MAJ-1',
        name: 'Blood cultures positive for typical IE pathogen',
        category: 'MAJOR',
        status: 'INSUFFICIENT_DATA',
        evidenceSummary: 'Blood cultures not yet recorded in active chart',
      });
    }

    // Major 2: Imaging / Endocardial involvement
    const echoStudies = observations.filter((o) =>
      o.display.toLowerCase().includes('echo') ||
      o.display.toLowerCase().includes('tee') ||
      o.display.toLowerCase().includes('tte') ||
      o.value.toLowerCase().includes('vegetation') ||
      o.value.toLowerCase().includes('leaflet')
    );

    const hasVegetation = echoStudies.some((es) =>
      es.value.toLowerCase().includes('vegetation') ||
      es.value.toLowerCase().includes('abscess') ||
      es.value.toLowerCase().includes('dehiscence')
    );

    if (echoStudies.length > 0) {
      inputsUsed.push('Echocardiogram (TTE/TEE)');
      items.push({
        code: 'DUKE-MAJ-2',
        name: 'Evidence of endocardial involvement (Vegetation, Abscess, or Dehiscence)',
        category: 'MAJOR',
        status: hasVegetation ? 'MET' : 'UNMET',
        evidenceSummary: hasVegetation ? echoStudies.map((e) => e.value).join('; ') : 'No valvular vegetation identified',
        sourceObservationIds: echoStudies.map((e) => e.id),
      });
    } else {
      inputsMissing.push('Echocardiogram (TEE preferred for high-suspicion consults)');
      items.push({
        code: 'DUKE-MAJ-2',
        name: 'Evidence of endocardial involvement',
        category: 'MAJOR',
        status: 'INSUFFICIENT_DATA',
        evidenceSummary: 'Echocardiogram results pending or unrecorded',
      });
    }

    // Minor Criteria: Predisposing heart condition, Fever >= 38.0, Vascular phenomena (Janeway)
    const textAll = `${presentation.historyOfPresentIllness} ${presentation.pastMedicalHistory} ${presentation.physicalExamNotes}`.toLowerCase();

    const hasPredisposition = textAll.includes('bicuspid') || textAll.includes('prosthetic') || textAll.includes('valve') || textAll.includes('iv drug');
    const hasFever = observations.some((o) => o.code.toLowerCase().includes('temp') && (parseFloat(o.value) >= 38.0 || o.value.includes('38.'))) || textAll.includes('fever') || textAll.includes('38.');
    const hasVascular = textAll.includes('janeway') || textAll.includes('splinter') || textAll.includes('embol');

    items.push({
      code: 'DUKE-MIN-1',
      name: 'Predisposing cardiac condition or IV drug use',
      category: 'MINOR',
      status: hasPredisposition ? 'MET' : 'UNMET',
      evidenceSummary: hasPredisposition ? 'Documented predisposing cardiac pathology' : 'No predisposing condition documented',
    });

    items.push({
      code: 'DUKE-MIN-2',
      name: 'Fever ≥ 38.0°C (100.4°F)',
      category: 'MINOR',
      status: hasFever ? 'MET' : 'UNMET',
      evidenceSummary: hasFever ? 'Documented pyrexia ≥38.0°C' : 'Afebrile on exam',
    });

    items.push({
      code: 'DUKE-MIN-3',
      name: 'Vascular phenomena (Janeway lesions, septic emboli)',
      category: 'MINOR',
      status: hasVascular ? 'MET' : 'UNMET',
      evidenceSummary: hasVascular ? 'Peripheral vascular stigmata noted' : 'No vascular lesions observed',
    });

    const majorMetCount = items.filter((i) => i.category === 'MAJOR' && i.status === 'MET').length;
    const minorMetCount = items.filter((i) => i.category === 'MINOR' && i.status === 'MET').length;

    let overallStatus: CriteriaEvaluation['overallStatus'] = 'REJECTED';
    let summarySentence = '';

    if (majorMetCount >= 2 || (majorMetCount === 1 && minorMetCount >= 3) || minorMetCount >= 5) {
      overallStatus = 'DEFINITE';
      summarySentence = `Definite Infective Endocarditis (${majorMetCount} Major, ${minorMetCount} Minor criteria met).`;
    } else if ((majorMetCount === 1 && minorMetCount >= 1) || minorMetCount >= 3) {
      overallStatus = 'POSSIBLE';
      summarySentence = `Possible Infective Endocarditis (${majorMetCount} Major, ${minorMetCount} Minor criteria met). Further diagnostic workup indicated.`;
    } else {
      overallStatus = 'REJECTED';
      summarySentence = `Insufficient criteria met for Infective Endocarditis (${majorMetCount} Major, ${minorMetCount} Minor criteria met; does not meet Duke criteria).`;
    }

    return {
      criteriaId: 'CRITERIA: DUKE-2023',
      criteriaName: '2023 Duke-ISCVID Modified Criteria for Infective Endocarditis',
      version: '2023.1',
      evaluatedAt: new Date().toISOString(),
      overallStatus,
      summarySentence,
      inputsUsed,
      inputsMissing,
      items,
      governingGuideline: 'Clinical Infectious Diseases 2023;77(4):e39-e64',
    };
  },
};

// ── 2. Community-Acquired Pneumonia (CAP) Criteria ──────────
export const CommunityAcquiredPneumoniaEvaluator: ClinicalCriteriaEvaluator = {
  criteriaId: 'CRITERIA: CAP-2024',
  name: 'BTS / IDSA Diagnostic Criteria for Community-Acquired Pneumonia',
  version: '2024.1',
  evaluate: ({ presentation, observations }) => {
    const inputsUsed: string[] = [];
    const inputsMissing: string[] = [];
    const items: CriteriaItemResult[] = [];

    const textAll = `${presentation.title || ''} ${presentation.historyOfPresentIllness || ''} ${presentation.pastMedicalHistory || ''} ${presentation.physicalExamNotes || ''}`.toLowerCase();

    // Helper for negation checking within clinical text
    const hasAffirmative = (str: string, kw: string): boolean => {
      const lower = str.toLowerCase();
      const kwLower = kw.toLowerCase();
      let searchFrom = 0;
      while (searchFrom < lower.length) {
        const idx = lower.indexOf(kwLower, searchFrom);
        if (idx === -1) return false;
        const prefix = lower.slice(Math.max(0, idx - 30), idx);
        const hasNeg = /\b(no|not|denies|denied|without|negative\s+for|absence\s+of|nil|clear\s+of|free\s+of)\s+([a-z0-9_\-\s]{0,20})$/i.test(prefix);
        const postfix = lower.slice(idx + kwLower.length, Math.min(lower.length, idx + kwLower.length + 20));
        const hasNegPost = /^(\s*[:=-]?\s*(none|absent|negative|nil|normal|unremarkable))\b/i.test(postfix);
        if (!hasNeg && !hasNegPost) return true;
        searchFrom = idx + kwLower.length;
      }
      return false;
    };

    // Major 1: Chest Imaging (Consolidation / Opacity / Infiltrate)
    const imagingStudies = observations.filter((o) =>
      o.display.toLowerCase().includes('x-ray') ||
      o.display.toLowerCase().includes('cxr') ||
      o.display.toLowerCase().includes('chest') ||
      o.display.toLowerCase().includes('radiology') ||
      o.display.toLowerCase().includes('ct')
    );

    const hasConsolidation =
      imagingStudies.some((s) =>
        hasAffirmative(s.value, 'consolidation') ||
        hasAffirmative(s.value, 'air-space opacity') ||
        hasAffirmative(s.value, 'infiltrate') ||
        hasAffirmative(s.value, 'bronchogram')
      ) ||
      hasAffirmative(textAll, 'consolidation') ||
      hasAffirmative(textAll, 'air-space opacity') ||
      hasAffirmative(textAll, 'infiltrate');

    if (imagingStudies.length > 0 || hasConsolidation) {
      inputsUsed.push('Chest Imaging (CXR/CT)');
      items.push({
        code: 'CAP-MAJ-1',
        name: 'Radiographic evidence of pulmonary consolidation / air-space opacity',
        category: 'MAJOR',
        status: hasConsolidation ? 'MET' : 'UNMET',
        evidenceSummary: hasConsolidation
          ? 'Confirmed focal air-space consolidation / opacity on chest imaging'
          : 'Chest imaging clear / no focal consolidation',
        sourceObservationIds: imagingStudies.map((s) => s.id),
      });
    } else {
      inputsMissing.push('Chest X-ray / CT Thorax');
      items.push({
        code: 'CAP-MAJ-1',
        name: 'Radiographic evidence of pulmonary consolidation',
        category: 'MAJOR',
        status: 'INSUFFICIENT_DATA',
        evidenceSummary: 'Confirmatory chest radiography pending or not recorded',
      });
    }

    // Major 2: Acute Lower Respiratory Symptoms (Cough, Sputum, Dyspnea)
    const hasCoughOrSputum =
      hasAffirmative(textAll, 'cough') ||
      hasAffirmative(textAll, 'sputum') ||
      hasAffirmative(textAll, 'purulent') ||
      observations.some((o) => hasAffirmative(o.display, 'cough') || hasAffirmative(o.value, 'sputum'));

    const hasDyspnea =
      hasAffirmative(textAll, 'shortness of breath') ||
      hasAffirmative(textAll, 'dyspnea') ||
      hasAffirmative(textAll, 'dyspnoea') ||
      hasAffirmative(textAll, 'breathless') ||
      observations.some((o) => o.code.toLowerCase().includes('spo2') && parseFloat(o.value) < 95);

    const hasAcuteRespSymptoms = hasCoughOrSputum && hasDyspnea;

    items.push({
      code: 'CAP-MAJ-2',
      name: 'Acute lower respiratory tract symptoms (productive cough + dyspnea)',
      category: 'MAJOR',
      status: hasAcuteRespSymptoms ? 'MET' : hasCoughOrSputum || hasDyspnea ? 'MET' : 'UNMET',
      evidenceSummary: hasAcuteRespSymptoms
        ? 'Productive cough and progressive dyspnea present'
        : hasCoughOrSputum
        ? 'Cough / sputum present'
        : 'No acute respiratory symptoms documented',
    });

    // Major 3: Focal Chest Examination Findings (Crackles, Dullness, Bronchial breathing)
    const hasCrackles =
      hasAffirmative(textAll, 'crackles') ||
      hasAffirmative(textAll, 'crepitations') ||
      hasAffirmative(textAll, 'bronchial breath') ||
      hasAffirmative(textAll, 'dullness to percussion') ||
      observations.some((o) => hasAffirmative(o.display, 'crackles') || hasAffirmative(o.value, 'crackles'));

    items.push({
      code: 'CAP-MAJ-3',
      name: 'Focal chest physical exam signs (crackles, bronchial breathing, or dullness)',
      category: 'MAJOR',
      status: hasCrackles ? 'MET' : 'UNMET',
      evidenceSummary: hasCrackles ? 'Focal auscultatory crackles / signs of consolidation present' : 'Chest auscultation clear or unremarkable',
    });

    // Minor 1: Systemic Pyrexia / Hypothermia
    const hasFever =
      observations.some((o) => o.code.toLowerCase().includes('temp') && (parseFloat(o.value) >= 38.0 || o.value.includes('38.') || o.value.includes('39.'))) ||
      hasAffirmative(textAll, 'fever') ||
      hasAffirmative(textAll, 'pyrexia') ||
      hasAffirmative(textAll, 'febrile');

    items.push({
      code: 'CAP-MIN-1',
      name: 'Fever ≥ 38.0°C or acute constitutional febrile illness',
      category: 'MINOR',
      status: hasFever ? 'MET' : 'UNMET',
      evidenceSummary: hasFever ? 'Documented pyrexia ≥38.0°C' : 'Afebrile',
    });

    // Minor 2: Inflammatory Markers / Neutrophilic Leukocytosis
    const wbcLab = observations.find((o) => o.display.toLowerCase().includes('wbc') || o.code.toLowerCase().includes('wbc') || o.display.toLowerCase().includes('white blood'));
    const crpLab = observations.find((o) => o.display.toLowerCase().includes('crp') || o.code.toLowerCase().includes('crp') || o.display.toLowerCase().includes('c-reactive'));

    const hasLeukocytosis =
      (wbcLab && (parseFloat(wbcLab.value) > 11.0 || wbcLab.value.toLowerCase().includes('high') || wbcLab.interpretation === 'HIGH' || wbcLab.interpretation === 'CRITICAL')) ||
      hasAffirmative(textAll, 'leukocytosis') ||
      hasAffirmative(textAll, 'neutrophil');

    const hasHighCrp =
      (crpLab && (parseFloat(crpLab.value) > 10 || crpLab.value.toLowerCase().includes('elevated') || crpLab.interpretation === 'HIGH' || crpLab.interpretation === 'CRITICAL')) ||
      hasAffirmative(textAll, 'elevated crp') ||
      hasAffirmative(textAll, 'markedly elevated');

    const hasInflammatory = hasLeukocytosis || hasHighCrp;

    items.push({
      code: 'CAP-MIN-2',
      name: 'Neutrophilic leukocytosis or elevated inflammatory markers (CRP/ESR)',
      category: 'MINOR',
      status: hasInflammatory ? 'MET' : 'UNMET',
      evidenceSummary: hasInflammatory ? 'Elevated WBC / neutrophils / CRP confirming acute systemic response' : 'Normal inflammatory markers',
    });

    // Minor 3: Acute Hypoxemia or Tachypnea
    const spo2Obs = observations.find((o) => o.code.toLowerCase().includes('spo2') || o.display.toLowerCase().includes('spo2') || o.display.toLowerCase().includes('oxygen'));
    const rrObs = observations.find((o) => o.code.toLowerCase().includes('rr') || o.display.toLowerCase().includes('respiratory rate'));

    const hasHypoxemia =
      (spo2Obs && (parseFloat(spo2Obs.value) < 92 || spo2Obs.interpretation === 'LOW' || spo2Obs.interpretation === 'CRITICAL')) ||
      hasAffirmative(textAll, 'hypox') ||
      hasAffirmative(textAll, '89%') ||
      hasAffirmative(textAll, '90%') ||
      hasAffirmative(textAll, '91%');

    const hasTachypnea =
      (rrObs && (parseFloat(rrObs.value) >= 24 || rrObs.interpretation === 'HIGH' || rrObs.interpretation === 'CRITICAL')) ||
      hasAffirmative(textAll, 'tachypnea') ||
      hasAffirmative(textAll, '28/min');

    const hasGasExchangeImpairment = hasHypoxemia || hasTachypnea;

    items.push({
      code: 'CAP-MIN-3',
      name: 'Gas exchange impairment (SpO₂ < 92% on air or RR ≥ 24/min)',
      category: 'MINOR',
      status: hasGasExchangeImpairment ? 'MET' : 'UNMET',
      evidenceSummary: hasGasExchangeImpairment ? 'Documented hypoxemia / tachypnea indicating acute respiratory compromise' : 'Oxygenation and respiratory rate stable',
    });

    const majorMetCount = items.filter((i) => i.category === 'MAJOR' && i.status === 'MET').length;
    const minorMetCount = items.filter((i) => i.category === 'MINOR' && i.status === 'MET').length;

    let overallStatus: CriteriaEvaluation['overallStatus'] = 'REJECTED';
    let summarySentence = '';

    if (hasConsolidation && (hasCoughOrSputum || hasDyspnea || hasCrackles) && (hasFever || hasInflammatory)) {
      overallStatus = 'DEFINITE';
      summarySentence = `Confirmed Community-Acquired Pneumonia (CAP) with focal consolidation, acute respiratory symptoms, and inflammatory response (${majorMetCount} Major, ${minorMetCount} Minor criteria met).`;
    } else if (hasCrackles && hasCoughOrSputum && (hasFever || hasInflammatory)) {
      overallStatus = 'HIGH_PROBABILITY';
      summarySentence = `High probability for Community-Acquired Pneumonia (${majorMetCount} Major, ${minorMetCount} Minor criteria met). Confirmatory chest imaging and microbial workup recommended.`;
    } else {
      overallStatus = 'REJECTED';
      summarySentence = 'Insufficient clinical or radiological criteria for Community-Acquired Pneumonia.';
    }

    return {
      criteriaId: 'CRITERIA: CAP-2024',
      criteriaName: 'BTS / IDSA Diagnostic Criteria for Community-Acquired Pneumonia',
      version: '2024.1',
      evaluatedAt: new Date().toISOString(),
      overallStatus,
      summarySentence,
      inputsUsed,
      inputsMissing,
      items,
      governingGuideline: 'NICE Clinical Guideline CG191 / IDSA/ATS CAP Guidelines 2019',
    };
  },
};

// ── Criteria Registry ──────────────────────────────────────
export const CLINICAL_CRITERIA_REGISTRY: Record<string, ClinicalCriteriaEvaluator> = {
  'CRITERIA: CAP-2024': CommunityAcquiredPneumoniaEvaluator,
  'CRITERIA: DUKE-2023': ModifiedDukeEvaluator,
};

export function evaluateCriteria(
  criteriaId: string,
  context: {
    presentation: IntakePresentationInput;
    observations: IntakeObservationInput[];
  }
): CriteriaEvaluation | null {
  const evaluator = CLINICAL_CRITERIA_REGISTRY[criteriaId];
  if (!evaluator) return null;
  return evaluator.evaluate(context);
}

/**
 * Automatically evaluates all registered criteria and returns the highest-acuity /
 * most relevant clinical criteria result for the case.
 */
export function evaluateOptimalCriteria(context: {
  presentation: IntakePresentationInput;
  observations: IntakeObservationInput[];
}): CriteriaEvaluation | null {
  const capEval = CommunityAcquiredPneumoniaEvaluator.evaluate(context);
  const dukeEval = ModifiedDukeEvaluator.evaluate(context);

  // If CAP meets DEFINITE or HIGH_PROBABILITY, it takes precedence for acute respiratory cases
  if (capEval.overallStatus === 'DEFINITE' || capEval.overallStatus === 'HIGH_PROBABILITY') {
    return capEval;
  }

  // If Duke meets DEFINITE or POSSIBLE (real Duke criteria: >= 1 Major + 1 Minor, or >= 3 Minor)
  if (dukeEval.overallStatus === 'DEFINITE' || dukeEval.overallStatus === 'POSSIBLE') {
    return dukeEval;
  }

  // If CAP has possible signals (e.g. respiratory symptoms, awaiting imaging)
  if (capEval.overallStatus === 'POSSIBLE') {
    return capEval;
  }

  // If no formal criteria guidelines are met, return null (do NOT force CAP or Duke)
  return null;
}

