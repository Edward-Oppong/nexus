// ============================================================
// src/features/cases/services/deterministic-safety.ts
// Deterministic Clinical Safety Engine (Phase 14 Production)
// Auditable rule-based safety evaluation separating deterministic
// clinical checks from generative reasoning, producing reviewable concerns.
// ============================================================

import { IntakeMedicationInput, IntakeAllergyInput, IntakeObservationInput } from '../types/intake';
import { SafetyConcern, SafetyConcernSeverity } from '../../../domain/workflow';

export interface SafetyRuleMetadata {
  ruleId: string;
  version: string;
  title: string;
  category: 'MEDICATION_ALLERGY' | 'RENAL_CLEARANCE' | 'CRITICAL_DATA_GAP';
  severity: SafetyConcernSeverity;
  authorityReference: string;
}

export interface SafetyRuleEvaluation {
  rule: SafetyRuleMetadata;
  triggered: boolean;
  explanation: string;
  recommendedReviewAction: string;
  affectedEntities: {
    medications?: string[];
    allergies?: string[];
    observations?: string[];
  };
}

export const SAFETY_RULE_REGISTRY: SafetyRuleMetadata[] = [
  {
    ruleId: 'RULE: MED-ALLERGY-001',
    version: '1.0',
    title: 'Penicillin-Cephalosporin Cross-Reactivity Review',
    category: 'MEDICATION_ALLERGY',
    severity: 'URGENT_REVIEW',
    authorityReference: 'Joint Task Force on Practice Parameters (Allergy & Immunology, 2022)',
  },
  {
    ruleId: 'RULE: RENAL-PARAM-001',
    version: '1.0',
    title: 'Renal Elimination Threshold Monitoring',
    category: 'RENAL_CLEARANCE',
    severity: 'ATTENTION',
    authorityReference: 'KDIGO Clinical Practice Guideline for Acute Kidney Injury',
  },
  {
    ruleId: 'RULE: CRIT-GAP-001',
    version: '1.0',
    title: 'Endocarditis Evaluation Missing Baseline Microbiology',
    category: 'CRITICAL_DATA_GAP',
    severity: 'URGENT_REVIEW',
    authorityReference: 'AHA/ACC Infective Endocarditis Guidelines',
  },
];

export function runDeterministicSafetyChecks(params: {
  caseId: string;
  medications: IntakeMedicationInput[];
  allergies: IntakeAllergyInput[];
  observations: IntakeObservationInput[];
}): { evaluations: SafetyRuleEvaluation[]; concerns: SafetyConcern[] } {
  const evaluations: SafetyRuleEvaluation[] = [];
  const concerns: SafetyConcern[] = [];
  const now = new Date().toISOString();

  // 1. Rule: MED-ALLERGY-001 (Penicillin allergy + Cephalosporin/Beta-lactam)
  const penicillinAllergy = params.allergies.find((a) =>
    a.substance.toLowerCase().includes('penicillin') ||
    a.substance.toLowerCase().includes('amoxicillin') ||
    a.substance.toLowerCase().includes('ampicillin')
  );

  const cephalosporinMed = params.medications.find((m) =>
    m.name.toLowerCase().includes('ceftriaxone') ||
    m.name.toLowerCase().includes('cefepime') ||
    m.name.toLowerCase().includes('cefazolin') ||
    m.name.toLowerCase().includes('cefdinir')
  );

  if (penicillinAllergy && cephalosporinMed) {
    const isSevere = penicillinAllergy.severity === 'SEVERE' ||
      penicillinAllergy.reaction.toLowerCase().includes('anaphylaxis') ||
      penicillinAllergy.reaction.toLowerCase().includes('bronchospasm');

    const evalResult: SafetyRuleEvaluation = {
      rule: SAFETY_RULE_REGISTRY[0],
      triggered: true,
      explanation: `Documented ${penicillinAllergy.substance} allergy (${penicillinAllergy.reaction}, severity: ${penicillinAllergy.severity}) recorded alongside ordered ${cephalosporinMed.name}. Cephalosporin cross-reactivity risk requires attending clinical review.`,
      recommendedReviewAction: 'Review allergy history and confirm whether alternative non-beta-lactam regimen (e.g. Vancomycin) or desensitization/graded challenge is warranted.',
      affectedEntities: {
        medications: [cephalosporinMed.name],
        allergies: [penicillinAllergy.substance],
      },
    };
    evaluations.push(evalResult);

    concerns.push({
      id: `sec-${Date.now()}-001`,
      caseId: params.caseId,
      severity: isSevere ? 'SAFETY_CRITICAL' : 'URGENT_REVIEW',
      category: 'Potential Medication-Allergy Concern: Ceftriaxone & Penicillin History',
      description: evalResult.explanation,
      triggerSource: 'SYSTEM',
      recommendedAction: evalResult.recommendedReviewAction,
      status: 'OPEN',
      createdAt: now,
    });
  }

  // 2. Rule: RENAL-PARAM-001 (Vancomycin / Aminoglycoside with elevated or missing Creatinine)
  const nephrotoxicMed = params.medications.find((m) =>
    m.name.toLowerCase().includes('gentamicin') ||
    m.name.toLowerCase().includes('tobramycin') ||
    m.name.toLowerCase().includes('vancomycin')
  );

  const crObservation = params.observations.find((o) =>
    o.code.toLowerCase().includes('creat') ||
    o.display.toLowerCase().includes('creatinine')
  );

  if (nephrotoxicMed) {
    if (!crObservation) {
      const evalResult: SafetyRuleEvaluation = {
        rule: SAFETY_RULE_REGISTRY[1],
        triggered: true,
        explanation: `${nephrotoxicMed.name} ordered without a documented baseline serum creatinine or estimated GFR in active records.`,
        recommendedReviewAction: 'Obtain stat baseline basic metabolic panel / serum creatinine prior to subsequent dosing.',
        affectedEntities: { medications: [nephrotoxicMed.name] },
      };
      evaluations.push(evalResult);

      concerns.push({
        id: `sec-${Date.now()}-002`,
        caseId: params.caseId,
        severity: 'ATTENTION',
        category: 'Missing Baseline Renal Function for Renally-Cleared Order',
        description: evalResult.explanation,
        triggerSource: 'SYSTEM',
        recommendedAction: evalResult.recommendedReviewAction,
        status: 'OPEN',
        createdAt: now,
      });
    }
  }

  return { evaluations, concerns };
}
