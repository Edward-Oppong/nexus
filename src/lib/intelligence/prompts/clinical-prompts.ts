// ============================================================
// src/lib/intelligence/prompts/clinical-prompts.ts
// Calibrated Clinical Prompt Engineering for Nexus AI
// Instruction-following format compatible with:
//   - mistralai/Mistral-7B-Instruct-v0.3
//   - HuggingFaceH4/zephyr-7b-beta
//   - Any HF text-generation model
// Adheres to EU MDR 2017/745 & MDCG 2020-1 Annex I standards
// ============================================================

export interface ClinicalPromptInput {
  caseId: string;
  clinicalSummary: string;
  verifiedFindings: Array<{
    id: string;
    category: string;
    label: string;
    value?: string;
    unit?: string;
    verificationStatus?: string;
  }>;
  investigationResults: Array<{
    id: string;
    testName: string;
    value: string;
    interpretation: string;
    status?: string;
  }>;
  retrievedEvidence: Array<{ id: string; title: string; excerpt?: string; sourceUrl?: string }>;
  informationGaps: Array<{ id: string; description: string; priority: string }>;
  patientDemographics?: {
    age?: number;
    gender?: string;
    allergies?: string[];
    pastHistory?: string[];
  };
  existingHypotheses?: Array<{ id: string; title: string; status: string }>;
}

// ----------------------------------------------------------
// Instruction-following JSON prompt for clinical differential
// diagnosis synthesis — works with Mistral, Zephyr, and
// other instruction-tuned text-generation models via HF.
// ----------------------------------------------------------
export function buildClinicalReasoningPrompt(input: ClinicalPromptInput): string {
  const verified = input.verifiedFindings.filter(
    (f) => !f.label.startsWith('[UNVERIFIED]')
  );
  const unverified = input.verifiedFindings.filter(
    (f) => f.label.startsWith('[UNVERIFIED]')
  );

  const verifiedList =
    verified.length > 0
      ? verified
          .map(
            (f) =>
              `  [${f.id}] (${f.category.toUpperCase()}) ${f.label}${f.value ? `: ${f.value}` : ''}${f.unit ? ` ${f.unit}` : ''}`
          )
          .join('\n')
      : '  (No clinician-verified findings yet — reason from investigation results and history)';

  const unverifiedList =
    unverified.length > 0
      ? unverified
          .map((f) => `  [${f.id}] ${f.label.replace('[UNVERIFIED] ', '')}`)
          .join('\n')
      : '  (None)';

  const labsList =
    input.investigationResults.length > 0
      ? input.investigationResults
          .map(
            (i) =>
              `  [${i.id}] ${i.testName}: ${i.value}  → ${i.interpretation}`
          )
          .join('\n')
      : '  (No results available yet)';

  const gapsList =
    input.informationGaps.length > 0
      ? input.informationGaps
          .map((g) => `  [${g.id}] [${g.priority}] ${g.description}`)
          .join('\n')
      : '  (None documented)';

  const demographics = input.patientDemographics
    ? [
        input.patientDemographics.age
          ? `Age: ${input.patientDemographics.age}yo`
          : '',
        input.patientDemographics.gender
          ? `Sex: ${input.patientDemographics.gender}`
          : '',
        input.patientDemographics.allergies?.length
          ? `Allergies: ${input.patientDemographics.allergies.join(', ')}`
          : 'Allergies: NKDA',
        input.patientDemographics.pastHistory?.length
          ? `PMHx: ${input.patientDemographics.pastHistory.join('; ')}`
          : '',
      ]
        .filter(Boolean)
        .join(' | ')
    : '';

  const hypothesesHint =
    input.existingHypotheses && input.existingHypotheses.length > 0
      ? `\nPrior hypotheses on file:\n${input.existingHypotheses.map((h) => `  - ${h.title} [${h.status}]`).join('\n')}`
      : '';

  const findingIds = input.verifiedFindings.map((f) => f.id);
  const labIds = input.investigationResults.map((i) => i.id);
  const allIds = [...findingIds, ...labIds];

  return `<s>[INST]
You are the Nexus Clinical Diagnostic Engine — a precision differential diagnosis co-pilot for acute hospital physicians. Your task is to analyze the clinical case below and return a structured differential diagnosis assessment.

=== CLINICAL CASE ===
${demographics ? demographics + '\n' : ''}Presentation: ${input.clinicalSummary}
${hypothesesHint}

VERIFIED CLINICAL FINDINGS:
${verifiedList}

UNVERIFIED AI-EXTRACTED FINDINGS (do not treat as fact, but may generate hypotheses):
${unverifiedList}

LABORATORY & INVESTIGATION RESULTS:
${labsList}

INFORMATION GAPS:
${gapsList}

=== STRICT OUTPUT RULES ===
1. GROUNDING: Every hypothesis MUST cite at least one ID from this list: ${JSON.stringify(allIds)}. Only use IDs that actually appear in the case data above. NEVER invent IDs.
2. NO PROBABILITIES: Do not use percentages or numeric odds. Use qualitative terms: "Supported", "Uncertain", or "Contradicted".
3. HYPOTHESES: Generate 2–4 clinically plausible differential diagnoses derived from the findings and labs above. If limited data, generate hypotheses based on the presentation and history.
4. CONTRADICTIONS: If any two findings conflict clinically (e.g., normal WBC yet high CRP, or normal ECG yet high troponin), document that contradiction.
5. SAFETY: Flag any drug-allergy conflicts, critical lab values, or urgent escalation triggers.
6. LIMITATIONS: Always list data gaps that limit this assessment.
7. ADVISORY ONLY: Never claim a definitive diagnosis. Output is for physician review only.

Return ONLY valid JSON with this exact structure (no markdown, no prose, just JSON):
{
  "summary": "2-3 sentence executive synthesis of the case with key acute priorities and pathophysiologic trajectory.",
  "hypotheses": [
    {
      "label": "Hypothesis name (e.g., Community-Acquired Pneumonia with Sepsis Features)",
      "status": "Supported",
      "rationale": "Mechanistic clinical rationale linking specific findings to this diagnosis. Reference the finding IDs that support or contradict it.",
      "supportingFindingIds": ["FINDING_ID_1", "FINDING_ID_2"],
      "contradictingFindingIds": [],
      "missingInformation": ["Specific test or datum that would confirm or exclude this hypothesis"],
      "evidenceSourceIds": []
    }
  ],
  "contradictions": [
    {
      "findingAId": "FINDING_ID_A",
      "findingBId": "FINDING_ID_B",
      "explanation": "Clinical explanation of why these two findings are in tension."
    }
  ],
  "safetyAlerts": [
    {
      "severity": "CRITICAL",
      "issue": "Specific safety concern",
      "action": "Recommended mitigation"
    }
  ],
  "limitations": [
    "List each clinical data gap or caveat limiting this assessment."
  ]
}
[/INST]`;
}

/**
 * SBAR Clinical Handover Synthesis Prompt
 */
export function buildSbarHandoverPrompt(
  patientName: string,
  caseSummary: string,
  findings: string[],
  planNotes: string
): string {
  return `<s>[INST]
Synthesize the following acute clinical case into a pristine SBAR (Situation, Background, Assessment, Recommendation) structured handover note for an incoming physician.

Patient: ${patientName}
Presentation: ${caseSummary}
Active Findings:
${findings.map((f) => `- ${f}`).join('\n')}
Active Orders & Plan: ${planNotes}

Format output cleanly in four sections:
- S (Situation): Immediate reason for admission, acuity level, current location.
- B (Background): Relevant past medical history, predisposing events, baseline functional status.
- A (Assessment): Current working diagnosis, hemodynamic stability, key laboratory/imaging results.
- R (Recommendation): Next 12-hour milestones, pending cultures, contingency safety parameters.
[/INST]`;
}

/**
 * Dense Literature Retrieval Query (PICO Format)
 */
export function buildPicoQuery(
  condition: string,
  findings: string[],
  contraindications?: string[]
): string {
  const p = findings.slice(0, 4).join(', ');
  const c =
    contraindications && contraindications.length > 0
      ? `with ${contraindications.join(', ')}`
      : 'standard inpatient';
  return `Patient population with ${condition} presenting with ${p} ${c}. Guideline-recommended diagnostic criteria, antimicrobial pharmacotherapy regimens, and risk stratification.`;
}

/**
 * Clinical NER Benchmarks
 */
export const CLINICAL_NER_BENCHMARKS = [
  {
    title: 'Infective Endocarditis with Allergy',
    text: 'A 42-year-old female presents with persistent high fever of 39.2°C, night sweats, and new splinter hemorrhages under nail beds after dental extraction 3 weeks ago. Auscultation reveals a grade 3/6 holosystolic murmur at cardiac apex. Documented severe anaphylaxis to amoxicillin. Blood cultures grew Streptococcus viridans in 3 of 3 sets.',
    expectedEntities: [
      'fever',
      'splinter hemorrhages',
      'dental extraction',
      'holosystolic murmur',
      'anaphylaxis',
      'amoxicillin',
      'Streptococcus viridans',
    ],
  },
  {
    title: 'Acute Coronary Syndrome & Renal Impairment',
    text: '68-year-old male presenting with acute substernal crushing chest pain radiating to left jaw, diaphoresis, and shortness of breath. ECG demonstrates 2mm ST-segment elevation in leads V1-V4. Serum troponin I elevated at 4.8 ng/mL. Serum creatinine is 2.1 mg/dL.',
    expectedEntities: [
      'crushing chest pain',
      'diaphoresis',
      'ST-segment elevation',
      'troponin I',
      'creatinine',
    ],
  },
];
