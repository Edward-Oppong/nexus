// ============================================================
// src/lib/rules-engine/allergy-engine.ts
// Phase 9: Allergy Cross-Reactivity Engine
// Evaluates structural side-chain similarities and immunological cross-reactivity
// ============================================================

import { AllergyCrossReactivityRule, AllergyAlertResult, AllergyRiskLevel } from '../../domain/rules-engine';

export const ALLERGY_CROSS_REACTIVITY_DATABASE: AllergyCrossReactivityRule[] = [
  // ------------------------------------------------------------
  // 1. Beta-Lactam: Penicillins to Cephalosporins
  // ------------------------------------------------------------
  {
    id: 'allergy-pen-amox-amp',
    allergenClass: 'PENICILLIN',
    offendingAgent: 'Penicillin / Amoxicillin',
    targetAgent: 'Ampicillin',
    targetDrugClass: 'Aminopenicillin',
    riskLevel: 'CONTRAINDICATED',
    estimatedCrossReactivityPercent: '100%',
    immunologicalMechanism: 'Identical core 6-aminopenicillanic acid (6-APA) nucleus and shared aminopenicillin epitopes.',
    clinicalGuidance: 'True direct class cross-reactivity. Contraindicated in confirmed penicillin/amoxicillin allergy.',
    recommendedAction: 'AVOID',
    safeAlternatives: ['Vancomycin', 'Daptomycin', 'Aztreonam (if Gram-negative)', 'Levofloxacin'],
  },
  {
    id: 'allergy-pen-zosyn',
    allergenClass: 'PENICILLIN',
    offendingAgent: 'Penicillin',
    targetAgent: 'Piperacillin / Tazobactam',
    targetDrugClass: 'Extended-spectrum Ureidopenicillin',
    riskLevel: 'CONTRAINDICATED',
    estimatedCrossReactivityPercent: '80–90%',
    immunologicalMechanism: 'Shared beta-lactam bicyclic thiazolidine ring and common penicilloyl major determinant.',
    clinicalGuidance: 'Avoid all penicillins and penicillin derivatives in severe IgE-mediated anaphylaxis or SCAR (SJS/TEN/DRESS).',
    recommendedAction: 'AVOID',
    safeAlternatives: ['Meropenem (if non-anaphylactic)', 'Aztreonam + Vancomycin', 'Ciprofloxacin + Metronidazole'],
  },
  {
    id: 'allergy-pen-ceph-1st',
    allergenClass: 'PENICILLIN',
    offendingAgent: 'Penicillin',
    targetAgent: 'Cephalexin / Cefazolin',
    targetDrugClass: '1st Generation Cephalosporin',
    riskLevel: 'MODERATE_RISK',
    estimatedCrossReactivityPercent: '2–5%',
    immunologicalMechanism: 'Historically reported as 10% due to penicillin contamination during early manufacturing. True cross-reactivity is driven by shared R1 side chains (e.g. ampicillin shares R1 with cephalexin and cefaclor). Cefazolin has a unique, distinct side chain.',
    clinicalGuidance: 'Caution in severe IgE-mediated anaphylaxis. For Cefazolin specifically, cross-reactivity with non-amino penicillins is < 1% and often safe under observation.',
    recommendedAction: 'USE_WITH_MONITORING',
    safeAlternatives: ['Cefazolin (unique side chain)', 'Vancomycin', 'Clindamycin (if susceptible)'],
  },
  {
    id: 'allergy-pen-ceph-3rd',
    allergenClass: 'PENICILLIN',
    offendingAgent: 'Penicillin',
    targetAgent: 'Ceftriaxone / Cefotaxime / Cefepime',
    targetDrugClass: '3rd / 4th Generation Cephalosporin',
    riskLevel: 'LOW_RISK',
    estimatedCrossReactivityPercent: '< 1%',
    immunologicalMechanism: 'Distinct 7-aminocephalosporanic acid (7-ACA) core with entirely distinct methoxyimino R1 side chains that do not share homology with benzylpenicillin or aminopenicillins.',
    clinicalGuidance: 'AAAAC/IDSA guidelines recommend 3rd/4th generation cephalosporins as safe in patients with non-severe penicillin allergy, and with standard monitoring even in mild-to-moderate IgE histories.',
    recommendedAction: 'SAFE_TO_ADMINISTER',
    safeAlternatives: ['Ceftriaxone', 'Cefepime', 'Vancomycin', 'Aztreonam'],
  },
  {
    id: 'allergy-pen-carbapenem',
    allergenClass: 'PENICILLIN',
    offendingAgent: 'Penicillin',
    targetAgent: 'Meropenem / Imipenem / Ertapenem',
    targetDrugClass: 'Carbapenem',
    riskLevel: 'LOW_RISK',
    estimatedCrossReactivityPercent: '< 1% (~0.8%)',
    immunologicalMechanism: 'Although both share a beta-lactam ring, the fused five-membered ring has a carbon substitution (carbapenem) rather than sulfur, and clinical skin test studies demonstrate cross-reactivity is < 1%.',
    clinicalGuidance: 'Safe to administer in most penicillin-allergic patients; test dose or monitor during first infusion if prior anaphylaxis was severe.',
    recommendedAction: 'SAFE_TO_ADMINISTER',
    safeAlternatives: ['Meropenem', 'Aztreonam', 'Fluoroquinolones'],
  },
  {
    id: 'allergy-pen-aztreonam',
    allergenClass: 'PENICILLIN',
    offendingAgent: 'Penicillin',
    targetAgent: 'Aztreonam',
    targetDrugClass: 'Monobactam',
    riskLevel: 'SAFE_ALTERNATIVE',
    estimatedCrossReactivityPercent: '0%',
    immunologicalMechanism: 'Monocyclic beta-lactam with NO fused second ring. Immunologically does not cross-react with penicillins.',
    clinicalGuidance: 'Completely safe in all penicillin allergies, including anaphylactic and Stevens-Johnson histories. (EXCEPTION: Ceftazidime-allergic patients cannot receive Aztreonam due to identical R1 side chain).',
    recommendedAction: 'SAFE_TO_ADMINISTER',
    safeAlternatives: ['Aztreonam'],
  },
  {
    id: 'allergy-ceftazidime-aztreonam',
    allergenClass: 'CEPHALOSPORIN',
    offendingAgent: 'Ceftazidime',
    targetAgent: 'Aztreonam',
    targetDrugClass: 'Monobactam',
    riskLevel: 'CONTRAINDICATED',
    estimatedCrossReactivityPercent: 'High (> 60%)',
    immunologicalMechanism: 'Ceftazidime and Aztreonam share an IDENTICAL R1 side-chain (2-amino-alpha-(1-carboxy-1-methylethoxyimino)-4-thiazoleacetic acid).',
    clinicalGuidance: 'Contraindicated. Patients with true Ceftazidime allergy must NOT receive Aztreonam.',
    recommendedAction: 'AVOID',
    safeAlternatives: ['Meropenem', 'Ciprofloxacin', 'Gentamicin', 'Cefepime (dissimilar side chain)'],
  },

  // ------------------------------------------------------------
  // 2. Sulfonamides
  // ------------------------------------------------------------
  {
    id: 'allergy-sulfa-antibiotic',
    allergenClass: 'SULFONAMIDE',
    offendingAgent: 'Sulfamethoxazole / Trimethoprim (Bactrim)',
    targetAgent: 'Sulfadiazine / Sulfasalazine',
    targetDrugClass: 'Sulfonamide Antimicrobial',
    riskLevel: 'CONTRAINDICATED',
    estimatedCrossReactivityPercent: 'High (> 50%)',
    immunologicalMechanism: 'Shared arylamine group at the N4 position and a 5- or 6-membered nitrogen-containing heterocyclic ring at the N1 position, which form reactive hydroxylamine metabolites.',
    clinicalGuidance: 'Avoid all antimicrobial sulfonamides in confirmed sulfonamide allergy.',
    recommendedAction: 'AVOID',
    safeAlternatives: ['Doxycycline', 'Nitrofurantoin', 'Fosfomycin', 'Fluoroquinolones'],
  },
  {
    id: 'allergy-sulfa-non-antibiotic',
    allergenClass: 'SULFONAMIDE',
    offendingAgent: 'Sulfamethoxazole (Bactrim)',
    targetAgent: 'Furosemide / Hydrochlorothiazide / Celecoxib',
    targetDrugClass: 'Non-antimicrobial Sulfonamide (Loop / Thiazide / COX-2)',
    riskLevel: 'LOW_RISK',
    estimatedCrossReactivityPercent: '< 1%',
    immunologicalMechanism: 'Non-antimicrobial sulfonamides lack the N4 arylamine and N1 heterocyclic ring necessary for immunological haptenation and cytotoxicity.',
    clinicalGuidance: 'Cross-reactivity is largely theoretical. Non-antibiotic sulfonamides can be safely administered without allergy testing.',
    recommendedAction: 'SAFE_TO_ADMINISTER',
    safeAlternatives: ['Furosemide', 'Torsemide', 'Ethacrynic acid (if strict non-sulfa loop needed)'],
  },

  // ------------------------------------------------------------
  // 3. NSAIDs & Aspirin
  // ------------------------------------------------------------
  {
    id: 'allergy-aspirin-nsaid',
    allergenClass: 'NSAID',
    offendingAgent: 'Aspirin',
    targetAgent: 'Ibuprofen / Ketorolac / Naproxen',
    targetDrugClass: 'Non-selective NSAID (COX-1 Inhibitor)',
    riskLevel: 'HIGH_RISK',
    estimatedCrossReactivityPercent: '80–90% in AERD',
    immunologicalMechanism: 'Non-IgE pharmacological shunting of arachidonic acid to the 5-lipoxygenase pathway with massive cysteinyl leukotriene release (Aspirin-Exacerbated Respiratory Disease / Samter triad).',
    clinicalGuidance: 'In patients with bronchospasm, urticaria, or angioedema with aspirin, avoid all COX-1 inhibiting NSAIDs.',
    recommendedAction: 'AVOID',
    safeAlternatives: ['Acetaminophen / Paracetamol (<= 1000 mg)', 'Celecoxib (selective COX-2)', 'Tramadol'],
  },

  // ------------------------------------------------------------
  // 4. Heparin / HIT
  // ------------------------------------------------------------
  {
    id: 'allergy-heparin-hit',
    allergenClass: 'HEPARIN',
    offendingAgent: 'Unfractionated Heparin (UFH)',
    targetAgent: 'Enoxaparin / Dalteparin (LMWH)',
    targetDrugClass: 'Low Molecular Weight Heparin',
    riskLevel: 'CONTRAINDICATED',
    estimatedCrossReactivityPercent: '100%',
    immunologicalMechanism: 'Anti-PF4/heparin antibodies cross-react near-universally with low molecular weight heparin complexes, propagating platelet activation and fatal thrombosis.',
    clinicalGuidance: 'LMWH is strictly contraindicated in acute or history of HIT.',
    recommendedAction: 'AVOID',
    safeAlternatives: ['Argatroban (direct thrombin inhibitor)', 'Bivalirudin', 'Fondaparinux'],
  },
];

/**
 * Checks a target drug against patient's allergy history
 */
export function evaluateAllergyCrossReactivity(
  knownAllergies: string[],
  targetDrug: string
): AllergyAlertResult[] {
  const alerts: AllergyAlertResult[] = [];
  const normalizedTarget = targetDrug.toLowerCase();

  for (const allergy of knownAllergies) {
    const normAllergy = allergy.toLowerCase();

    for (const rule of ALLERGY_CROSS_REACTIVITY_DATABASE) {
      const matchOffending =
        normAllergy.includes(rule.allergenClass.toLowerCase()) ||
        normAllergy.includes(rule.offendingAgent.toLowerCase()) ||
        rule.offendingAgent.toLowerCase().includes(normAllergy);

      const matchTarget =
        normalizedTarget.includes(rule.targetAgent.toLowerCase()) ||
        rule.targetAgent.toLowerCase().includes(normalizedTarget) ||
        normalizedTarget.includes(rule.targetDrugClass.toLowerCase());

      if (matchOffending && matchTarget) {
        alerts.push({
          offendingAllergy: allergy,
          targetDrugName: targetDrug,
          riskLevel: rule.riskLevel,
          rule,
          alertHeadline: `${rule.riskLevel === 'CONTRAINDICATED' ? 'CONTRAINDICATION' : 'ALLERGY CROSS-REACTIVITY WARNING'}: ${targetDrug} in patient with ${allergy} (${rule.estimatedCrossReactivityPercent} estimated cross-reactivity)`,
          managementAdvice: rule.clinicalGuidance,
          safeSubstitutes: rule.safeAlternatives,
        });
      }
    }
  }

  return alerts;
}
