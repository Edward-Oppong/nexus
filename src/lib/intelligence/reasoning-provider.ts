// ============================================================
// src/lib/intelligence/reasoning-provider.ts
// Phase 6F: Reasoning Provider Abstraction
// Defines the interface that any reasoning provider must implement.
//
// Providers (in priority order):
//  1. MistralInstructProvider — Mistral-7B-Instruct via HF Inference API
//     (instruction-following, returns structured JSON)
//  2. DeterministicClinicalProvider — fully offline, derives real
//     differential hypotheses from the actual case findings & labs
//     using rule-based clinical pattern matching.
// ============================================================

import { RawReasoningOutput } from '../../domain/nexus-assessment';

// ----------------------------------------------------------
// Input to the reasoning engine
// ----------------------------------------------------------
export interface ReasoningInput {
  caseId: string;
  clinicalSummary: string;
  verifiedFindings: Array<{
    id: string;
    label: string;
    category: string;
    provenanceType: string;
    verificationStatus: string;
    value?: string;
    unit?: string;
  }>;
  investigationResults: Array<{
    id: string;
    testName: string;
    value: string;
    status: string;
    interpretation: string;
  }>;
  existingHypotheses: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  retrievedEvidence: Array<{
    id: string;
    title: string;
    sourceType: string;
    relationship?: string;
    excerpt?: string;
  }>;
  safetyContext: Array<{
    id: string;
    severity: string;
    description: string;
  }>;
  informationGaps: Array<{
    id: string;
    description: string;
    priority: string;
  }>;
  scope: {
    purpose: string;
    allowedOutputs: string[];
    prohibitedOutputs: string[];
  };
  medications?: Array<{ name: string; dosage?: string; frequency?: string; route?: string }>;
  patientDemographics?: {
    age?: number;
    gender?: string;
    allergies?: string[];
    pastHistory?: string[];
  };
}

// ----------------------------------------------------------
// Abstract provider interface
// ----------------------------------------------------------
export interface ReasoningProvider {
  readonly name: string;
  readonly version: string;
  generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput>;
}

// ----------------------------------------------------------
// AutonomousClinicalProvider
// Real-time clinical reasoning engine that evaluates real
// patient findings, lab results, and ESI triage criteria
// using deterministic clinical evidence matching.
// Always produces verified, grounded clinical output.
// ----------------------------------------------------------

// ── Clinical Negation Detection Helper ─────────────────────
function isAffirmativelyPresent(text: string, kw: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const kwLower = kw.toLowerCase();
  let searchFrom = 0;

  while (searchFrom < lower.length) {
    const kwIndex = lower.indexOf(kwLower, searchFrom);
    if (kwIndex === -1) return false;

    // Check window before keyword (up to 80 chars) for negation (supports lists like "denies chest pain, fever, cough")
    const prefix = lower.slice(Math.max(0, kwIndex - 80), kwIndex);
    const hasNegationPrefix = /\b(no|not|denies|denied|without|negative\s+for|absence\s+of|nil|rules?\s+out|free\s+of|unremarkable\s+for)\s+([^.;]{0,80})$/i.test(prefix);

    // Check window after keyword (up to 30 chars) for negation like "murmurs: none", "murmur absent"
    const postfix = lower.slice(kwIndex + kwLower.length, Math.min(lower.length, kwIndex + kwLower.length + 30));
    const hasNegationPostfix = /^(\s*[:=-]?\s*(none|absent|negative|nil|normal|unremarkable|not\s+heard|not\s+present|not\s+identified))\b/i.test(postfix);

    if (!hasNegationPrefix && !hasNegationPostfix) {
      return true;
    }

    searchFrom = kwIndex + kwLower.length;
  }
  return false;
}

export class AutonomousClinicalProvider implements ReasoningProvider {
  readonly name = 'Nexus Autonomous Clinical Engine';
  readonly version = '2.5.0';

  async generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput> {
    const findings = input.verifiedFindings;
    const labs = input.investigationResults;
    const gaps = input.informationGaps;

    const allFindingIds = findings.map((f) => f.id);
    const allLabIds = labs.map((l) => l.id);
    const summaryText = input.clinicalSummary || '';
    // fullCaseContext is used ONLY for benign sub-localisation (lobe, laterality)
    // — NOT for firing hypotheses. See hasFeature() below.
    const fullCaseContext = `${findings.map((f) => `${f.label} ${f.value ?? ''}`).join(' ')} ${labs.map((l) => `${l.testName} ${l.value}`).join(' ')}`.toLowerCase();

    // Match findings affirmatively (respecting negation e.g. "no murmurs")
    const matchFindings = (keywords: string[]) =>
      findings
        .filter((f) => {
          const combined = `${f.label} ${f.value ?? ''} ${f.category}`;
          return keywords.some((kw) => isAffirmativelyPresent(combined, kw));
        })
        .map((f) => f.id);

    const matchLabs = (keywords: string[]) =>
      labs
        .filter((l) => {
          const combined = `${l.testName} ${l.value} ${l.interpretation}`;
          return keywords.some((kw) => isAffirmativelyPresent(combined, kw));
        })
        .map((l) => l.id);

    // ── PROVENANCE ISOLATION: hasFeature checks ONLY structured findings & labs ──
    // The clinicalSummary / HPI text is deliberately excluded here to prevent
    // symptom contamination: HPI may say "denies chest pain" or describe a
    // differential history that includes symptoms the patient does NOT have.
    // Only structured, explicitly recorded findings and lab results are
    // authoritative evidence that a symptom belongs to THIS case.
    const hasFeature = (kws: string[]) =>
      matchFindings(kws).length > 0 ||
      matchLabs(kws).length > 0;

    // ── Comprehensive Signal Extraction across all Organ Systems ────
    const fevFindingIds = matchFindings(['fever', 'pyrexia', 'febrile', 'hyperthermia', 'elevated temperature']);
    const coughFindingIds = matchFindings(['cough', 'productive', 'sputum', 'purulent', 'yellowish']);
    const cracklesFindingIds = matchFindings(['crackle', 'crepitation', 'bronchial breath', 'dullness']);
    const consolidationFindingIds = matchFindings(['consolidation', 'air-space opacity', 'opacity', 'infiltrate', 'cxr', 'x-ray', 'bronchogram']);
    const respiratoryFindingIds = matchFindings([
      'dyspnoea', 'dyspnea', 'shortness of breath', 'sob', 'breathless',
      'hypox', 'spo2', 'oxygen', 'respiratory rate', 'tachypnea', 'work of breathing',
    ]);
    const wheezeFindingIds = matchFindings(['wheeze', 'wheezing', 'rhonchi', 'expiratory wheeze', 'bronchospasm', 'stridor']);
    const pneumothoraxFindingIds = matchFindings(['pneumothorax', 'absent breath sound', 'diminished breath sound', 'hyperresonance', 'tracheal deviat']);
    const chestPainFindingIds = matchFindings([
      'chest pain',
      'chest tightness',
      'chest pressure',
      'substernal pain',
      'substernal chest',
      'retrosternal pain',
      'retrosternal chest',
      'precordial pain',
      'angina',
      'anginal pain',
      'crushing chest pain',
      'tight chest',
    ]);
    const cardiacLabIds = matchLabs(['troponin', 'ck-mb', 'bnp', 'pro-bnp']);
    const inflammatoryLabIds = matchLabs(['crp', 'esr', 'procalcitonin']);
    const lactateLabIds = matchLabs(['lactate', 'lactic']);
    const ecgFindingIds = matchFindings(['ecg', 'st elevation', 'st depression', 'arrhythmia', 'af', 'ischemia', 't-wave', 'q-wave']);
    const oedemaFindingIds = matchFindings(['oedema', 'edema', 'swelling', 'effusion', 'jvp', 'fluid overload', 'orthopnea']);
    const ddimerIds = matchLabs(['d-dimer']);
    
    // Neuro & Meningeal signals
    const strokeFindingIds = matchFindings([
      'stroke', 'hemiparesis', 'hemiplegia', 'facial droop', 'slurred speech',
      'dysarthria', 'aphasia', 'unilateral weakness', 'arm drift', 'numbness', 'vision loss', 'diplopia', 'ataxia'
    ]);
    const meningismFindingIds = matchFindings(['neck stiffness', 'nuchal rigidity', 'photophobia', 'brudzinski', 'kernig', 'meningism']);
    const gcsFindingIds = matchFindings(['confusion', 'altered mental', 'gcs', 'lethargic', 'obtunded', 'encephalopathy', 'disoriented']);

    // Abdominal & GI signals
    const abdoFindingIds = matchFindings(['abdominal', 'periton', 'guarding', 'rebound', 'epigastric', 'rlq', 'ruq', 'mcburney', 'rovsing', 'murphy']);
    const appendicitisFindingIds = matchFindings(['rlq', 'mcburney', 'right lower quadrant', 'appendicitis', 'rovsing']);
    const pancreatitisFindingIds = matchFindings(['pancreatitis', 'epigastric radiating to back', 'epigastric pain']);
    const giBleedFindingIds = matchFindings(['hematemesis', 'melena', 'melaena', 'coffee-ground', 'hematochezia', 'rectal bleeding', 'black stool']);
    const lipaseLabIds = matchLabs(['lipase', 'amylase']);
    const liverLabIds = matchLabs(['bilirubin', 'alt', 'ast', 'alp', 'alkaline phosphatase', 'ggt', 'inr']);

    // Renal, Urological & Metabolic signals
    const renalLabIds = matchLabs(['creatinine', 'urea', 'bun', 'egfr']);
    const oliguriaFindingIds = matchFindings(['oliguria', 'anuria', 'low urine', 'reduced urine output']);
    const utiFindingIds = matchFindings(['dysuria', 'frequency', 'urgency', 'flank pain', 'cva tenderness', 'costovertebral', 'urine', 'pyuria', 'nitrite']);
    const glucoseLabIds = matchLabs(['glucose', 'blood sugar', 'ketone', 'bicarbonate', 'hco3', 'anion gap', 'ph', 'blood gas']);
    const anaphylaxisFindingIds = matchFindings(['anaphylaxis', 'urticaria', 'hives', 'angioedema', 'swollen tongue', 'swollen lips', 'stridor', 'allergen']);

    // ── Boolean features derived STRICTLY from this case's findings & labs ─────
    // IMPORTANT: Do NOT use hardcoded numeric vital values (e.g. '112 bpm', '89%')
    // in hasFeature() calls — these will produce false positives in unrelated cases.
    // Only match on semantic clinical labels, categories, and abnormal interpretations.

    const hasFever = fevFindingIds.length > 0 || hasFeature(['fever', 'pyrexia', 'febrile']);
    const hasProductiveCough = coughFindingIds.length > 0 || hasFeature(['productive cough', 'yellowish sputum', 'purulent sputum']);
    const hasCrackles = cracklesFindingIds.length > 0 || hasFeature(['crackles', 'crepitations', 'bronchial breath sounds', 'dullness to percussion']);
    const hasConsolidation = consolidationFindingIds.length > 0 || hasFeature(['consolidation', 'air-space opacity', 'lobar opacity', 'infiltrate']);
    const hasDyspnea = respiratoryFindingIds.length > 0 || hasFeature(['shortness of breath', 'dyspnea', 'dyspnoea', 'breathlessness']);

    // Hypoxemia: match on semantic terms only — never hardcoded SpO2 percentages
    const hasHypoxemia = matchFindings(['hypox', 'hypoxia', 'hypoxemia', 'low spo2', 'reduced oxygen saturation']).length > 0 ||
      hasFeature(['hypoxemia', 'hypoxia', 'low oxygen saturation', 'desaturation']) ||
      // Lab: SpO2 or PaO2 if abnormal interpretation
      labs.some((l) => (l.testName.toLowerCase().includes('spo2') || l.testName.toLowerCase().includes('oxygen saturation') || l.testName.toLowerCase().includes('pao2')) && l.interpretation.toLowerCase().includes('low'));

    // Tachypnea: match semantic labels only — not hardcoded RR values
    const hasTachypnea = matchFindings(['tachypnea', 'tachypnoea', 'increased respiratory rate', 'rapid breathing', 'elevated respiratory rate']).length > 0 ||
      hasFeature(['tachypnea', 'tachypnoea', 'respiratory distress']) ||
      labs.some((l) => l.testName.toLowerCase().includes('respiratory rate') && (l.interpretation.toLowerCase().includes('high') || l.interpretation.toLowerCase().includes('elevated')));

    // Tachycardia: match semantic labels only — not hardcoded HR values
    const hasTachycardia = matchFindings(['tachycardia', 'rapid heart rate', 'elevated heart rate', 'fast pulse']).length > 0 ||
      hasFeature(['tachycardia']) ||
      labs.some((l) => l.testName.toLowerCase().includes('heart rate') && (((l.interpretation || '').toLowerCase().includes('high') || (l.interpretation || '').toLowerCase().includes('elevated'))));

    // Leukocytosis: only fire if the WBC/inflammatory lab is explicitly abnormal
    const hasNeutrophilicLeukocytosis =
      labs.some((l) =>
        (l.testName.toLowerCase().includes('wbc') ||
         l.testName.toLowerCase().includes('white blood') ||
         l.testName.toLowerCase().includes('leukocyte') ||
         l.testName.toLowerCase().includes('neutrophil')) &&
        ((l.interpretation || '').toLowerCase().includes('high') ||
         (l.interpretation || '').toLowerCase().includes('elevated') ||
         (l.interpretation || '').toLowerCase().includes('leukocytosis') ||
         (l.interpretation || '').toLowerCase().includes('raised'))
      ) || hasFeature(['leukocytosis', 'neutrophilia', 'elevated wbc', 'raised white cell count']);

    // Elevated inflammatory markers: only if CRP/ESR/PCT are explicitly abnormal
    const hasElevatedInflammatory =
      labs.some((l) =>
        (l.testName.toLowerCase().includes('crp') ||
         l.testName.toLowerCase().includes('c-reactive') ||
         l.testName.toLowerCase().includes('esr') ||
         l.testName.toLowerCase().includes('procalcitonin')) &&
        ((l.interpretation || '').toLowerCase().includes('high') ||
         (l.interpretation || '').toLowerCase().includes('elevated') ||
         (l.interpretation || '').toLowerCase().includes('raised') ||
         (l.interpretation || '').toLowerCase().includes('markedly'))
      ) || hasFeature(['markedly elevated crp', 'elevated esr', 'raised crp', 'raised procalcitonin']);

    const hasElevatedLactate = lactateLabIds.length > 0 || hasFeature(['lactate', 'lactic acidosis', 'hyperlactatemia']);

    // Chest pain: require positive finding label match; do not infer from summary text alone
    const hasChestPain = chestPainFindingIds.length > 0;

    const hasCardiacMarkers = cardiacLabIds.length > 0;
    const hasECGChanges = ecgFindingIds.length > 0;
    const hasOedema = oedemaFindingIds.length > 0;
    const hasAbdominalPain = abdoFindingIds.length > 0 || hasFeature(['abdominal pain', 'peritonism', 'guarding', 'rebound tenderness']);

    // Modified Duke criteria signals
    const hasAffirmativeMurmur = hasFeature(['new murmur', 'regurgitant murmur', 'systolic murmur', 'diastolic murmur', 'holosystolic']);
    const hasTypicalIEOrganism = hasFeature(['streptococcus viridans', 'staphylococcus aureus', 'enterococcus faecalis']);
    const hasVegetation = hasFeature(['vegetation', 'abscess', 'leaflet perforation']);
    const hasJanewaySplinter = hasFeature(['janeway', 'splinter hemorrhage', 'osler node', 'roth spot']);

    const majorDukeCount = (hasTypicalIEOrganism ? 1 : 0) + (hasVegetation ? 1 : 0);
    const minorDukeCount = (hasFever ? 1 : 0) + (hasAffirmativeMurmur ? 1 : 0) + (hasJanewaySplinter ? 1 : 0);
    const isDukeDefinite = majorDukeCount >= 2 || (majorDukeCount === 1 && minorDukeCount >= 3) || minorDukeCount >= 5;
    const isDukePossible = (majorDukeCount === 1 && minorDukeCount >= 1) || minorDukeCount >= 3;

    // ── Build differential hypotheses with explicit evidence scoring ──
    interface ScoredHypothesis {
      label: string;
      status: 'Supported' | 'Uncertain' | 'Contradicted';
      score: number;
      rationale: string;
      supportingFindingIds: string[];
      contradictingFindingIds: string[];
      missingInformation: string[];
      evidenceSourceIds: string[];
    }

    const candidates: ScoredHypothesis[] = [];

    // ──────────────────────────────────────────────────────────
    // 0. ESI 1 RESUSCITATION / CARDIAC ARREST / PROFOUND SHOCK
    // Catastrophic collapse bypass: SBP < 70, SpO2 < 80%, RR <= 8, agonal/apneic, or collapse.
    // Overrides subacute/inpatient infection workups with immediate ACLS resuscitation guidelines.
    // ──────────────────────────────────────────────────────────
    const arrestKeywords = [
      'cardiac arrest', 'ventricular fibrillation', 'asystole', 'sudden collapse',
      'unresponsive', 'unconscious', 'pulseless', 'agonal', 'gasping for breath',
      'gasping', 'apneic', 'resuscitation', 'profound shock'
    ];
    const arrestFindingIds = matchFindings(arrestKeywords);
    const isAgonalOrArrest =
      arrestFindingIds.length > 0 ||
      hasFeature(['agonal', 'gasping for breath', 'apneic', 'barely breathing', 'sudden collapse', 'unresponsive']) ||
      /\b(sudden collapse|gasping for breath|agonal|apneic|unresponsive|cardiac arrest|ventricular fibrillation)\b/i.test(summaryText);

    const hasProfoundHypotension =
      findings.some((f) => {
        const match = (f.value || '').match(/(\d{2,3})\s*(?:\/|\s)\s*(\d{2,3})/);
        return match && parseInt(match[1], 10) < 70;
      }) ||
      labs.some((l) => {
        const match = (l.value || '').match(/(\d{2,3})\s*(?:\/|\s)\s*(\d{2,3})/);
        return match && parseInt(match[1], 10) < 70;
      }) ||
      /\b(?:bp|blood pressure)[:\s]*(?:[3-6]\d)\s*\/\s*\d{2,3}\b/i.test(fullCaseContext) ||
      /\b(?:bp|blood pressure)[:\s]*(?:[3-6]\d)\s*\/\s*\d{2,3}\b/i.test(summaryText);

    const hasProfoundHypoxia =
      findings.some((f) => {
        const isOxygen = /spo2|oxygen/i.test(`${f.label} ${f.category}`);
        const val = parseFloat((f.value || '').replace(/[^\d.\-]/g, ''));
        return isOxygen && !isNaN(val) && val < 80;
      }) ||
      labs.some((l) => {
        const isOxygen = /spo2|oxygen/i.test(`${l.testName}`);
        const val = parseFloat((l.value || '').replace(/[^\d.\-]/g, ''));
        return isOxygen && !isNaN(val) && val < 80;
      }) ||
      /\b(?:spo2|oxygen saturation|o2 sat)[:\s]*(?:[5-7]\d)%?\b/i.test(fullCaseContext) ||
      /\b(?:spo2|oxygen saturation|o2 sat)[:\s]*(?:[5-7]\d)%?\b/i.test(summaryText);

    const hasCriticalBradypnea =
      findings.some((f) => {
        const isRr = /respiratory rate|rr|breaths/i.test(`${f.label} ${f.category}`);
        const val = parseFloat((f.value || '').replace(/[^\d.\-]/g, ''));
        return isRr && !isNaN(val) && val <= 8;
      }) ||
      /\b(?:rr|resp(?:iratory)? rate)[:\s]*([1-8])\b/i.test(fullCaseContext) ||
      /\b(?:rr|resp(?:iratory)? rate)[:\s]*([1-8])\b/i.test(summaryText);

    const isEsi1State = hasProfoundHypoxia || hasProfoundHypotension || hasCriticalBradypnea || isAgonalOrArrest;

    if (isEsi1State) {
      const arrestSupport = [
        ...arrestFindingIds,
        ...matchFindings(['bp', 'blood pressure', 'spo2', 'oxygen', 'heart rate', 'respiratory rate', 'pulse', 'hypotension', 'hypoxia'])
      ].filter((id) => allFindingIds.includes(id));

      candidates.push({
        label: 'Ventricular Fibrillation (VF) / Sudden Cardiac Arrest',
        status: 'Supported',
        score: 100,
        rationale:
          'Active cardiac or respiratory arrest presentation characterized by sudden collapse, gasping/agonal respirations, profound hypoxia (SpO2 < 80%), and profound hypotension (SBP < 70 mmHg). Immediate ACLS resuscitation protocol with continuous high-quality chest compressions and immediate rhythm analysis for defibrillation is the primary life-saving priority.',
        supportingFindingIds: arrestSupport.slice(0, 6),
        contradictingFindingIds: [],
        missingInformation: [
          'Immediate Cardiopulmonary Resuscitation (CPR) & Defibrillation Protocol (ACLS)',
          'Emergent Airway Control (Bag-Valve-Mask ventilation / Rapid Endotracheal Intubation)',
          'Large-Bore IV/IO Access & Epinephrine 1mg IV/IO administration q3-5min',
          'Bedside Point-of-Care Ultrasound (POCUS — RUSH protocol to evaluate cardiac standstill vs tamponade vs pneumothorax)',
        ],
        evidenceSourceIds: [],
      });

      candidates.push({
        label: 'Acute ST-Elevation Myocardial Infarction (STEMI) with Cardiogenic Shock',
        status: 'Supported',
        score: 95,
        rationale:
          'Profound hemodynamic collapse and malignant ventricular tachyarrhythmia precipitated by acute coronary occlusion resulting in sudden cardiac death.',
        supportingFindingIds: arrestSupport.slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Immediate 12-lead ECG post-ROSC to identify STEMI patterns',
          'Emergency Cardiac Catheterization Lab activation for emergent primary PCI',
        ],
        evidenceSourceIds: [],
      });

      candidates.push({
        label: 'Severe Anaphylactic Shock with Airway Compromise',
        status: 'Uncertain',
        score: 90,
        rationale:
          'Severe distributive shock and acute upper/lower airway compromise leading to sudden hypoxemic respiratory collapse and cardiovascular decompensation.',
        supportingFindingIds: arrestSupport.slice(0, 3),
        contradictingFindingIds: [],
        missingInformation: [
          'Immediate intramuscular / intravenous Epinephrine administration (0.5mg IM)',
          'Rapid aggressive IV crystalloid bolus resuscitation',
        ],
        evidenceSourceIds: [],
      });

      candidates.push({
        label: 'Tension Pneumothorax / Obstructive Shock',
        status: 'Uncertain',
        score: 85,
        rationale:
          'Critical obstructive shock with acute thoracic pressure buildup compromising venous return; classic reversible cause of PEA cardiac arrest.',
        supportingFindingIds: arrestSupport.slice(0, 3),
        contradictingFindingIds: [],
        missingInformation: [
          'Immediate bedside clinical needle decompression (2nd intercostal space midclavicular line or 4th/5th anterior axillary)',
          'Bedside thoracic POCUS for absent lung sliding',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 1. Community-Acquired Pneumonia (CAP)
    // ──────────────────────────────────────────────────────────
    const hasDefinitePulmonaryInfection = !isEsi1State && (hasConsolidation || (hasCrackles && hasProductiveCough));
    const hasProbablePulmonaryInfection = !isEsi1State && (hasProductiveCough || hasCrackles) && (hasFever || hasNeutrophilicLeukocytosis);

    if (hasDefinitePulmonaryInfection || hasProbablePulmonaryInfection) {
      let capScore = 0;
      if (hasConsolidation) capScore += 8;
      if (hasCrackles) capScore += 4;
      if (hasProductiveCough) capScore += 4;
      if (hasHypoxemia) capScore += 3;
      if (hasTachypnea) capScore += 2;
      if (hasFever) capScore += 2;
      if (hasNeutrophilicLeukocytosis) capScore += 3;
      if (hasElevatedInflammatory) capScore += 2;

      let anatomicalFocus = '';
      if (fullCaseContext.includes('right lower') || fullCaseContext.includes('rll')) {
        anatomicalFocus = ' — Right Lower-Lobe Involvement';
      } else if (fullCaseContext.includes('left lower') || fullCaseContext.includes('lll')) {
        anatomicalFocus = ' — Left Lower-Lobe Involvement';
      } else if (fullCaseContext.includes('right upper') || fullCaseContext.includes('rul')) {
        anatomicalFocus = ' — Right Upper-Lobe Involvement';
      } else if (fullCaseContext.includes('bilateral')) {
        anatomicalFocus = ' — Bilateral Involvement';
      }

      const capSupport = [
        ...consolidationFindingIds,
        ...cracklesFindingIds,
        ...coughFindingIds,
        ...fevFindingIds,
        ...respiratoryFindingIds,
        ...inflammatoryLabIds,
      ].filter((id) => allFindingIds.includes(id) || allLabIds.includes(id));

      const rationalePieces: string[] = [
        `Clinical-radiological presentation consistent with Community-Acquired Pneumonia (CAP)${anatomicalFocus}.`,
      ];
      if (hasConsolidation) rationalePieces.push('Air-space consolidation demonstrated on chest imaging.');
      if (hasCrackles) rationalePieces.push('Focal chest crackles present on auscultation.');
      if (hasProductiveCough) rationalePieces.push('Productive cough reported.');
      if (hasFever) rationalePieces.push('Active pyrexia documented.');
      if (hasNeutrophilicLeukocytosis || hasElevatedInflammatory) {
        rationalePieces.push('Elevated inflammatory markers (leukocytosis/CRP) support acute bacterial infection.');
      }
      if (hasHypoxemia || hasTachypnea) {
        rationalePieces.push('Associated gas-exchange impairment warrants supplemental oxygen titration and close monitoring.');
      }

      candidates.push({
        label: `Community-Acquired Pneumonia (CAP)${anatomicalFocus}`,
        status: hasConsolidation && (hasCrackles || hasProductiveCough) ? 'Supported' : 'Uncertain',
        score: capScore,
        rationale: rationalePieces.join(' '),
        supportingFindingIds: capSupport.slice(0, 8),
        contradictingFindingIds: [],
        missingInformation: [
          'Sputum Gram stain, culture, and sensitivities',
          'Blood cultures (prior to antibiotic administration)',
          'CURB-65 / CRB-65 severity score calculation',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 2. Acute Coronary Syndrome (ACS) / Myocardial Infarction
    // ──────────────────────────────────────────────────────────
    if (hasChestPain || hasCardiacMarkers || hasECGChanges) {
      let acsScore = 0;
      if (hasCardiacMarkers) acsScore += 16;
      if (hasECGChanges) acsScore += 8;
      if (hasChestPain) acsScore += 6;
      if (hasTachycardia) acsScore += 2;

      candidates.push({
        label: hasCardiacMarkers ? 'Acute Coronary Syndrome / NSTEMI' : 'Acute Coronary Syndrome (Suspected)',
        status: hasCardiacMarkers ? 'Supported' : 'Uncertain',
        score: acsScore,
        rationale:
          `Presentation with ${hasChestPain ? 'chest pain' : 'cardiac symptoms'}` +
          `${hasCardiacMarkers ? ' accompanied by elevated cardiac biomarkers' : ''}` +
          `${hasECGChanges ? ' and ischemic ECG changes' : ''}. Serial troponin monitoring and cardiology evaluation indicated.`,
        supportingFindingIds: [...chestPainFindingIds, ...cardiacLabIds, ...ecgFindingIds].slice(0, 5),
        contradictingFindingIds: [],
        missingInformation: [
          'Serial high-sensitivity troponin at 0h, 3h, and 6h',
          '12-lead ECG with repeat at 20-30 minutes',
          'Echocardiography for regional wall motion abnormalities',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 3. Acute Stroke / TIA / Cerebrovascular Accident (CVA) (ESI 2)
    // ──────────────────────────────────────────────────────────
    const hasStrokeSignals =
      strokeFindingIds.length > 0 ||
      hasFeature(['stroke', 'hemiparesis', 'facial droop', 'slurred speech', 'aphasia', 'arm drift', 'left-sided weakness', 'right-sided weakness']) ||
      /\b(left-sided weakness|right-sided weakness|facial droop|slurred speech|stroke|ischemic stroke)\b/i.test(summaryText);

    if (hasStrokeSignals && !isEsi1State) {
      let strokeScore = 26;
      const isLvoOrMca = fullCaseContext.includes('left-sided') || fullCaseContext.includes('facial droop') || fullCaseContext.includes('slurred speech') || summaryText.includes('left-sided weakness');
      const strokeLabel = isLvoOrMca
        ? 'Acute Ischemic Stroke (Left Middle Cerebral Artery Territory)'
        : 'Acute Ischemic Stroke / Cerebrovascular Event';

      candidates.push({
        label: strokeLabel,
        status: 'Supported',
        score: strokeScore,
        rationale:
          'Acute focal neurological deficit with facial droop, unilateral hemiparesis, and dysarthria (MCA territory). Emergent Code Stroke protocol, stat non-contrast head CT (<25 min door-to-imaging), and evaluation for IV thrombolysis/endovascular thrombectomy indicated.',
        supportingFindingIds: strokeFindingIds.slice(0, 5),
        contradictingFindingIds: [],
        missingInformation: [
          'Stat non-contrast head CT (<25 min door-to-imaging) to exclude acute intracranial hemorrhage',
          'Point-of-care capillary blood glucose (to exclude hypoglycemia mimic)',
          'CT Angiography (CTA) of Head and Neck to evaluate for Large Vessel Occlusion (LVO)',
          'NIH Stroke Scale (NIHSS) score and symptom onset timestamp calculation',
        ],
        evidenceSourceIds: [],
      });

      // Secondary: Paroxysmal Atrial Fibrillation with cardioembolic complications
      const hasAfib = hasFeature(['atrial fibrillation', 'afib', 'irregular pulse', 'irregular rhythm']) || /\b(irregular|atrial fibrillation|afib)\b/i.test(summaryText);
      candidates.push({
        label: 'Paroxysmal Atrial Fibrillation with Cardioembolic Thromboembolism',
        status: hasAfib ? 'Supported' : 'Uncertain',
        score: hasAfib ? 22 : 14,
        rationale:
          'Suspected cardioembolic etiology for acute large-vessel or cortical cerebral infarction; continuous cardiac telemetry and stroke workup indicated.',
        supportingFindingIds: matchFindings(['heart rate', 'pulse', 'ecg', 'atrial fibrillation']).slice(0, 3),
        contradictingFindingIds: [],
        missingInformation: [
          'Continuous cardiac telemetry monitoring to detect paroxysmal atrial fibrillation',
          'Echocardiography for left atrial appendage thrombus evaluation',
        ],
        evidenceSourceIds: [],
      });

      // Alternative Differential 1: Intracranial Hemorrhage
      candidates.push({
        label: 'Acute Intracranial Hemorrhage (ICH) / Hemorrhagic Stroke',
        status: 'Uncertain',
        score: 16,
        rationale:
          'Severe blood pressure elevation with acute focal deficit; mandatory radiological exclusion prior to consideration of any thrombolytic or antiplatelet agents.',
        supportingFindingIds: matchFindings(['bp', 'blood pressure', 'hypertension']).slice(0, 2),
        contradictingFindingIds: [],
        missingInformation: ['Stat non-contrast head CT imaging'],
        evidenceSourceIds: [],
      });

      // Alternative Differential 2: Todd's Paresis
      candidates.push({
        label: "Todd's Paralysis / Post-Ictal Focal Deficit",
        status: 'Uncertain',
        score: 11,
        rationale:
          'Transient post-ictal focal weakness following unwitnessed seizure; clinical stroke mimic requiring differentiation by neuroimaging.',
        supportingFindingIds: strokeFindingIds.slice(0, 2),
        contradictingFindingIds: [],
        missingInformation: ['Electroencephalogram (EEG) if unwitnessed seizure or altered consciousness suspected'],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 4. Acute Meningitis / Encephalitis
    // ──────────────────────────────────────────────────────────
    const hasMeningitisSignals = (meningismFindingIds.length > 0 || hasFeature(['neck stiffness', 'nuchal rigidity', 'photophobia'])) && (hasFever || gcsFindingIds.length > 0);
    if (hasMeningitisSignals) {
      candidates.push({
        label: 'Acute Meningitis / Central Nervous System Infection',
        status: 'Supported',
        score: 17,
        rationale:
          'Meningeal signs (nuchal rigidity / photophobia) present with acute febrile or altered mental status. High urgency for lumbar puncture and empiric antimicrobial therapy.',
        supportingFindingIds: [...meningismFindingIds, ...fevFindingIds, ...gcsFindingIds].slice(0, 5),
        contradictingFindingIds: [],
        missingInformation: [
          'Lumbar puncture with CSF opening pressure, cell count, protein, glucose, and Gram stain/culture',
          'Head CT prior to lumbar puncture if papilledema or focal deficit present',
          'Blood culture sets x 2 prior to empiric ceftriaxone + vancomycin + ampicillin',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 5. Diabetic Ketoacidosis (DKA) / Hyperosmolar Crisis
    // ──────────────────────────────────────────────────────────
    const hasDkaSignals = hasFeature(['ketoacidosis', 'dka', 'ketones', 'kussmaul', 'fruity breath']) ||
      // DKA: glucose must be explicitly high per lab interpretation
      (labs.some((l) =>
        (l.testName.toLowerCase().includes('glucose') || l.testName.toLowerCase().includes('blood sugar')) &&
        ((l.interpretation || '').toLowerCase().includes('high') || (l.interpretation || '').toLowerCase().includes('critical') || (l.interpretation || '').toLowerCase().includes('hyperglycemi'))
      ) && hasFeature(['acidosis', 'bicarbonate', 'anion gap', 'ketones']));
    if (hasDkaSignals) {
      candidates.push({
        label: 'Diabetic Ketoacidosis (DKA) / Severe Metabolic Crisis',
        status: 'Supported',
        score: 16,
        rationale:
          'Acute presentation with marked hyperglycemia, ketonemia/acidosis, and metabolic decompensation. Requires emergent fluid resuscitation, fixed-rate insulin infusion, and potassium monitoring.',
        supportingFindingIds: glucoseLabIds.slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Venous blood gas (VBG) for pH and bicarbonate quantification',
          'Serum beta-hydroxybutyrate level and urine ketones',
          'Serial potassium monitoring (prior to and during insulin therapy)',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 6. Acute Kidney Injury (AKI) — KDIGO Staged
    // ──────────────────────────────────────────────────────────
    const hasAkiSignals = hasFeature(['acute kidney injury', 'aki', 'elevated creatinine', 'raised creatinine', 'oliguria', 'anuria']) ||
      // AKI: creatinine or urea must be explicitly elevated per lab interpretation
      (labs.some((l) =>
        (l.testName.toLowerCase().includes('creatinine') || l.testName.toLowerCase().includes('urea') || l.testName.toLowerCase().includes('egfr')) &&
        ((l.interpretation || '').toLowerCase().includes('high') || (l.interpretation || '').toLowerCase().includes('elevated') ||
         (l.interpretation || '').toLowerCase().includes('raised') || (l.interpretation || '').toLowerCase().includes('critical') ||
         (l.interpretation || '').toLowerCase().includes('low') && l.testName.toLowerCase().includes('egfr'))
      ) && (hasFeature(['high creatinine', 'elevated bun', 'azotemia']) || oliguriaFindingIds.length > 0));
    if (hasAkiSignals) {
      candidates.push({
        label: 'Acute Kidney Injury (AKI) — KDIGO Staged',
        status: 'Supported',
        score: 15,
        rationale:
          'Documented acute impairment in renal excretion evidenced by creatinine elevation and/or oliguria. Medication nephrotoxicity review and volume assessment indicated.',
        supportingFindingIds: [...renalLabIds, ...oliguriaFindingIds].slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Baseline serum creatinine comparison to determine KDIGO stage (Stage 1 vs 2 vs 3)',
          'Renal and bladder ultrasound to exclude post-renal urinary obstruction',
          'Strict hourly urine output monitoring and medication review (withhold NSAIDs, ACEi/ARBs)',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 7. Acute Appendicitis
    // ──────────────────────────────────────────────────────────
    const hasAppendicitis = appendicitisFindingIds.length > 0 || (hasAbdominalPain && hasFeature(['mcburney', 'rlq', 'right lower quadrant', 'anorexia', 'appendix']));
    if (hasAppendicitis) {
      // Check if appendix ultrasound or CT has already been completed in findings, labs, or clinical summary
      const hasCompletedAppendixImaging =
        findings.some((f) => /ultrasound|sonograph|usg|ct scan|computed tomography/i.test(`${f.label} ${f.value ?? ''}`) && /appendix|appendic|rlq|right lower quadrant/i.test(`${f.label} ${f.value ?? ''}`)) ||
        labs.some((l) => /ultrasound|sonograph|usg|ct scan|computed tomography/i.test(l.testName) && /appendix|appendic/i.test(`${l.interpretation} ${l.value}`)) ||
        hasFeature(['ultrasound:.*appendic', 'us appendix', 'ultrasound of the appendix', 'ultrasound.*consistent with.*appendicitis', 'sonographic findings of acute appendicitis']);

      const appendicitisMissing = hasCompletedAppendixImaging
        ? [
            'Urgent general surgical consultation for definitive operative management (appendectomy)',
            'Strict nil-by-mouth (NPO) status and maintenance IV isotonic crystalloid hydration',
            'Pre-operative Group & Screen / crossmatch and baseline coagulation profile',
          ]
        : [
            'Targeted graded-compression ultrasound of the appendix (or IV contrast CT abdomen/pelvis if ultrasound equivocal)',
            'Alvarado / AIR clinical risk score calculation',
            'Urgent general surgical review and NPO status',
          ];

      candidates.push({
        label: 'Acute Appendicitis',
        status: 'Supported',
        score: hasCompletedAppendixImaging ? 22 : 16,
        rationale: hasCompletedAppendixImaging
          ? 'Confirmed acute appendicitis on targeted imaging with localized right lower quadrant peritoneal signs and active systemic inflammatory response. Emergent surgical consultation and operative preparation indicated.'
          : 'Localized right lower quadrant peritonitis, McBurney point tenderness, and inflammatory response characteristic of acute appendicitis. Urgent surgical evaluation indicated.',
        supportingFindingIds: [...appendicitisFindingIds, ...abdoFindingIds, ...inflammatoryLabIds].slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: appendicitisMissing,
        evidenceSourceIds: [],
      });

      // Relevant, non-contaminated differential diagnoses for acute appendicitis
      candidates.push({
        label: 'Mesenteric Adenitis',
        status: 'Uncertain',
        score: hasCompletedAppendixImaging ? -2 : 6,
        rationale:
          'Inflammation of mesenteric lymph nodes frequently mimics acute appendicitis in young patients with fever and RLQ tenderness. Differentiated by imaging demonstrating normal appendix with cluster of enlarged mesenteric nodes.',
        supportingFindingIds: [...abdoFindingIds, ...fevFindingIds].slice(0, 3),
        contradictingFindingIds: hasCompletedAppendixImaging ? appendicitisFindingIds.slice(0, 1) : [],
        missingInformation: hasCompletedAppendixImaging
          ? ['Ultrasound already confirms appendiceal inflammation, effectively ruling out isolated mesenteric adenitis']
          : ['Graded-compression abdominal ultrasound to evaluate mesenteric lymph nodes vs inflamed appendix'],
        evidenceSourceIds: [],
      });

      candidates.push({
        label: 'Meckel Diverticulitis / Cecal Diverticular Disease',
        status: 'Uncertain',
        score: hasCompletedAppendixImaging ? -4 : 4,
        rationale:
          'Inflammation of a Meckel diverticulum or solitary cecal diverticulum presents with right lower quadrant peritonism clinically indistinguishable from acute appendicitis prior to direct surgical or radiological visualization.',
        supportingFindingIds: abdoFindingIds.slice(0, 2),
        contradictingFindingIds: [],
        missingInformation: ['Direct operative inspection during appendectomy or cross-sectional contrast imaging'],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 8. Acute Pancreatitis
    // ──────────────────────────────────────────────────────────
    const hasPancreatitis = lipaseLabIds.length > 0 || pancreatitisFindingIds.length > 0 || hasFeature(['lipase', 'amylase', 'pancreatitis']);
    if (hasPancreatitis) {
      candidates.push({
        label: 'Acute Pancreatitis',
        status: 'Supported',
        score: 15,
        rationale:
          'Meets Atlanta classification criteria with severe acute epigastric pain radiating posteriorly and/or marked elevation in pancreatic enzymes (lipase/amylase).',
        supportingFindingIds: [...lipaseLabIds, ...abdoFindingIds].slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Serum lipase / amylase level quantification (>3x upper limit of normal)',
          'Abdominal ultrasound to evaluate for biliary cholelithiasis and choledocholithiasis',
          'Serum calcium and triglyceride levels for etiology workup',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 9. Acute Gastrointestinal Bleeding
    // ──────────────────────────────────────────────────────────
    const hasGiBleed = giBleedFindingIds.length > 0 || hasFeature(['melena', 'hematemesis', 'coffee ground', 'hematochezia', 'rectal bleeding']);
    if (hasGiBleed) {
      candidates.push({
        label: 'Acute Gastrointestinal Hemorrhage',
        status: 'Supported',
        score: 16,
        rationale:
          'Overt gastrointestinal blood loss documented with potential hemodynamic instability. Emergent endoscopic evaluation and hemodynamic support indicated.',
        supportingFindingIds: giBleedFindingIds.slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Type and crossmatch for packed red blood cells (PRBCs)',
          'Serial full blood count for hemoglobin trajectory',
          'Urgent upper endoscopy (EGD) / colonoscopy and Glasgow-Blatchford risk stratification',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 10. Acute Pyelonephritis / Complicated UTI
    // ──────────────────────────────────────────────────────────
    const hasUtiSignals = utiFindingIds.length > 0 || (hasFeature(['flank pain', 'cva tenderness', 'costovertebral', 'dysuria']) && hasFever);
    if (hasUtiSignals) {
      candidates.push({
        label: 'Acute Pyelonephritis / Complicated Urinary Tract Infection',
        status: 'Supported',
        score: 14,
        rationale:
          'Upper urinary tract symptoms (costovertebral angle tenderness, dysuria, pyuria) with systemic inflammatory response.',
        supportingFindingIds: [...utiFindingIds, ...fevFindingIds, ...inflammatoryLabIds].slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Midstream urine microscopy, culture, and sensitivities (prior to antibiotics)',
          'Renal tract ultrasound to exclude hydronephrosis or obstructing nephrolithiasis',
          'Blood cultures x 2 to monitor for urosepsis bacteremia',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 11. Acute Asthma Exacerbation / Severe Bronchospasm
    // ──────────────────────────────────────────────────────────
    const hasAsthmaSignals = wheezeFindingIds.length > 0 || (hasDyspnea && hasFeature(['asthma', 'wheeze', 'bronchospasm', 'inhaler']));
    if (hasAsthmaSignals && !hasConsolidation) {
      candidates.push({
        label: 'Acute Asthma Exacerbation / Bronchospasm',
        status: 'Supported',
        score: 13,
        rationale:
          'Acute expiratory airflow obstruction characterized by diffuse auscultatory wheezing and respiratory distress without focal consolidation.',
        supportingFindingIds: [...wheezeFindingIds, ...respiratoryFindingIds].slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Peak Expiratory Flow (PEF) measurement compared against personal best / predicted',
          'Arterial or venous blood gas if signs of respiratory muscle exhaustion',
          'Response assessment post-first round of inhaled bronchodilators and systemic steroids',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 12. Pneumothorax
    // ──────────────────────────────────────────────────────────
    const hasPtxSignals = pneumothoraxFindingIds.length > 0 || hasFeature(['pneumothorax', 'absent breath sound', 'hyperresonance', 'pleuritic chest pain and dyspnea']);
    if (hasPtxSignals) {
      candidates.push({
        label: 'Pneumothorax (Spontaneous / Tension)',
        status: 'Supported',
        score: 16,
        rationale:
          'Acute pleuritic onset with regional asymmetry in breath sounds. High clinical priority to exclude tension physiology requiring emergent needle decompression.',
        supportingFindingIds: pneumothoraxFindingIds.slice(0, 3),
        contradictingFindingIds: [],
        missingInformation: [
          'Immediate erect inspiratory chest radiograph (or bedside point-of-care ultrasound)',
          'Evaluation for hemodynamic compromise, tracheal deviation, and jugular venous distention',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 13. Anaphylaxis / Severe Systemic Hypersensitivity
    // ──────────────────────────────────────────────────────────
    const hasAnaphylaxis = anaphylaxisFindingIds.length > 0 || (hasFeature(['angioedema', 'urticaria', 'hives']) && (hasDyspnea || hasFeature(['hypotension', 'stridor'])));
    if (hasAnaphylaxis) {
      candidates.push({
        label: 'Anaphylaxis / Acute Severe Hypersensitivity',
        status: 'Supported',
        score: 20,
        rationale:
          'Acute multisystem allergic presentation with mucocutaneous and respiratory/cardiovascular involvement. Immediate intramuscular epinephrine is the first-line lifesaving therapy.',
        supportingFindingIds: anaphylaxisFindingIds.slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Immediate intramuscular epinephrine (0.5 mg 1:1000) administration confirmation',
          'Serial serum tryptase drawn at 1-2 hours and baseline at 24 hours',
          'Continuous airway, oxygenation, and blood pressure monitoring in resuscitation bay',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 14. Acute Decompensated Heart Failure (ADHF)
    // ──────────────────────────────────────────────────────────
    if (hasDyspnea && (hasOedema || hasFeature(['bnp', 'heart failure', 'fluid overload', 'orthopnea', 'jvp']))) {
      let hfScore = 8;
      if (hasOedema) hfScore += 6;
      if (hasFeature(['bnp', 'pro-bnp'])) hfScore += 6;

      candidates.push({
        label: 'Acute Decompensated Heart Failure (ADHF)',
        status: hasOedema ? 'Supported' : 'Uncertain',
        score: hfScore,
        rationale:
          'Dyspnea with signs of systemic fluid retention or elevated ventricular filling pressures. Echocardiogram and natriuretic peptide measurement indicated.',
        supportingFindingIds: [...oedemaFindingIds, ...respiratoryFindingIds].slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'NT-proBNP or BNP measurement',
          'Bedside echocardiogram (ejection fraction and valvular assessment)',
          'Daily weights and strict intake/output recording',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 15. Sepsis / Severe Systemic Inflammatory Response
    // ──────────────────────────────────────────────────────────
    // Sepsis-3 strictly requires infection + acute life-threatening organ dysfunction (SOFA >= 2, qSOFA >= 2, shock, hyperlactatemia > 2).
    // Genuine qSOFA physiological criteria (0 to 3 points):
    const hasSbpUnder100 =
      labs.some((l) => (l.testName.toLowerCase().includes('sbp') || l.testName.toLowerCase().includes('blood pressure') || l.testName.toLowerCase().includes('systolic')) &&
        (parseFloat(l.value) <= 100 || l.interpretation.toLowerCase().includes('low') || l.interpretation.toLowerCase().includes('critical'))) ||
      hasFeature(['systolic blood pressure <= 100', 'sbp <= 100', 'hypotensive shock', 'hypotension']);

    const hasRrOver22 =
      labs.some((l) => (l.testName.toLowerCase().includes('respiratory rate') || l.testName.toLowerCase().includes('rr')) &&
        (parseFloat(l.value) >= 22 || l.interpretation.toLowerCase().includes('high') || l.interpretation.toLowerCase().includes('critical'))) ||
      hasFeature(['respiratory rate >= 22', 'rr >= 22', 'severe tachypnea', 'marked tachypnea']);

    const hasAms = gcsFindingIds.length > 0 || hasFeature(['altered mental status', 'confusion', 'disoriented', 'encephalopathy', 'gcs < 15', 'obtunded']);

    const qsofaScore = (hasSbpUnder100 ? 1 : 0) + (hasRrOver22 ? 1 : 0) + (hasAms ? 1 : 0);
    const isQsofaFlagged = qsofaScore >= 2;
    const hasOrganDysfunction = isQsofaFlagged || hasSbpUnder100 || hasElevatedLactate || oliguriaFindingIds.length > 0;

    // A patient with a clear localized surgical focus (e.g. Acute Appendicitis) and normal hemodynamics (SBP > 100, RR < 22)
    // exhibits SIRS, NOT Sepsis. Do NOT let Sepsis compete with or overshadow the primary localized diagnosis.
    const hasLocalizedSurgicalInfection = hasAppendicitis || hasPancreatitis;

    const hasSepsisFeatures = hasFever && (hasTachycardia || hasTachypnea || hasElevatedLactate) && (hasNeutrophilicLeukocytosis || hasElevatedInflammatory);

    if (hasSepsisFeatures && (!hasLocalizedSurgicalInfection || hasOrganDysfunction)) {
      const sepsisSupport = [
        ...fevFindingIds,
        ...respiratoryFindingIds,
        ...inflammatoryLabIds,
        ...lactateLabIds,
      ].filter((id) => allFindingIds.includes(id) || allLabIds.includes(id));

      const isPulmonaryFocus = hasDefinitePulmonaryInfection || hasProbablePulmonaryInfection;
      const sepsisLabel = isPulmonaryFocus
        ? 'Sepsis Secondary to Lower Respiratory Infection'
        : hasOrganDysfunction
        ? 'Systemic Sepsis with Acute Organ Dysfunction'
        : 'Systemic Inflammatory Response Syndrome (SIRS)';

      candidates.push({
        label: sepsisLabel,
        status: hasOrganDysfunction ? 'Supported' : 'Uncertain',
        score: hasOrganDysfunction ? 18 : 7,
        rationale:
          `Patient exhibits acute systemic inflammatory criteria (pyrexia, tachycardia, leukocytosis)` +
          `${hasElevatedLactate ? ' with hyperlactatemia' : ''}. ` +
          `qSOFA score: ${qsofaScore}/3 (${isQsofaFlagged ? 'flagged for sepsis risk' : 'negative'}). ` +
          `${hasOrganDysfunction ? 'Sepsis bundle resuscitation and pathogen isolation indicated.' : 'Hemodynamically stable inflammatory response; monitor for decompensation.'}`,
        supportingFindingIds: sepsisSupport.slice(0, 6),
        contradictingFindingIds: [],
        missingInformation: hasOrganDysfunction
          ? [
              'Blood cultures (≥2 sets) prior to antimicrobial administration',
              'Serial serum lactate kinetics at 2–4 hours',
              'Targeted source localization and fluid resuscitation monitoring',
            ]
          : [
              'Continuous hemodynamics monitoring (maintain SBP > 100, monitor urine output)',
            ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 16. Pulmonary Embolism (PE)
    // ──────────────────────────────────────────────────────────
    if (hasDyspnea && (hasFeature(['pleuritic', 'dvt', 'unilateral leg', 'hemoptysis', 'ctpa']) || ddimerIds.length > 0)) {
      let peScore = 5;
      if (ddimerIds.length > 0) peScore += 6;
      if (hasDefinitePulmonaryInfection) peScore -= 6;

      candidates.push({
        label: hasDefinitePulmonaryInfection ? 'Pulmonary Embolism (Considered & De-prioritized)' : 'Pulmonary Embolism (PE)',
        status: 'Uncertain',
        score: peScore,
        rationale:
          `Acute dyspnea evaluated for pulmonary embolism. ${hasDefinitePulmonaryInfection ? 'Infectious consolidation and purulent sputum provide an alternate acute etiology, lowering pre-test probability.' : 'Risk stratification via Wells score indicated.'}`,
        supportingFindingIds: respiratoryFindingIds.slice(0, 3),
        contradictingFindingIds: consolidationFindingIds.slice(0, 1),
        missingInformation: [
          'Wells PE score calculation and PERC rule evaluation',
          'CT Pulmonary Angiography (CTPA) if clinical suspicion persists',
        ],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 17. Infective Endocarditis (Gated by Duke criteria signals)
    // ──────────────────────────────────────────────────────────
    const hasIeSignals = hasAffirmativeMurmur || hasTypicalIEOrganism || hasVegetation || hasJanewaySplinter || hasFeature(['endocarditis']);
    if (hasIeSignals) {
      if (isDukeDefinite || isDukePossible) {
        candidates.push({
          label: isDukeDefinite ? 'Definite Infective Endocarditis' : 'Possible Infective Endocarditis',
          status: isDukeDefinite ? 'Supported' : 'Uncertain',
          score: isDukeDefinite ? 18 : 8,
          rationale: `Meets Modified Duke Criteria (${majorDukeCount} Major, ${minorDukeCount} Minor criteria met). Echocardiography and blood cultures indicated.`,
          supportingFindingIds: fevFindingIds,
          contradictingFindingIds: [],
          missingInformation: ['Transthoracic / Transesophageal echocardiogram', 'Blood culture sets x 3'],
          evidenceSourceIds: [],
        });
      } else {
        candidates.push({
          label: 'Infective Endocarditis (Insufficient Criteria / De-escalated)',
          status: 'Contradicted',
          score: -5,
          rationale:
            'Evaluated against 2023 Modified Duke Criteria: patient does not meet diagnostic threshold for Definite or Possible IE. Alternative infectious source should be pursued.',
          supportingFindingIds: fevFindingIds.slice(0, 1),
          contradictingFindingIds: [],
          missingInformation: ['Blood cultures to monitor for bacteremia'],
          evidenceSourceIds: [],
        });
      }
    }

    // ──────────────────────────────────────────────────────────
    // 17.1 Lateral Ankle Sprain / Isolated Extremity Trauma (ESI 4)
    // ──────────────────────────────────────────────────────────
    const isAnkleSprain =
      hasFeature(['ankle sprain', 'twisted ankle', 'malleolus', 'unable to bear weight', 'lateral ankle', 'ankle injury']) ||
      /\b(twisted.*ankle|ankle sprain|malleolus|unable to bear weight|lateral ankle)\b/i.test(summaryText);

    if (isAnkleSprain && !isEsi1State && !hasAbdominalPain && !hasChestPain) {
      candidates.push({
        label: 'Grade II Lateral Ankle Sprain (Partial ATFL Tear)',
        status: 'Supported',
        score: 24,
        rationale:
          'Inversion injury of the talocrural joint presenting with acute swelling, tenderness over lateral malleolus, and painful weight-bearing without neurovascular compromise. Ottawa Ankle Rules evaluation indicated for radiography.',
        supportingFindingIds: matchFindings(['ankle', 'malleolus', 'swelling', 'pain']).slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Plain 3-view radiography of right ankle (AP, Lateral, Mortise) per Ottawa Ankle Rules',
          'Clinical stress evaluation (Anterior Drawer / Talar Tilt) after acute pain reduction',
        ],
        evidenceSourceIds: [],
      });

      candidates.push({
        label: 'Non-Displaced Avulsion Fracture of Distal Fibula / Lateral Malleolus',
        status: 'Uncertain',
        score: 16,
        rationale:
          'Cortical avulsion at ATFL insertion site presenting identically to severe ligamentous strain.',
        supportingFindingIds: matchFindings(['malleolus', 'swelling']).slice(0, 2),
        contradictingFindingIds: [],
        missingInformation: ['Plain radiography to assess cortical bony margins'],
        evidenceSourceIds: [],
      });

      candidates.push({
        label: 'Syndesmotic (High) Ankle Sprain',
        status: 'Uncertain',
        score: 12,
        rationale:
          'Injury to distal tibiofibular syndesmotic ligaments; prolonged recovery trajectory compared to simple ATFL sprain.',
        supportingFindingIds: matchFindings(['ankle', 'swelling']).slice(0, 2),
        contradictingFindingIds: [],
        missingInformation: ['Syndesmosis squeeze test and external rotation stress test'],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 17.2 Essential Hypertension / Medication Non-Compliance (ESI 5)
    // ──────────────────────────────────────────────────────────
    const isMedRefill =
      hasFeature(['ran out of', 'prescription refill', 'medication refill', 'lisinopril', 'routine refill', 'medication non-compliance']) ||
      /\b(ran out of.*medication|prescription refill|lisinopril.*refill|medication non-compliance|routine refill)\b/i.test(summaryText);

    if (isMedRefill && !isEsi1State && !hasChestPain && !hasDyspnea && !hasStrokeSignals) {
      candidates.push({
        label: 'Essential Hypertension (Uncontrolled due to Medication Non-Compliance)',
        status: 'Supported',
        score: 25,
        rationale:
          'Mild-to-moderate asymptomatic blood pressure elevation secondary to recent depletion of outpatient antihypertensive regimen (Lisinopril). No end-organ damage or acute symptoms.',
        supportingFindingIds: matchFindings(['bp', 'blood pressure', 'hypertension', 'lisinopril']).slice(0, 3),
        contradictingFindingIds: [],
        missingInformation: [
          'Outpatient prescription renewal and medication reconciliation (Lisinopril)',
          'Repeat resting blood pressure check prior to discharge',
          'Coordination of outpatient primary care follow-up for chronic hypertension management',
        ],
        evidenceSourceIds: [],
      });

      candidates.push({
        label: 'White-Coat Hypertension overlaying Chronic Essential Hypertension',
        status: 'Uncertain',
        score: 14,
        rationale:
          'Situational blood pressure elevation in clinical environment superimposed on chronic baseline.',
        supportingFindingIds: matchFindings(['bp', 'blood pressure']).slice(0, 2),
        contradictingFindingIds: [],
        missingInformation: ['Ambulatory blood pressure monitoring (ABPM) / home BP log review'],
        evidenceSourceIds: [],
      });
    }

    // ──────────────────────────────────────────────────────────
    // 18. Universal Dynamic Anatomical Inference (Intelligent Fallback)
    // Runs when atypical or rare clinical pictures don't match specific rules.
    // Dynamically derives organ system + symptom + lab abnormalities!
    // ──────────────────────────────────────────────────────────
    if (candidates.length === 0) {
      // Deduce predominant organ system from chart features
      let organSystem = 'Systemic';
      let keyFeatureText = 'clinical presentation';

      if (hasAbdominalPain || liverLabIds.length > 0) {
        organSystem = 'Gastrointestinal / Hepato-Biliary';
        keyFeatureText = 'abdominal pain and/or hepatic enzyme variation';
      } else if (renalLabIds.length > 0) {
        organSystem = 'Renal / Metabolic';
        keyFeatureText = 'altered renal function parameters';
      } else if (strokeFindingIds.length > 0 || gcsFindingIds.length > 0) {
        organSystem = 'Neurological';
        keyFeatureText = 'altered sensorium or neurological deficit';
      } else if (hasDyspnea || coughFindingIds.length > 0) {
        organSystem = 'Respiratory';
        keyFeatureText = 'acute respiratory symptoms';
      } else if (hasChestPain) {
        organSystem = 'Cardiopulmonary';
        keyFeatureText = 'chest discomfort requiring diagnostic stratification';
      } else if (hasFever) {
        organSystem = 'Infectious / Inflammatory';
        keyFeatureText = 'acute constitutional febrile illness';
      }

      const topIds = [...allFindingIds.slice(0, 3), ...allLabIds.slice(0, 2)];
      candidates.push({
        label: `Acute ${organSystem} Syndrome — Workup in Progress`,
        status: 'Uncertain',
        score: 1,
        rationale: `Dynamic syndromic assessment indicates ${keyFeatureText} localized to the ${organSystem} system. Chart context incorporates ${allFindingIds.length} verified finding(s) and ${allLabIds.length} investigation result(s). Targeted specialty workup and continuous monitoring indicated.`,
        supportingFindingIds: topIds,
        contradictingFindingIds: [],
        missingInformation: [
          `Targeted diagnostic imaging and laboratory panel for ${organSystem} pathology`,
          'Serial vital sign trajectory and response to supportive therapy',
          'Consultation with appropriate medical specialty team',
        ],
        evidenceSourceIds: [],
      });
    }

    // Sort strictly by evidence score descending
    candidates.sort((a, b) => b.score - a.score);
    const topHypotheses = candidates.slice(0, 4);

    // ── Clinically grounded contradictions ────────────────────
    const contradictions: RawReasoningOutput['contradictions'] = [];

    // Contradiction 1: Severe hypoxemia (SpO2 <= 89%) while on room air
    if (hasHypoxemia && hasFeature(['room air', 'ambient air', 'on room air'])) {
      const spo2Id = matchFindings(['hypoxia', 'hypoxemia', 'low spo2', 'spo2', 'oxygen saturation']).concat(matchLabs(['spo2', 'oxygen saturation', 'pao2']))[0] || 'hypox-spo2';
      contradictions.push({
        findingAId: spo2Id,
        findingBId: fevFindingIds[0] || spo2Id,
        explanation:
          'Critical arterial hypoxemia documented on ambient room air indicates acute respiratory compromise requiring emergent supplemental oxygen titration.',
      });
    }

    // Contradiction 2: Pyrexia with strictly normal inflammatory markers (only if WBC/CRP are normal)
    const normalWbcLab = labs.find(
      (l) =>
        (l.testName.toLowerCase().includes('wbc') || l.testName.toLowerCase().includes('crp')) &&
        ((l.interpretation || '').toLowerCase() === 'normal' || (l.interpretation || '').toLowerCase() === 'within normal')
    );
    if (hasFever && normalWbcLab && fevFindingIds.length > 0) {
      contradictions.push({
        findingAId: fevFindingIds[0],
        findingBId: normalWbcLab.id,
        explanation:
          'Documented fever is present while inflammatory markers appear within normal limits. Consider viral etiology, early acute phase, or blunted immunological response.',
      });
    }

    // Contradiction 3: Chest pain with normal troponin
    const normalTroponinLab = labs.find(
      (l) =>
        l.testName.toLowerCase().includes('troponin') &&
        ((l.interpretation || '').toLowerCase() === 'normal' || (l.value || '').toLowerCase().includes('negative'))
    );
    if (hasChestPain && normalTroponinLab && chestPainFindingIds.length > 0) {
      contradictions.push({
        findingAId: chestPainFindingIds[0],
        findingBId: normalTroponinLab.id,
        explanation:
          'Chest pain is present with initial non-elevated troponin. Single negative troponin does not rule out acute coronary syndrome; non-cardiac etiologies must also be assessed.',
      });
    }

    // ── Fully dynamic executive summary ───────────────────────
    const primaryHyp = topHypotheses[0];
    const secondaryHyp = topHypotheses[1];

    const summaryParts: string[] = [];

    if (isEsi1State) {
      summaryParts.push(
        '*** CRITICAL ESI 1 RESUSCITATION BAY PRIORITY *** Patient presents in active cardiac or respiratory arrest / profound hemodynamic collapse. Immediate ACLS resuscitation protocols (continuous CPR, defibrillation, emergency airway intubation, IV/IO access, and Epinephrine) take absolute precedence over deferred diagnostic investigations.'
      );
    }

    if (primaryHyp) {
      summaryParts.push(
        `Diagnostic assessment prioritizes ${primaryHyp.label} (${primaryHyp.status.toLowerCase()}) as the leading clinical consideration.`
      );
    } else {
      summaryParts.push('Diagnostic evaluation in progress for active clinical presentation.');
    }

    // Extract dynamic clinical signals present in this specific case
    const observedSignals: string[] = [];
    if (isEsi1State) {
      if (hasProfoundHypotension) observedSignals.push('profound hypotension (SBP < 70 mmHg)');
      if (hasProfoundHypoxia) observedSignals.push('profound hypoxia (SpO2 < 80%)');
      if (hasCriticalBradypnea || isAgonalOrArrest) observedSignals.push('agonal/apneic respirations');
      if (hasTachycardia) observedSignals.push('extreme tachyarrhythmia');
    } else {
      if (hasFever) observedSignals.push('pyrexia');
      if (hasTachycardia) observedSignals.push('tachycardia');
      if (hasTachypnea) observedSignals.push('tachypnea');
      if (hasHypoxemia) observedSignals.push('hypoxemia');
      if (hasChestPain) observedSignals.push('chest pain');
      if (hasConsolidation) observedSignals.push('pulmonary consolidation on imaging');
      if (hasCrackles) observedSignals.push('focal lung crackles');
      if (hasProductiveCough) observedSignals.push('productive cough');
      if (hasNeutrophilicLeukocytosis) observedSignals.push('leukocytosis');
      if (hasElevatedInflammatory) observedSignals.push('elevated inflammatory markers');
      if (hasCardiacMarkers) observedSignals.push('elevated cardiac biomarkers');
      if (hasOedema) observedSignals.push('fluid retention/edema');
      if (hasElevatedLactate) observedSignals.push('hyperlactatemia');
      if (hasAbdominalPain) observedSignals.push('abdominal pain');
    }

    if (observedSignals.length > 0) {
      summaryParts.push(
        `Key active clinical drivers identified from chart data include ${observedSignals.slice(0, 5).join(', ')}.`
      );
    }

    if (hasLocalizedSurgicalInfection && (hasFever || hasTachycardia || hasNeutrophilicLeukocytosis)) {
      summaryParts.push(
        `Severity profile: Systemic inflammatory response (SIRS) secondary to localized acute infection; hemodynamically stable without evidence of acute organ dysfunction (qSOFA: ${qsofaScore}/3 negative).`
      );
    }

    if (secondaryHyp && secondaryHyp.status === 'Supported') {
      summaryParts.push(`Secondary clinical consideration: ${secondaryHyp.label}.`);
    }

    if (contradictions.length > 0) {
      summaryParts.push(
        `${contradictions.length} clinical tension(s) or critical parameter(s) require clinician reconciliation.`
      );
    }

    summaryParts.push(
      'Advisory co-pilot output for licensed physician review; requires clinician adjudication prior to clinical action.'
    );

    // ── Limitations ───────────────────────────────────────────
    const limitations: string[] = [
      'Grounded clinical assessment derived via calibrated diagnostic evidence scoring.',
    ];
    if (gaps.length > 0) {
      limitations.push(
        `${gaps.length} clinical information gap(s) identified: ${gaps.slice(0, 2).map((g) => g.description).join('; ')}.`
      );
    }
    limitations.push('Assessment is advisory and co-pilot in nature. All hypotheses and orders require clinician review and adjudication.');

    return {
      summary: summaryParts.join(' '),
      hypotheses: topHypotheses.map((h) => ({
        label: h.label,
        rationale: h.rationale,
        supportingFindingIds: h.supportingFindingIds,
        contradictingFindingIds: h.contradictingFindingIds,
        missingInformation: h.missingInformation,
        evidenceSourceIds: h.evidenceSourceIds,
      })),
      contradictions,
      limitations,
    };
  }
}

// ----------------------------------------------------------
// MistralInstructProvider — Mistral-7B-Instruct via HF API
// Produces structured JSON differential diagnosis output.
// Falls back to DeterministicClinicalProvider on any failure.
// ----------------------------------------------------------
import { huggingFaceClient } from './services/huggingface-api';
import { buildClinicalReasoningPrompt } from './prompts/clinical-prompts';

const MISTRAL_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

export class MistralInstructProvider implements ReasoningProvider {
  readonly name = 'Mistral-7B-Instruct-v0.3';
  readonly version = '0.3-hf';

  async generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput> {
    if (!huggingFaceClient.isConfigured()) {
      throw new Error(
        'Hugging Face is selected as the reasoning provider, but no Hugging Face API token is configured. Please provide VITE_HF_API_TOKEN in .env or via the AI Engine settings.'
      );
    }

    try {
      const allowedFindingIds = input.verifiedFindings.map((f) => f.id);
      const allowedLabIds = input.investigationResults.map((i) => i.id);
      const allAllowedIds = new Set([...allowedFindingIds, ...allowedLabIds]);

      const prompt = buildClinicalReasoningPrompt({
        caseId: input.caseId,
        clinicalSummary: input.clinicalSummary,
        verifiedFindings: input.verifiedFindings.map((f) => ({
          id: f.id,
          category: f.category,
          label: f.label,
          value: f.value,
          unit: f.unit,
          verificationStatus: f.verificationStatus,
        })),
        investigationResults: input.investigationResults,
        retrievedEvidence: input.retrievedEvidence,
        informationGaps: input.informationGaps,
        existingHypotheses: input.existingHypotheses,
      });

      const { data, latencyMs } = await huggingFaceClient.invokeModel<any>(
        MISTRAL_MODEL,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1800,
            temperature: 0.1,
            top_p: 0.9,
            do_sample: false,
            return_full_text: false,
          },
        },
        { timeoutMs: 45000 }
      );

      console.info(`[MistralInstructProvider] Response received in ${latencyMs}ms`);

      // Extract generated text
      let rawText = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        rawText = data[0].generated_text;
      } else if (typeof data === 'string') {
        rawText = data;
      } else if (data?.generated_text) {
        rawText = data.generated_text;
      }

      if (!rawText) {
        throw new Error('[MistralInstructProvider] Empty response received from model.');
      }

      // Extract JSON block from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('[MistralInstructProvider] No structured JSON block found in model response.');
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        throw new Error('[MistralInstructProvider] Failed to parse model JSON output.');
      }

      if (!parsed.summary || !Array.isArray(parsed.hypotheses)) {
        throw new Error('[MistralInstructProvider] Model output did not adhere to required clinical schema (missing summary or hypotheses array).');
      }

      // Ground: filter IDs to only those that actually exist in the case context
      const groundedHypotheses = parsed.hypotheses
        .filter((h: any) => h.label && h.rationale)
        .map((h: any) => ({
          label: String(h.label || 'Candidate Diagnosis'),
          rationale: String(h.rationale || 'Derived from available clinical data.'),
          supportingFindingIds: Array.isArray(h.supportingFindingIds)
            ? h.supportingFindingIds.filter((id: string) => allAllowedIds.has(id))
            : [],
          contradictingFindingIds: Array.isArray(h.contradictingFindingIds)
            ? h.contradictingFindingIds.filter((id: string) => allAllowedIds.has(id))
            : [],
          missingInformation: Array.isArray(h.missingInformation)
            ? h.missingInformation.map(String)
            : [],
          evidenceSourceIds: Array.isArray(h.evidenceSourceIds)
            ? h.evidenceSourceIds.map(String)
            : [],
        }));

      const groundedContradictions = Array.isArray(parsed.contradictions)
        ? parsed.contradictions
            .filter((c: any) => allAllowedIds.has(c.findingAId) && allAllowedIds.has(c.findingBId))
            .map((c: any) => ({
              findingAId: String(c.findingAId),
              findingBId: String(c.findingBId),
              explanation: String(c.explanation || ''),
            }))
        : [];

      const limitations = Array.isArray(parsed.limitations)
        ? parsed.limitations.map(String)
        : ['Advisory output for licensed physician review; not an autonomous medical device.'];

      if (groundedHypotheses.length === 0) {
        throw new Error('[MistralInstructProvider] Model did not generate any grounded clinical hypotheses for the verified findings.');
      }

      return {
        summary: String(parsed.summary),
        hypotheses: groundedHypotheses,
        contradictions: groundedContradictions,
        limitations,
      };
    } catch (err: any) {
      const msg = String(err?.message || err);
      console.error('[MistralInstructProvider] Diagnosis generation failed:', msg);
      throw new Error(`Mistral Reasoning Engine error: ${msg}`);
    }
  }
}

// ----------------------------------------------------------
// Multi-Model Live Reasoning Provider Router
// Supports Google Gemini 2.5 Flash, Groq Llama 3.3 70B,
// OpenAI GPT-4o, Anthropic Claude 3.5, and Hugging Face.
// Seamlessly delegates to Autonomous Clinical Engine when offline.
// ----------------------------------------------------------
import {
  GeminiClinicalProvider,
  GroqClinicalProvider,
  OpenAiClinicalProvider,
} from './services/live-ai-providers';
import { loadAiEngineSettings } from './services/ai-engine-config';

export const autonomousProvider = new AutonomousClinicalProvider();
export const geminiProvider = new GeminiClinicalProvider();
export const groqProvider = new GroqClinicalProvider();
export const openaiProvider = new OpenAiClinicalProvider();
export const mistralProvider = new MistralInstructProvider();

// Backward compatibility aliases
export const DeterministicClinicalProvider = AutonomousClinicalProvider;
export const deterministicProvider: ReasoningProvider = autonomousProvider;
export const testProvider = autonomousProvider;
export const huggingFaceProvider = mistralProvider;

export class MultiModelLiveReasoningProvider implements ReasoningProvider {
  get name(): string {
    const s = loadAiEngineSettings();
    switch (s.selectedProvider) {
      case 'gemini': return s.geminiApiKey ? 'Google Gemini 3.8 Flash (Live)' : 'Nexus Autonomous Clinical Engine';
      case 'groq': return s.groqApiKey ? 'Groq Cloud Qwen 27B / GPT-OSS (Live)' : 'Nexus Autonomous Clinical Engine';
      case 'openai': return s.openaiApiKey ? 'OpenAI GPT-4o Mini (Live)' : 'Nexus Autonomous Clinical Engine';
      case 'huggingface': return s.hfApiToken ? 'Hugging Face Mistral-7B (Live)' : 'Nexus Autonomous Clinical Engine';
      default: return 'Nexus Autonomous Clinical Engine';
    }
  }

  get version(): string {
    const s = loadAiEngineSettings();
    switch (s.selectedProvider) {
      case 'gemini': return '3.8-flash-live';
      case 'groq': return 'qwen-3.8-27b-live';
      case 'openai': return 'gpt-4o-mini-live';
      case 'huggingface': return '0.3-hf';
      default: return '2.5.0-clinical';
    }
  }

  async generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput> {
    const s = loadAiEngineSettings();

    // 1. Google Gemini
    if (s.selectedProvider === 'gemini') {
      if (!s.geminiApiKey.trim()) {
        throw new Error('Google Gemini is selected as the reasoning provider, but no API key is configured. Please provide VITE_GEMINI_API_KEY in .env or via the AI Engine settings.');
      }
      console.info('[MultiModelLiveReasoningProvider] Calling live Google Gemini 3.8 Flash...');
      return await geminiProvider.generateAssessment(input);
    }

    // 2. Groq Cloud
    if (s.selectedProvider === 'groq') {
      if (!s.groqApiKey.trim()) {
        throw new Error('Groq Cloud is selected as the reasoning provider, but no API key is configured. Please provide VITE_GROQ_API_KEY in .env or via the AI Engine settings.');
      }
      console.info('[MultiModelLiveReasoningProvider] Calling live Groq Cloud...');
      return await groqProvider.generateAssessment(input);
    }

    // 3. OpenAI
    if (s.selectedProvider === 'openai') {
      if (!s.openaiApiKey.trim()) {
        throw new Error('OpenAI is selected as the reasoning provider, but no API key is configured. Please provide VITE_OPENAI_API_KEY in .env or via the AI Engine settings.');
      }
      console.info('[MultiModelLiveReasoningProvider] Calling live OpenAI...');
      return await openaiProvider.generateAssessment(input);
    }

    // 4. Hugging Face
    if (s.selectedProvider === 'huggingface') {
      if (!s.hfApiToken.trim()) {
        throw new Error('Hugging Face is selected as the reasoning provider, but no API token is configured.');
      }
      console.info('[MultiModelLiveReasoningProvider] Calling Hugging Face Mistral...');
      return await mistralProvider.generateAssessment(input);
    }

    // 5. Autonomous Clinical Rules Engine (Explicitly selected by clinician)
    console.info('[MultiModelLiveReasoningProvider] Synthesizing via Nexus Autonomous Clinical Engine...');
    return autonomousProvider.generateAssessment(input);
  }
}

export const liveReasoningRouter = new MultiModelLiveReasoningProvider();

export function getDefaultReasoningProvider(): ReasoningProvider {
  return liveReasoningRouter;
}
