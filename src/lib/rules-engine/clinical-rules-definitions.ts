// ============================================================
// src/lib/rules-engine/clinical-rules-definitions.ts
// Phase 9: Guideline Clinical Decision Rules Definitions & Evaluator
// ============================================================

import { ClinicalRule, RuleEvaluationResult } from '../../domain/rules-engine';

export const CLINICAL_RULES_REGISTRY: ClinicalRule[] = [
  {
    id: 'rule-duke-endocarditis',
    code: 'DUKE_IE_2023',
    title: 'Modified Duke Criteria for Infective Endocarditis',
    shortDescription: 'Evaluates major and minor clinical/microbiological criteria to stratify probability of infective endocarditis.',
    category: 'DIAGNOSTIC_CRITERIA',
    specialty: 'Infectious Disease / Cardiology',
    guidelineCitation: '2023 Duke-ISCVID Criteria for Infective Endocarditis; Clin Infect Dis 2023.',
    version: '2023.1',
    evaluationLogic: 'MAJOR_MINOR_CRITERIA',
    criteria: [
      {
        id: 'duke-major-1',
        name: 'Major 1: Blood Culture Positive for IE',
        description: 'Typical microorganisms consistent with IE from 2 separate blood cultures (e.g., Viridans streptococci, S. aureus, Enterococcus).',
        category: 'MAJOR',
        points: 1,
        isMet: true,
      },
      {
        id: 'duke-major-2',
        name: 'Major 2: Evidence of Endocardial Involvement',
        description: 'Echocardiogram positive for IE (vegetation, abscess, new partial dehiscence of prosthetic valve, new valvular regurgitation).',
        category: 'MAJOR',
        points: 1,
        isMet: true,
      },
      {
        id: 'duke-minor-1',
        name: 'Minor 1: Predisposition',
        description: 'Predisposing heart condition (prosthetic valve, prior IE, congenital disease) or intravenous drug use.',
        category: 'MINOR',
        points: 1,
        isMet: false,
      },
      {
        id: 'duke-minor-2',
        name: 'Minor 2: Fever',
        description: 'Temperature >= 38.0°C (100.4°F).',
        category: 'MINOR',
        points: 1,
        isMet: true,
      },
      {
        id: 'duke-minor-3',
        name: 'Minor 3: Vascular Phenomena',
        description: 'Major arterial emboli, septic pulmonary infarcts, mycotic aneurysm, intracranial hemorrhage, conjunctival hemorrhages, Janeway lesions.',
        category: 'MINOR',
        points: 1,
        isMet: true,
      },
      {
        id: 'duke-minor-4',
        name: 'Minor 4: Immunologic Phenomena',
        description: 'Glomerulonephritis, Osler nodes, Roth spots, or rheumatoid factor positivity.',
        category: 'MINOR',
        points: 1,
        isMet: false,
      },
      {
        id: 'duke-minor-5',
        name: 'Minor 5: Microbiological Evidence',
        description: 'Positive blood culture but does not meet a major criterion, or serological evidence of active infection.',
        category: 'MINOR',
        points: 1,
        isMet: false,
      },
    ],
    tiers: [
      {
        id: 'duke-definite',
        label: 'Definite Infective Endocarditis',
        clinicalInterpretation: 'Meets 2 Major criteria, or 1 Major + 3 Minor criteria, or 5 Minor criteria.',
        recommendedAction: 'Mandatory bactericidal antimicrobial therapy; urgent cardiology/cardiac surgery consultation for valve intervention assessment.',
        riskSeverity: 'CRITICAL',
      },
      {
        id: 'duke-possible',
        label: 'Possible Infective Endocarditis',
        clinicalInterpretation: 'Meets 1 Major + 1 Minor criterion, or 3 Minor criteria.',
        recommendedAction: 'Obtain repeat blood cultures (3 sets), transesophageal echocardiography (TEE), and consult Infectious Disease.',
        riskSeverity: 'HIGH',
      },
      {
        id: 'duke-rejected',
        label: 'Rejected / Unlikely IE',
        clinicalInterpretation: 'Firm alternate diagnosis established, or resolution of IE syndrome with antibiotic therapy for <= 4 days.',
        recommendedAction: 'Pursue alternative diagnostic workup; re-evaluate if fever or bacteremia persists.',
        riskSeverity: 'LOW',
      },
    ],
  },
  {
    id: 'rule-curb-65',
    code: 'CURB_65',
    title: 'CURB-65 Score for Pneumonia Severity',
    shortDescription: 'Stratifies mortality risk in community-acquired pneumonia to guide outpatient vs. inpatient disposition.',
    category: 'SEVERITY_INDEX',
    specialty: 'Pulmonology / Emergency Medicine',
    guidelineCitation: 'Lim WS, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003.',
    version: '2003.1',
    evaluationLogic: 'SUM_POINTS',
    criteria: [
      {
        id: 'curb-c',
        name: 'C: Confusion',
        description: 'Abbreviated Mental Test score <= 8, or new disorientation in person, place, or time.',
        points: 1,
        isMet: false,
      },
      {
        id: 'curb-u',
        name: 'U: Urea / BUN',
        description: 'Blood urea nitrogen > 19 mg/dL (> 7 mmol/L).',
        points: 1,
        isMet: false,
      },
      {
        id: 'curb-r',
        name: 'R: Respiratory Rate',
        description: 'Respiratory rate >= 30 breaths per minute.',
        points: 1,
        isMet: false,
      },
      {
        id: 'curb-b',
        name: 'B: Blood Pressure',
        description: 'Systolic BP < 90 mmHg or Diastolic BP <= 60 mmHg.',
        points: 1,
        isMet: false,
      },
      {
        id: 'curb-65',
        name: '65: Age >= 65 Years',
        description: 'Patient chronological age is 65 years or older.',
        points: 1,
        isMet: false,
      },
    ],
    tiers: [
      {
        id: 'curb-tier-low',
        label: 'Score 0–1: Low Risk (Mortality < 3%)',
        minScore: 0,
        maxScore: 1,
        clinicalInterpretation: 'Mild pneumonia severity; outpatient management usually suitable if social/clinical factors permit.',
        recommendedAction: 'Outpatient oral antimicrobial regimen; primary care follow-up within 48–72 hours.',
        riskSeverity: 'LOW',
      },
      {
        id: 'curb-tier-mod',
        label: 'Score 2: Moderate Risk (Mortality ~9%)',
        minScore: 2,
        maxScore: 2,
        clinicalInterpretation: 'Moderate pneumonia severity; inpatient hospital admission recommended.',
        recommendedAction: 'Inpatient medical ward admission; intravenous/oral combination antimicrobial therapy.',
        riskSeverity: 'MODERATE',
      },
      {
        id: 'curb-tier-high',
        label: 'Score 3–5: Severe Pneumonia (Mortality 15–40%)',
        minScore: 3,
        maxScore: 5,
        clinicalInterpretation: 'High mortality risk; urgent hospital admission with ICU or high-dependency level consideration.',
        recommendedAction: 'Immediate inpatient admission; assess for Intensive Care Unit (ICU) level support and broad-spectrum IV coverage.',
        riskSeverity: 'CRITICAL',
      },
    ],
  },
  {
    id: 'rule-wells-pe',
    code: 'WELLS_PE',
    title: 'Wells Criteria for Pulmonary Embolism',
    shortDescription: 'Quantifies pre-test clinical probability of pulmonary embolism to determine D-dimer vs. CT pulmonary angiogram.',
    category: 'PROGNOSTIC_SCORE',
    specialty: 'Vascular Medicine / Pulmonology / ER',
    guidelineCitation: 'Wells PS, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism. Thromb Haemost. 2000.',
    version: '2000.2',
    evaluationLogic: 'SUM_POINTS',
    criteria: [
      {
        id: 'wells-dvt-signs',
        name: 'Clinical signs and symptoms of DVT',
        description: 'Objective leg swelling and pain with palpation of deep veins.',
        points: 3.0,
        isMet: false,
      },
      {
        id: 'wells-alt-less-likely',
        name: 'An alternative diagnosis is less likely than PE',
        description: 'Physician judgment that PE is the most likely etiology.',
        points: 3.0,
        isMet: false,
      },
      {
        id: 'wells-tachycardia',
        name: 'Heart rate > 100 beats/min',
        description: 'Documented resting tachycardia.',
        points: 1.5,
        isMet: false,
      },
      {
        id: 'wells-immobilization',
        name: 'Immobilization (>= 3 days) or surgery in previous 4 weeks',
        description: 'Bed rest or surgical procedure requiring anesthesia.',
        points: 1.5,
        isMet: false,
      },
      {
        id: 'wells-prior-dvt-pe',
        name: 'Previous DVT or PE',
        description: 'Objectively documented prior venous thromboembolism.',
        points: 1.5,
        isMet: false,
      },
      {
        id: 'wells-hemoptysis',
        name: 'Hemoptysis',
        description: 'Coughing up blood.',
        points: 1.0,
        isMet: false,
      },
      {
        id: 'wells-malignancy',
        name: 'Malignancy',
        description: 'Active cancer, treated within 6 months, or receiving palliative care.',
        points: 1.0,
        isMet: false,
      },
    ],
    tiers: [
      {
        id: 'wells-unlikely',
        label: 'Score <= 4.0: PE Unlikely (~12% probability)',
        minScore: 0,
        maxScore: 4.0,
        clinicalInterpretation: 'Low-to-moderate pre-test clinical probability.',
        recommendedAction: 'High-sensitivity D-dimer testing recommended; if negative (< 500 ng/mL or age-adjusted), PE safely ruled out without CT.',
        riskSeverity: 'LOW',
      },
      {
        id: 'wells-likely',
        label: 'Score > 4.0: PE Likely (~37% probability)',
        minScore: 4.5,
        maxScore: 12.5,
        clinicalInterpretation: 'High pre-test clinical probability of pulmonary embolism.',
        recommendedAction: 'Proceed directly to CT Pulmonary Angiogram (CTPA) or V/Q scan; consider early anticoagulation if imaging delayed.',
        riskSeverity: 'HIGH',
      },
    ],
  },
  {
    id: 'rule-qsofa',
    code: 'QSOFA_SEPSIS3',
    title: 'qSOFA (Quick SOFA) for Sepsis Risk',
    shortDescription: 'Rapid bedside tool to identify patients with suspected infection at high risk for in-hospital mortality.',
    category: 'CLINICAL_TRIGGER',
    specialty: 'Critical Care / Acute Medicine',
    guidelineCitation: 'Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016.',
    version: '2016.1',
    evaluationLogic: 'SUM_POINTS',
    criteria: [
      {
        id: 'qsofa-rr',
        name: 'Respiratory Rate >= 22 / min',
        description: 'Tachypneic breathing pattern.',
        points: 1,
        isMet: false,
      },
      {
        id: 'qsofa-gcs',
        name: 'Altered Mentation (GCS < 15)',
        description: 'Glasgow Coma Scale score less than 15 or acute disorientation.',
        points: 1,
        isMet: false,
      },
      {
        id: 'qsofa-sbp',
        name: 'Systolic Blood Pressure <= 100 mmHg',
        description: 'Hypotension responsive or unresponsive to fluid challenge.',
        points: 1,
        isMet: false,
      },
    ],
    tiers: [
      {
        id: 'qsofa-neg',
        label: 'Score 0–1: Low Risk for Sepsis-Induced Mortality',
        minScore: 0,
        maxScore: 1,
        clinicalInterpretation: 'Negative screen. Low probability of sepsis-related in-hospital decompensation.',
        recommendedAction: 'Continue standard clinical monitoring and targeted workup of focal infection.',
        riskSeverity: 'LOW',
      },
      {
        id: 'qsofa-pos',
        label: 'Score 2–3: High Risk for Poor Outcome (Sepsis Trigger)',
        minScore: 2,
        maxScore: 3,
        clinicalInterpretation: 'Positive screen. 3- to 14-fold increased risk of in-hospital mortality.',
        recommendedAction: 'Immediate escalation: obtain serum lactate, blood cultures, broad-spectrum antimicrobials, and IV crystalloid resuscitation within 1 hour.',
        riskSeverity: 'CRITICAL',
      },
    ],
  },
  {
    id: 'rule-cha2ds2-vasc',
    code: 'CHA2DS2_VASC',
    title: 'CHA₂DS₂-VASc Score for AF Stroke Risk',
    shortDescription: 'Calculates annual thromboembolic stroke risk in non-valvular atrial fibrillation to guide oral anticoagulation therapy.',
    category: 'PROGNOSTIC_SCORE',
    specialty: 'Cardiology / Thrombosis',
    guidelineCitation: 'Lip GY, et al. Refining clinical risk stratification in atrial fibrillation. Chest 2010; 2023 ACC/AHA/ACCP/HRS AF Guideline.',
    version: '2023.1',
    evaluationLogic: 'SUM_POINTS',
    criteria: [
      { id: 'chads-c', name: 'Congestive heart failure / LV dysfunction', description: 'Signs/symptoms of CHF or documented LVEF <= 40%', points: 1, isMet: false },
      { id: 'chads-h', name: 'Hypertension', description: 'Resting BP > 140/90 mmHg or treated on antihypertensives', points: 1, isMet: false },
      { id: 'chads-a2', name: 'Age >= 75 years', description: 'Major stroke risk factor (+2 points)', points: 2, isMet: false },
      { id: 'chads-d', name: 'Diabetes mellitus', description: 'Fasting glucose > 126 mg/dL or treated on hypoglycemic therapy', points: 1, isMet: false },
      { id: 'chads-s2', name: 'Prior Stroke / TIA / Thromboembolism', description: 'History of cerebrovascular or peripheral ischemic event (+2 points)', points: 2, isMet: false },
      { id: 'chads-v', name: 'Vascular disease', description: 'Prior myocardial infarction, peripheral artery disease, or aortic plaque', points: 1, isMet: false },
      { id: 'chads-a', name: 'Age 65–74 years', description: 'Moderate age risk factor (+1 point)', points: 1, isMet: false },
      { id: 'chads-sc', name: 'Sex category (Female)', description: 'Female biological sex (+1 point)', points: 1, isMet: false },
    ],
    tiers: [
      {
        id: 'chads-low',
        label: 'Score 0 (Male) or 1 (Female): Truly Low Risk',
        minScore: 0,
        maxScore: 1,
        clinicalInterpretation: 'Annual stroke risk < 1%. Anticoagulation therapy generally not recommended.',
        recommendedAction: 'No antithrombotic therapy or antiplatelet therapy alone; reassess periodically.',
        riskSeverity: 'LOW',
      },
      {
        id: 'chads-intermediate',
        label: 'Score 1 (Male): Intermediate Risk',
        minScore: 1,
        maxScore: 1,
        clinicalInterpretation: 'Annual stroke risk ~1.3%. Oral anticoagulation may be considered based on shared decision making.',
        recommendedAction: 'Consider oral anticoagulation (DOAC preferred over Warfarin).',
        riskSeverity: 'MODERATE',
      },
      {
        id: 'chads-high',
        label: 'Score >= 2: High Stroke Risk (Annual Risk 2.2–15%)',
        minScore: 2,
        maxScore: 9,
        clinicalInterpretation: 'Definite indication for systemic oral anticoagulation.',
        recommendedAction: 'Oral anticoagulation strongly recommended with DOAC (Apixaban, Rivaroxaban, Dabigatran) or Warfarin.',
        riskSeverity: 'CRITICAL',
      },
    ],
  },
];

/**
 * Deterministic evaluator for Clinical Rules
 */
export function evaluateClinicalRule(
  rule: ClinicalRule,
  activeCriteriaIds: string[]
): RuleEvaluationResult {
  const activeSet = new Set(activeCriteriaIds);

  const criteriaResults = rule.criteria.map((c) => ({
    criterionId: c.id,
    criterionName: c.name,
    isMet: activeSet.has(c.id),
  }));

  if (rule.evaluationLogic === 'MAJOR_MINOR_CRITERIA') {
    const majorCount = rule.criteria
      .filter((c) => c.category === 'MAJOR' && activeSet.has(c.id))
      .length;
    const minorCount = rule.criteria
      .filter((c) => c.category === 'MINOR' && activeSet.has(c.id))
      .length;

    let matchedTier = rule.tiers[2]; // default rejected / unlikely
    let meetsGuidelineThreshold = false;

    // Modified Duke: Definite = 2 Major, OR 1 Major + 3 Minor, OR 5 Minor
    if (majorCount >= 2 || (majorCount >= 1 && minorCount >= 3) || minorCount >= 5) {
      matchedTier = rule.tiers[0]; // Definite
      meetsGuidelineThreshold = true;
    } else if ((majorCount === 1 && minorCount >= 1) || minorCount >= 3) {
      matchedTier = rule.tiers[1]; // Possible
      meetsGuidelineThreshold = true;
    }

    return {
      ruleId: rule.id,
      ruleTitle: rule.title,
      evaluatedAt: new Date().toISOString(),
      majorCount,
      minorCount,
      matchedTier,
      criteriaResults,
      meetsGuidelineThreshold,
      clinicalSummary: `${matchedTier.label}: ${majorCount} Major and ${minorCount} Minor criteria met. ${matchedTier.clinicalInterpretation}`,
    };
  }

  // Sum points logic (CURB-65, Wells, qSOFA, CHA2DS2-VASc)
  let totalScore = 0;
  rule.criteria.forEach((c) => {
    if (activeSet.has(c.id)) {
      totalScore += c.points || 0;
    }
  });

  let matchedTier = rule.tiers[0];
  for (const tier of rule.tiers) {
    const min = tier.minScore ?? -Infinity;
    const max = tier.maxScore ?? Infinity;
    if (totalScore >= min && totalScore <= max) {
      matchedTier = tier;
      break;
    }
  }

  return {
    ruleId: rule.id,
    ruleTitle: rule.title,
    evaluatedAt: new Date().toISOString(),
    score: totalScore,
    matchedTier,
    criteriaResults,
    meetsGuidelineThreshold: matchedTier.riskSeverity !== 'LOW',
    clinicalSummary: `Calculated Score: ${totalScore}. ${matchedTier.label} (${matchedTier.clinicalInterpretation})`,
  };
}
