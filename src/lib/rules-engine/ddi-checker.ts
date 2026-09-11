// ============================================================
// src/lib/rules-engine/ddi-checker.ts
// Phase 9: Drug-Drug Interaction Checker (RxNorm + FHIR MedicationStatement)
// ============================================================

import { DrugInteraction, DdiCheckResult, InteractionSeverity } from '../../domain/rules-engine';

export const DDI_DATABASE: DrugInteraction[] = [
  {
    id: 'ddi-vanc-gent',
    drugA: { name: 'Vancomycin', rxNorm: '11124' },
    drugB: { name: 'Gentamicin', rxNorm: '4734' },
    severity: 'MAJOR',
    mechanism: 'Additive and synergistic proximal renal tubular necrosis and hair cell ototoxicity.',
    clinicalConsequence: 'Marked increase in acute kidney injury (AKI) incidence (up to 30–40% in co-treated patients) and irreversible vestibulotoxicity/hearing loss.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Limit synergy duration to 2–3 days if possible. Maintain gentamicin trough < 1 mcg/mL and vancomycin trough 15–20 mcg/mL. Check daily serum creatinine. Discontinue gentamicin immediately if serum Cr rises >= 0.3 mg/dL.',
    guidelineReference: 'AHA 2015 Infective Endocarditis Guidelines; ASHP/IDSA 2020 Vancomycin Guidelines.',
  },
  {
    id: 'ddi-vanc-zosyn',
    drugA: { name: 'Vancomycin', rxNorm: '11124' },
    drugB: { name: 'Piperacillin / Tazobactam', rxNorm: '313988' },
    severity: 'MAJOR',
    mechanism: 'Synergistic nephrotoxicity via distinct cellular injury pathways (tubular cast formation + interstitial nephritis).',
    clinicalConsequence: 'Nearly threefold increased risk of acute kidney injury compared to Vancomycin + Cefepime or Vancomycin + Meropenem.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Prefer Cefepime or Meropenem over Piperacillin/Tazobactam when co-prescribed with Vancomycin in patients with baseline CKD or critical illness, unless anaerobic coverage is mandatory.',
    guidelineReference: 'JAMA Netw Open 2022; IDSA Practice Advisory on Vancomycin-Zosyn Nephrotoxicity.',
  },
  {
    id: 'ddi-warf-amiodarone',
    drugA: { name: 'Warfarin', rxNorm: '11289' },
    drugB: { name: 'Amiodarone', rxNorm: '703' },
    severity: 'MAJOR',
    mechanism: 'Potent inhibition of CYP2C9 and CYP1A2 by amiodarone and its active metabolite desethylamiodarone, impairing S-warfarin clearance.',
    clinicalConsequence: 'Dramatic elevation in INR (frequently > 5.0) within 3–14 days, with substantial risk of life-threatening gastrointestinal or intracranial hemorrhage.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Proactively reduce maintenance warfarin dose by 33% to 50% upon initiating amiodarone. Measure INR every 48–72 hours until stable.',
    guidelineReference: 'CHEST Antithrombotic Therapy Guidelines 2021; FDA Drug Safety Communication.',
  },
  {
    id: 'ddi-clop-omeprazole',
    drugA: { name: 'Clopidogrel', rxNorm: '32968' },
    drugB: { name: 'Omeprazole', rxNorm: '7646' },
    severity: 'MODERATE',
    mechanism: 'Competitive inhibition of hepatic CYP2C19 by omeprazole prevents conversion of clopidogrel prodrug into active thiol metabolite.',
    clinicalConsequence: 'Attenuated antiplatelet effect and increased risk of stent thrombosis and recurrent major adverse cardiac events (MACE).',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Avoid omeprazole and esomeprazole. Substitute with pantoprazole (minimal CYP2C19 inhibition) or an H2-receptor antagonist (famotidine).',
    guidelineReference: 'FDA Boxed Warning / ACC/AHA DAPT Guidelines.',
  },
  {
    id: 'ddi-cipro-amiodarone',
    drugA: { name: 'Ciprofloxacin', rxNorm: '2551' },
    drugB: { name: 'Amiodarone', rxNorm: '703' },
    severity: 'CONTRAINDICATED',
    mechanism: 'Additive cardiac potassium IKr channel blockade causing delayed ventricular repolarization.',
    clinicalConsequence: 'Severe QTc prolongation (> 500 ms) and high probability of Torsades de Pointes (TdP) ventricular tachycardia and sudden cardiac death.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Combination is contraindicated. Select alternative antimicrobial without QTc liability (e.g., Ceftriaxone, Levofloxacin is also QTc-prolonging; Meropenem, Aminoglycoside).',
    guidelineReference: 'CredibleMeds Known Risk of Torsades de Pointes.',
  },
  {
    id: 'ddi-lisin-spirono',
    drugA: { name: 'Lisinopril', rxNorm: '29046' },
    drugB: { name: 'Spironolactone', rxNorm: '9997' },
    severity: 'MAJOR',
    mechanism: 'Dual suppression of aldosterone axis (ACE inhibition + mineralocorticoid receptor blockade) impairing renal potassium excretion.',
    clinicalConsequence: 'Life-threatening hyperkalemia (serum K+ > 6.0 mEq/L), cardiac conduction abnormalities, sinoventricular rhythm, and asystole.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Monitor serum potassium and creatinine at baseline, 3 days, 1 week, and monthly. Limit initial spironolactone dose to 12.5–25 mg daily. Avoid potassium supplements or salt substitutes.',
    guidelineReference: 'AHA/ACC Heart Failure Guidelines 2022.',
  },
  {
    id: 'ddi-simva-fluconazole',
    drugA: { name: 'Simvastatin', rxNorm: '36567' },
    drugB: { name: 'Fluconazole', rxNorm: '4450' },
    severity: 'CONTRAINDICATED',
    mechanism: 'Potent CYP3A4 inhibition by fluconazole causes up to 10- to 20-fold elevation in simvastatin plasma concentration.',
    clinicalConsequence: 'Severe toxic statin myopathy and acute rhabdomyolysis leading to myoglobinuric renal failure and cardiac arrest.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Contraindicated. Hold simvastatin/atorvastatin throughout fluconazole treatment, or switch temporarily to rosuvastatin/pravastatin (non-CYP3A4 metabolized).',
    guidelineReference: 'FDA Simvastatin Label Safety Update.',
  },
  {
    id: 'ddi-paxlovid-apixaban',
    drugA: { name: 'Nirmatrelvir / Ritonavir', rxNorm: '2587000' },
    drugB: { name: 'Apixaban', rxNorm: '1364430' },
    severity: 'CONTRAINDICATED',
    mechanism: 'Ritonavir is a near-complete mechanism-based inhibitor of CYP3A4 and P-glycoprotein efflux transporter.',
    clinicalConsequence: 'Dramatic apixaban plasma accumulation with massive increase in life-threatening bleeding risk.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Contraindicated. If Paxlovid is mandatory, either withhold apixaban and bridge with unfractionated heparin / LMWH under specialist care, or use alternative COVID therapy (Remdesivir IV).',
    guidelineReference: 'NIH COVID-19 Treatment Guidelines; FDA Paxlovid Emergency Use Authorization.',
  },
  {
    id: 'ddi-mtx-nsaid',
    drugA: { name: 'Methotrexate', rxNorm: '6851' },
    drugB: { name: 'Ibuprofen', rxNorm: '5640' },
    severity: 'MAJOR',
    mechanism: 'NSAIDs reduce renal perfusion pressure and compete with organic anion transporters (OAT1/OAT3) responsible for renal tubular excretion of methotrexate.',
    clinicalConsequence: 'Sustained toxic methotrexate serum levels resulting in fatal bone marrow aplasia, severe mucositis, and acute tubular necrosis.',
    evidenceLevel: 'DEFINITIVE',
    managementRecommendation: 'Avoid NSAIDs with high-dose methotrexate. If low-dose methotrexate (e.g., rheumatoid arthritis), monitor complete blood count, liver transaminases, and renal profile closely.',
    guidelineReference: 'American College of Rheumatology Drug Safety Advisory.',
  },
];

/**
 * Normalizes drug string names for fuzzy matching against the DDI database
 */
function normalizeDrugName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Evaluates candidate medications against active patient medications and DDI registry
 */
export function checkDrugInteractions(
  medications: Array<{ name: string; rxNorm?: string }>
): DdiCheckResult {
  const detectedInteractions: DrugInteraction[] = [];

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const medA = medications[i];
      const medB = medications[j];

      const normA = normalizeDrugName(medA.name);
      const normB = normalizeDrugName(medB.name);

      for (const ddi of DDI_DATABASE) {
        const ddiA = normalizeDrugName(ddi.drugA.name);
        const ddiB = normalizeDrugName(ddi.drugB.name);

        const matchForward =
          (normA.includes(ddiA) || ddiA.includes(normA) || (medA.rxNorm && medA.rxNorm === ddi.drugA.rxNorm)) &&
          (normB.includes(ddiB) || ddiB.includes(normB) || (medB.rxNorm && medB.rxNorm === ddi.drugB.rxNorm));

        const matchReverse =
          (normA.includes(ddiB) || ddiB.includes(normA) || (medA.rxNorm && medA.rxNorm === ddi.drugB.rxNorm)) &&
          (normB.includes(ddiA) || ddiA.includes(normB) || (medB.rxNorm && medB.rxNorm === ddi.drugA.rxNorm));

        if (matchForward || matchReverse) {
          // Avoid duplicate push
          if (!detectedInteractions.some((existing) => existing.id === ddi.id)) {
            detectedInteractions.push(ddi);
          }
        }
      }
    }
  }

  // Calculate highest severity
  let highestSeverity: DdiCheckResult['highestSeverity'] = 'NONE';
  let hasContraindications = false;

  if (detectedInteractions.some((d) => d.severity === 'CONTRAINDICATED')) {
    highestSeverity = 'CONTRAINDICATED';
    hasContraindications = true;
  } else if (detectedInteractions.some((d) => d.severity === 'MAJOR')) {
    highestSeverity = 'MAJOR';
  } else if (detectedInteractions.some((d) => d.severity === 'MODERATE')) {
    highestSeverity = 'MODERATE';
  } else if (detectedInteractions.some((d) => d.severity === 'MINOR')) {
    highestSeverity = 'MINOR';
  }

  return {
    detectedInteractions,
    hasContraindications,
    highestSeverity,
    checkedMedications: medications,
    timestamp: new Date().toISOString(),
  };
}
