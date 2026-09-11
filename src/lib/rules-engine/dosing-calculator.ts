// ============================================================
// src/lib/rules-engine/dosing-calculator.ts
// Phase 9: Clinical Pharmacotherapy & Renal Dosing Engine
// Deterministic Cockcroft-Gault, CKD-EPI, IBW/AdjBW, and Drug Protocols
// ============================================================

import {
  PatientDosingMetrics,
  RenalFunctionResult,
  DrugDosingProtocol,
  DosingCalculationResult,
} from '../../domain/rules-engine';

/**
 * Calculates standard renal parameters (Cockcroft-Gault CrCl, CKD-EPI 2021, BSA, IBW, AdjBW)
 */
export function calculateRenalMetrics(metrics: PatientDosingMetrics): RenalFunctionResult {
  const { age, gender, weightKg, heightCm, serumCreatinineMgDl } = metrics;

  // 1. Devine Ideal Body Weight (IBW)
  const heightInches = heightCm / 2.54;
  const inchesOver5Feet = Math.max(0, heightInches - 60);
  const baseIbw = gender === 'MALE' ? 50.0 : 45.5;
  const idealBodyWeightKg = Math.round((baseIbw + 2.3 * inchesOver5Feet) * 10) / 10;

  // BMI
  const heightMeters = heightCm / 100;
  const bmi = Math.round((weightKg / (heightMeters * heightMeters)) * 10) / 10;

  // Adjusted Body Weight (AdjBW) if obese (BMI >= 30 or actual weight > 120% of IBW)
  let adjustedBodyWeightKg: number | undefined;
  let weightForCrCl = weightKg;

  if (weightKg > 1.2 * idealBodyWeightKg) {
    adjustedBodyWeightKg = Math.round((idealBodyWeightKg + 0.4 * (weightKg - idealBodyWeightKg)) * 10) / 10;
    // In clinical pharmacy practice, AdjBW is preferred in obese patients for Cockcroft-Gault
    weightForCrCl = adjustedBodyWeightKg;
  }

  // 2. Cockcroft-Gault CrCl (mL/min)
  // CrCl = [ (140 - Age) * Weight (kg) ] / ( 72 * Serum Cr ) * (0.85 if female)
  const scr = Math.max(0.4, serumCreatinineMgDl); // floor at 0.4 to prevent artificial extremes
  const sexMultiplier = gender === 'FEMALE' ? 0.85 : 1.0;
  const crClRaw = ((140 - age) * weightForCrCl * sexMultiplier) / (72 * scr);
  const cockcroftGaultCrCl = Math.round(crClRaw * 10) / 10;

  // 3. Mosteller BSA (m2) = sqrt( (Height_cm * Weight_kg) / 3600 )
  const bsaMosteller = Math.round(Math.sqrt((heightCm * weightKg) / 3600) * 100) / 100;

  // 4. CKD-EPI 2021 Race-Free eGFR (mL/min/1.73m2)
  // eGFR = 142 * min(Scr/kappa, 1)^alpha * max(Scr/kappa, 1)^(-1.200) * 0.9938^Age * (1.012 if female)
  const kappa = gender === 'FEMALE' ? 0.7 : 0.9;
  const alpha = gender === 'FEMALE' ? -0.241 : -0.302;
  const scrOverKappa = scr / kappa;
  const minTerm = Math.min(scrOverKappa, 1) ** alpha;
  const maxTerm = Math.max(scrOverKappa, 1) ** -1.2;
  const ageTerm = 0.9938 ** age;
  const femaleFactor = gender === 'FEMALE' ? 1.012 : 1.0;
  const egfrRaw = 142 * minTerm * maxTerm * ageTerm * femaleFactor;
  const ckdEpiEgfr = Math.round(egfrRaw * 10) / 10;

  // CKD Staging based on eGFR (KDIGO 2024 guidelines)
  let ckdStage: RenalFunctionResult['ckdStage'] = 'STAGE_1';
  let interpretation = 'Normal or high kidney function';

  if (ckdEpiEgfr >= 90) {
    ckdStage = 'STAGE_1';
    interpretation = 'Normal or high renal clearance (eGFR >= 90 mL/min/1.73m2)';
  } else if (ckdEpiEgfr >= 60) {
    ckdStage = 'STAGE_2';
    interpretation = 'Mildly decreased renal clearance (eGFR 60–89 mL/min/1.73m2)';
  } else if (ckdEpiEgfr >= 45) {
    ckdStage = 'STAGE_3A';
    interpretation = 'Mild-to-moderately decreased renal clearance (eGFR 45–59 mL/min/1.73m2)';
  } else if (ckdEpiEgfr >= 30) {
    ckdStage = 'STAGE_3B';
    interpretation = 'Moderately-to-severely decreased renal clearance (eGFR 30–44 mL/min/1.73m2)';
  } else if (ckdEpiEgfr >= 15) {
    ckdStage = 'STAGE_4';
    interpretation = 'Severely decreased renal clearance (eGFR 15–29 mL/min/1.73m2). Substantial drug accumulation risk.';
  } else {
    ckdStage = 'STAGE_5';
    interpretation = 'Kidney failure / End-stage renal disease (eGFR < 15 mL/min/1.73m2). Extreme drug clearance impairment.';
  }

  return {
    cockcroftGaultCrCl,
    ckdEpiEgfr,
    bsaMosteller,
    idealBodyWeightKg,
    adjustedBodyWeightKg,
    bmi,
    ckdStage,
    interpretation,
  };
}

// ------------------------------------------------------------
// DRUG PROTOCOL CATALOG
// ------------------------------------------------------------

export const DRUG_DOSING_CATALOG: DrugDosingProtocol[] = [
  {
    id: 'drug-vancomycin',
    genericName: 'Vancomycin',
    brandNames: ['Vancocin', 'Firvanq'],
    rxNormCode: '11124',
    drugClass: 'Glycopeptide Antibiotic',
    standardDose: '15–20 mg/kg (based on actual body weight)',
    standardInterval: 'every 8 to 12 hours',
    indication: 'Severe MRSA / Enterococcal / Viridans Streptococcal Bacteremia or Endocarditis',
    isWeightBased: true,
    mgPerKgLoading: 25, // 25-30 mg/kg loading in severe sepsis / endocarditis
    mgPerKgStandard: 17.5,
    maxSingleDoseMg: 2000,
    renalAdjustmentRequired: true,
    renalTiers: [
      {
        minCrCl: 50,
        recommendedDose: '15–20 mg/kg',
        interval: 'q8h–q12h',
        clinicalNote: 'Normal clearance. Target AUC/MIC 400–600 mg·h/L or trough 15–20 mcg/mL for severe bacteremia/IE.',
        severityWarning: 'NORMAL',
      },
      {
        minCrCl: 30,
        maxCrCl: 49,
        recommendedDose: '15 mg/kg',
        interval: 'q24h',
        clinicalNote: 'Moderate renal impairment. Extend dosing interval to 24h. Check pre-dose trough prior to 3rd dose.',
        severityWarning: 'CAUTION',
      },
      {
        minCrCl: 15,
        maxCrCl: 29,
        recommendedDose: '15 mg/kg',
        interval: 'q48h',
        clinicalNote: 'Severe impairment. Extend interval to 48h. High risk of drug accumulation and synergistic ototoxicity/nephrotoxicity.',
        severityWarning: 'HIGH_ALERT',
      },
      {
        maxCrCl: 14,
        recommendedDose: '15–20 mg/kg loading dose only',
        interval: 'Redose per serum trough level (< 15–20 mcg/mL)',
        clinicalNote: 'End-stage renal impairment / hemodialysis. Do not schedule fixed intervals. Dose by level.',
        severityWarning: 'HIGH_ALERT',
      },
    ],
    monitoringGuidance: {
      targetTrough: '15–20 mcg/mL (for IE, osteomyelitis, sepsis)',
      targetAucMic: '400–600 (IDSA/ASHP 2020 guideline preferred)',
      monitoringFrequency: 'Measure trough immediately prior to 4th dose (steady state), and serum creatinine daily.',
      toxicities: ['Nephrotoxicity (acute tubular necrosis)', 'Ototoxicity', 'Red Man Syndrome with rapid infusion'],
    },
  },
  {
    id: 'drug-gentamicin',
    genericName: 'Gentamicin',
    brandNames: ['Garamycin'],
    rxNormCode: '4734',
    drugClass: 'Aminoglycoside Antibiotic',
    standardDose: '1 mg/kg (synergy in IE) or 5–7 mg/kg (extended interval)',
    standardInterval: 'every 8 hours (synergy) or every 24 hours (extended)',
    indication: 'Synergistic bactericidal therapy for Streptococcal / Enterococcal Infective Endocarditis',
    isWeightBased: true,
    mgPerKgStandard: 1.0,
    maxSingleDoseMg: 500,
    renalAdjustmentRequired: true,
    renalTiers: [
      {
        minCrCl: 60,
        recommendedDose: '1 mg/kg (synergy dose)',
        interval: 'q8h',
        clinicalNote: 'Normal renal function. Target peak 3–4 mcg/mL, trough < 1 mcg/mL.',
        severityWarning: 'NORMAL',
      },
      {
        minCrCl: 40,
        maxCrCl: 59,
        recommendedDose: '1 mg/kg',
        interval: 'q12h',
        clinicalNote: 'Mild renal impairment. Extend interval to 12 hours.',
        severityWarning: 'CAUTION',
      },
      {
        minCrCl: 20,
        maxCrCl: 39,
        recommendedDose: '1 mg/kg',
        interval: 'q24h',
        clinicalNote: 'Moderate renal impairment. Extend interval to 24 hours. Monitor creatinine daily.',
        severityWarning: 'HIGH_ALERT',
      },
      {
        maxCrCl: 19,
        recommendedDose: 'Avoid or single dose 1 mg/kg then monitor',
        interval: 'Redose only when trough < 0.5 mcg/mL',
        clinicalNote: 'Severe renal failure. Synergy aminoglycosides have extreme nephrotoxic and irreversible vestibular risk.',
        severityWarning: 'HIGH_ALERT',
      },
    ],
    monitoringGuidance: {
      targetTrough: '< 1.0 mcg/mL (synergy)',
      targetPeak: '3–4 mcg/mL (synergy)',
      monitoringFrequency: 'Trough level within 30 min before 3rd dose; daily serum creatinine.',
      toxicities: ['Irreversible ototoxicity (cochlear and vestibular)', 'Synergistic acute kidney injury with Vancomycin'],
    },
  },
  {
    id: 'drug-enoxaparin',
    genericName: 'Enoxaparin',
    brandNames: ['Lovenox'],
    rxNormCode: '32968',
    drugClass: 'Low Molecular Weight Heparin (LMWH)',
    standardDose: '1 mg/kg SC q12h (therapeutic) or 40 mg SC q24h (prophylactic)',
    standardInterval: 'every 12 hours (therapeutic)',
    indication: 'Treatment and prevention of Deep Vein Thrombosis / Pulmonary Embolism',
    isWeightBased: true,
    mgPerKgStandard: 1.0,
    renalAdjustmentRequired: true,
    renalTiers: [
      {
        minCrCl: 30,
        recommendedDose: '1 mg/kg SC (therapeutic) or 40 mg SC (prophylaxis)',
        interval: 'q12h (therapeutic) or q24h (prophylaxis)',
        clinicalNote: 'CrCl >= 30 mL/min: Standard dosing applies without routine anti-Xa monitoring.',
        severityWarning: 'NORMAL',
      },
      {
        maxCrCl: 29,
        recommendedDose: '1 mg/kg SC (therapeutic) or 30 mg SC (prophylaxis)',
        interval: 'q24h (extended to once daily)',
        clinicalNote: 'CrCl < 30 mL/min: LMWH bioaccumulates significantly. Reduce frequency to once daily or switch to unfractionated heparin (UFH).',
        severityWarning: 'HIGH_ALERT',
      },
    ],
    monitoringGuidance: {
      targetTrough: 'Peak anti-Xa: 0.6–1.0 IU/mL for q12h therapeutic, measured 4h post-dose.',
      monitoringFrequency: 'Anti-Xa monitoring recommended if CrCl < 30 mL/min, pregnancy, or BMI > 40.',
      toxicities: ['Major hemorrhage', 'Heparin-Induced Thrombocytopenia (HIT)', 'Spinal/epidural hematoma'],
    },
  },
  {
    id: 'drug-cefepime',
    genericName: 'Cefepime',
    brandNames: ['Maxipime'],
    rxNormCode: '2551',
    drugClass: '4th Generation Cephalosporin',
    standardDose: '2g IV',
    standardInterval: 'every 8 hours',
    indication: 'Pseudomonas aeruginosa and severe nosocomial bacteremia / neutropenic fever',
    isWeightBased: false,
    renalAdjustmentRequired: true,
    renalTiers: [
      {
        minCrCl: 60,
        recommendedDose: '2g IV',
        interval: 'q8h',
        clinicalNote: 'Normal renal function.',
        severityWarning: 'NORMAL',
      },
      {
        minCrCl: 30,
        maxCrCl: 59,
        recommendedDose: '2g IV',
        interval: 'q12h',
        clinicalNote: 'Mild renal impairment. Extend interval to 12 hours.',
        severityWarning: 'CAUTION',
      },
      {
        minCrCl: 11,
        maxCrCl: 29,
        recommendedDose: '2g IV',
        interval: 'q24h',
        clinicalNote: 'Moderate to severe impairment. Extend to 24 hours.',
        severityWarning: 'HIGH_ALERT',
      },
      {
        maxCrCl: 10,
        recommendedDose: '1g IV',
        interval: 'q24h (after dialysis on HD days)',
        clinicalNote: 'High risk of severe Cefepime-induced encephalopathy, non-convulsive status epilepticus, and myoclonus.',
        severityWarning: 'HIGH_ALERT',
      },
    ],
    monitoringGuidance: {
      monitoringFrequency: 'Monitor neurologic status (confusion, myoclonus, seizures) daily, especially in renal dysfunction.',
      toxicities: ['Neurotoxicity (Cefepime encephalopathy)', 'Clostridioides difficile colitis', 'Thrombocytopenia'],
    },
  },
  {
    id: 'drug-piperacillin-tazobactam',
    genericName: 'Piperacillin / Tazobactam',
    brandNames: ['Zosyn'],
    rxNormCode: '313988',
    drugClass: 'Extended-spectrum Penicillin + Beta-lactamase inhibitor',
    standardDose: '4.5g IV (extended infusion over 3–4 hours)',
    standardInterval: 'every 6 to 8 hours',
    indication: 'Broad-spectrum intra-abdominal, severe respiratory, or skin/soft tissue sepsis',
    isWeightBased: false,
    renalAdjustmentRequired: true,
    renalTiers: [
      {
        minCrCl: 50,
        recommendedDose: '4.5g IV',
        interval: 'q6h (or 3.375g q6h / 4.5g q8h over 4h extended infusion)',
        clinicalNote: 'Standard renal function.',
        severityWarning: 'NORMAL',
      },
      {
        minCrCl: 20,
        maxCrCl: 49,
        recommendedDose: '3.375g IV',
        interval: 'q6h',
        clinicalNote: 'Moderate renal impairment. Reduce dose to 3.375g.',
        severityWarning: 'CAUTION',
      },
      {
        maxCrCl: 19,
        recommendedDose: '2.25g IV',
        interval: 'q6h (or 2.25g q8h if on hemodialysis with 0.75g post-HD)',
        clinicalNote: 'Severe renal impairment. Limit total daily piperacillin exposure to prevent neuro- and bone marrow toxicity.',
        severityWarning: 'HIGH_ALERT',
      },
    ],
    monitoringGuidance: {
      monitoringFrequency: 'CBC with differential weekly (risk of neutropenia with prolonged therapy); daily BUN/Cr.',
      toxicities: ['Acute interstitial nephritis', 'Severe synergistic acute kidney injury when co-administered with Vancomycin'],
    },
  },
  {
    id: 'drug-meropenem',
    genericName: 'Meropenem',
    brandNames: ['Merrem'],
    rxNormCode: '29046',
    drugClass: 'Carbapenem Antibiotic',
    standardDose: '1g IV (2g for meningitis)',
    standardInterval: 'every 8 hours (infuse over 30 min or 3-hour extended infusion)',
    indication: 'MDR Gram-negative sepsis, ESBL-producing enterobacteriaceae, bacterial meningitis',
    isWeightBased: false,
    renalAdjustmentRequired: true,
    renalTiers: [
      {
        minCrCl: 50,
        recommendedDose: '1g IV (2g in meningitis)',
        interval: 'q8h',
        clinicalNote: 'Normal renal clearance.',
        severityWarning: 'NORMAL',
      },
      {
        minCrCl: 26,
        maxCrCl: 49,
        recommendedDose: '1g IV',
        interval: 'q12h',
        clinicalNote: 'Moderate renal impairment. Extend interval to 12 hours.',
        severityWarning: 'CAUTION',
      },
      {
        minCrCl: 10,
        maxCrCl: 25,
        recommendedDose: '500 mg IV',
        interval: 'q12h',
        clinicalNote: 'Severe impairment. Reduce dose by 50% to prevent seizure threshold lowering.',
        severityWarning: 'HIGH_ALERT',
      },
      {
        maxCrCl: 9,
        recommendedDose: '500 mg IV',
        interval: 'q24h (give post-hemodialysis)',
        clinicalNote: 'End-stage renal disease. Carbapenems accumulate and lower seizure threshold.',
        severityWarning: 'HIGH_ALERT',
      },
    ],
    monitoringGuidance: {
      monitoringFrequency: 'Electrolytes, renal function, seizure precautions in renal insufficiency.',
      toxicities: ['Seizures (especially with under-adjusted renal dosing)', 'C. difficile infection'],
    },
  },
  {
    id: 'drug-apixaban',
    genericName: 'Apixaban',
    brandNames: ['Eliquis'],
    rxNormCode: '1364430',
    drugClass: 'Direct Oral Anticoagulant (DOAC - Factor Xa Inhibitor)',
    standardDose: '5 mg orally twice daily',
    standardInterval: 'every 12 hours',
    indication: 'Non-valvular atrial fibrillation stroke prevention, DVT/PE treatment',
    isWeightBased: false,
    renalAdjustmentRequired: true,
    renalTiers: [
      {
        minCrCl: 25,
        recommendedDose: '5 mg PO (or 2.5 mg PO if patient meets 2 of: Age >=80, Wt <=60kg, Scr >=1.5 mg/dL)',
        interval: 'BID (twice daily)',
        clinicalNote: 'Standard dosing. Apply ABC criteria: Age >= 80, Body weight <= 60 kg, Serum Cr >= 1.5 mg/dL -> Reduce to 2.5 mg BID if >= 2 criteria present.',
        severityWarning: 'NORMAL',
      },
      {
        maxCrCl: 24,
        recommendedDose: '2.5 mg PO BID (or consider Warfarin)',
        interval: 'BID',
        clinicalNote: 'Severe renal impairment (CrCl < 25 mL/min). Limited clinical trial data. Monitor closely for hemorrhage.',
        severityWarning: 'HIGH_ALERT',
      },
    ],
    monitoringGuidance: {
      monitoringFrequency: 'CBC and renal function every 3 to 6 months; monitor for overt bleeding or unexpected drop in hemoglobin.',
      toxicities: ['Major hemorrhage (gastrointestinal, intracranial)', 'Hematoma'],
    },
  },
];

/**
 * Calculates drug-specific dosing based on patient metrics and renal clearance
 */
export function calculateDrugDosing(
  protocol: DrugDosingProtocol,
  patientMetrics: PatientDosingMetrics
): DosingCalculationResult {
  const renal = calculateRenalMetrics(patientMetrics);
  const crCl = renal.cockcroftGaultCrCl;

  // Match renal tier
  let matchedTier = protocol.renalTiers[0];
  for (const tier of protocol.renalTiers) {
    const min = tier.minCrCl ?? -Infinity;
    const max = tier.maxCrCl ?? Infinity;
    if (crCl >= min && crCl <= max) {
      matchedTier = tier;
      break;
    }
  }

  // Weight-based calculation for maintenance and loading
  let calculatedLoadingDose: string | undefined;
  let calculatedMaintenanceDose = matchedTier.recommendedDose;

  // Check if patient is obese for weight selection
  const doseWeightKg = renal.adjustedBodyWeightKg ?? patientMetrics.weightKg;

  if (protocol.isWeightBased && protocol.mgPerKgStandard) {
    if (protocol.mgPerKgLoading) {
      const rawLoading = Math.min(
        protocol.maxSingleDoseMg ?? 3000,
        Math.round((protocol.mgPerKgLoading * doseWeightKg) / 250) * 250 // round to nearest 250mg
      );
      calculatedLoadingDose = `${rawLoading} mg IV (Loading dose: ~${protocol.mgPerKgLoading} mg/kg on ${doseWeightKg} kg body weight)`;
    }

    // Determine maintenance
    let mgPerKgToUse = protocol.mgPerKgStandard;
    if (matchedTier.severityWarning === 'HIGH_ALERT') {
      mgPerKgToUse = Math.min(mgPerKgToUse, 15);
    }
    const rawMaint = Math.min(
      protocol.maxSingleDoseMg ?? 2500,
      Math.max(250, Math.round((mgPerKgToUse * doseWeightKg) / 250) * 250)
    );
    calculatedMaintenanceDose = `${rawMaint} mg IV (${mgPerKgToUse} mg/kg on ${doseWeightKg} kg)`;
  }

  // Safety alerts
  const safetyAlerts: string[] = [];
  if (matchedTier.severityWarning === 'HIGH_ALERT') {
    safetyAlerts.push(
      `RENAL ALERT: Patient CrCl (${crCl} mL/min) falls in HIGH_ALERT renal impairment tier. Standard dose causes drug bioaccumulation.`
    );
  }
  if (renal.adjustedBodyWeightKg) {
    safetyAlerts.push(
      `OBESITY ADJUSTMENT: Patient BMI is ${renal.bmi} kg/m2. Dosing calculated using Salazar-Corcoran Adjusted Body Weight (${renal.adjustedBodyWeightKg} kg) rather than actual weight (${patientMetrics.weightKg} kg).`
    );
  }
  if (protocol.monitoringGuidance.targetTrough) {
    safetyAlerts.push(`THERAPEUTIC DRUG MONITORING: ${protocol.monitoringGuidance.monitoringFrequency}`);
  }

  return {
    drugId: protocol.id,
    drugName: protocol.genericName,
    patientMetrics,
    renalMetrics: renal,
    calculatedLoadingDose,
    calculatedMaintenanceDose,
    calculatedInterval: matchedTier.interval,
    adjustmentTier: matchedTier,
    monitoringPlan: `${protocol.monitoringGuidance.targetTrough ? `Target Trough: ${protocol.monitoringGuidance.targetTrough}. ` : ''}${protocol.monitoringGuidance.monitoringFrequency}`,
    safetyAlerts,
    calculatedAt: new Date().toISOString(),
  };
}
