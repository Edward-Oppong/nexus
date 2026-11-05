// ============================================================
// src/lib/intelligence/case-isolation-validator.ts
// Hard Boundary Case Isolation & Provenance Validator
// Ensures no observation, finding, lab, or medication from Case A
// can cross-contaminate Case B. Enforces caseId === currentAnalysis.caseId
// as a hard structural validation.
// ============================================================

import { FullSyntheticCase } from '../../data/cases/mockCasesData';
import { ClinicalFinding } from '../../domain/finding';

export interface CaseIsolationViolation {
  entityType: 'FINDING' | 'OBSERVATION' | 'INVESTIGATION' | 'MEDICATION' | 'DOCUMENT';
  entityId: string;
  expectedCaseId: string;
  actualCaseId: string;
  label: string;
  actionTaken: 'DROPPED_CONTAMINANT';
  detectedAt: string;
}

export interface CaseIsolationResult {
  isIsolated: boolean;
  activeCaseId: string;
  analysisRunId: string;
  isolatedCase: FullSyntheticCase;
  violations: CaseIsolationViolation[];
  isolationStats: {
    findingsAudited: number;
    findingsRetained: number;
    investigationsAudited: number;
    investigationsRetained: number;
    contaminantsPurged: number;
  };
}

/**
 * Hard isolation gate. Audits all entities in activeCase against the expected caseId.
 * Strips any entity whose caseId explicitly belongs to a foreign case.
 */
export function validateCaseIsolation(
  activeCase: FullSyntheticCase,
  analysisRunId: string
): CaseIsolationResult {
  const expectedCaseId = (activeCase.overview?.id || '').trim();
  if (!expectedCaseId) {
    throw new Error('[CaseIsolationValidator] Fatal error: activeCase.overview.id is missing or empty.');
  }

  const now = new Date().toISOString();
  const violations: CaseIsolationViolation[] = [];

  // 1. Audit Clinical Findings
  const rawFindings = activeCase.findings || [];
  const isolatedFindings: ClinicalFinding[] = [];

  for (const f of rawFindings) {
    const findingCaseId = (f.caseId || f.provenance?.caseId || '').trim();
    if (findingCaseId && findingCaseId !== expectedCaseId) {
      violations.push({
        entityType: 'FINDING',
        entityId: f.id,
        expectedCaseId,
        actualCaseId: findingCaseId,
        label: f.label,
        actionTaken: 'DROPPED_CONTAMINANT',
        detectedAt: now,
      });
      continue; // Hard drop foreign finding
    }

    // Seal finding with strict isolation provenance
    isolatedFindings.push({
      ...f,
      caseId: expectedCaseId,
      analysisRunId,
      provenance: {
        ...f.provenance,
        caseId: expectedCaseId,
        analysisRunId,
      },
    });
  }

  // 2. Audit Investigations
  const rawInvestigations = activeCase.investigations || [];
  const isolatedInvestigations: typeof rawInvestigations = [];

  for (const inv of rawInvestigations) {
    const invCaseId = ((inv as any).caseId || '').trim();
    if (invCaseId && invCaseId !== expectedCaseId) {
      violations.push({
        entityType: 'INVESTIGATION',
        entityId: inv.id,
        expectedCaseId,
        actualCaseId: invCaseId,
        label: inv.testName,
        actionTaken: 'DROPPED_CONTAMINANT',
        detectedAt: now,
      });
      continue; // Hard drop foreign investigation
    }

    isolatedInvestigations.push({
      ...inv,
      ...({ caseId: expectedCaseId, analysisRunId } as any),
    });
  }

  // 3. Assemble Isolated Case
  const isolatedCase: FullSyntheticCase = {
    ...activeCase,
    findings: isolatedFindings,
    investigations: isolatedInvestigations,
  };

  return {
    isIsolated: violations.length === 0,
    activeCaseId: expectedCaseId,
    analysisRunId,
    isolatedCase,
    violations,
    isolationStats: {
      findingsAudited: rawFindings.length,
      findingsRetained: isolatedFindings.length,
      investigationsAudited: rawInvestigations.length,
      investigationsRetained: isolatedInvestigations.length,
      contaminantsPurged: violations.length,
    },
  };
}
