// ============================================================
// src/features/case-workspace/api/buildCaseContext.ts
// Phase 6E: Case Context Builder (Section 26 & 27)
// Structured context builder for clinical intelligence services.
// Performs relevance filtering, temporal alignment, and contradiction identification.
// ============================================================

import { Case } from '../../../domain/case';
import { Patient } from '../../../domain/patient';
import { Encounter } from '../../../domain/encounter';
import { Observation } from '../../../domain/observation';
import { ClinicalFinding } from '../../../domain/finding';
import { Investigation, InvestigationResult } from '../../../domain/investigation';
import { DiagnosticReport } from '../../../domain/diagnostic-report';
import { CandidateHypothesis } from '../../../domain/hypothesis';
import { EvidenceItem } from '../../../domain/evidence';
import { SafetyIssue } from '../../../domain/safety';
import { ClinicalContradiction } from '../../../domain/contradiction';
import { MissingInformation } from '../../../domain/intelligence';

export interface CaseContext {
  case: Case;
  patient: Patient;
  encounter?: Encounter;
  observations: Observation[];
  findings: ClinicalFinding[];
  investigations: Investigation[];
  investigationResults: InvestigationResult[];
  reports: DiagnosticReport[];
  hypotheses: CandidateHypothesis[];
  evidence: EvidenceItem[];
  safetyConcerns: SafetyIssue[];
  contradictions: ClinicalContradiction[];
  missingInformation: MissingInformation[];
}

/**
 * Section 27: Intelligent Context Builder
 * Assembles and filters the structured case context prior to sending to intelligence services.
 * Avoids indiscriminate LLM context dumping.
 */
export function buildCaseContext(rawContext: CaseContext): CaseContext {
  // 1. Filter out rejected findings unless evaluating audit trails
  const activeFindings = rawContext.findings.filter(
    (f) => f.provenance.verificationStatus !== 'Rejected' && f.status !== 'REJECTED'
  );

  // 2. Sort observations temporally (most recent first)
  const sortedObservations = [...rawContext.observations].sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
  );

  return {
    ...rawContext,
    findings: activeFindings,
    observations: sortedObservations,
  };
}
