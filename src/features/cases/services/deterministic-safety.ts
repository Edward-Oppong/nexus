// ============================================================
// src/features/cases/services/deterministic-safety.ts
// Deterministic Clinical Safety Engine (Phase 15 Production)
// Non-biased, auditable rule-based safety evaluation.
// Separates deterministic safety guardrails from generative AI,
// enforcing strict allergy cross-reactivity matrices, age/sex-adjusted
// 2021 CKD-EPI non-race renal elimination checks, and critical vital alarms.
// ============================================================

import { IntakeMedicationInput, IntakeAllergyInput, IntakeObservationInput } from '../types/intake';
import { SafetyConcern, SafetyConcernSeverity } from '../../../domain/workflow';
import { calculateEgfr2021, calculateAgeInYears } from './clinical-knowledge';

export interface SafetyRuleMetadata {
  ruleId: string;
  version: string;
  title: string;
  category: 'MEDICATION_ALLERGY' | 'RENAL_CLEARANCE' | 'CRITICAL_DATA_GAP' | 'HEMODYNAMIC_SAFETY';
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
    ruleId: 'RULE: MED-ALLERGY-CROSS',
    version: '2.0',
    title: 'Medication-Allergy Cross-Reactivity & Contraindication Matrix',
    category: 'MEDICATION_ALLERGY',
    severity: 'URGENT_REVIEW',
    authorityReference: 'Joint Task Force on Practice Parameters (Allergy & Immunology, 2022 Update)',
  },
  {
    ruleId: 'RULE: RENAL-CLEARANCE-SAFETY',
    version: '2.0',
    title: 'Renal Elimination & Nephrotoxic Dosing Safety (2021 CKD-EPI Non-Race)',
    category: 'RENAL_CLEARANCE',
    severity: 'ATTENTION',
    authorityReference: 'KDIGO 2024 Clinical Practice Guideline for Evaluation and Management of CKD & AKI',
  },
  {
    ruleId: 'RULE: HEMODYNAMIC-INSTABILITY',
    version: '2.0',
    title: 'Physiological Instability & Critical Vitals Decompensation',
    category: 'HEMODYNAMIC_SAFETY',
    severity: 'SAFETY_CRITICAL',
    authorityReference: 'Surviving Sepsis Campaign 2021 / National Early Warning Score (NEWS2)',
  },
  {
    ruleId: 'RULE: CRIT-DATA-GAP',
    version: '2.0',
    title: 'Baseline Clinical Safety Information Gap',
    category: 'CRITICAL_DATA_GAP',
    severity: 'URGENT_REVIEW',
    authorityReference: 'Joint Commission National Patient Safety Goals (NPSG.03.06.01 Medication Reconciliation)',
  },
];

export interface RunSafetyChecksParams {
  caseId: string;
  medications: IntakeMedicationInput[];
  allergies: IntakeAllergyInput[];
  observations: IntakeObservationInput[];
  patientDemographics?: {
    ageYears?: number;
    dateOfBirth?: string;
    administrativeSex?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  };
  careContext?: 'TRIAGE' | 'OPD' | 'INPATIENT';
}

export function runDeterministicSafetyChecks(params: RunSafetyChecksParams): {
  evaluations: SafetyRuleEvaluation[];
  concerns: SafetyConcern[];
} {
  const evaluations: SafetyRuleEvaluation[] = [];
  const concerns: SafetyConcern[] = [];
  const now = new Date().toISOString();

  const medications = params.medications || [];
  const allergies = params.allergies || [];
  const observations = params.observations || [];

  // Determine age & biological sex for demographic calculations
  const age = params.patientDemographics?.ageYears ?? calculateAgeInYears(params.patientDemographics?.dateOfBirth);
  const sex = params.patientDemographics?.administrativeSex || 'UNKNOWN';

  // ─────────────────────────────────────────────────────────────
  // 1. RULE: MED-ALLERGY-CROSS (Extensible, Multi-Class Allergy Matrix)
  // ─────────────────────────────────────────────────────────────

  // 1A. Beta-Lactam / Penicillin allergy vs Cephalosporins / Carbapenems
  const penicillinAllergy = allergies.find((a) =>
    /(penicillin|amoxicillin|ampicillin|piperacillin|augmentin|unasyn|zosyn|oxacillin|nafcillin)/i.test(a.substance)
  );

  if (penicillinAllergy) {
    const isAnaphylaxis =
      penicillinAllergy.severity === 'SEVERE' ||
      /(anaphylaxis|bronchospasm|angioedema|shock|respiratory arrest|hypotension)/i.test(penicillinAllergy.reaction);

    // 1st Gen Cephalosporins (shared amino side-chains -> highest cross-reactivity ~2-8%)
    const gen1Ceph = medications.find((m) =>
      /(cephalexin|cefalexin|cefazolin|cefadroxil)/i.test(m.name)
    );
    // Later Gen Cephalosporins (different side chains -> low cross-reactivity ~1%)
    const laterGenCeph = medications.find((m) =>
      /(ceftriaxone|cefepime|cefdinir|ceftazidime|cefotaxime|cefpodoxime|cefoxitin)/i.test(m.name)
    );
    // Carbapenems (<1% cross reactivity)
    const carbapenem = medications.find((m) =>
      /(meropenem|ertapenem|imipenem)/i.test(m.name)
    );

    const conflictingMed = gen1Ceph || laterGenCeph || carbapenem;

    if (conflictingMed) {
      const isHighRisk = gen1Ceph || isAnaphylaxis;
      const severity: SafetyConcernSeverity = isHighRisk ? 'SAFETY_CRITICAL' : 'URGENT_REVIEW';

      const evalResult: SafetyRuleEvaluation = {
        rule: SAFETY_RULE_REGISTRY[0],
        triggered: true,
        explanation: `Documented ${penicillinAllergy.substance} allergy (${penicillinAllergy.reaction || 'Unspecified'}, severity: ${penicillinAllergy.severity}) recorded alongside ordered ${conflictingMed.name}. ${
          gen1Ceph
            ? 'First-generation cephalosporins share similar R1 side-chains with amino-penicillins; high cross-reactivity risk.'
            : 'Later generation cephalosporin/carbapenem cross-reactivity is low (~1-2%), but documented severe penicillin anaphylaxis mandates clinical verification.'
        }`,
        recommendedReviewAction: 'Review allergy severity. If true IgE-mediated anaphylaxis history, consider non-beta-lactam alternative (e.g. Vancomycin, Aztreonam, Fluoroquinolone) or allergy desensitization.',
        affectedEntities: {
          medications: [conflictingMed.name],
          allergies: [penicillinAllergy.substance],
        },
      };
      evaluations.push(evalResult);

      concerns.push({
        id: `sec-alg-${Date.now()}-001`,
        caseId: params.caseId,
        severity,
        category: 'Beta-Lactam Cross-Reactivity Contraindication',
        description: evalResult.explanation,
        triggerSource: 'SYSTEM',
        recommendedAction: evalResult.recommendedReviewAction,
        status: 'OPEN',
        createdAt: now,
      });
    }
  }

  // 1B. Sulfonamide allergy vs Sulfonamide antimicrobials
  const sulfaAllergy = allergies.find((a) => /(sulfa|sulfamethoxazole|bactrim|septra)/i.test(a.substance));
  const sulfaMed = medications.find((m) => /(bactrim|trimethoprim-sulfamethoxazole|sulfadiazine|dapsone)/i.test(m.name));
  if (sulfaAllergy && sulfaMed) {
    const isSevere = sulfaAllergy.severity === 'SEVERE' || /(stevens-johnson|sjs|ten|anaphylaxis|blister)/i.test(sulfaAllergy.reaction);
    const evalResult: SafetyRuleEvaluation = {
      rule: SAFETY_RULE_REGISTRY[0],
      triggered: true,
      explanation: `Documented sulfonamide allergy (${sulfaAllergy.substance}: ${sulfaAllergy.reaction}) with prescribed sulfonamide antimicrobial ${sulfaMed.name}. High risk of severe hypersensitivity.`,
      recommendedReviewAction: 'Discontinue sulfonamide order immediately and substitute with an alternative non-sulfonamide antimicrobial.',
      affectedEntities: {
        medications: [sulfaMed.name],
        allergies: [sulfaAllergy.substance],
      },
    };
    evaluations.push(evalResult);
    concerns.push({
      id: `sec-alg-${Date.now()}-002`,
      caseId: params.caseId,
      severity: isSevere ? 'SAFETY_CRITICAL' : 'URGENT_REVIEW',
      category: 'Sulfonamide Hypersensitivity Contraindication',
      description: evalResult.explanation,
      triggerSource: 'SYSTEM',
      recommendedAction: evalResult.recommendedReviewAction,
      status: 'OPEN',
      createdAt: now,
    });
  }

  // 1C. NSAID / Aspirin Exacerbated Respiratory Disease (AERD) or Allergy
  const nsaidAllergy = allergies.find((a) => /(aspirin|nsaid|ibuprofen|naproxen|ketorolac|toradol)/i.test(a.substance));
  const nsaidMed = medications.find((m) => /(ketorolac|toradol|ibuprofen|naproxen|celecoxib|indomethacin|meloxicam|diclofenac)/i.test(m.name));
  if (nsaidAllergy && nsaidMed) {
    const evalResult: SafetyRuleEvaluation = {
      rule: SAFETY_RULE_REGISTRY[0],
      triggered: true,
      explanation: `Documented NSAID/Aspirin allergy (${nsaidAllergy.substance}) with prescribed NSAID ${nsaidMed.name}. Risk of bronchospasm or acute angioedema.`,
      recommendedReviewAction: 'Replace with acetaminophen / paracetamol or opioid analgesic.',
      affectedEntities: {
        medications: [nsaidMed.name],
        allergies: [nsaidAllergy.substance],
      },
    };
    evaluations.push(evalResult);
    concerns.push({
      id: `sec-alg-${Date.now()}-003`,
      caseId: params.caseId,
      severity: 'SAFETY_CRITICAL',
      category: 'NSAID / Aspirin Cross-Reactivity Risk',
      description: evalResult.explanation,
      triggerSource: 'SYSTEM',
      recommendedAction: evalResult.recommendedReviewAction,
      status: 'OPEN',
      createdAt: now,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. RULE: RENAL-CLEARANCE-SAFETY (2021 CKD-EPI Non-Race Calculation)
  // ─────────────────────────────────────────────────────────────
  const renallyClearedMed = medications.find((m) =>
    /(gentamicin|tobramycin|amikacin|vancomycin|metformin|apixaban|rivaroxaban|dabigatran|enoxaparin|methotrexate)/i.test(m.name)
  );

  const crObservation = observations.find((o) =>
    /(creat|serum\s*creatinine|\bcr\b)/i.test(o.code || o.display)
  );

  if (renallyClearedMed) {
    if (!crObservation) {
      // Missing baseline renal check
      const evalResult: SafetyRuleEvaluation = {
        rule: SAFETY_RULE_REGISTRY[1],
        triggered: true,
        explanation: `${renallyClearedMed.name} ordered without a documented baseline serum creatinine or estimated GFR in active records.`,
        recommendedReviewAction: 'Obtain stat baseline basic metabolic panel / serum creatinine prior to subsequent dosing.',
        affectedEntities: { medications: [renallyClearedMed.name] },
      };
      evaluations.push(evalResult);
      concerns.push({
        id: `sec-rnl-${Date.now()}-001`,
        caseId: params.caseId,
        severity: 'ATTENTION',
        category: 'Missing Baseline Renal Clearance for Renally-Cleared Order',
        description: evalResult.explanation,
        triggerSource: 'SYSTEM',
        recommendedAction: evalResult.recommendedReviewAction,
        status: 'OPEN',
        createdAt: now,
      });
    } else {
      // Evaluate numeric creatinine and eGFR
      const numericCr = parseFloat((crObservation.value || '').replace(/[^\d.]/g, ''));
      if (!isNaN(numericCr) && numericCr > 0) {
        // Normalize to mg/dL if entered in µmol/L
        const isUmol = (crObservation.unit || '').includes('mol');
        const crMgDl = isUmol ? numericCr / 88.4 : numericCr;

        // Calculate unbiased 2021 CKD-EPI eGFR if age is available
        const egfr = age ? calculateEgfr2021(crMgDl, age, sex) : null;

        if (egfr !== null && egfr < 30) {
          // Severe Renal Impairment / Stage 4-5 CKD
          const evalResult: SafetyRuleEvaluation = {
            rule: SAFETY_RULE_REGISTRY[1],
            triggered: true,
            explanation: `Severe renal impairment detected: 2021 CKD-EPI non-race eGFR = ${egfr} mL/min/1.73m² (Creatinine: ${crObservation.value} ${crObservation.unit || 'mg/dL'}). Prescribed ${renallyClearedMed.name} poses high toxicity or accumulation risk at standard dose.`,
            recommendedReviewAction: `Adjust ${renallyClearedMed.name} dose per renal insufficiency protocol (eGFR < 30) or substitute with non-renally cleared alternative.`,
            affectedEntities: {
              medications: [renallyClearedMed.name],
              observations: [crObservation.display || 'Creatinine'],
            },
          };
          evaluations.push(evalResult);
          concerns.push({
            id: `sec-rnl-${Date.now()}-002`,
            caseId: params.caseId,
            severity: 'SAFETY_CRITICAL',
            category: 'Critical Renal Impairment Medication Dose Alert',
            description: evalResult.explanation,
            triggerSource: 'SYSTEM',
            recommendedAction: evalResult.recommendedReviewAction,
            status: 'OPEN',
            createdAt: now,
          });
        } else if ((egfr !== null && egfr < 50) || crMgDl >= 1.6) {
          // Moderate Renal Impairment / Stage 3 CKD
          const egfrLabel = egfr !== null ? `eGFR: ${egfr} mL/min/1.73m²` : `Creatinine: ${numericCr} ${crObservation.unit || 'mg/dL'}`;
          const evalResult: SafetyRuleEvaluation = {
            rule: SAFETY_RULE_REGISTRY[1],
            triggered: true,
            explanation: `Moderate renal dysfunction detected (${egfrLabel}). Patient prescribed ${renallyClearedMed.name}; monitor therapeutic drug levels and renal trajectory.`,
            recommendedReviewAction: 'Monitor renal panel and calculate interval clearance before subsequent redosing.',
            affectedEntities: {
              medications: [renallyClearedMed.name],
              observations: [crObservation.display || 'Creatinine'],
            },
          };
          evaluations.push(evalResult);
          concerns.push({
            id: `sec-rnl-${Date.now()}-003`,
            caseId: params.caseId,
            severity: 'ATTENTION',
            category: 'Renal Clearance Dose Monitoring Advisory',
            description: evalResult.explanation,
            triggerSource: 'SYSTEM',
            recommendedAction: evalResult.recommendedReviewAction,
            status: 'OPEN',
            createdAt: now,
          });
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. RULE: HEMODYNAMIC-INSTABILITY (Objective Vitals Decompensation)
  // ─────────────────────────────────────────────────────────────
  const hrObs = observations.find((o) => /(heart\s*rate|pulse|hr\b|bpm)/i.test(o.code || o.display));
  const bpObs = observations.find((o) => /(blood\s*pressure|bp|systolic)/i.test(o.code || o.display));
  const spo2Obs = observations.find((o) => /(sp\s*o[2₂]|oxygen\s*sat|spo2)/i.test(o.code || o.display));
  const tempObs = observations.find((o) => /(temp(?:erature)?|pyrexia)/i.test(o.code || o.display));

  let isShockOrHypotensive = false;
  let instabilityReason = '';

  if (bpObs) {
    const match = (bpObs.value || '').match(/(\d{2,3})\s*(?:\/|\s)\s*(\d{2,3})/);
    if (match) {
      const sys = parseInt(match[1], 10);
      const hrNum = hrObs ? parseFloat(hrObs.value) : NaN;

      if (sys < 90) {
        isShockOrHypotensive = true;
        instabilityReason = `Hypotension: Systolic BP ${sys} mmHg (< 90 mmHg).`;
        if (!isNaN(hrNum) && hrNum > 100) {
          instabilityReason += ` Concomitant tachycardia (HR ${hrNum} bpm) gives Shock Index ${(hrNum / sys).toFixed(2)} (> 1.0), indicating hemodynamic compromise / impending shock.`;
        }
      }
    }
  }

  if (spo2Obs) {
    const spo2Num = parseFloat(spo2Obs.value);
    if (!isNaN(spo2Num) && spo2Num < 90) {
      isShockOrHypotensive = true;
      instabilityReason += ` Severe hypoxia: SpO2 ${spo2Num}% on room air (< 90%).`;
    }
  }

  if (tempObs) {
    let tNum = parseFloat(tempObs.value);
    if (!isNaN(tNum) && tNum > 45) {
      // In Fahrenheit
      tNum = (tNum - 32) * (5 / 9);
    }
    if (!isNaN(tNum) && (tNum >= 39.5 || tNum < 35.0)) {
      isShockOrHypotensive = true;
      instabilityReason += ` Critical temperature derangement: ${tNum.toFixed(1)}°C (hyperpyrexia / hypothermia).`;
    }
  }

  if (isShockOrHypotensive) {
    const evalResult: SafetyRuleEvaluation = {
      rule: SAFETY_RULE_REGISTRY[2],
      triggered: true,
      explanation: `Immediate clinical decompensation risk detected: ${instabilityReason.trim()}`,
      recommendedReviewAction: 'Initiate stat bedside resuscitation review, assess airway/breathing/circulation, and alert attending clinician.',
      affectedEntities: {
        observations: [bpObs?.display, hrObs?.display, spo2Obs?.display, tempObs?.display].filter(Boolean) as string[],
      },
    };
    evaluations.push(evalResult);
    concerns.push({
      id: `sec-vit-${Date.now()}-001`,
      caseId: params.caseId,
      severity: 'SAFETY_CRITICAL',
      category: 'Physiological Instability & Critical Vitals Decompensation',
      description: evalResult.explanation,
      triggerSource: 'SYSTEM',
      recommendedAction: evalResult.recommendedReviewAction,
      status: 'OPEN',
      createdAt: now,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. RULE: CRIT-DATA-GAP (Unbiased General Baseline Gaps)
  // ─────────────────────────────────────────────────────────────
  // If medications are ordered for an acute patient without ANY documented allergy check
  if (medications.length > 0 && allergies.length === 0) {
    const evalResult: SafetyRuleEvaluation = {
      rule: SAFETY_RULE_REGISTRY[3],
      triggered: true,
      explanation: `Patient has ${medications.length} active medication(s) ordered, but no allergy records or "No Known Drug Allergies" (NKDA) have been documented.`,
      recommendedReviewAction: 'Complete and record a formal allergy reconciliation with the patient or family before administering first dose.',
      affectedEntities: {
        medications: medications.map((m) => m.name),
      },
    };
    evaluations.push(evalResult);
    concerns.push({
      id: `sec-gap-${Date.now()}-001`,
      caseId: params.caseId,
      severity: 'ATTENTION',
      category: 'Unreconciled Allergy Assessment for Ordered Pharmacotherapy',
      description: evalResult.explanation,
      triggerSource: 'SYSTEM',
      recommendedAction: evalResult.recommendedReviewAction,
      status: 'OPEN',
      createdAt: now,
    });
  }

  return { evaluations, concerns };
}
