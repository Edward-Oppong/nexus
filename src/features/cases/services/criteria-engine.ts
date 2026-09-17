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
    } else if (majorMetCount === 1 || minorMetCount >= 1) {
      overallStatus = 'POSSIBLE';
      summarySentence = `Possible Infective Endocarditis (${majorMetCount} Major, ${minorMetCount} Minor criteria met). Further diagnostic workup indicated.`;
    } else {
      overallStatus = 'REJECTED';
      summarySentence = 'Insufficient criteria met for Infective Endocarditis at this evaluation.';
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

// ── Criteria Registry ──────────────────────────────────────
export const CLINICAL_CRITERIA_REGISTRY: Record<string, ClinicalCriteriaEvaluator> = {
  'CRITERIA: DUKE-2023': ModifiedDukeEvaluator,
};

export function evaluateCriteria(criteriaId: string, context: {
  presentation: IntakePresentationInput;
  observations: IntakeObservationInput[];
}): CriteriaEvaluation | null {
  const evaluator = CLINICAL_CRITERIA_REGISTRY[criteriaId];
  if (!evaluator) return null;
  return evaluator.evaluate(context);
}
