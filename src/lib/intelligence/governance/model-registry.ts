// ============================================================
// src/lib/intelligence/governance/model-registry.ts
// Phase 11: Clinical AI Model Version Registry
// Tracks model calibration, medical benchmarks, context windows, and safety tiers
// ============================================================

import {
  AiModelRegistryEntry,
  ModelDeploymentStatus,
} from '../../../domain/ai-governance';

export const CLINICAL_MODEL_REGISTRY: AiModelRegistryEntry[] = [
  {
    id: 'gemini-1.5-pro-clinical',
    name: 'Gemini 1.5 Pro (Clinical Fine-Tuned)',
    provider: 'Google Health',
    version: '2026.08-v2.1',
    releaseDate: '2026-08-15',
    status: 'ACTIVE',
    contextWindowTokens: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    benchmarks: {
      medQaUsmlPercent: 91.2,
      pubmedQaPercent: 82.4,
      mmluClinicalPercent: 89.6,
      hallucinationRatePercent: 1.2,
    },
    temperature: 0.1,
    safetyTier: 'TIER_1_STRICT',
    calibrationDate: '2026-09-01',
    activeDeploymentsCount: 14,
    description: 'Primary clinical reasoning engine for complex differential diagnosis and multi-day inpatient trajectory synthesis.',
    intendedClinicalScope: 'Differential diagnosis, qualitative uncertainty estimation, clinical contradiction detection.',
  },
  {
    id: 'claude-3.5-sonnet-clinical',
    name: 'Claude 3.5 Sonnet (Clinical Reasoning)',
    provider: 'Anthropic',
    version: '2026.06-v1.4',
    releaseDate: '2026-06-20',
    status: 'ACTIVE',
    contextWindowTokens: 200000,
    maxOutputTokens: 8192,
    benchmarks: {
      medQaUsmlPercent: 92.1,
      pubmedQaPercent: 84.1,
      mmluClinicalPercent: 90.4,
      hallucinationRatePercent: 0.9,
    },
    temperature: 0.1,
    safetyTier: 'TIER_1_STRICT',
    calibrationDate: '2026-08-28',
    activeDeploymentsCount: 12,
    description: 'Challenger reasoning engine with superior nuance in multi-morbid elderly trajectories and clinical guideline adherence.',
    intendedClinicalScope: 'Multi-morbidity triage, diagnostic synthesis, complex investigation planning.',
  },
  {
    id: 'gpt-4o-clinical',
    name: 'GPT-4o (Clinical Reasoning Preview)',
    provider: 'OpenAI',
    version: '2026.05-v3.0',
    releaseDate: '2026-05-12',
    status: 'CANARY',
    contextWindowTokens: 128000,
    maxOutputTokens: 4096,
    benchmarks: {
      medQaUsmlPercent: 89.8,
      pubmedQaPercent: 80.2,
      mmluClinicalPercent: 87.9,
      hallucinationRatePercent: 1.8,
    },
    temperature: 0.2,
    safetyTier: 'TIER_2_STANDARD',
    calibrationDate: '2026-07-15',
    activeDeploymentsCount: 3,
    description: 'Canary deployment evaluating low-latency diagnostic suggestions for urgent ambulatory care.',
    intendedClinicalScope: 'Rapid consultation summaries, patient discharge instruction drafting.',
  },
  {
    id: 'open-biollm-70b',
    name: 'Open-BioLLM 70B (On-Premises Edge)',
    provider: 'Open-Source Bio',
    version: '2026.04-llama3-bio',
    releaseDate: '2026-04-10',
    status: 'SHADOW',
    contextWindowTokens: 32768,
    maxOutputTokens: 4096,
    benchmarks: {
      medQaUsmlPercent: 85.6,
      pubmedQaPercent: 78.9,
      mmluClinicalPercent: 83.2,
      hallucinationRatePercent: 2.6,
    },
    temperature: 0.1,
    safetyTier: 'TIER_2_STANDARD',
    calibrationDate: '2026-06-30',
    activeDeploymentsCount: 2,
    description: 'Air-gapped on-premises medical foundation model for low-connectivity district facilities and high-privacy jurisdictions.',
    intendedClinicalScope: 'Offline clinical decision support, local entity extraction.',
  },
];

export function getActiveModels(): AiModelRegistryEntry[] {
  return CLINICAL_MODEL_REGISTRY.filter((m) => m.status === 'ACTIVE' || m.status === 'CANARY');
}

export function getModelById(modelId: string): AiModelRegistryEntry | undefined {
  return CLINICAL_MODEL_REGISTRY.find((m) => m.id === modelId);
}
