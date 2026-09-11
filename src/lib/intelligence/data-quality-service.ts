// ============================================================
// src/lib/intelligence/data-quality-service.ts
// Phase 6F: Layer 1 — Deterministic Clinical Logic
// These checks run without an LLM. They are pure data validation.
// Results feed into the Nexus assessment as safety/gap inputs.
// ============================================================

import { ClinicalFinding } from '../../domain/finding';
import { InvestigationOrder } from '../../domain/investigation';
import { InformationGap } from '../../domain/hypothesis';
import { SafetyBoundaryState } from '../../domain/nexus-assessment';

export interface DataQualityResult {
  safetyBoundary: SafetyBoundaryState;
  safetyBoundaryReason?: string;
  unverifiedAIFindings: ClinicalFinding[];
  pendingInvestigations: InvestigationOrder[];
  missingCriticalData: string[];
  conflictingMeasurements: Array<{
    finding1Label: string;
    finding2Label: string;
    explanation: string;
  }>;
  isReasoningBlocked: boolean;
}

export interface DataQualityInput {
  findings: ClinicalFinding[];
  investigations: InvestigationOrder[];
  informationGaps: InformationGap[];
}

// ----------------------------------------------------------
// Deterministic quality gate
// Returns a DataQualityResult that the orchestrator uses to
// decide whether to proceed to AI reasoning or block with
// INSUFFICIENT_DATA / SAFETY_CRITICAL boundary state.
// ----------------------------------------------------------
export function runDataQualityChecks(input: DataQualityInput): DataQualityResult {
  const { findings, investigations, informationGaps } = input;

  // 1. Identify unverified AI-extracted findings
  const unverifiedAIFindings = findings.filter(
    (f) =>
      (f.provenance.provenanceType === 'AI-extracted' ||
        f.provenance.provenanceType === 'AI_EXTRACTED') &&
      (f.provenance.verificationStatus === 'Unverified' ||
        f.provenance.verificationStatus === 'UNREVIEWED')
  );

  // 2. Identify pending investigations
  const pendingInvestigations = investigations.filter(
    (i) =>
      i.status === 'In progress' ||
      i.status === 'Requested' ||
      i.status === 'IN_PROGRESS' ||
      i.status === 'REQUESTED'
  );

  // 3. High-priority missing data
  const missingCriticalData = informationGaps
    .filter((g) => g.priority === 'HIGH PRIORITY' && g.status === 'Not yet resolved')
    .map((g) => g.testName);

  // 4. Conflicting measurements — deterministic check
  // Look for multiple findings with overlapping labels but conflicting values
  const conflictingMeasurements: DataQualityResult['conflictingMeasurements'] = [];
  const vitalFindings = findings.filter(
    (f) => f.category === 'vital' || f.category === 'sign'
  );
  // Primitive deduplication: if more than one finding has the same label, flag it
  const labelGroups = new Map<string, ClinicalFinding[]>();
  vitalFindings.forEach((f) => {
    const key = f.label.toLowerCase().split(' ').slice(0, 3).join(' ');
    if (!labelGroups.has(key)) labelGroups.set(key, []);
    labelGroups.get(key)!.push(f);
  });
  labelGroups.forEach((group, key) => {
    if (group.length > 1) {
      conflictingMeasurements.push({
        finding1Label: group[0].label,
        finding2Label: group[1].label,
        explanation: `Multiple findings describe "${key}". Clinician should confirm which value is authoritative.`,
      });
    }
  });

  // 5. Determine safety boundary
  let safetyBoundary: SafetyBoundaryState = 'OK';
  let safetyBoundaryReason: string | undefined;

  const totalVerifiedFindings = findings.filter(
    (f) =>
      f.provenance.verificationStatus === 'Verified' ||
      f.provenance.verificationStatus === 'VERIFIED'
  ).length;

  if (totalVerifiedFindings === 0) {
    safetyBoundary = 'INSUFFICIENT_DATA';
    safetyBoundaryReason = 'No clinician-verified findings are available. Nexus cannot produce a grounded assessment.';
  } else if (conflictingMeasurements.length > 0) {
    safetyBoundary = 'CONTRADICTION';
    safetyBoundaryReason = `${conflictingMeasurements.length} conflicting measurement(s) detected. Review before relying on assessment.`;
  }

  // 6. Reasoning is blocked only for INSUFFICIENT_DATA
  const isReasoningBlocked = safetyBoundary === 'INSUFFICIENT_DATA';

  return {
    safetyBoundary,
    safetyBoundaryReason,
    unverifiedAIFindings,
    pendingInvestigations,
    missingCriticalData,
    conflictingMeasurements,
    isReasoningBlocked,
  };
}
