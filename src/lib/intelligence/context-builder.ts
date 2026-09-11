// ============================================================
// src/lib/intelligence/context-builder.ts
// Phase 6F: Context Builder
// Builds the structured CaseContext from FullSyntheticCase.
// The context is the only thing that goes into the reasoning engine.
// The model cannot invent data outside what the context provides.
// ============================================================

import { FullSyntheticCase } from '../../data/cases/mockCasesData';
import { ReasoningInput } from './reasoning-provider';

// ----------------------------------------------------------
// Build ReasoningInput from a FullSyntheticCase
// Only verified findings enter the reasoning context.
// AI-extracted-unverified findings are excluded from reasoning
// but flagged by the data quality layer.
// ----------------------------------------------------------
export function buildReasoningContext(
  activeCase: FullSyntheticCase,
  retrievedEvidence: ReasoningInput['retrievedEvidence'],
  scope: ReasoningInput['scope']
): ReasoningInput {
  const { overview, chiefComplaint, historyOfPresentIllness, findings, hypotheses, informationGaps, investigations, safetyIssues } = activeCase;

  // Only include clinician-verified findings in reasoning context
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
      verificationStatus: String(f.provenance.verificationStatus),
    }));

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

  const clinicalSummary =
    `Case ${overview.id}: ${chiefComplaint}. ` +
    `HPI: ${historyOfPresentIllness.substring(0, 200)}... ` +
    `${verifiedFindings.length} verified finding(s). ` +
    `${investigationResults.length} investigation result(s). ` +
    `${informationGapsContext.length} information gap(s). ` +
    `Safety issues: ${safetyContext.length}.`;

  return {
    caseId: overview.id,
    clinicalSummary,
    verifiedFindings,
    investigationResults,
    existingHypotheses,
    retrievedEvidence,
    safetyContext,
    informationGaps: informationGapsContext,
    scope,
  };
}
