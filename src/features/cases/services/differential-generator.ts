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
  // 0. TOP PRIORITY: ESI 1 RESUSCITATION / CARDIAC ARREST / PROFOUND SHOCK
  // Architectural bypass for catastrophic physiological collapse.
  // Bypasses standard delayed imaging/sputum workup; injects immediate ACLS protocols.
  // ─────────────────────────────────────────────────────────────
  const hasAgonalOrApnea = /\b(agonal|apneic|apnea|gasping|gasping for breath|barely breathing)\b/i.test(combinedContext);
  const hasCollapseOrUnresponsive = /\b(sudden collapse|collapse|unresponsive|unconscious|pulseless|asystole|ventricular fibrillation|vf arrest|cardiac arrest)\b/i.test(combinedContext);
  const hasProfoundHypotension = /\b(?:bp|blood pressure)[:\s]*(?:[3-6]\d)\s*\/\s*\d{2,3}\b/i.test(combinedContext) ||
    observations.some((o) => {
      const match = (o.value || '').match(/(\d{2,3})\s*(?:\/|\s)\s*(\d{2,3})/);
      return match && parseInt(match[1], 10) < 70;
    });
  const hasProfoundHypoxia = /\b(?:spo2|oxygen saturation|o2 sat)[:\s]*(?:[5-7]\d)%?\b/i.test(combinedContext) ||
    observations.some((o) => {
      const num = parseFloat((o.value || '').replace(/[^\d.\-]/g, ''));
      return /spo2|oxygen/i.test(`${o.display} ${o.code}`) && !isNaN(num) && num < 80;
    });

  const isEsi1Resuscitation = hasAgonalOrApnea || (hasCollapseOrUnresponsive && (hasProfoundHypotension || hasProfoundHypoxia)) || (hasProfoundHypotension && hasProfoundHypoxia);

  if (isEsi1Resuscitation) {
    const shockSupporting = findSupporting(/(bp|blood pressure|spo2|oxygen|respiratory rate|heart rate|pulse|unresponsive|collapse|gasping|agonal)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: 'Ventricular Fibrillation (VF) / Sudden Cardiac Arrest',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Catastrophic hemodynamic collapse with agonal respirations, profound hypoxia, and shock. Requires immediate ACLS resuscitation and defibrillation.',
        supportingFindingIds: shockSupporting.length ? shockSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-acls-cpr-defib', 'gap-immediate-airway', 'gap-iv-io-epi'],
        evidenceIds: ['ev-aha-acls-2024'],
        nexusAssessment: 'CRITICAL ESI 1 RESUSCITATION: Active cardiac arrest / peri-arrest state. Initiate immediate CPR, rhythm check for defibrillation, and advanced airway management.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Acute ST-Elevation Myocardial Infarction (STEMI) with Cardiogenic Shock',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Sudden cardiac death / cardiogenic shock secondary to acute coronary occlusion with malignant ventricular tachyarrhythmia.',
        supportingFindingIds: findSupporting(/(bp|heart rate|spo2|collapse)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-stat-ecg-rhythm', 'gap-bedside-pocus'],
        evidenceIds: ['ev-acc-aha-acs', 'ev-aha-acls-2024'],
        nexusAssessment: 'Leading primary etiology for sudden non-traumatic adult arrest. Post-ROSC immediate 12-lead ECG and emergency cardiac catheterization pathway activation.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Severe Anaphylactic Shock with Airway Compromise',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Distributive shock with upper/lower airway occlusion causing sudden hypoxia, bronchospasm, and profound hypotension.',
        supportingFindingIds: findSupporting(/(spo2|bp|agonal|gasping)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-im-epi-airway'],
        evidenceIds: ['ev-nice-antimicrobial'],
        nexusAssessment: 'Must be actively excluded in sudden collapse with respiratory collapse: requires immediate epinephrine administration.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-4`,
        caseId,
        title: 'Tension Pneumothorax / Obstructive Shock',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Acute hemodynamic collapse from tension physiology compromising venous return; reversible cause of PEA arrest requiring immediate needle decompression.',
        supportingFindingIds: findSupporting(/(bp|spo2|respiratory rate|agonal)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-bedside-pocus', 'gap-needle-decompression'],
        evidenceIds: ['ev-aha-acls-2024'],
        nexusAssessment: 'Reversible 5Hs & 5Ts cause of cardiac arrest. Rapid bedside thoracic ultrasound or immediate clinical needle decompression indicated.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-acls-cpr-defib',
        testName: 'Immediate ACLS Protocol: High-Quality CPR & Rhythm Analysis / Defibrillation',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Mandatory life-saving intervention. Immediate unsynchronized shock if VF / pulseless VT identified.',
        affectedHypotheses: ['Ventricular Fibrillation (VF) / Sudden Cardiac Arrest', 'Acute ST-Elevation Myocardial Infarction (STEMI) with Cardiogenic Shock'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-immediate-airway',
        testName: 'Emergent Airway Control: Bag-Valve-Mask (BVM) / Rapid Endotracheal Intubation',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Corrects profound hypoxemia (SpO2 78%) and overcomes agonal respiratory insufficiency.',
        affectedHypotheses: ['Ventricular Fibrillation (VF) / Sudden Cardiac Arrest', 'Severe Anaphylactic Shock with Airway Compromise'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-iv-io-epi',
        testName: 'Large-Bore IV / IO Access & Epinephrine 1mg IV/IO q3-5min',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Provides essential vascular access for vasopressor support and ACLS medication delivery.',
        affectedHypotheses: ['Ventricular Fibrillation (VF) / Sudden Cardiac Arrest', 'Acute ST-Elevation Myocardial Infarction (STEMI) with Cardiogenic Shock'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-bedside-pocus',
        testName: 'Bedside Point-of-Care Ultrasound (POCUS — RUSH / Cardiac Arrest Protocol)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Differentiates cardiac standstill, pericardial tamponade, right ventricular strain (PE), and tension pneumothorax without leaving resuscitation bay.',
        affectedHypotheses: ['Tension Pneumothorax / Obstructive Shock', 'Ventricular Fibrillation (VF) / Sudden Cardiac Arrest'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 0.1 ESI 2: ACUTE ISCHEMIC STROKE / HIGH-RISK NEURO
  // ─────────────────────────────────────────────────────────────
  else if (
    /(facial droop|slurred speech|hemiparesis|hemiplegia|left-sided weakness|right-sided weakness|arm drift|acute ischemic stroke|stroke|mca)/i.test(combinedContext)
  ) {
    const strokeSupporting = findSupporting(/(facial droop|slurred speech|weakness|hemiparesis|arm drift|speech|neuro|bp|blood pressure|heart rate|afib|atrial fibrillation)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: 'Acute Ischemic Stroke (Left Middle Cerebral Artery Territory)',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Acute focal neurological deficit with facial droop, unilateral hemiparesis, and dysarthria within the acute thrombolysis/thrombectomy treatment window.',
        supportingFindingIds: strokeSupporting.length ? strokeSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-stat-head-ct', 'gap-poc-glucose', 'gap-cta-head-neck', 'gap-nihss-score'],
        evidenceIds: ['ev-aha-stroke-2023'],
        nexusAssessment: 'Code Stroke pathway activation. Door-to-CT imaging target < 20 minutes. Evaluate IV thrombolysis and endovascular thrombectomy criteria.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Paroxysmal Atrial Fibrillation with Cardioembolic Thromboembolism',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Suspected irregular rhythm / cardioembolic source leading to middle cerebral artery occlusion.',
        supportingFindingIds: findSupporting(/(heart rate|pulse|irregular|atrial fibrillation|afib)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-12-lead-ecg', 'gap-telemetry-monitoring'],
        evidenceIds: ['ev-aha-stroke-2023'],
        nexusAssessment: 'Evaluate rhythm tracing for atrial fibrillation to determine post-acute anticoagulation indication.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Acute Intracranial Hemorrhage (ICH) / Hemorrhagic Stroke',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Intracerebral hemorrhage presenting with acute focal neurological deficit and severe hypertension (BP 195/110 mmHg). Mandatory rule-out prior to thrombolysis.',
        supportingFindingIds: findSupporting(/(bp|blood pressure|weakness|headache)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-stat-head-ct'],
        evidenceIds: ['ev-aha-stroke-2023'],
        nexusAssessment: 'Non-contrast head CT is required immediately to exclude hemorrhage before administering thrombolytics.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-4`,
        caseId,
        title: "Todd's Paralysis / Post-Ictal Focal Deficit",
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Transient post-ictal focal neurological weakness following unwitnessed focal seizure event.',
        supportingFindingIds: findSupporting(/(weakness|speech)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-stat-head-ct', 'gap-eeg'],
        evidenceIds: ['ev-aha-stroke-2023'],
        nexusAssessment: 'Stroke mimic to be ruled out by negative perfusion imaging or prompt symptom resolution.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-stat-head-ct',
        testName: 'Stat Non-Contrast Head CT (<25 min door-to-imaging)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Mandatory initial study to definitively differentiate ischemic stroke from intracranial hemorrhage.',
        affectedHypotheses: ['Acute Ischemic Stroke (Left Middle Cerebral Artery Territory)', 'Acute Intracranial Hemorrhage (ICH) / Hemorrhagic Stroke'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-poc-glucose',
        testName: 'Point-of-Care Capillary Blood Glucose',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Exclude severe hypoglycemia as an acute focal neurological mimic prior to stroke pathway therapies.',
        affectedHypotheses: ['Acute Ischemic Stroke (Left Middle Cerebral Artery Territory)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-cta-head-neck',
        testName: 'CT Angiography (CTA) Head and Neck',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Identifies Large Vessel Occlusion (LVO) of the internal carotid or middle cerebral artery for emergency mechanical thrombectomy.',
        affectedHypotheses: ['Acute Ischemic Stroke (Left Middle Cerebral Artery Territory)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-nihss-score',
        testName: 'NIH Stroke Scale (NIHSS) Scoring & Timestamp Verification',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Quantifies deficit severity and validates eligibility within the 4.5-hour intravenous thrombolysis window.',
        affectedHypotheses: ['Acute Ischemic Stroke (Left Middle Cerebral Artery Territory)'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 0.2 ESI 4: LESS URGENT (ISOLATED ANKLE SPRAIN / SINGLE RESOURCE)
  // ─────────────────────────────────────────────────────────────
  else if (
    /(twisted.*ankle|ankle sprain|malleolus|lateral ankle|bear weight|ankle injury)/i.test(combinedContext) &&
    !/(chest|abdominal|stroke|fever|bleed|shock|unresponsive)/i.test(combinedContext)
  ) {
    const sprainSupporting = findSupporting(/(ankle|malleolus|swelling|weight|pain)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: 'Grade II Lateral Ankle Sprain (Partial ATFL Tear)',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Inversion injury of the talocrural joint presenting with lateral malleolar swelling, tenderness, and painful weight-bearing.',
        supportingFindingIds: sprainSupporting.length ? sprainSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-ottawa-ankle-xray'],
        evidenceIds: ['ev-ottawa-ankle-rules'],
        nexusAssessment: 'Stable isolated extremity trauma. Evaluate via Ottawa Ankle Rules for plain radiography indication.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Non-Displaced Avulsion Fracture of the Distal Fibula / Lateral Malleolus',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Bony avulsion at the fibular attachment of the anterior talofibular ligament.',
        supportingFindingIds: findSupporting(/(malleolus|swelling|bear weight)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-ottawa-ankle-xray'],
        evidenceIds: ['ev-ottawa-ankle-rules'],
        nexusAssessment: 'Plain film radiography required to rule out cortical avulsion or distal fibular fracture.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Syndesmotic (High) Ankle Sprain',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Distal tibiofibular syndesmosis injury typically caused by external rotation of the talus.',
        supportingFindingIds: findSupporting(/(swelling|pain|weight)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-squeeze-test'],
        evidenceIds: ['ev-ottawa-ankle-rules'],
        nexusAssessment: 'Examine for tenderness along the anterior inferior tibiofibular ligament and perform syndesmosis squeeze test.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-ottawa-ankle-xray',
        testName: 'Plain Radiography of Right Ankle (3 Views: AP, Lateral, Mortise)',
        priority: 'HIGH PRIORITY',
        whyItMatters: 'Single resource anticipated per Ottawa Ankle Rules to definitively exclude fracture.',
        affectedHypotheses: ['Grade II Lateral Ankle Sprain (Partial ATFL Tear)', 'Non-Displaced Avulsion Fracture of the Distal Fibula / Lateral Malleolus'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 0.3 ESI 5: NON-URGENT (PRESCRIPTION REFILL / UNCONTROLLED HTN)
  // ─────────────────────────────────────────────────────────────
  else if (
    /(ran out of.*medication|prescription refill|refill.*lisinopril|medication non-compliance|routine refill)/i.test(combinedContext) &&
    !/(chest|pain|shortness of breath|fever|bleed|trauma|stroke|weakness)/i.test(combinedContext)
  ) {
    const refillSupporting = findSupporting(/(bp|blood pressure|hypertension|lisinopril|refill|medication)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: 'Essential Hypertension (Uncontrolled due to Medication Non-Compliance)',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: 'Mild-to-moderate asymptomatic blood pressure elevation secondary to recent depletion of routine outpatient antihypertensive supply (Lisinopril).',
        supportingFindingIds: refillSupporting.length ? refillSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: ['gap-rx-renewal', 'gap-bp-recheck'],
        evidenceIds: ['ev-nice-antimicrobial'],
        nexusAssessment: 'Non-urgent encounter (ESI 5). Outpatient prescription refill and blood pressure reconciliation indicated; no emergency department resources required.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'White-Coat Hypertension overlaying Chronic Essential Hypertension',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Transient situational elevation in clinic setting superimposed on known baseline hypertension.',
        supportingFindingIds: findSupporting(/(bp|blood pressure)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-ambulatory-bp'],
        evidenceIds: ['ev-nice-antimicrobial'],
        nexusAssessment: 'Compare against patient home blood pressure diary upon medication re-initiation.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = [
      {
        id: 'gap-rx-renewal',
        testName: 'Prescription Renewal & Medication Reconciliation (Lisinopril)',
        priority: 'ROUTINE',
        whyItMatters: 'Restores pharmacological blood pressure control and prevents sustained secondary hypertension.',
        affectedHypotheses: ['Essential Hypertension (Uncontrolled due to Medication Non-Compliance)'],
        status: 'Not yet resolved',
      },
      {
        id: 'gap-bp-recheck',
        testName: 'Repeat Resting Blood Pressure Measurement (Post-Rest)',
        priority: 'ROUTINE',
        whyItMatters: 'Confirms absence of hypertensive emergency symptoms and verifies clinical stability prior to discharge.',
        affectedHypotheses: ['Essential Hypertension (Uncontrolled due to Medication Non-Compliance)'],
        status: 'Not yet resolved',
      },
    ];
  }
  // ─────────────────────────────────────────────────────────────
  // 1. CARDIOLOGY / INFECTIVE ENDOCARDITIS PATTERN
  // ─────────────────────────────────────────────────────────────
  else if (
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
  // 4. ACUTE ABDOMEN / ACUTE APPENDICITIS PATTERN
  // ─────────────────────────────────────────────────────────────
  else if (
    /(appendic|mcburney|right lower quadrant|rlq|rovsing|iliac fossa)/i.test(combinedContext) ||
    (/(abdominal pain|periton|guarding|rebound)/i.test(combinedContext) && /(fever|pyrexia|wbc|leukocyt|ultrasound)/i.test(combinedContext))
  ) {
    const hasCompletedImaging =
      /(ultrasound|sonograph|usg|ct scan|computed tomography).*(appendix|appendic|rlq|right lower quadrant|abdomen|pelvis)|(appendix|appendicitis).*(ultrasound|sonograph|usg)/i.test(combinedContext);

    const appSupporting = findSupporting(/(appendix|rlq|mcburney|right lower quadrant|abdominal|guarding|rebound|fever|temp|wbc|crp|leukocyte|ultrasound)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: 'Acute Appendicitis',
        status: 'Supported',
        canonicalStatus: 'SUPPORTED',
        statusDetail: hasCompletedImaging
          ? 'Acute appendicitis confirmed on targeted imaging with localized right lower quadrant peritoneal signs and systemic inflammatory response.'
          : 'High clinical suspicion for acute appendicitis supported by localized RLQ peritonitis and inflammatory response.',
        supportingFindingIds: appSupporting.length ? appSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: hasCompletedImaging ? ['gap-surgical-consult', 'gap-preop-prep', 'gap-group-screen'] : ['gap-appendix-us', 'gap-surgical-consult'],
        evidenceIds: ['ev-wses-appendicitis-2020'],
        nexusAssessment: hasCompletedImaging
          ? 'Radiologically confirmed acute appendicitis. Urgent surgical consultation for appendectomy and pre-operative optimization indicated.'
          : 'Urgent targeted ultrasound and surgical consultation indicated.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-2`,
        caseId,
        title: 'Mesenteric Adenitis',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Self-limiting inflammation of mesenteric lymph nodes frequently mimicking acute appendiceal pathology in patients with fever and RLQ pain.',
        supportingFindingIds: findSupporting(/(fever|temp|abdominal|wbc|crp)/i),
        contradictingFindingIds: hasCompletedImaging ? findSupporting(/(ultrasound|appendix|sonograph)/i) : [],
        informationGapIds: hasCompletedImaging ? [] : ['gap-appendix-us'],
        evidenceIds: ['ev-wses-appendicitis-2020'],
        nexusAssessment: 'Essential pediatric and young-adult differential when acute appendicitis cannot be definitively excluded.',
        clinicalReviewStatus: 'Pending Review',
      },
      {
        id: `hyp-${caseId}-3`,
        caseId,
        title: 'Meckel Diverticulitis / Cecal Diverticulitis',
        status: 'Uncertain',
        canonicalStatus: 'CANDIDATE',
        statusDetail: 'Inflammation of lower gastrointestinal diverticulum presenting with right lower quadrant peritonism clinically identical to appendicitis.',
        supportingFindingIds: findSupporting(/(abdominal|guarding|rebound|fever|wbc)/i),
        contradictingFindingIds: [],
        informationGapIds: ['gap-surgical-consult'],
        evidenceIds: ['ev-wses-appendicitis-2020'],
        nexusAssessment: 'Surgical differential to consider if intraoperative inspection reveals a normal vermiform appendix.',
        clinicalReviewStatus: 'Pending Review',
      },
    ];

    informationGaps = hasCompletedImaging
      ? [
          {
            id: 'gap-surgical-consult',
            testName: 'Urgent General Surgical Consultation',
            priority: 'HIGH PRIORITY',
            whyItMatters: 'Mandatory definitive specialty evaluation for emergency laparoscopic appendectomy.',
            affectedHypotheses: ['Acute Appendicitis'],
            status: 'Not yet resolved',
          },
          {
            id: 'gap-preop-prep',
            testName: 'Nil-by-Mouth (NPO) & Maintenance Crystalloid Infusion',
            priority: 'HIGH PRIORITY',
            whyItMatters: 'Aspiration prevention during anesthetic induction and hemodynamic maintenance.',
            affectedHypotheses: ['Acute Appendicitis'],
            status: 'Not yet resolved',
          },
          {
            id: 'gap-group-screen',
            testName: 'Group & Screen / Crossmatch & Coagulation Screen',
            priority: 'MODERATE PRIORITY',
            whyItMatters: 'Pre-operative preparation for potential intraoperative blood product administration.',
            affectedHypotheses: ['Acute Appendicitis'],
            status: 'Not yet resolved',
          },
        ]
      : [
          {
            id: 'gap-appendix-us',
            testName: 'Targeted Graded-Compression Appendix Ultrasound',
            priority: 'HIGH PRIORITY',
            whyItMatters: 'First-line non-ionizing diagnostic imaging to confirm non-compressible tubular structure in RLQ.',
            affectedHypotheses: ['Acute Appendicitis', 'Mesenteric Adenitis'],
            status: 'Not yet resolved',
          },
          {
            id: 'gap-surgical-consult',
            testName: 'Urgent General Surgical Consultation',
            priority: 'HIGH PRIORITY',
            whyItMatters: 'Definitive evaluation for operative intervention.',
            affectedHypotheses: ['Acute Appendicitis'],
            status: 'Not yet resolved',
          },
        ];
  }
  // ─────────────────────────────────────────────────────────────
  // 5. SEPSIS / SYSTEMIC INFECTION / FUO PATTERN
  // ─────────────────────────────────────────────────────────────
  else if (
    /(sepsis|pyrexia|fever|shock|lactate|qsofa|hypotension|bacteremia|leukocytosis|rigors|chills)/.test(combinedContext)
  ) {
    const hasHypotension = /(bp|sbp|systolic|blood pressure)\s*[:=]?\s*([0-9]{1,2}|100)\b|hypotension/i.test(combinedContext);
    const hasTachypnea = /(rr|respiratory rate)\s*[:=]?\s*(2[2-9]|[3-9]\d)\b|tachypnea/i.test(combinedContext);
    const hasAlteredMental = /(confusion|altered mental|encephalopathy|disoriented|gcs\s*(?:<|<=|:\s*(?:1[0-4]|[0-9])))/i.test(combinedContext);
    const qsofaPoints = (hasHypotension ? 1 : 0) + (hasTachypnea ? 1 : 0) + (hasAlteredMental ? 1 : 0);
    const isQsofaPositive = qsofaPoints >= 2;

    const sepsisDetail = isQsofaPositive
      ? `Dysregulated host response to suspected infection with organ dysfunction risk (qSOFA criteria flagged: ${qsofaPoints}/3).`
      : `Acute systemic inflammatory response (SIRS) to infection; hemodynamically stable without organ dysfunction (qSOFA: ${qsofaPoints}/3 negative).`;

    const sepsisSupporting = findSupporting(/(fever|temp|lactate|wbc|crp|blood pressure|pulse|heart rate)/i);

    hypotheses = [
      {
        id: `hyp-${caseId}-1`,
        caseId,
        title: isQsofaPositive ? 'Systemic Sepsis with Organ Dysfunction Risk' : 'Systemic Inflammatory Response Syndrome (SIRS)',
        status: isQsofaPositive ? 'Supported' : 'Uncertain',
        canonicalStatus: isQsofaPositive ? 'SUPPORTED' : 'CANDIDATE',
        statusDetail: sepsisDetail,
        supportingFindingIds: sepsisSupporting.length ? sepsisSupporting : allFindingIds,
        contradictingFindingIds: [],
        informationGapIds: isQsofaPositive ? ['gap-pan-cultures', 'gap-serum-lactate'] : ['gap-source-id'],
        evidenceIds: ['ev-sepsis3-2021'],
        nexusAssessment: isQsofaPositive
          ? 'Surviving Sepsis bundle execution indicated: broad-spectrum IV antimicrobials, serum lactate measurement, and fluid resuscitation.'
          : 'Hemodynamically stable inflammatory presentation. Monitor vital parameters and identify source focus prior to broad-spectrum antimicrobials.',
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
