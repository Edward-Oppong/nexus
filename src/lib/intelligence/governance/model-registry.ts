// ============================================================
// src/lib/intelligence/governance/model-registry.ts
// Phase 11: Clinical AI Model Version Registry
// Tracks model calibration, medical benchmarks, context windows, and safety tiers
// Formal registry for the specialized Nexus multi-model stack.
// ============================================================

import {
  AiModelRegistryEntry,
} from '../../../domain/ai-governance';

export interface SpecializedModelCard {
  id: string;
  hfModelId: string;
  name: string;
  provider: string;
  role: 'NER' | 'DOCUMENT_CLASSIFIER' | 'FINDING_CLASSIFIER' | 'QUERY_EMBEDDING' | 'ARTICLE_EMBEDDING' | 'RERANKING' | 'SUMMARIZATION' | 'REASONING';
  version: string;
  status: 'ACTIVE' | 'TESTING' | 'CHALLENGER' | 'DEPRECATED';
  parameters: string;
  contextWindow: number;
  description: string;
  architecturalConstraint: string;
}

export const NEXUS_SPECIALIZED_MODEL_STACK: SpecializedModelCard[] = [
  {
    id: 'biomedical-ner-all',
    hfModelId: 'd4data/biomedical-ner-all',
    name: 'Biomedical NER (All Entities)',
    provider: 'Hugging Face / d4data',
    role: 'NER',
    version: '1.0.0',
    status: 'ACTIVE',
    parameters: '110M',
    contextWindow: 512,
    description: 'High-throughput token classification extracting symptoms, diseases, medications, procedures, severity, and anatomical spans.',
    architecturalConstraint: 'Emits candidate spans with character offsets; never creates verified findings directly.',
  },
  {
    id: 'bart-doc-classifier',
    hfModelId: 'facebook/bart-large-mnli',
    name: 'BART Clinical Document Classifier',
    provider: 'Meta / Hugging Face',
    role: 'DOCUMENT_CLASSIFIER',
    version: '1.0.0',
    status: 'ACTIVE',
    parameters: '406M',
    contextWindow: 1024,
    description: 'Zero-shot classification categorizing uploaded clinical documents into Lab Reports, Imaging, Clinical Notes, Discharge Summaries, and Consultations.',
    architecturalConstraint: 'Determines downstream extraction pipeline; does not establish clinical ground truth.',
  },
  {
    id: 'bioclinicalbert-finding-classifier',
    hfModelId: 'emilyalsentzer/Bio_ClinicalBERT',
    name: 'Nexus BioClinicalBERT Finding Classifier',
    provider: 'MIT LCP / Hugging Face',
    role: 'FINDING_CLASSIFIER',
    version: '2.0.0',
    status: 'ACTIVE',
    parameters: '110M',
    contextWindow: 512,
    description: 'Classifies extracted findings into SYMPTOM, SIGN, LABORATORY, IMAGING, HISTORY, MEDICATION, or EXAMINATION.',
    architecturalConstraint: 'Model confidence is never displayed as a medical diagnosis probability.',
  },
  {
    id: 'medcpt-query-encoder',
    hfModelId: 'ncbi/MedCPT-Query-Encoder',
    name: 'NLM MedCPT Query Encoder',
    provider: 'National Library of Medicine (NCBI)',
    role: 'QUERY_EMBEDDING',
    version: '1.0.0',
    status: 'ACTIVE',
    parameters: '110M',
    contextWindow: 512,
    description: 'Encodes case context and clinical differential queries into dense 768-dimensional vectors for pgvector search.',
    architecturalConstraint: 'Read-only vector generator; respects tenant and organization RLS permissions in Postgres.',
  },
  {
    id: 'medcpt-article-encoder',
    hfModelId: 'ncbi/MedCPT-Article-Encoder',
    name: 'NLM MedCPT Article Encoder',
    provider: 'National Library of Medicine (NCBI)',
    role: 'ARTICLE_EMBEDDING',
    version: '1.0.0',
    status: 'ACTIVE',
    parameters: '110M',
    contextWindow: 512,
    description: 'Indexes PubMed guidelines, clinical trials, and systematic reviews into pgvector chunks.',
    architecturalConstraint: 'Encodes verified literature only; never indexes unverified hallucinated text.',
  },
  {
    id: 'medcpt-cross-encoder',
    hfModelId: 'ncbi/MedCPT-Cross-Encoder',
    name: 'NLM MedCPT Cross-Encoder Reranker',
    provider: 'National Library of Medicine (NCBI)',
    role: 'RERANKING',
    version: '1.0.0',
    status: 'ACTIVE',
    parameters: '110M',
    contextWindow: 512,
    description: 'Deep relevance scoring of top-50 vector search candidates down to the top-10 high-yield clinical excerpts.',
    architecturalConstraint: 'Scores represent retrieval relevance to case query, not clinical certainty.',
  },
  {
    id: 'biomed-reranker',
    hfModelId: 'NYSgpt/biomed-reranker',
    name: 'BioMed Reranker (149M)',
    provider: 'NYSgpt',
    role: 'RERANKING',
    version: '1.0.0',
    status: 'CHALLENGER',
    parameters: '149M',
    contextWindow: 8192,
    description: 'Challenger cross-encoder trained on 433k biomedical papers with native 8k context window.',
    architecturalConstraint: 'Benchmarked in shadow mode against MedCPT cross-encoder.',
  },
  {
    id: 'falconsai-medical-summarization',
    hfModelId: 'Falconsai/medical_summarization',
    name: 'Falconsai Medical Summarizer & Synthesizer',
    provider: 'Falconsai / Hugging Face',
    role: 'SUMMARIZATION',
    version: '1.0.0',
    status: 'ACTIVE',
    parameters: '250M',
    contextWindow: 1024,
    description: 'Fine-tuned clinical summarizer that extracts structured section summaries and timeline spans from clinical notes.',
    architecturalConstraint: 'Retains explicit character/token references to original document spans.',
  },
  {
    id: 'medgemma-27b-text-it',
    hfModelId: 'google/medgemma-27b-text-it',
    name: 'Google MedGemma 27B Text-IT',
    provider: 'Google Health',
    role: 'REASONING',
    version: '1.0-27b',
    status: 'ACTIVE',
    parameters: '27.2B',
    contextWindow: 131072,
    description: 'Primary clinical reasoning model for controlled multi-hypothesis differential decomposition.',
    architecturalConstraint: 'Runs under strict Zod schema; zero direct DB mutation; prohibited from emitting diagnostic odds % or overriding safety rules.',
  },
];

export const CLINICAL_MODEL_REGISTRY: AiModelRegistryEntry[] = [
  {
    id: 'medgemma-27b-text-it',
    name: 'MedGemma 27B (Clinical Reasoning Engine)',
    provider: 'Google Health',
    version: '2026.09-v1.0',
    releaseDate: '2026-09-01',
    status: 'ACTIVE',
    contextWindowTokens: 131072,
    maxOutputTokens: 8192,
    benchmarks: {
      medQaUsmlPercent: 93.4,
      pubmedQaPercent: 86.8,
      mmluClinicalPercent: 92.1,
      hallucinationRatePercent: 0.7,
    },
    temperature: 0.1,
    safetyTier: 'TIER_1_STRICT',
    calibrationDate: '2026-09-10',
    activeDeploymentsCount: 16,
    description: 'Primary clinical reasoning engine for multi-hypothesis differential decomposition and grounded synthesis.',
    intendedClinicalScope: 'Differential diagnosis decomposition, qualitative uncertainty estimation, clinical contradiction detection.',
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
    id: 'medgemma-4b-it',
    name: 'MedGemma 4B (Document Intelligence)',
    provider: 'Google Health',
    version: '2026.09-v1.5',
    releaseDate: '2026-09-01',
    status: 'ACTIVE',
    contextWindowTokens: 32768,
    maxOutputTokens: 4096,
    benchmarks: {
      medQaUsmlPercent: 86.5,
      pubmedQaPercent: 81.2,
      mmluClinicalPercent: 84.8,
      hallucinationRatePercent: 1.4,
    },
    temperature: 0.1,
    safetyTier: 'TIER_1_STRICT',
    calibrationDate: '2026-09-05',
    activeDeploymentsCount: 16,
    description: 'Fast edge-capable clinical document summarizer and finding extractor.',
    intendedClinicalScope: 'Clinical report summarization, laboratory timeline extraction.',
  },
];

export function getModelRegistryEntry(id: string): AiModelRegistryEntry | undefined {
  return CLINICAL_MODEL_REGISTRY.find((m) => m.id === id);
}

export function getSpecializedModelCard(id: string): SpecializedModelCard | undefined {
  return NEXUS_SPECIALIZED_MODEL_STACK.find((m) => m.id === id);
}
