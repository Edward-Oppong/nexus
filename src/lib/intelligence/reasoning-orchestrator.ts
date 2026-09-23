// ============================================================
// src/lib/intelligence/reasoning-orchestrator.ts
// Phase 6F: Reasoning Orchestrator
// Main pipeline: Context → DataQuality → Evidence → Provider → Validate → Ground → Assessment
// This is the component that makes Nexus an orchestration layer,
// not simply an LLM wrapper.
// ============================================================

import { FullSyntheticCase } from '../../data/cases/mockCasesData';
import {
  NexusAssessment,
  NexusFinding,
  NexusRecommendation,
  DetectedContradiction,
  AssessmentEvidenceSource,
} from '../../domain/nexus-assessment';
import { ReasoningProvider } from './reasoning-provider';
import { runDataQualityChecks } from './data-quality-service';
import { retrieveEvidenceForCase } from './evidence-service';
import { buildReasoningContext } from './context-builder';
import { validateAssessmentOutput, validateGrounding } from './nexus-assessment-schema';

// ----------------------------------------------------------
// Orchestration options
// ----------------------------------------------------------
export interface AnalysisStageInfo {
  stageIndex: number;
  totalStages: number;
  stageName: string;
  detail: string;
}

export interface OrchestrationOptions {
  caseId: string;
  purpose?: string;
  onStageProgress?: (stage: AnalysisStageInfo) => void;
}

// ----------------------------------------------------------
// Main orchestration function
// ----------------------------------------------------------
export async function runNexusAnalysis(
  activeCase: FullSyntheticCase,
  provider: ReasoningProvider,
  options: OrchestrationOptions
): Promise<NexusAssessment> {
  const now = new Date().toISOString();
  const assessmentId = `assess-${Date.now()}`;

  // Helper for staged delay so UI transitions are perceptible
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // ── Stage 1: Data Quality (deterministic) ──────────────────
  options.onStageProgress?.({
    stageIndex: 1,
    totalStages: 4,
    stageName: 'Data Quality & Bounds Check',
    detail: 'Auditing 18 safety boundaries, vital ranges, and unverified AI extraction flags...',
  });
  await sleep(350);

  const qualityResult = runDataQualityChecks({
    findings: activeCase.findings,
    investigations: activeCase.investigations,
    informationGaps: activeCase.informationGaps,
  });

  // ── Stage 2: Evidence Retrieval & Dense Ranking ────────────
  options.onStageProgress?.({
    stageIndex: 2,
    totalStages: 4,
    stageName: 'MedCPT Dense Semantic Retrieval',
    detail: 'Embedding query tokens and cross-encoder reranking against clinical guidelines...',
  });
  await sleep(400);
  const evidenceMap = retrieveEvidenceForCase(
    activeCase.overview.id,
    activeCase.hypotheses.map((h) => ({ id: h.id, title: h.title }))
  );

  // Flatten all evidence for reasoning context
  const allEvidence: Array<{ id: string; title: string; sourceType: string; relationship?: string; excerpt?: string }> = [];
  const evidenceSourcesList: AssessmentEvidenceSource[] = [];
  let rank = 1;

  evidenceMap.forEach((results) => {
    results.forEach((r) => {
      if (!allEvidence.find((e: any) => e.id === r.source.id)) {
        allEvidence.push({
          id: r.source.id,
          title: r.source.title,
          sourceType: r.source.sourceType,
          relationship: r.relationship,
          excerpt: r.excerpt,
        });
        evidenceSourcesList.push({
          evidenceSourceId: r.source.id,
          retrievalRank: rank++,
          relevanceScore: r.relevanceScore,
        });
      }
    });
  });

  // ── Step 3: Build Context ─────────────────────────────────
  const scope = {
    purpose: options.purpose ?? 'CASE_REVIEW',
    allowedOutputs: [
      'Identify candidate hypotheses from verified findings',
      'Summarize relevant evidence',
      'Identify missing information',
      'Detect potential contradictions',
      'State uncertainty and limitations',
    ],
    prohibitedOutputs: [
      'Make a definitive diagnosis',
      'Recommend specific treatment or medication',
      'Reference findings not in the supplied context',
      'Produce numeric probability or confidence scores',
      'Override clinician judgment',
    ],
  };

  const reasoningInput = buildReasoningContext(activeCase, allEvidence, scope);

  // ── Safety boundary check ────────────────────────
  if (qualityResult.isReasoningBlocked) {
    return buildBlockedAssessment(assessmentId, activeCase.overview.id, qualityResult, now, provider);
  }

  // ── Stage 3: Falconsai Clinical Synthesis ────────────────
  options.onStageProgress?.({
    stageIndex: 3,
    totalStages: 4,
    stageName: 'Falconsai Clinical Synthesis',
    detail: 'Generating grounded clinical narrative from retrieved evidence and verified findings...',
  });

  const rawOutput = await provider.generateAssessment(reasoningInput);

  // ── Step 6: Schema Validation ────────────────────────────
  const schemaValidation = validateAssessmentOutput(rawOutput);
  if (!schemaValidation.valid) {
    console.error('[Nexus] Schema validation failed:', schemaValidation.errors);
    return buildBlockedAssessment(assessmentId, activeCase.overview.id, qualityResult, now, provider);
  }

  // ── Stage 4: 18-Rule Grounding Validation ─────────────────
  options.onStageProgress?.({
    stageIndex: 4,
    totalStages: 4,
    stageName: '18-Rule Grounding Validation',
    detail: 'Verifying all output references against case context. Excluding hallucinated IDs...',
  });
  await sleep(250);

  const contextFindingIds = new Set(activeCase.findings.map((f) => f.id));
  const contextEvidenceIds = new Set(allEvidence.map((e: any) => e.id));
  const groundingValidation = validateGrounding(rawOutput, contextFindingIds, contextEvidenceIds);
  // Log warnings — unresolvable evidence IDs get excluded
  if (groundingValidation.warnings.length > 0) {
    console.warn('[Nexus] Grounding warnings:', groundingValidation.warnings);
  }

  // ── Step 8: Build NexusAssessment ────────────────────────
  const nexusFindings: NexusFinding[] = rawOutput.hypotheses.map((h, idx) => ({
    id: `nf-${assessmentId}-${idx}`,
    assessmentId,
    findingType: 'SUPPORT' as const,
    content: `${h.label}: ${h.rationale}`,
    status: 'UNREVIEWED' as const,
    findingIds: [...h.supportingFindingIds, ...h.contradictingFindingIds].filter((id) => contextFindingIds.has(id)),
    evidenceSourceIds: h.evidenceSourceIds.filter((id) => contextEvidenceIds.has(id)),
    createdAt: now,
  }));

  const contradictions: DetectedContradiction[] = [
    // From deterministic quality layer
    ...qualityResult.conflictingMeasurements.map((c, i) => ({
      id: `det-contra-${i}`,
      findingAId: 'measurement',
      findingBId: 'measurement',
      explanation: c.explanation,
      severity: 'MODERATE' as const,
    })),
    // From reasoning output (grounded)
    ...rawOutput.contradictions
      .filter((c) => contextFindingIds.has(c.findingAId) && contextFindingIds.has(c.findingBId))
      .map((c, i) => ({
        id: `ai-contra-${i}`,
        findingAId: c.findingAId,
        findingBId: c.findingBId,
        explanation: c.explanation,
        severity: 'LOW' as const,
      })),
  ];

  const recommendations: NexusRecommendation[] = [
    ...(qualityResult.unverifiedAIFindings.length > 0 ? [{
      id: `rec-${assessmentId}-0`,
      assessmentId,
      category: 'REVIEW' as const,
      content: `${qualityResult.unverifiedAIFindings.length} AI-extracted finding(s) require clinician verification before they can contribute to reasoning.`,
      rationale: 'Unverified AI output must not be treated as clinical fact.',
      status: 'PROPOSED' as const,
      createdAt: now,
    }] : []),
    ...(qualityResult.pendingInvestigations.length > 0 ? [{
      id: `rec-${assessmentId}-1`,
      assessmentId,
      category: 'INFORMATION' as const,
      content: `${qualityResult.pendingInvestigations.length} investigation(s) are pending. Reassessment is recommended when results are available.`,
      rationale: 'Pending results may materially change the clinical picture.',
      status: 'PROPOSED' as const,
      createdAt: now,
    }] : []),
  ];

  return {
    id: assessmentId,
    caseId: activeCase.overview.id,
    status: 'REVIEW_REQUIRED',
    summary: rawOutput.summary,
    dataCompleteness: qualityResult.missingCriticalData.length > 0 ? 'LOW' : qualityResult.pendingInvestigations.length > 0 ? 'MODERATE' : 'HIGH',
    evidenceConsistency: qualityResult.conflictingMeasurements.length > 0 ? 'CONFLICTING' : 'MODERATE',
    limitations: rawOutput.limitations,
    modelName: provider.name,
    modelVersion: provider.version,
    promptVersion: '6F.1',
    pipelineVersion: '6F.1',
    createdAt: now,
    nexusFindings,
    recommendations,
    contradictions,
    evidenceSources: evidenceSourcesList,
    safetyBoundary: qualityResult.safetyBoundary,
    safetyBoundaryReason: qualityResult.safetyBoundaryReason,
  };
}

// ----------------------------------------------------------
// Build a blocked assessment when data is insufficient
// ----------------------------------------------------------
function buildBlockedAssessment(
  id: string,
  caseId: string,
  quality: ReturnType<typeof runDataQualityChecks>,
  now: string,
  provider: ReasoningProvider
): NexusAssessment {
  return {
    id,
    caseId,
    status: 'REVIEW_REQUIRED',
    summary: 'Nexus cannot produce a grounded assessment with the currently available verified information.',
    dataCompleteness: 'LOW',
    evidenceConsistency: 'HIGH',
    limitations: [
      quality.safetyBoundaryReason ?? 'Insufficient data for assessment.',
      'No AI reasoning was performed. Assessment is blocked by deterministic safety gate.',
    ],
    modelName: provider.name,
    modelVersion: provider.version,
    promptVersion: '6F.1',
    pipelineVersion: '6F.1',
    createdAt: now,
    nexusFindings: [],
    recommendations: [],
    contradictions: [],
    evidenceSources: [],
    safetyBoundary: quality.safetyBoundary,
    safetyBoundaryReason: quality.safetyBoundaryReason,
  };
}
