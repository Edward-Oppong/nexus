// ============================================================
// src/lib/intelligence/prompts/clinical-prompts.ts
// Calibrated Clinical Prompt Engineering System for Nexus AI Models
// High-confidence, few-shot, and regulatory-guarded prompt templates
// Adheres strictly to EU MDR 2017/745 & MDCG 2020-1 Annex I standards
// ============================================================

export interface ClinicalPromptInput {
  caseId: string;
  clinicalSummary: string;
  verifiedFindings: Array<{ id: string; category: string; label: string; value?: string; unit?: string }>;
  investigationResults: Array<{ id: string; testName: string; value: string; interpretation: string; status?: string }>;
  retrievedEvidence: Array<{ id: string; title: string; excerpt?: string; sourceUrl?: string }>;
  informationGaps: Array<{ id: string; description: string; priority: string }>;
  patientDemographics?: { age?: number; gender?: string; allergies?: string[]; pastHistory?: string[] };
}

/**
 * 1. HIGH-CONFIDENCE CLINICAL REASONING & DIFFERENTIAL SYNTHESIS PROMPT
 * Used by generative reasoning models (MedGemma, Mixtral, Qwen-2.5, Falconsai)
 */
export function buildClinicalReasoningPrompt(input: ClinicalPromptInput): string {
  const verifiedFindingsList = input.verifiedFindings.length > 0
    ? input.verifiedFindings.map((f) => `  - [${f.id}] [${f.category.toUpperCase()}] ${f.label}${f.value ? `: ${f.value}` : ''}${f.unit ? ` ${f.unit}` : ''}`).join('\n')
    : '  (None documented yet)';

  const investigationResultsList = input.investigationResults.length > 0
    ? input.investigationResults.map((i) => `  - [${i.id}] ${i.testName}: ${i.value} -> ${i.interpretation}${i.status ? ` [${i.status}]` : ''}`).join('\n')
    : '  (Pending laboratory/imaging results)';

  const evidenceList = input.retrievedEvidence.length > 0
    ? input.retrievedEvidence.map((e) => `  - [${e.id}] "${e.title}" (${e.excerpt ? e.excerpt.slice(0, 160) : 'Guideline reference'})`).join('\n')
    : '  (Standard clinical guidelines apply)';

  const gapsList = input.informationGaps.length > 0
    ? input.informationGaps.map((g) => `  - [${g.id}] [${g.priority}] ${g.description}`).join('\n')
    : '  (No outstanding gaps recorded)';

  const demographics = input.patientDemographics
    ? `Patient: ${input.patientDemographics.age ? `${input.patientDemographics.age}yo` : ''} ${input.patientDemographics.gender || ''}
Documented Allergies: ${input.patientDemographics.allergies?.join(', ') || 'NKDA'}
Relevant PMHx: ${input.patientDemographics.pastHistory?.join('; ') || 'None reported'}`
    : `Case ID: ${input.caseId}`;

  return `[SYSTEM ROLE: SENIOR ATTENDING CLINICIAN & CLINICAL REASONING FELLOW]
You are the Nexus Clinical Diagnostic Engine, an advanced medical intelligence co-pilot designed to assist acute physicians with diagnostic reasoning, differential hypothesis weighting, and safety hazard detection.

=== CLINICAL PATIENT DOSSIER ===
${demographics}
Presentation Narrative: "${input.clinicalSummary}"

VERIFIED CLINICAL FINDINGS (Ground Truth):
${verifiedFindingsList}

DIAGNOSTIC INVESTIGATION RESULTS:
${investigationResultsList}

RETRIEVED GUIDELINE EVIDENCE POOL:
${evidenceList}

CRITICAL INFORMATION GAPS:
${gapsList}

=== 18 NON-NEGOTIABLE ARCHITECTURAL & SAFETY RULES ===
1. GROUNDING REQUIREMENT: Every hypothesis claim MUST explicitly cite matching verified finding IDs (e.g. ["f-1", "f-2"]) from the dossier above. NEVER hallucinate or invent new IDs.
2. NO NUMERICAL PROBABILITIES: NEVER output percentages or statistical diagnostic odds (e.g. no "85% likelihood", no "p = 0.04"). Use qualitative certainty terms: SUPPORTED, UNCERTAIN, or CONTRADICTED.
3. EPISTEMIC SEPARATION: Strictly isolate what is KNOWN (verified findings), what is INFERRED (pathophysiologic link), and what is UNKNOWN (information gaps).
4. SAFETY FIRST: Actively flag drug-allergy conflicts, organ dysfunction dosing adjustments, and urgent clinical escalations.
5. IMMUTABLE CONTRADICTIONS: If clinical findings contradict each other (e.g. joint pains suggesting lupus vs splinter hemorrhages indicating bacterial emboli), explicitly document the contradiction.

=== REQUIRED OUTPUT FORMAT ===
Return ONLY a valid JSON object matching this exact schema:
{
  "summary": "Concise 2-3 sentence executive clinical synthesis emphasizing acute priorities and pathophysiologic trajectory.",
  "hypotheses": [
    {
      "label": "Primary Diagnostic Hypothesis (e.g. Subacute Infective Endocarditis)",
      "status": "Supported",
      "rationale": "Clear mechanistic rationale connecting verified findings to established clinical criteria (e.g. Modified Duke Criteria) without percentage probabilities.",
      "supportingFindingIds": ["f-2", "f-3"],
      "contradictingFindingIds": [],
      "missingInformation": ["Transesophageal Echocardiogram (TEE) to evaluate vegetation size"],
      "evidenceSourceIds": ["ev-aha-2025"]
    }
  ],
  "contradictions": [
    {
      "findingAId": "f-1",
      "findingBId": "f-2",
      "explanation": "Detailed explanation of clinical tension between these observations."
    }
  ],
  "safetyAlerts": [
    {
      "severity": "CRITICAL",
      "issue": "Specific safety hazard (e.g. Penicillin allergy cross-reactivity contraindication).",
      "action": "Clear actionable mitigation (e.g. Switch to IV Vancomycin with AUC-targeted therapeutic monitoring)."
    }
  ],
  "limitations": [
    "Advisory output for licensed physician review; not an autonomous medical device."
  ]
}`;
}

/**
 * 2. STRUCTURED SBAR LONGITUDINAL SYNTHESIS PROMPT
 * Used for clinical handover notes, multidisciplinary summaries, and round briefings
 */
export function buildSbarHandoverPrompt(patientName: string, caseSummary: string, findings: string[], planNotes: string): string {
  return `[TASK: SBAR CLINICAL HANDOVER SYNTHESIS]
Synthesize the following acute clinical case into a pristine, high-fidelity SBAR (Situation, Background, Assessment, Recommendation) structured note for incoming physician handover:

Patient: ${patientName}
Presentation: ${caseSummary}
Active Findings & Parameters:
${findings.map((f) => `- ${f}`).join('\n')}
Active Orders & Plan: ${planNotes}

Format output cleanly in four standardized sections:
- S (Situation): Immediate reason for admission, acuity, current bed location.
- B (Background): Relevant past medical history, predisposing events (e.g. recent procedures), baseline functional status.
- A (Assessment): Current working diagnosis, hemodynamic stability, key laboratory / imaging results.
- R (Recommendation): Next 12-hour critical milestones, pending laboratory cultures, and contingency safety parameters.`;
}

/**
 * 3. DENSE LITERATURE RETRIEVAL PROMPT (PICO FORMAT)
 * Formulates optimized semantic queries for MedCPT literature encoders
 */
export function buildPicoQuery(condition: string, findings: string[], contraindications?: string[]): string {
  const p = findings.slice(0, 4).join(', ');
  const c = contraindications && contraindications.length > 0 ? `with ${contraindications.join(', ')}` : 'standard inpatient';
  return `Patient population with ${condition} presenting with ${p} ${c}. Guideline-recommended diagnostic criteria, antimicrobial pharmacotherapy regimens, and risk stratification.`;
}

/**
 * 4. CLINICAL NER GUIDELINES & SAMPLE PRESETS
 * Verified input benchmarks for biomedical entity recognition models
 */
export const CLINICAL_NER_BENCHMARKS = [
  {
    title: 'Infective Endocarditis with Allergy',
    text: 'A 42-year-old female presents with persistent high fever of 39.2°C, night sweats, and new splinter hemorrhages under nail beds after dental extraction 3 weeks ago. Auscultation reveals a grade 3/6 holosystolic murmur at cardiac apex. Documented severe anaphylaxis to amoxicillin. Blood cultures grew Streptococcus viridans in 3 of 3 sets.',
    expectedEntities: ['fever', 'splinter hemorrhages', 'dental extraction', 'holosystolic murmur', 'anaphylaxis', 'amoxicillin', 'Streptococcus viridans'],
  },
  {
    title: 'Acute Coronary Syndrome & Renal Impairment',
    text: '68-year-old male presenting with acute substernal crushing chest pain radiating to left jaw, diaphoresis, and shortness of breath. ECG demonstrates 2mm ST-segment elevation in leads V1-V4. Serum troponin I elevated at 4.8 ng/mL. Serum creatinine is 2.1 mg/dL. Prescribed aspirin 300mg and ticagrelor 180mg.',
    expectedEntities: ['crushing chest pain', 'diaphoresis', 'shortness of breath', 'ST-segment elevation', 'troponin I', 'creatinine', 'aspirin', 'ticagrelor'],
  },
  {
    title: 'Severe COPD Exacerbation with Infection',
    text: '71-year-old female with severe COPD admitted with acute respiratory distress, wheezing, and purulent green sputum. Arterial blood gas shows pH 7.29, PaCO2 58 mmHg, PaO2 55 mmHg. Chest X-ray reveals left lower lobe consolidation. Started on non-invasive ventilation (BiPAP), IV methylprednisolone 40mg, and nebulized ipratropium.',
    expectedEntities: ['COPD', 'respiratory distress', 'wheezing', 'purulent green sputum', 'PaCO2', 'PaO2', 'consolidation', 'methylprednisolone', 'ipratropium'],
  },
];
