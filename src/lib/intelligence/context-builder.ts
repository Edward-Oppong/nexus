// ============================================================
// src/lib/intelligence/context-builder.ts
// Phase 6F: Context Builder
// Builds the structured ReasoningInput from FullSyntheticCase.
// The context is the only thing that goes into the reasoning engine.
// The model cannot invent data outside what the context provides.
// ============================================================

import { FullSyntheticCase } from '../../data/cases/mockCasesData';
import { ReasoningInput } from './reasoning-provider';

// ----------------------------------------------------------
// Build ReasoningInput from a FullSyntheticCase
// Includes ALL findings (verified + unverified) so the AI
// always has clinical data to reason against.
// Unverified findings are flagged — the AI must not treat
// them as authoritative but can use them for hypothesis generation.
// ----------------------------------------------------------
export function buildReasoningContext(
  activeCase: FullSyntheticCase,
  retrievedEvidence: ReasoningInput['retrievedEvidence'],
  scope: ReasoningInput['scope']
): ReasoningInput {
  const {
    overview,
    chiefComplaint,
    historyOfPresentIllness,
    findings,
    hypotheses,
    informationGaps,
    investigations,
    safetyIssues,
  } = activeCase;

  // Include ALL findings — verified ones are primary, unverified are flagged
  const verifiedFindings = findings
    .filter(
      (f) =>
        f.provenance.verificationStatus === 'Verified' ||
        f.provenance.verificationStatus === 'VERIFIED'
    )
    .map((f) => ({
      id: f.id,
      label: f.label,
      category: f.category,
      provenanceType: String(f.provenance.provenanceType),
      verificationStatus: 'Verified' as const,
      value: (f as any).value ?? (f as any).observedValue ?? '',
      unit: (f as any).unit ?? '',
    }));

  // Also pass unverified findings as context (flagged clearly)
  const unverifiedFindings = findings
    .filter(
      (f) =>
        f.provenance.verificationStatus !== 'Verified' &&
        f.provenance.verificationStatus !== 'VERIFIED'
    )
    .map((f) => ({
      id: f.id,
      label: `[UNVERIFIED] ${f.label}`,
      category: f.category,
      provenanceType: String(f.provenance.provenanceType),
      verificationStatus: 'Unverified' as const,
      value: (f as any).value ?? (f as any).observedValue ?? '',
      unit: (f as any).unit ?? '',
    }));

  // All findings (verified first)
  const allFindings = [...verifiedFindings, ...unverifiedFindings];

  // Completed investigations with results
  const investigationResults = investigations
    .filter((i) => i.result !== undefined)
    .map((i) => ({
      id: i.id,
      testName: i.testName,
      value: i.result!.value,
      status: i.result!.status,
      interpretation: i.result!.interpretation,
    }));

  // Existing hypotheses for the engine to be aware of
  const existingHypotheses = hypotheses.map((h) => ({
    id: h.id,
    title: h.title,
    status: h.status,
  }));

  // Safety context
  const safetyContext = safetyIssues
    .filter((s) => s.status !== 'Resolved')
    .map((s) => ({
      id: s.id,
      severity: s.severity,
      description: s.details,
    }));

  // Information gaps
  const informationGapsContext = informationGaps.map((g) => ({
    id: g.id,
    description: g.whyItMatters,
    priority: g.priority,
  }));

  // Extract patient demographics from overview
  const patientAge = (overview as any).patientAge ?? (overview as any).age;
  const patientGender = (overview as any).patientGender ?? (overview as any).gender;

  // Build rich clinical summary
  const findingSummaryParts: string[] = [];
  if (verifiedFindings.length > 0) {
    findingSummaryParts.push(`${verifiedFindings.length} verified finding(s)`);
  }
  if (unverifiedFindings.length > 0) {
    findingSummaryParts.push(`${unverifiedFindings.length} unverified finding(s)`);
  }
  if (investigationResults.length > 0) {
    findingSummaryParts.push(`${investigationResults.length} investigation result(s)`);
  }

  const clinicalSummary =
    `${chiefComplaint || 'Clinical case under review'}. ` +
    (historyOfPresentIllness
      ? `History: ${historyOfPresentIllness.substring(0, 300)}. `
      : '') +
    (patientAge ? `Patient age: ${patientAge}. ` : '') +
    (patientGender ? `Gender: ${patientGender}. ` : '') +
    (findingSummaryParts.length > 0 ? findingSummaryParts.join(', ') + '. ' : '') +
    (safetyContext.length > 0 ? `${safetyContext.length} active safety concern(s).` : '');

  return {
    caseId: overview.id,
    clinicalSummary,
    verifiedFindings: allFindings, // Pass all findings to the prompt
    investigationResults,
    existingHypotheses,
    retrievedEvidence,
    safetyContext,
    informationGaps: informationGapsContext,
    scope,
  };
}
