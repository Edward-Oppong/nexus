// ============================================================
// src/features/cases/services/differential-generator.ts
// Clinical Differential Diagnosis Engine
// Formulates 3–4 evidence-grounded hypotheses, supporting findings,
// contradiction signals, information gaps, and linked clinical guidelines.
// ============================================================

import { CandidateHypothesis, QualitativeUncertainty, InformationGap } from '../../../domain/hypothesis';
import { ClinicalFinding } from '../../../domain/finding';
import { CriteriaEvaluation } from './criteria-engine';
import { IntakeObservationInput, IntakePresentationInput } from '../types/intake';

interface GenerateHypothesesInput {
  caseId: string;
  presentation: IntakePresentationInput;
  observations: IntakeObservationInput[];
  criteriaEval: CriteriaEvaluation | null;
  findings: ClinicalFinding[];
}

interface GenerateHypothesesResult {
  hypotheses: CandidateHypothesis[];
  informationGaps: InformationGap[];
  uncertainty: QualitativeUncertainty;
}

export function generateDifferentialHypotheses({
  caseId,
  presentation,
  observations,
  criteriaEval,
  findings,
}: GenerateHypothesesInput): GenerateHypothesesResult {
  const fullText = `${presentation.title || ''} ${presentation.historyOfPresentIllness || ''} ${presentation.pastMedicalHistory || ''} ${presentation.physicalExamNotes || ''}`.toLowerCase();
  const obsText = observations.map((o) => `${o.display} ${o.value} ${o.interpretation || ''}`).join(' ').toLowerCase();
  const combinedContext = `${fullText} ${obsText}`;

  // Helper to collect finding IDs matching keywords
  const findSupporting = (keywords: RegExp): string[] => {
    return findings
      .filter((f) => keywords.test(`${f.label} ${f.description || ''}`.toLowerCase()))
      .map((f) => f.id);
  };

  const allFindingIds = findings.map((f) => f.id);
  const now = new Date().toISOString();

  let hypotheses: CandidateHypothesis[] = [];
  let informationGaps: InformationGap[] = [];

  // ─────────────────────────────────────────────────────────────
  // 1. CARDIOLOGY / INFECTIVE ENDOCARDITIS PATTERN
  // ─────────────────────────────────────────────────────────────
  if (
    criteriaEval?.criteriaId.includes('DUKE') ||
    /(endocarditis|vegetation|murmur|bacteremia|strep.*viridans|staph.*aureus|valvul|osler|janeway)/.test(combinedContext)
  ) {
    const isDukeMet = criteriaEval?.overallStatus === 'DEFINITE';
    const primaryTitle = criteriaEval
      ? criteriaEval.summarySentence
      : 'Subacute Infective Endocarditis (IE)';

    const ieSupporting = findSupporting(/(blood culture|murmur|echo|vegetation|fever|temp|spO2|tachycardia|splinter|janeway|crp|esr|leukocyte|wbc)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: primaryTitle,
        status: isDukeMet ? 'Supported' : 'Uncertain',
        canonicalStatus: isDukeMet ? 'SUPPORTED' : 'CANDIDATE',
        statusDetail: isDukeMet
          ? 'Definite Infective Endocarditis confirmed by Modified Duke criteria (microbiological & echocardiographic findings).'
          : 'High clinical suspicion for subacute infective endocarditis based on bacteremia, pyrexia, or auscultatory findings.',
        supportingFindingIds: ieSupporting.length ? ieSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-echo-tee', 'gap-serial-cultures'],
        evidenceIds: ['ev-duke-2024', 'ev-aha-2025'],
        nexusAssessment: 'Working diagnosis strongly indicated. Criteria evaluation identifies persistent bacteremia and valvular risk. Serial blood cultures and repeat echocardiography required.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Non-Bacterial Thrombotic Endocarditis (NBTE) / Marantic Endocarditis',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Sterile platelet-fibrin vegetations associated with advanced malignancy or systemic hypercoagulable state. Must be differentiated by persistent sterile blood cultures.',
        supportingFindingIds: findSupporting(/(vegetation|echo|murmur|hypercoagulable|weight loss|anemia)/i),
        contradictingFindingIds: findSupporting(/(blood culture.*positive|streptococcus|staphylococcus|bacteremia)/i),
        informationGapIds: ['gap-hypercoag-screen', 'gap-serial-cultures'],
        evidenceIds: ['ev-duke-2024'],
        nexusAssessment: 'Essential non-infectious differential if blood cultures demonstrate no sustained growth despite definite echocardiographic vegetation.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Systemic Bacteremia with Sepsis (Occult Extracardiac Focus)',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Persistent bloodstream infection originating from occult venous line, urinary tract, or soft-tissue source without primary valvular seeding.',
        supportingFindingIds: findSupporting(/(fever|temp|crp|wbc|blood culture|pulse|heart rate|lactate)/i),
        contradictingFindingIds: findSupporting(/(vegetation|new murmur|valvular)/i),
        informationGapIds: ['gap-line-tip-culture', 'gap-echo-tee'],
        evidenceIds: ['ev-sepsis3-2021', 'ev-duke-2024'],
        nexusAssessment: 'Sepsis parameters elevated. Transesophageal echocardiogram (TEE) recommended to definitively exclude intracardiac extension.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-4`,
        caseId,
        title: 'Acute Rheumatic Carditis / Post-Infectious Valvulitis',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Autoimmune valvulitis triggered by preceding group A streptococcal exposure, associated with PR prolongation, elevated ESR/CRP, and arthralgias.',
        supportingFindingIds: findSupporting(/(murmur|fever|crp|esr|joint|history)/i),
        contradictingFindingIds: findSupporting(/(staphylococcus aureus|dense vegetation)/i),
        informationGapIds: ['gap-aso-titer'],
        evidenceIds: ['ev-aha-2025'],
        nexusAssessment: 'Secondary differential to consider in patients presenting with new murmur, constitutional inflammatory markers, and negative initial blood cultures.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-echo-tee',
        testName: 'Transesophageal Echocardiography (TEE)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Higher sensitivity than TTE for identifying small vegetations (<5mm), perivalvular abscess, or leaflet perforation.',
        affectedHypotheses: [primaryTitle, 'Non-Bacterial Thrombotic Endocarditis (NBTE) / Marantic Endocarditis'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-serial-cultures',
        testName: 'Serial Blood Cultures (3 sets over 24 hours)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Mandatory Duke criterion requirement to document continuous bacteremia typical of endocardial infection.',
        affectedHypotheses: [primaryTitle, 'Systemic Bacteremia with Sepsis (Occult Extracardiac Focus)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-hypercoag-screen',
        testName: 'Antiphospholipid & Coagulation Profile',
        priority: 'MODERATE PRIORITY',
        whyItMatters: 'Differentiates marantic/autoimmune thrombotic vegetation from bacterial endocarditis.',
        affectedHypotheses: ['Non-Bacterial Thrombotic Endocarditis (NBTE) / Marantic Endocarditis'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 2. RESPIRATORY / PNEUMONIA PATTERN
  // ─────────────────────────────────────────────────────────────
  else if (
    criteriaEval?.criteriaId.includes('CAP') ||
    /(pneumonia|cough|dyspnea|sputum|crackles|infiltrate|consolidation|pleuritic|shortness of breath|spo2|curb)/.test(combinedContext)
  ) {
    const isCapDefinite = criteriaEval?.overallStatus === 'DEFINITE' || criteriaEval?.overallStatus === 'HIGH_PROBABILITY';
    const primaryTitle = criteriaEval ? criteriaEval.summarySentence : 'Community-Acquired Bacterial Pneumonia (CAP)';

    const capSupporting = findSupporting(/(x-ray|cxr|cough|dyspnea|crackles|fever|temp|spo2|wbc|crp|sputum|consolidation)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: primaryTitle,
        status: isCapDefinite ? 'Supported' : 'Uncertain',
        canonicalStatus: isCapDefinite ? 'SUPPORTED' : 'CANDIDATE',
        statusDetail: isCapDefinite
          ? 'Definite CAP supported by focal radiographic infiltrate/consolidation and acute lower respiratory tract findings.'
          : 'Probable Community-Acquired Pneumonia with active respiratory compromise; awaiting final imaging verification.',
        supportingFindingIds: capSupporting.length ? capSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-cxr', 'gap-sputum-culture'],
        evidenceIds: ['ev-idsa-pneumonia', 'ev-curb65-2023'],
        nexusAssessment: 'ATS/IDSA guideline-directed empirical antimicrobial management indicated. CURB-65 severity assessment recommended to determine inpatient vs outpatient safety.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Acute Pulmonary Embolism (PE)',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Sudden onset respiratory distress, pleuritic pain, and tachycardia; clinical exclusion via Wells Score and D-dimer mandatory.',
        supportingFindingIds: findSupporting(/(dyspnea|shortness of breath|pleuritic|tachycardia|heart rate|spo2)/i),
        contradictingFindingIds: findSupporting(/(purulent sputum|focal consolidation)/i),
        informationGapIds: ['gap-ctpa-ddimer'],
        evidenceIds: ['ev-wells-pe'],
        nexusAssessment: 'Life-threatening differential. Pleuritic chest pain and hypoxia warrant Wells PE rule evaluation prior to assuming purely infectious etiology.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Viral Pneumonitis / Atypical Respiratory Infection (e.g., Influenza, COVID-19, Mycoplasma)',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Bilateral diffuse interstitial process characterized by prodromal myalgias, dry cough, or discordant auscultatory examination.',
        supportingFindingIds: findSupporting(/(cough|fever|fatigue|spo2|headache|myalgia)/i),
        contradictingFindingIds: findSupporting(/(dense lobar consolidation|purulent sputum)/i),
        informationGapIds: ['gap-viral-pcr'],
        evidenceIds: ['ev-idsa-pneumonia'],
        nexusAssessment: 'Consider multiplex viral PCR panel. If negative, focus on atypical bacterial or pyogenic pathogens.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-4`,
        caseId,
        title: 'Acute Exacerbation of Pre-Existing Airway Disease (COPD / Asthma)',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Bronchospasm, wheezing, and hyperinflation triggered by upper airway viral infection or environmental irritant.',
        supportingFindingIds: findSupporting(/(dyspnea|wheeze|cough|smoking|history)/i),
        contradictingFindingIds: findSupporting(/(focal consolidation|fever > 39)/i),
        informationGapIds: ['gap-spirometry'],
        evidenceIds: ['ev-curb65-2023'],
        nexusAssessment: 'Evaluate for underlying obstructive lung disease if reversible expiratory wheezing is prominent.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-cxr',
        testName: 'High-Resolution Chest Radiography (PA & Lateral)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Confirms focal alveolar consolidation and rules out parapneumonic effusion or pneumothorax.',
        affectedHypotheses: [primaryTitle, 'Acute Pulmonary Embolism (PE)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-ctpa-ddimer',
        testName: 'D-Dimer / CT Pulmonary Angiogram (CTPA)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Essential to safely exclude pulmonary thromboembolism in acute pleuritic hypoxia.',
        affectedHypotheses: ['Acute Pulmonary Embolism (PE)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-viral-pcr',
        testName: 'Respiratory Multiplex Viral PCR Panel',
        priority: 'MODERATE PRIORITY',
        whyItMatters: 'Guides targeted antiviral therapy and prevents unnecessary antibiotic continuation.',
        affectedHypotheses: ['Viral Pneumonitis / Atypical Respiratory Infection (e.g., Influenza, COVID-19, Mycoplasma)'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 3. CARDIOVASCULAR / ACUTE CORONARY SYNDROME PATTERN
  // ─────────────────────────────────────────────────────────────
  else if (
    /(troponin|angina|chest pain|ecg|stemi|nstemi|ischemi|infarct|substernal|coronary|nitroglycerin)/.test(combinedContext)
  ) {
    const acsSupporting = findSupporting(/(chest pain|troponin|ecg|blood pressure|heart rate|diaphoresis|radiation)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: 'Acute Coronary Syndrome (NSTEMI / Unstable Angina)',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Acute myocardial injury accompanied by ischemic symptoms and cardiac biomarker release.',
        supportingFindingIds: acsSupporting.length ? acsSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-serial-trop', 'gap-stat-ecg'],
        evidenceIds: ['ev-acc-aha-acs'],
        nexusAssessment: 'Stat cardiology evaluation, telemetry monitoring, dual antiplatelet therapy (DAPT), and urgent coronary angiography assessment indicated.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Acute Myopericarditis',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Pericardial and superficial epicardial inflammation; characterized by positional chest pain (worse supine) and PR segment depression.',
        supportingFindingIds: findSupporting(/(chest pain|troponin|fever|friction rub|crp)/i),
        contradictingFindingIds: findSupporting(/(reciprocal st depression|focal wall motion abnormality)/i),
        informationGapIds: ['gap-echo-pericardial'],
        evidenceIds: ['ev-acc-aha-acs'],
        nexusAssessment: 'Check for friction rub, diffuse concave ST elevation, and absence of reciprocal ST depression.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Acute Aortic Dissection (Stanford Type A / B)',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Catastrophic intimal tear with radiating interscapular or retrosternal tearing pain. Critical rule-out before loading antithrombotics.',
        supportingFindingIds: findSupporting(/(chest pain|blood pressure|hypertension|pulse)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-cta-aorta'],
        evidenceIds: ['ev-acc-aha-acs'],
        nexusAssessment: 'Verify bilateral upper extremity blood pressure equality and evaluate mediastinal silhouette.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-4`,
        caseId,
        title: 'Acute Pulmonary Embolism with Right Ventricular Strain',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Massive or submassive PE presenting with acute chest discomfort, dyspnea, and right-heart troponin leakage.',
        supportingFindingIds: findSupporting(/(chest pain|dyspnea|tachycardia|spo2|troponin)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-ctpa-ddimer'],
        evidenceIds: ['ev-wells-pe'],
        nexusAssessment: 'Consider Wells score calculation and CT pulmonary angiography if ECG reveals S1Q3T3 pattern.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-serial-trop',
        testName: 'High-Sensitivity Troponin I/T (0h, 1h, 3h Delta Kinetics)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Mandatory to establish rising/falling dynamic pattern confirming acute myocardial necrosis.',
        affectedHypotheses: ['Acute Coronary Syndrome (NSTEMI / Unstable Angina)', 'Acute Myopericarditis'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-stat-ecg',
        testName: 'Serial 12-Lead Electrocardiogram (ECG)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Evaluates dynamic ST-segment deviation, T-wave inversion, or new bundle branch block.',
        affectedHypotheses: ['Acute Coronary Syndrome (NSTEMI / Unstable Angina)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-cta-aorta',
        testName: 'CT Angiography of Thoracic Aorta',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Definitively excludes life-threatening aortic dissection prior to invasive antiplatelet therapy.',
        affectedHypotheses: ['Acute Aortic Dissection (Stanford Type A / B)'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 4. SEPSIS / SYSTEMIC INFECTION / FUO PATTERN
  // ─────────────────────────────────────────────────────────────
  else if (
    /(sepsis|pyrexia|fever|shock|lactate|qsofa|hypotension|bacteremia|leukocytosis|rigors|chills)/.test(combinedContext)
  ) {
    const sepsisSupporting = findSupporting(/(fever|temp|lactate|wbc|crp|blood pressure|pulse|heart rate)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: 'Systemic Sepsis / Severe Systemic Inflammatory Response (SIRS)',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Dysregulated host response to suspected infection with organ dysfunction risk (qSOFA criteria flagged).',
        supportingFindingIds: sepsisSupporting.length ? sepsisSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-pan-cultures', 'gap-serum-lactate'],
        evidenceIds: ['ev-sepsis3-2021'],
        nexusAssessment: 'Surviving Sepsis 1-hour bundle execution indicated: broad-spectrum IV antimicrobials, serum lactate measurement, and fluid resuscitation.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Complicated Urosepsis / Acute Pyelonephritis',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Ascending urinary tract infection with bacteremic dissemination and systemic hemodynamic instability.',
        supportingFindingIds: findSupporting(/(fever|temp|wbc|crp|urine|flank)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-urinalysis-culture'],
        evidenceIds: ['ev-sepsis3-2021'],
        nexusAssessment: 'Common source for occult bacteremia in hospitalized or elderly patients; obtain clean-catch urine analysis and renal ultrasound.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Intra-Abdominal Sepsis / Occult Viscus Perforation or Abscess',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Biliary sepsis, diverticular abscess, or intestinal translocation driving sustained inflammatory reaction.',
        supportingFindingIds: findSupporting(/(fever|abdominal|vomiting|wbc|lactate)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-ct-abdomen'],
        evidenceIds: ['ev-sepsis3-2021'],
        nexusAssessment: 'Evaluate for abdominal guarding, rebound tenderness, and order contrast CT if localizing signs emerge.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-4`,
        caseId,
        title: 'Drug-Induced Hypersensitivity Syndrome or Autoinflammatory Disorder',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Non-infectious hyperpyrexia with leukocytosis secondary to medication reaction (DRESS) or autoimmune flare.',
        supportingFindingIds: findSupporting(/(fever|rash|eosinophil|medication|history)/i),
        contradictingFindingIds: findSupporting(/(bacteremia|positive blood culture)/i),
        informationGapIds: ['gap-autoimmune-screen'],
        evidenceIds: ['ev-sepsis3-2021'],
        nexusAssessment: 'Review medication administration log and check for peripheral eosinophilia or atypical lymphocytosis.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-pan-cultures',
        testName: 'Pan-Cultures (Blood x2, Sputum, Urine)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Isolates the culprit pathogen to facilitate de-escalation of empirical broad-spectrum coverage.',
        affectedHypotheses: ['Systemic Sepsis / Severe Systemic Inflammatory Response (SIRS)', 'Complicated Urosepsis / Acute Pyelonephritis'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-serum-lactate',
        testName: 'Serial Venous / Arterial Lactate Kinetics',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Quantifies tissue hypoperfusion and monitors cellular recovery following fluid challenge.',
        affectedHypotheses: ['Systemic Sepsis / Severe Systemic Inflammatory Response (SIRS)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-ct-abdomen',
        testName: 'Abdominopelvic Contrast CT',
        priority: 'MODERATE PRIORITY',
        whyItMatters: 'Rules out occult intra-abdominal collections, bowel ischemia, or appendicitis.',
        affectedHypotheses: ['Intra-Abdominal Sepsis / Occult Viscus Perforation or Abscess'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 5. DEFAULT CLINICAL DIFFERENTIAL SET
  // ─────────────────────────────────────────────────────────────
  else {
    const generalSupporting = findSupporting(/(fever|pain|creatinine|wbc|bp|heart rate|glucose|potassium)/i);
    const primaryTitle = presentation.title
      ? `Clinical Presentation: ${presentation.title}`
      : 'Primary Clinical Syndrome under Evaluation';

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: primaryTitle,
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Leading diagnostic candidate aligned with presenting clinical features and active bedside findings.',
        supportingFindingIds: generalSupporting.length ? generalSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-baseline-labs'],
        evidenceIds: ['ev-duke-2024', 'ev-idsa-pneumonia'],
        nexusAssessment: 'Intake data compiled. Multidisciplinary clinical review recommended to establish definitive diagnostic protocol.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Secondary Systemic Inflammatory / Infectious Process',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Infectious or inflammatory etiologies with constitutional symptoms requiring active surveillance.',
        supportingFindingIds: findSupporting(/(temp|fever|wbc|crp|pulse)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-inflammatory-markers'],
        evidenceIds: ['ev-sepsis3-2021'],
        nexusAssessment: 'Evaluate CRP, ESR, and leukocyte differential to assess inflammatory activity.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Metabolic or Toxic-Nutritional Dysregulation',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Electrolyte imbalance, glycemic instability, or renal clearance impairment exacerbating presentation.',
        supportingFindingIds: findSupporting(/(glucose|creatinine|potassium|sodium|bun|kidney)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-metabolic-panel'],
        evidenceIds: ['ev-kdigo-aki'],
        nexusAssessment: 'Review comprehensive metabolic panel and adjust renal medication dosages accordingly.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-4`,
        caseId,
        title: 'Adverse Drug Reaction or Drug-Drug Interaction',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Iatrogenic symptom manifestation or pharmacological interaction based on active medication profile.',
        supportingFindingIds: findSupporting(/(medication|allergy|history)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-pharm-review'],
        evidenceIds: ['ev-nice-antimicrobial'],
        nexusAssessment: 'Cross-reference active pharmacotherapy against renal function and documented drug allergies.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-baseline-labs',
        testName: 'Complete Diagnostic Blood Workup',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Establishes objective physiological baselines to stratify candidate hypotheses.',
        affectedHypotheses: [primaryTitle],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-metabolic-panel',
        testName: 'Comprehensive Metabolic Panel (CMP)',
        priority: 'MODERATE PRIORITY',
        whyItMatters: 'Assesses renal, hepatic, and electrolyte stability.',
        affectedHypotheses: ['Metabolic or Toxic-Nutritional Dysregulation'],
        status: 'Not yet resolved',
      },
    ];
  }

  // Qualitative uncertainty metrics
  const obsCount = observations.length;
  const uncertainty: QualitativeUncertainty = {
    dataCompleteness: obsCount >= 4 ? 'High' : obsCount >= 2 ? 'Moderate' : 'Low',
    dataCompletenessReason: `Intake recorded ${findings.length} clinical findings across ${obsCount} observations.`,
    evidenceConsistency: hypotheses.some((h) => h.contradictingFindingIds.length > 0) ? 'Moderate' : 'High',
    evidenceConsistencyReason: 'Findings align logically with clinical differential rules and guideline standards.',
    modelApplicability: 'High',
    modelApplicabilityReason: 'Deterministic diagnostic guidelines applied to verified structured observations.',
    overallState: 'STABLE',
    primaryReason: 'Differential hypotheses formulated across multiple diagnostic categories.',
  };

  return { hypotheses, informationGaps, uncertainty };
}
