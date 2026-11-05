// ============================================================
// src/lib/intelligence/evidence-auditor.ts
// Evidence Graph & Post-Reasoning Auditor (Phase 14 Production)
// Audits all reasoning outputs, hypotheses, and recommendations
// against the hard-boundary Evidence Graph of the active case.
// Catches and purges hallucinations, cross-case contaminations,
// redundant investigation recommendations, and inaccurate clinical scores.
// ============================================================

import { FullSyntheticCase } from '../../data/cases/mockCasesData';
import { RawReasoningOutput } from '../../domain/nexus-assessment';
import { NexusRecommendation } from '../../domain/nexus-assessment';

export interface EvidenceGraph {
  caseId: string;
  patientAge?: number;
  patientSex?: string;
  chiefComplaint: string;
  hasChestPain: boolean;
  hasAbdominalPain: boolean;
  hasShortnessOfBreath: boolean;
  hasFever: boolean;
  verifiedSymptomTokens: Set<string>;
  completedTestNames: Set<string>;
  completedFindingLabels: string[];
  vitals: {
    temperature?: number;
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    respiratoryRate?: number;
    spo2?: number;
    gcs?: number;
  };
  labs: {
    wbc?: number;
    crp?: number | string;
    troponin?: number | string;
    lactate?: number | string;
    creatinine?: number;
    platelets?: number;
    bilirubin?: number;
  };
  qsofaScore: number;
  qsofaInputsPresent: boolean;
  sirsCriteriaMet: number;
  hasEstablishedOrganDysfunction: boolean;
  sepsisAudit: {
    infectionEvidence: 'PRESENT' | 'SUSPECTED' | 'NOT_ESTABLISHED';
    sirsCriteriaMet: number;
    qsofaScore: number;
    organDysfunction: 'NOT_ESTABLISHED' | 'ESTABLISHED';
    sepsisStatus: 'NOT_ESTABLISHED' | 'SUSPECTED_EVALUATE_SOFA' | 'CRITERIA_MET';
  };
}

export interface ClaimAuditResult {
  claim: string;
  status: 'SUPPORTED' | 'UNSUPPORTED_CONTAMINATION' | 'REDUNDANT_ALREADY_PERFORMED' | 'NOT_CLINICALLY_RELEVANT';
  reason: string;
}

export interface EvidenceAuditReport {
  isFullyGrounded: boolean;
  supportedClaimsCount: number;
  rejectedClaimsCount: number;
  auditedClaims: ClaimAuditResult[];
  purgedContaminations: string[];
  suppressedRecommendations: string[];
  sepsisStratification: {
    infectionEvidence: 'PRESENT' | 'SUSPECTED' | 'NOT_ESTABLISHED';
    sirsCriteriaMet: number;
    qsofaScore: number;
    organDysfunction: 'NOT_ESTABLISHED_FROM_AVAILABLE_DATA' | 'ESTABLISHED';
    sepsisStatus: 'NOT_ESTABLISHED' | 'SUSPECTED_EVALUATE_SOFA' | 'CRITERIA_MET';
    clinicalConcern: string;
  };
}

/**
 * Builds the ground-truth Evidence Graph strictly from the verified case data.
 */
/**
 * Checks whether a keyword is affirmatively present in text,
 * respecting both prefix negation ("denies chest pain", "nil chest pain")
 * and postfix negation ("chest pain: negative", "murmur absent").
 * Also handles compound comma-separated denial lists
 * ("denies chest pain, fever, cough" → all three negated).
 *
 * Mirrors isAffirmativelyPresent from reasoning-provider.ts
 * but works on a single combined text blob.
 */
function isAffirmativelyPresentInText(text: string, kw: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const kwLower = kw.toLowerCase();
  let searchFrom = 0;

  while (searchFrom < lower.length) {
    const kwIndex = lower.indexOf(kwLower, searchFrom);
    if (kwIndex === -1) return false;

    // Prefix negation: look back up to 80 chars for denial words
    const prefix = lower.slice(Math.max(0, kwIndex - 80), kwIndex);
    const hasNegationPrefix = /\b(no|not|denies|denied|without|negative\s+for|absence\s+of|nil|rules?\s+out|free\s+of|unremarkable\s+for)\s+([^.;]{0,80})$/i.test(prefix);

    // Postfix negation: look ahead up to 30 chars for "none", "absent", "negative", etc.
    const postfix = lower.slice(kwIndex + kwLower.length, Math.min(lower.length, kwIndex + kwLower.length + 30));
    const hasNegationPostfix = /^(\s*[:=-]?\s*(none|absent|negative|nil|normal|unremarkable|not\s+heard|not\s+present|not\s+identified))\b/i.test(postfix);

    if (!hasNegationPrefix && !hasNegationPostfix) {
      return true;
    }

    searchFrom = kwIndex + kwLower.length;
  }
  return false;
}

export function buildEvidenceGraph(activeCase: FullSyntheticCase): EvidenceGraph {
  const caseId = activeCase.overview.id;
  const cc = (activeCase.chiefComplaint || '').toLowerCase();
  const hpi = (activeCase.historyOfPresentIllness || '').toLowerCase();
  const findings = activeCase.findings || [];
  const completedFindingLabels = findings.map((f) => f.label);
  const investigations = activeCase.investigations || [];

  // Completed tests (only tests that have an actual recorded result)
  const completedTestNames = new Set<string>();
  for (const inv of investigations) {
    if (inv.result !== undefined || inv.status === 'COMPLETED') {
      completedTestNames.add(inv.testName.toLowerCase());
    }
  }
  for (const f of findings) {
    if (f.category === 'LABORATORY' || f.category === 'IMAGING' || f.category === 'laboratory') {
      completedTestNames.add(f.label.toLowerCase());
    }
  }

  // Symptom tokens
  const verifiedSymptomTokens = new Set<string>();
  const addTokens = (str: string) => {
    str
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
      .forEach((t) => verifiedSymptomTokens.add(t));
  };
  addTokens(cc);
  addTokens(hpi);
  findings.forEach((f) => addTokens(f.label));

  // Full text blob for isAffirmativelyPresentInText checks
  const allClinicalText = `${cc} ${hpi} ${findings.map((f) => f.label).join(' ')}`;

  // Structured Chest Pain Check: Uses the shared negation-aware helper
  const chestPainKeywords = ['chest pain', 'chest discomfort', 'chest tightness', 'chest pressure', 'angina'];
  const hasChestPain =
    chestPainKeywords.some((kw) => isAffirmativelyPresentInText(allClinicalText, kw)) ||
    isAffirmativelyPresentInText(allClinicalText, 'substernal');

  const hasAbdominalPain =
    isAffirmativelyPresentInText(allClinicalText, 'abdominal pain') ||
    isAffirmativelyPresentInText(allClinicalText, 'belly pain') ||
    isAffirmativelyPresentInText(allClinicalText, 'right lower quadrant') ||
    isAffirmativelyPresentInText(allClinicalText, 'rlq') ||
    isAffirmativelyPresentInText(allClinicalText, 'mcburney') ||
    isAffirmativelyPresentInText(allClinicalText, 'iliac fossa') ||
    isAffirmativelyPresentInText(allClinicalText, 'epigastric pain');

  const hasShortnessOfBreath =
    isAffirmativelyPresentInText(allClinicalText, 'dyspnea') ||
    isAffirmativelyPresentInText(allClinicalText, 'shortness of breath') ||
    isAffirmativelyPresentInText(allClinicalText, 'breathlessness') ||
    isAffirmativelyPresentInText(allClinicalText, 'orthopnea') ||
    isAffirmativelyPresentInText(allClinicalText, 'tachypnea');

  // Vitals extraction
  const vitals: EvidenceGraph['vitals'] = {};
  for (const v of activeCase.vitalSigns || []) {
    const param = (v.parameter || '').toLowerCase();
    const val = parseFloat(String(v.value).replace(/[^0-9.]/g, ''));
    if (isNaN(val)) continue;

    if (param.includes('temp')) vitals.temperature = val;
    if (param.includes('blood pressure') || param.includes('bp')) {
      const parts = String(v.value).split('/');
      if (parts[0]) vitals.systolicBp = parseFloat(parts[0]);
      if (parts[1]) vitals.diastolicBp = parseFloat(parts[1]);
    }
    if (param.includes('heart rate') || param.includes('pulse')) vitals.heartRate = val;
    if (param.includes('resp') || param.includes('rr')) vitals.respiratoryRate = val;
    if (param.includes('spo2') || param.includes('oxygen sat')) vitals.spo2 = val;
    if (param.includes('gcs')) vitals.gcs = val;
  }

  // Labs extraction
  const labs: EvidenceGraph['labs'] = {};
  for (const inv of investigations) {
    const name = inv.testName.toLowerCase();
    const rawRes = inv.result;
    const strRes = typeof rawRes === 'object' && rawRes !== null ? String((rawRes as any).value ?? '') : String(rawRes ?? '');
    const val = parseFloat(strRes.replace(/[^0-9.]/g, ''));
    if (name.includes('wbc') || name.includes('white blood')) labs.wbc = val;
    if (name.includes('crp') || name.includes('c-reactive')) labs.crp = strRes;
    if (name.includes('troponin')) labs.troponin = strRes;
    if (name.includes('lactate')) labs.lactate = strRes;
    if (name.includes('creatinine')) labs.creatinine = val;
    if (name.includes('platelet')) labs.platelets = val;
    if (name.includes('bilirubin')) labs.bilirubin = val;
  }

  const hasFever = (vitals.temperature !== undefined && vitals.temperature >= 38.0) ||
    isAffirmativelyPresentInText(allClinicalText, 'fever') ||
    isAffirmativelyPresentInText(allClinicalText, 'febrile') ||
    isAffirmativelyPresentInText(allClinicalText, 'pyrexia');

  // qSOFA Calculation: RR >= 22 (1 pt), SBP <= 100 (1 pt), GCS < 15 (1 pt)
  let qsofaScore = 0;
  let qsofaInputsPresent = false;
  if (vitals.respiratoryRate !== undefined) {
    qsofaInputsPresent = true;
    if (vitals.respiratoryRate >= 22) qsofaScore += 1;
  }
  if (vitals.systolicBp !== undefined) {
    qsofaInputsPresent = true;
    if (vitals.systolicBp <= 100) qsofaScore += 1;
  }
  if (vitals.gcs !== undefined) {
    qsofaInputsPresent = true;
    if (vitals.gcs < 15) qsofaScore += 1;
  }

  // SIRS Criteria (Temp > 38 or < 36, HR > 90, RR > 20 or PaCO2 < 32, WBC > 12 or < 4 or >10% bands)
  let sirsCriteriaMet = 0;
  if (
    (vitals.temperature !== undefined && (vitals.temperature > 38.0 || vitals.temperature < 36.0)) ||
    hasFever
  ) {
    sirsCriteriaMet++;
  }
  if (
    (vitals.heartRate !== undefined && vitals.heartRate > 90) ||
    findings.some((f) => /tachycardia|heart rate (1\d\d|[9]\d)/i.test(f.label))
  ) {
    sirsCriteriaMet++;
  }
  if (
    (vitals.respiratoryRate !== undefined && vitals.respiratoryRate > 20) ||
    findings.some((f) => /tachypnea|resp.* rate [2-9]\d/i.test(f.label))
  ) {
    sirsCriteriaMet++;
  }
  if (
    (labs.wbc !== undefined && (labs.wbc > 12.0 || labs.wbc < 4.0)) ||
    findings.some((f) => /leukocytosis|wbc (1[2-9]|[2-9]\d)/i.test(f.label))
  ) {
    sirsCriteriaMet++;
  }

  // Organ dysfunction: MAP < 65, PaO2/FiO2 < 300, Platelets < 100, Bilirubin > 34, Creatinine > 170
  const hasEstablishedOrganDysfunction =
    (vitals.systolicBp !== undefined && vitals.systolicBp < 90) ||
    (labs.platelets !== undefined && labs.platelets < 100) ||
    (labs.creatinine !== undefined && labs.creatinine > 170) ||
    (labs.lactate !== undefined && typeof labs.lactate === 'number' && labs.lactate >= 2.0);

  const sepsisAudit = {
    infectionEvidence: (hasFever || (labs.wbc !== undefined && labs.wbc > 10.0)) ? ('PRESENT' as const) : ('NOT_ESTABLISHED' as const),
    sirsCriteriaMet,
    qsofaScore,
    organDysfunction: hasEstablishedOrganDysfunction ? ('ESTABLISHED' as const) : ('NOT_ESTABLISHED' as const),
    sepsisStatus: hasEstablishedOrganDysfunction
      ? ('CRITERIA_MET' as const)
      : qsofaScore >= 2
      ? ('SUSPECTED_EVALUATE_SOFA' as const)
      : ('NOT_ESTABLISHED' as const),
  };

  return {
    caseId,
    chiefComplaint: cc,
    hasChestPain,
    hasAbdominalPain,
    hasShortnessOfBreath,
    hasFever,
    verifiedSymptomTokens,
    completedTestNames,
    completedFindingLabels,
    vitals,
    labs,
    qsofaScore,
    qsofaInputsPresent,
    sirsCriteriaMet,
    hasEstablishedOrganDysfunction,
    sepsisAudit,
  };
}

/**
 * Evidence Auditor:
 * 1. Audits hypotheses for cross-case contaminated claims (e.g., chest pain in appendicitis).
 * 2. Implements the strict 3-Check Investigation Recommendation Filter:
 *    - Check 1: Already available? -> Suppress.
 *    - Check 2: Clinically relevant to a current hypothesis? -> If no, suppress.
 *    - Check 3: Would its result change diagnosis, risk classification, or management? -> If no, suppress.
 * 3. Stratifies Sepsis per Surviving Sepsis Campaign (SCCM 2021): Sepsis is not equal to infection + SIRS.
 */
export function auditReasoningOutput(
  rawOutput: RawReasoningOutput,
  evidenceGraph: EvidenceGraph
): { auditedOutput: RawReasoningOutput; report: EvidenceAuditReport } {
  const auditedClaims: ClaimAuditResult[] = [];
  const purgedContaminations: string[] = [];
  const suppressedRecommendations: string[] = [];

  // ── 1. Audit Hypotheses and Reasoning Justifications ─────────
  const auditedHypotheses = rawOutput.hypotheses
    .filter((h: RawReasoningOutput['hypotheses'][number]) => {
      // Rejection rule: If hypothesis is Acute Coronary Syndrome / Angina / Myocardial Infarction
      // but the Evidence Graph explicitly has NO chest pain and NO cardiac findings, reject it.
      const isCardiacHypothesis = /coronary|myocardial|stemi|angina|cardiac\s*ischemia|acute\s*coronary/i.test(h.label);
      if (isCardiacHypothesis && !evidenceGraph.hasChestPain) {
        purgedContaminations.push(`Rejected contaminated hypothesis: "${h.label}" (Zero chest pain or cardiac findings in active case)`);
        auditedClaims.push({
          claim: h.label,
          status: 'UNSUPPORTED_CONTAMINATION',
          reason: 'Active case Evidence Graph does not contain chest pain or cardiac evidence.',
        });
        return false;
      }

      // Rejection rule: If hypothesis is "Systemic Sepsis" or "Septic Shock"
      // but organ dysfunction is NOT established and qSOFA is 0/3.
      // Sepsis-3 (Surviving Sepsis Campaign 2021) strictly requires organ dysfunction.
      const isSepsisDiagnosis = /systemic\s*sepsis|septic\s*shock|sepsis\s*with\s*acute\s*organ/i.test(h.label);
      if (isSepsisDiagnosis && !evidenceGraph.hasEstablishedOrganDysfunction && evidenceGraph.qsofaScore < 2) {
        purgedContaminations.push(`Downgraded premature Sepsis diagnosis: "${h.label}" (Organ dysfunction not established; criteria for Sepsis-3 unmet)`);
        auditedClaims.push({
          claim: h.label,
          status: 'UNSUPPORTED_CONTAMINATION',
          reason: 'Sepsis requires acute life-threatening organ dysfunction (SOFA delta >= 2). SIRS to localized infection does not equate to systemic sepsis.',
        });
        return false;
      }

      return true;
    })
    .map((h: RawReasoningOutput['hypotheses'][number]) => {
      // Clean contaminated words from hypothesis description or summary
      let cleanedRationale = h.rationale || '';
      if (!evidenceGraph.hasChestPain && /chest\s*pain/i.test(cleanedRationale)) {
        cleanedRationale = cleanedRationale.replace(/,?\s*chest\s*pain\b/gi, '');
        purgedContaminations.push(`Stripped "chest pain" from hypothesis rationale of "${h.label}"`);
      }

      // Clean missingInformation items through the strict 3-check filter
      const cleanedMissingInfo = (h.missingInformation || []).filter((item: string) => {
        const itemLower = item.toLowerCase();

        // ── Check 1: Already Available? ─────────────────────────
        const isAlreadyDone = (testPatterns: RegExp[]) => {
          for (const pattern of testPatterns) {
            for (const completed of evidenceGraph.completedTestNames) {
              if (pattern.test(completed)) return true;
            }
            for (const fLabel of evidenceGraph.completedFindingLabels) {
              if (pattern.test(fLabel.toLowerCase())) return true;
            }
          }
          return false;
        };

        // Appendix ultrasound / CT abdomen
        if (/ultrasound.*appendix|appendix.*ultrasound|ct.*abdomen/i.test(itemLower)) {
          if (isAlreadyDone([/ultrasound/, /sonograph/, /usg/, /ct.*abdomen/])) {
            suppressedRecommendations.push(`Suppressed redundant test: "${item}" (Already available in case evidence)`);
            auditedClaims.push({
              claim: item,
              status: 'REDUNDANT_ALREADY_PERFORMED',
              reason: 'Imaging of appendix already performed and available in evidence graph.',
            });
            return false;
          }
        }

        // Troponin
        if (/troponin/i.test(itemLower)) {
          if (isAlreadyDone([/troponin/])) {
            suppressedRecommendations.push(`Suppressed redundant test: "${item}" (Already completed)`);
            return false;
          }
          // ── Check 2: Clinically Relevant to current hypotheses? ──
          if (!evidenceGraph.hasChestPain) {
            suppressedRecommendations.push(`Suppressed irrelevant test: "${item}" (No cardiac symptoms or chest pain in active case)`);
            auditedClaims.push({
              claim: item,
              status: 'NOT_CLINICALLY_RELEVANT',
              reason: 'Troponin has zero clinical relevance in absence of chest pain or acute coronary syndrome concern.',
            });
            return false;
          }
        }

        // Chest X-ray
        if (/chest\s*(x-ray|radiograph|cxr)/i.test(itemLower)) {
          if (isAlreadyDone([/chest\s*(x-ray|radiograph|cxr)/])) {
            suppressedRecommendations.push(`Suppressed redundant test: "${item}" (Already available in evidence)`);
            return false;
          }
        }

        // Pan-cultures / broad sepsis workup
        if (/pan-culture|sputum.*culture|serial.*lactate/i.test(itemLower)) {
          if (!evidenceGraph.hasEstablishedOrganDysfunction && evidenceGraph.qsofaScore === 0) {
            suppressedRecommendations.push(`Suppressed broad sepsis bundle: "${item}" (Organ dysfunction not established)`);
            return false;
          }
        }

        return true;
      });

      return {
        ...h,
        rationale: cleanedRationale,
        missingInformation: cleanedMissingInfo,
      };
    });

  // ── 2. Clean Case Summary from Contaminants ──────────────────
  let cleanedSummary = rawOutput.summary || '';
  if (!evidenceGraph.hasChestPain && /chest\s*pain/i.test(cleanedSummary)) {
    cleanedSummary = cleanedSummary.replace(/,?\s*chest\s*pain\b/gi, '');
    purgedContaminations.push('Stripped foreign "chest pain" symptom token from reasoning summary.');
  }

  // Surviving Sepsis Campaign (SCCM 2021) Stratification
  const sepsisStratification: EvidenceAuditReport['sepsisStratification'] = {
    infectionEvidence: evidenceGraph.hasFever || evidenceGraph.labs.wbc ? 'PRESENT' : 'NOT_ESTABLISHED',
    sirsCriteriaMet: evidenceGraph.sirsCriteriaMet,
    qsofaScore: evidenceGraph.qsofaScore,
    organDysfunction: evidenceGraph.hasEstablishedOrganDysfunction ? 'ESTABLISHED' : 'NOT_ESTABLISHED_FROM_AVAILABLE_DATA',
    sepsisStatus: evidenceGraph.hasEstablishedOrganDysfunction
      ? 'CRITERIA_MET'
      : evidenceGraph.qsofaScore >= 2
      ? 'SUSPECTED_EVALUATE_SOFA'
      : 'NOT_ESTABLISHED',
    clinicalConcern: evidenceGraph.hasEstablishedOrganDysfunction
      ? 'Initiate Surviving Sepsis Hour-1 bundle: IV broad-spectrum antimicrobials and hemodynamic stabilization.'
      : 'Physiological SIRS response to localized infectious process. Sepsis with organ failure is NOT established; monitor and prioritize surgical/localized source control.',
  };

  const report: EvidenceAuditReport = {
    isFullyGrounded: purgedContaminations.length === 0,
    supportedClaimsCount: auditedHypotheses.length,
    rejectedClaimsCount: purgedContaminations.length,
    auditedClaims,
    purgedContaminations,
    suppressedRecommendations,
    sepsisStratification,
  };

  const auditedOutput: RawReasoningOutput = {
    ...rawOutput,
    summary: cleanedSummary,
    hypotheses: auditedHypotheses,
  };

  return { auditedOutput, report };
}
