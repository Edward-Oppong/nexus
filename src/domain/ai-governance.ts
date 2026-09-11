// ============================================================
// src/domain/ai-governance.ts
// Phase 11: AI Governance & Model Management Domain Types
// Model Version Registry, A/B Comparison, Human Feedback DPO, and Explainability
// ============================================================

import { NexusAssessment } from './nexus-assessment';

// ------------------------------------------------------------
// 1. Model Version Registry
// ------------------------------------------------------------

export type ModelDeploymentStatus = 'ACTIVE' | 'CANARY' | 'SHADOW' | 'DEPRECATED';
export type ModelSafetyTier = 'TIER_1_STRICT' | 'TIER_2_STANDARD' | 'TIER_3_RESEARCH';

export interface MedicalBenchmarkScores {
  medQaUsmlPercent: number; // e.g. 90.2
  pubmedQaPercent: number; // e.g. 81.5
  mmluClinicalPercent: number; // e.g. 88.4
  hallucinationRatePercent: number; // e.g. 1.8%
}

export interface AiModelRegistryEntry {
  id: string;
  name: string;
  provider: 'Google Health' | 'Anthropic' | 'OpenAI' | 'Open-Source Bio' | 'Local Edge';
  version: string;
  releaseDate: string;
  status: ModelDeploymentStatus;
  contextWindowTokens: number;
  maxOutputTokens: number;
  benchmarks: MedicalBenchmarkScores;
  temperature: number;
  safetyTier: ModelSafetyTier;
  calibrationDate: string;
  activeDeploymentsCount: number;
  description: string;
  intendedClinicalScope: string;
}

// ------------------------------------------------------------
// 2. A/B Assessment Comparison
// ------------------------------------------------------------

export type ClinicianPreferenceBallot =
  | 'MODEL_A_SUPERIOR'
  | 'MODEL_B_SUPERIOR'
  | 'EQUIVALENT_CONCORDANCE'
  | 'BOTH_INADEQUATE';

export interface ModelAssessmentVariant {
  modelId: string;
  modelName: string;
  version: string;
  assessment: NexusAssessment;
  generationLatencyMs: number;
  totalTokensUsed: number;
}

export interface ConcordanceMetric {
  overallConcordancePercent: number; // e.g. 84%
  hypothesisRankCorrelation: number; // Spearman rho e.g. 0.88
  findingsOverlapPercent: number; // Jaccard similarity
  contradictionAgreement: boolean;
  differingConclusions: Array<{
    area: 'HYPOTHESIS_RANKING' | 'SAFETY_FLAG' | 'RECOMMENDATION' | 'EVIDENCE_CITATION';
    modelAPosition: string;
    modelBPosition: string;
    clinicalSignificance: 'CRITICAL' | 'MODERATE' | 'NEGLIGIBLE';
  }>;
}

export interface AbComparisonSession {
  sessionId: string;
  caseId: string;
  modelA: ModelAssessmentVariant;
  modelB: ModelAssessmentVariant;
  concordance: ConcordanceMetric;
  clinicianPreference?: ClinicianPreferenceBallot;
  clinicianFeedbackNotes?: string;
  adjudicatedBy?: string;
  adjudicatedAt?: string;
  createdAt: string;
}

// ------------------------------------------------------------
// 3. Human Feedback Loop & Fine-Tuning Curation
// ------------------------------------------------------------

export type ClinicianCorrectionType =
  | 'HALLUCINATED_FINDING'
  | 'UNSUPPORTED_LEAP'
  | 'OVERCONFIDENCE'
  | 'MISSED_CONTRADICTION'
  | 'OUTDATED_GUIDELINE'
  | 'INAPPROPRIATE_RECOMMENDATION'
  | 'TERMINOLOGY_ERROR';

export type FeedbackSeverity = 'CRITICAL' | 'MODERATE' | 'MINOR';

export interface HumanFeedbackRecord {
  id: string;
  caseId: string;
  assessmentId: string;
  modelId: string;
  modelVersion: string;
  findingOrHypothesisId?: string;
  correctionType: ClinicianCorrectionType;
  originalAiContent: string;
  clinicianCorrection: string;
  clinicalRationale: string;
  severity: FeedbackSeverity;
  curatedForFineTuning: boolean;
  exportStatus: 'PENDING' | 'EXPORTED';
  submittedBy: string;
  submittedAt: string;
}

export interface DpoDatasetPair {
  prompt: string;
  chosen: string; // Clinician accepted/corrected output
  rejected: string; // Flawed AI generation
  metadata: {
    caseId: string;
    correctionType: ClinicianCorrectionType;
    modelVersion: string;
    annotatorId: string;
    timestamp: string;
  };
}

// ------------------------------------------------------------
// 4. Explainability & Feature Attribution
// ------------------------------------------------------------

export type AttributionDirection = 'POSITIVE_SUPPORT' | 'NEGATIVE_REFUTATION' | 'NEUTRAL_CONTEXT';

export interface FindingAttribution {
  findingId: string;
  findingLabel: string;
  category: string;
  attributionPercentage: number; // e.g. 42%
  direction: AttributionDirection;
  shapleyProxyValue: number; // normalized relative contribution
  counterfactualImpact: string; // "If absent, probability drops by 35%"
}

export interface CounterfactualScenario {
  findingModified: string;
  originalState: string;
  simulatedState: string;
  predictedHypothesisRankShift: string;
  clinicalRationale: string;
}

export interface HypothesisExplainability {
  hypothesisId: string;
  hypothesisLabel: string;
  qualitativeLikelihood: string;
  attributions: FindingAttribution[];
  topDrivers: string[];
  counterfactuals: CounterfactualScenario[];
  uncertaintyBreakdown: {
    epistemicUncertainty: 'HIGH' | 'MODERATE' | 'LOW'; // solvable with more tests
    aleatoricUncertainty: 'HIGH' | 'MODERATE' | 'LOW'; // inherent biological variability
    clinicalSummary: string;
  };
}
