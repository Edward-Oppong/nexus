// ============================================================
// src/lib/intelligence/governance/ab-comparison-engine.ts
// Phase 11: A/B Assessment Comparison & Concordance Evaluator
// Compares two foundation model outputs on identical clinical case context
// ============================================================

import {
  AbComparisonSession,
  ModelAssessmentVariant,
  ConcordanceMetric,
  ClinicianPreferenceBallot,
} from '../../../domain/ai-governance';
import { CLINICAL_MODEL_REGISTRY } from './model-registry';
import { FullSyntheticCase } from '../../../data/cases/mockCasesData';

/**
 * Generates an A/B Comparison Session comparing two models on a case
 */
export function createAbComparisonSession(
  activeCase: FullSyntheticCase,
  modelAId = 'gemini-1.5-pro-clinical',
  modelBId = 'claude-3.5-sonnet-clinical'
): AbComparisonSession {
  const modelAEntry = CLINICAL_MODEL_REGISTRY.find((m) => m.id === modelAId) || CLINICAL_MODEL_REGISTRY[0];
  const modelBEntry = CLINICAL_MODEL_REGISTRY.find((m) => m.id === modelBId) || CLINICAL_MODEL_REGISTRY[1];

  // Base assessment from active case
  const baseAssessment = activeCase.nexusAssessment || {
    id: 'assess-demo-10482',
    caseId: activeCase.overview.id,
    status: 'REVIEW_REQUIRED' as const,
    summary: '42-year-old female presenting with persistent Viridans group streptococcal bacteremia, new regurgitant murmur, and splinter hemorrhages following recent dental manipulation. Clinical criteria highly consistent with Subacute Bacterial Infective Endocarditis.',
    modelName: modelAEntry.name,
    modelVersion: modelAEntry.version,
    promptVersion: '2026.08-clinical-prompt-v2',
    pipelineVersion: '1.4.0',
    createdAt: new Date().toISOString(),
    nexusFindings: [
      {
        id: 'nf-1',
        assessmentId: 'assess-demo-10482',
        findingType: 'SUPPORT' as const,
        content: 'Blood cultures positive x 3 bottles for Streptococcus viridans satisfies Duke Major Microbiological Criterion.',
        status: 'UNREVIEWED' as const,
        hypothesisId: 'h-ie',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'nf-2',
        assessmentId: 'assess-demo-10482',
        findingType: 'SUPPORT' as const,
        content: 'New apical regurgitant murmur + splinter hemorrhages fulfill Duke Minor Clinical criteria.',
        status: 'UNREVIEWED' as const,
        hypothesisId: 'h-ie',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'nf-3',
        assessmentId: 'assess-demo-10482',
        findingType: 'SAFETY' as const,
        content: 'Severe documented Penicillin anaphylaxis prohibits first-line Ampicillin/Penicillin G therapy.',
        status: 'UNREVIEWED' as const,
        createdAt: new Date().toISOString(),
      },
    ],
    recommendations: [
      {
        id: 'rec-1',
        assessmentId: 'assess-demo-10482',
        category: 'INVESTIGATION' as const,
        content: 'Urgent Transesophageal Echocardiography (TEE) to confirm valvular vegetation size and rule out perivalvular abscess.',
        status: 'PROPOSED' as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rec-2',
        assessmentId: 'assess-demo-10482',
        category: 'SAFETY' as const,
        content: 'Initiate intravenous Vancomycin with weight-adjusted dosing protocol and daily renal monitoring.',
        status: 'PROPOSED' as const,
        createdAt: new Date().toISOString(),
      },
    ],
    contradictions: [],
    evidenceSources: [
      { evidenceSourceId: 'ev-aha-2025', retrievalRank: 1, relevanceScore: 0.94 },
      { evidenceSourceId: 'ev-duke-2024', retrievalRank: 2, relevanceScore: 0.91 },
    ],
    limitations: ['Awaiting definitive TEE image interpretation', 'Allergy desensitization history unverified'],
    safetyBoundary: 'OK' as const,
  };

  // Model A variant (Google Health Gemini 1.5 Pro)
  const variantA: ModelAssessmentVariant = {
    modelId: modelAEntry.id,
    modelName: modelAEntry.name,
    version: modelAEntry.version,
    assessment: {
      ...baseAssessment,
      modelName: modelAEntry.name,
      modelVersion: modelAEntry.version,
    },
    generationLatencyMs: 1420,
    totalTokensUsed: 3840,
  };

  // Model B variant (Anthropic Claude 3.5 Sonnet)
  const variantB: ModelAssessmentVariant = {
    modelId: modelBEntry.id,
    modelName: modelBEntry.name,
    version: modelBEntry.version,
    assessment: {
      ...baseAssessment,
      id: 'assess-demo-claude-10482',
      modelName: modelBEntry.name,
      modelVersion: modelBEntry.version,
      summary: 'Patient demonstrates classic presentation of subacute infective endocarditis with bacteremia and peripheral stigmata. Given severe penicillin allergy, empiric vancomycin is indicated alongside immediate TEE.',
      nexusFindings: [
        ...baseAssessment.nexusFindings,
        {
          id: 'nf-b-4',
          assessmentId: 'assess-demo-claude-10482',
          findingType: 'CONTEXT' as const,
          content: 'Dental extraction 10 days prior provides direct mucosal portal of entry for oral streptococci.',
          status: 'UNREVIEWED' as const,
          hypothesisId: 'h-ie',
          createdAt: new Date().toISOString(),
        },
      ],
      recommendations: [
        ...baseAssessment.recommendations,
        {
          id: 'rec-b-3',
          assessmentId: 'assess-demo-claude-10482',
          category: 'FOLLOW_UP' as const,
          content: 'Consult Cardiothoracic Surgery early if mobile vegetations > 10mm or severe valvular regurgitation noted.',
          status: 'PROPOSED' as const,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    generationLatencyMs: 1890,
    totalTokensUsed: 4120,
  };

  // Compute Concordance Metrics
  const concordance: ConcordanceMetric = {
    overallConcordancePercent: 88,
    hypothesisRankCorrelation: 0.96,
    findingsOverlapPercent: 85,
    contradictionAgreement: true,
    differingConclusions: [
      {
        area: 'RECOMMENDATION',
        modelAPosition: 'Recommends TEE and Vancomycin monotherapy with pharmacy dosing.',
        modelBPosition: 'Recommends early prophylactic Cardiothoracic Surgery consultation alongside TEE.',
        clinicalSignificance: 'MODERATE',
      },
      {
        area: 'EVIDENCE_CITATION',
        modelAPosition: 'Cited 2 primary guidelines (AHA 2025, Duke-ISCVID 2024).',
        modelBPosition: 'Cited AHA 2025 and ESC 2023 Guidelines for Management of Endocarditis.',
        clinicalSignificance: 'NEGLIGIBLE',
      },
    ],
  };

  return {
    sessionId: 'ab-sess-' + Math.random().toString(36).substring(2, 9),
    caseId: activeCase.overview.id,
    modelA: variantA,
    modelB: variantB,
    concordance,
    createdAt: new Date().toISOString(),
  };
}
