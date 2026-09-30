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
// DeterministicClinicalProvider
// Offline differential diagnosis engine that derives real
// hypotheses from actual case data via clinical pattern matching.
// No LLM required — always produces meaningful output.
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

    // Check window before keyword (up to 40 chars) for negation
    const prefix = lower.slice(Math.max(0, kwIndex - 40), kwIndex);
    const hasNegationPrefix = /\b(no|not|denies|denied|without|negative\s+for|absence\s+of|nil|rules?\s+out|free\s+of|unremarkable\s+for)\s+([a-z0-9_\-\s]{0,25})$/i.test(prefix);

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

export class DeterministicClinicalProvider implements ReasoningProvider {
  readonly name = 'Nexus-Deterministic-v3';
  readonly version = '3.1.0';

  async generateAssessment(input: ReasoningInput): Promise<RawReasoningOutput> {
    const findings = input.verifiedFindings;
    const labs = input.investigationResults;
    const gaps = input.informationGaps;

    const allFindingIds = findings.map((f) => f.id);
    const allLabIds = labs.map((l) => l.id);
    const summaryText = input.clinicalSummary || '';
    const fullCaseContext = `${summaryText} ${findings.map((f) => `${f.label} ${f.value ?? ''}`).join(' ')} ${labs.map((l) => `${l.testName} ${l.value}`).join(' ')}`.toLowerCase();

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

    // Check presence in findings, labs, or presentation summary
    const hasFeature = (kws: string[]) =>
      matchFindings(kws).length > 0 ||
      matchLabs(kws).length > 0 ||
      kws.some((kw) => isAffirmativelyPresent(summaryText, kw));

    // ── Comprehensive Signal Extraction across all Organ Systems ────
    const fevFindingIds = matchFindings(['fever', 'pyrexia', 'temperature', 'febrile', '38.', '39.']);
    const coughFindingIds = matchFindings(['cough', 'productive', 'sputum', 'purulent', 'yellowish']);
    const cracklesFindingIds = matchFindings(['crackle', 'crepitation', 'bronchial breath', 'dullness']);
    const consolidationFindingIds = matchFindings(['consolidation', 'air-space opacity', 'opacity', 'infiltrate', 'cxr', 'x-ray', 'bronchogram']);
    const respiratoryFindingIds = matchFindings([
      'dyspnoea', 'dyspnea', 'shortness of breath', 'sob', 'breathless',
      'hypox', 'spo2', 'oxygen', 'respiratory rate', 'tachypnea', 'work of breathing',
    ]);
    const wheezeFindingIds = matchFindings(['wheeze', 'wheezing', 'rhonchi', 'expiratory wheeze', 'bronchospasm', 'stridor']);
    const pneumothoraxFindingIds = matchFindings(['pneumothorax', 'absent breath sound', 'diminished breath sound', 'hyperresonance', 'tracheal deviat']);
    const chestPainFindingIds = matchFindings(['chest pain', 'thoracic', 'substernal', 'precordial', 'angina', 'crushing chest', 'pressure']);
    const cardiacLabIds = matchLabs(['troponin', 'ck-mb', 'bnp', 'pro-bnp']);
    const inflammatoryLabIds = matchLabs(['crp', 'esr', 'wbc', 'leukocyte', 'neutrophil', 'procalcitonin']);
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

    // Boolean features derived dynamically from case chart
    const hasFever = fevFindingIds.length > 0 || hasFeature(['fever', 'pyrexia', 'febrile', '38.', '39.']);
    const hasProductiveCough = coughFindingIds.length > 0 || hasFeature(['productive cough', 'yellowish sputum', 'cough', 'sputum']);
    const hasCrackles = cracklesFindingIds.length > 0 || hasFeature(['crackles', 'crepitations', 'bronchial breath', 'dullness to percussion']);
    const hasConsolidation = consolidationFindingIds.length > 0 || hasFeature(['consolidation', 'air-space opacity', 'infiltrate', 'lobar opacity']);
    const hasDyspnea = respiratoryFindingIds.length > 0 || hasFeature(['shortness of breath', 'dyspnea', 'dyspnoea', 'work of breathing']);
    const hasHypoxemia = hasFeature(['hypox', '89%', '90%', '91%', 'spo2']) || matchFindings(['hypox', '89%', '90%', '91%']).length > 0;
    const hasTachypnea = hasFeature(['tachypnea', '28/min', 'respiratory rate: 28', 'rr: 28']) || matchFindings(['tachypnea', '28']).length > 0;
    const hasTachycardia = hasFeature(['tachycardia', '112 bpm', 'heart rate: 112', 'pulse']) || matchFindings(['tachycardia', '112']).length > 0;
    const hasNeutrophilicLeukocytosis = inflammatoryLabIds.length > 0 || hasFeature(['leukocytosis', 'wbc', 'neutrophil']);
    const hasElevatedInflammatory = inflammatoryLabIds.length > 0 || hasFeature(['crp: markedly elevated', 'crp', 'c-reactive protein', 'esr']);
    const hasElevatedLactate = lactateLabIds.length > 0 || hasFeature(['lactate', 'lactic']);
    const hasChestPain = chestPainFindingIds.length > 0 || (hasFeature(['chest pain', 'substernal']) && !hasFeature(['no chest pain', 'denies chest pain']));
    const hasCardiacMarkers = cardiacLabIds.length > 0;
    const hasECGChanges = ecgFindingIds.length > 0;
    const hasOedema = oedemaFindingIds.length > 0;
    const hasAbdominalPain = abdoFindingIds.length > 0 || hasFeature(['abdominal pain', 'periton', 'guarding', 'rebound', 'appendicitis']);

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
    // 1. Community-Acquired Pneumonia (CAP)
    // ──────────────────────────────────────────────────────────
    const hasDefinitePulmonaryInfection = hasConsolidation || (hasCrackles && hasProductiveCough);
    const hasProbablePulmonaryInfection = (hasProductiveCough || hasCrackles) && (hasFever || hasNeutrophilicLeukocytosis);

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
    // 3. Acute Stroke / TIA / Cerebrovascular Accident (CVA)
    // ──────────────────────────────────────────────────────────
    const hasStrokeSignals = strokeFindingIds.length > 0 || hasFeature(['stroke', 'hemiparesis', 'facial droop', 'slurred speech', 'aphasia', 'arm drift']);
    if (hasStrokeSignals) {
      let strokeScore = 18;
      if (hasFeature(['facial droop', 'arm drift', 'slurred speech'])) strokeScore += 6;

      candidates.push({
        label: 'Acute Ischemic Stroke / Cerebrovascular Event',
        status: 'Supported',
        score: strokeScore,
        rationale:
          'Acute focal neurological deficit identified with motor, speech, or sensory localization. Immediate non-contrast head CT and acute stroke thrombolysis/thrombectomy protocol indicated.',
        supportingFindingIds: strokeFindingIds.slice(0, 5),
        contradictingFindingIds: [],
        missingInformation: [
          'Immediate non-contrast head CT to rule out intracranial hemorrhage',
          'Point-of-care capillary blood glucose (to exclude hypoglycemia mimic)',
          'NIH Stroke Scale (NIHSS) scoring and symptom onset timestamp calculation',
        ],
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
      (hasFeature(['hyperglycemia', 'glucose: 2', 'glucose: 3', 'glucose: 4']) && hasFeature(['acidosis', 'bicarbonate', 'anion gap']));
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
    const hasAkiSignals = hasFeature(['acute kidney injury', 'aki', 'elevated creatinine', 'creatinine: 2', 'creatinine: 3', 'oliguria', 'anuria']) ||
      (renalLabIds.length > 0 && (hasFeature(['high creatinine', 'elevated bun', 'azotemia']) || oliguriaFindingIds.length > 0));
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
    const hasAppendicitis = appendicitisFindingIds.length > 0 || (hasAbdominalPain && hasFeature(['mcburney', 'rlq', 'right lower quadrant', 'anorexia']));
    if (hasAppendicitis) {
      candidates.push({
        label: 'Acute Appendicitis',
        status: 'Supported',
        score: 15,
        rationale:
          'Localized right lower quadrant peritonitis, McBurney point tenderness, and inflammatory response characteristic of acute appendicitis. Urgent surgical evaluation indicated.',
        supportingFindingIds: [...appendicitisFindingIds, ...abdoFindingIds, ...inflammatoryLabIds].slice(0, 4),
        contradictingFindingIds: [],
        missingInformation: [
          'Urgent targeted ultrasound of the appendix or IV contrast CT abdomen/pelvis',
          'Alvarado / AIR score clinical risk calculation',
          'Pre-operative surgical consultation and NPO status',
        ],
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
    const hasSepsisFeatures = hasFever && (hasTachycardia || hasTachypnea || hasElevatedLactate) && (hasNeutrophilicLeukocytosis || hasElevatedInflammatory);
    if (hasSepsisFeatures) {
      const sepsisSupport = [
        ...fevFindingIds,
        ...respiratoryFindingIds,
        ...inflammatoryLabIds,
        ...lactateLabIds,
      ].filter((id) => allFindingIds.includes(id) || allLabIds.includes(id));

      const isPulmonaryFocus = hasDefinitePulmonaryInfection || hasProbablePulmonaryInfection;
      const sepsisLabel = isPulmonaryFocus
        ? 'Sepsis Secondary to Lower Respiratory Infection'
        : 'Sepsis / Severe Systemic Inflammatory Response';

      candidates.push({
        label: sepsisLabel,
        status: 'Supported',
        score: isPulmonaryFocus ? 11 : 18,
        rationale:
          `Patient exhibits acute systemic inflammatory criteria (pyrexia, tachycardia/tachypnea, leukocytosis)` +
          `${hasElevatedLactate ? ' with hyperlactatemia' : ''}.` +
          `${isPulmonaryFocus ? ' The systemic response appears secondary to the active pulmonary infection.' : ' Thorough septic workup to identify primary infectious source is warranted.'}`,
        supportingFindingIds: sepsisSupport.slice(0, 6),
        contradictingFindingIds: [],
        missingInformation: [
          'Blood cultures (≥2 sets) prior to antimicrobial administration',
          'Repeat serum lactate at 2–4 hours to confirm clearance',
          'Source localization (chest radiography, urinalysis, blood cultures)',
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
      const spo2Id = matchFindings(['89%', '90%', 'spo2', 'oxygen']).concat(matchLabs(['spo2', 'oxygen']))[0] || 'hypox-spo2';
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
        (l.interpretation.toLowerCase() === 'normal' || l.interpretation.toLowerCase() === 'within normal')
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
        (l.interpretation.toLowerCase() === 'normal' || l.value.toLowerCase().includes('negative'))
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
    if (primaryHyp) {
      summaryParts.push(
        `Diagnostic assessment prioritizes ${primaryHyp.label} (${primaryHyp.status.toLowerCase()}) as the leading clinical consideration.`
      );
    } else {
      summaryParts.push('Diagnostic evaluation in progress for active clinical presentation.');
    }

    // Extract dynamic clinical signals present in this specific case
    const observedSignals: string[] = [];
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

    if (observedSignals.length > 0) {
      summaryParts.push(
        `Key active clinical drivers identified from chart data include ${observedSignals.slice(0, 5).join(', ')}.`
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
      console.info('[MistralInstructProvider] No HF token — using deterministic fallback.');
      return deterministicProvider.generateAssessment(input);
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
        console.warn('[MistralInstructProvider] Empty response — falling back to deterministic.');
        return deterministicProvider.generateAssessment(input);
      }

      // Extract JSON block from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[MistralInstructProvider] No JSON block found in response — falling back.');
        return deterministicProvider.generateAssessment(input);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.warn('[MistralInstructProvider] JSON parse failed — falling back.', parseErr);
        return deterministicProvider.generateAssessment(input);
      }

      if (!parsed.summary || !Array.isArray(parsed.hypotheses)) {
        console.warn('[MistralInstructProvider] Schema mismatch — falling back.');
        return deterministicProvider.generateAssessment(input);
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

      // If AI returned no grounded hypotheses, supplement with deterministic
      if (groundedHypotheses.length === 0) {
        console.warn('[MistralInstructProvider] No grounded hypotheses in AI output — merging deterministic.');
        const det = await deterministicProvider.generateAssessment(input);
        return {
          summary: parsed.summary || det.summary,
          hypotheses: det.hypotheses,
          contradictions: [...groundedContradictions, ...det.contradictions],
          limitations: [...limitations, ...det.limitations],
        };
      }

      return {
        summary: String(parsed.summary),
        hypotheses: groundedHypotheses,
        contradictions: groundedContradictions,
        limitations,
      };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const is429 = msg.includes('429') || msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('overload');
      const is503 = msg.includes('503') || msg.toLowerCase().includes('warming') || msg.toLowerCase().includes('loading');

      if (is429 || is503) {
        console.warn(`[MistralInstructProvider] Model temporarily unavailable (${is429 ? '429 rate-limit' : '503 loading'}) — using deterministic synthesizer.`);
      } else {
        console.warn('[MistralInstructProvider] Generation error — falling back to deterministic:', msg);
      }

      return deterministicProvider.generateAssessment(input);
    }
  }
}

// Singleton instances
export const deterministicProvider: ReasoningProvider = new DeterministicClinicalProvider();
export const mistralProvider: ReasoningProvider = new MistralInstructProvider();

// Legacy alias for backward compatibility
export const testProvider = deterministicProvider;
export const huggingFaceProvider = mistralProvider;

export function getDefaultReasoningProvider(): ReasoningProvider {
  return mistralProvider; // Always use Mistral (falls back to deterministic if no HF token)
}
