// ============================================================
// src/lib/compliance/fda-pccp-tracker.ts
// Phase 12: FDA Predetermined Change Control Plan (PCCP) Engine
// Evaluates AI/ML modifications against authorized change protocols
// ============================================================

import {
  FdaPccpPlan,
  PccpModificationProtocol,
  PccpModificationType,
  PccpBoundaryResult,
} from '../../domain/regulatory-compliance';

export const INITIAL_PCCP_PROTOCOLS: PccpModificationProtocol[] = [
  {
    protocolId: 'AMP-001',
    modificationType: 'PROMPT_TEMPLATE_OPTIMIZATION',
    description: 'Refinements to clinical reasoning prompt templates for differential synthesis.',
    allowedVarianceRange: 'Wording updates preserving strict JSON output schema and non-numeric probability constraint.',
    actualProposedChange: 'Incorporate explicit Duke Minor vascular criteria guidance into system prompt.',
    boundaryEvaluation: 'WITHIN_AUTHORIZED_BOUNDS',
    verificationMethod: 'Regression testing against 200 synthetic reference case trajectories with automated schema validation.',
    acceptanceCriteria: '100% schema conformance; no regression on primary differential recall.',
    approvalStatus: 'APPROVED',
    regulatoryImpactRationale: 'Does not alter intended use or clinical output format. Within pre-authorized modification boundaries.',
    reviewedBy: 'Dr. Sarah Lin, MD (Regulatory Clinical Lead)',
    reviewedAt: '2026-09-02T10:15:00Z',
  },
  {
    protocolId: 'AMP-002',
    modificationType: 'REASONING_TEMPERATURE_TUNING',
    description: 'Adjusting LLM decoding temperature for diagnostic reasoning stability.',
    allowedVarianceRange: 'Temperature range 0.00 to 0.25; top-p 0.90 to 0.98.',
    actualProposedChange: 'Lower primary reasoning temperature from 0.20 to 0.12 to reduce candidate hypothesis variance.',
    boundaryEvaluation: 'WITHIN_AUTHORIZED_BOUNDS',
    verificationMethod: 'Monte Carlo temperature stability trial across 50 clinical edge cases.',
    acceptanceCriteria: 'Hallucination rate remains under 2.0%; zero omitted high-risk safety flags.',
    approvalStatus: 'APPROVED',
    reviewedBy: 'Dr. Marcus Vance, Chief Medical Officer',
    reviewedAt: '2026-09-05T14:30:00Z',
    regulatoryImpactRationale: 'Maintains conservative deterministic generation bounds. Well within authorized parameters.',
  },
  {
    protocolId: 'AMP-003',
    modificationType: 'WEIGHT_QUANTIZATION_CHANGE',
    description: 'Quantization optimization for reduced inference latency on edge nodes.',
    allowedVarianceRange: 'Quantization format change (FP16 -> AWQ-4bit / GGUF-Q8) with MedQA degradation < 1.5%.',
    actualProposedChange: 'Deploy AWQ-4bit quantized checkpoint for Meditron-70b auxiliary model.',
    boundaryEvaluation: 'REQUIRES_INTERNAL_VALIDATION',
    verificationMethod: 'Side-by-side A/B assessment against full FP16 baseline across 100 benchmark clinical vignettes.',
    acceptanceCriteria: 'Concordance score > 0.90; MedQA benchmark delta <= 1.0%.',
    approvalStatus: 'PENDING_REVIEW',
    regulatoryImpactRationale: 'Permissible within PCCP upon verified completion of full A/B concordance evaluation.',
  },
  {
    protocolId: 'AMP-004',
    modificationType: 'RETRAINING_SET_EXPANSION',
    description: 'Incorporating curated, de-identified clinician feedback into continuous DPO alignment.',
    allowedVarianceRange: 'Up to 5,000 verified clinician correction pairs from Human Feedback Curator.',
    actualProposedChange: 'Ingest 1,250 DPO pairs addressing hallucinated murmur stigmata and atypical presentations.',
    boundaryEvaluation: 'REQUIRES_INTERNAL_VALIDATION',
    verificationMethod: 'Automated DPO loss convergence analysis + clinical validation panel blind evaluation.',
    acceptanceCriteria: 'Safety concern detection sensitivity >= 99.0%; no catastrophic forgetting.',
    approvalStatus: 'PENDING_REVIEW',
    regulatoryImpactRationale: 'Pre-specified in FDA PCCP Section 3.2 (Supervised Fine-Tuning & Alignment Updates).',
  },
  {
    protocolId: 'AMP-005',
    modificationType: 'CLINICAL_DECISION_RULE_ADDITION',
    description: 'Adding peer-reviewed deterministic clinical decision rules to library.',
    allowedVarianceRange: 'Deterministic guideline scoring rules published in recognized clinical societies (ACC, AHA, ESC, IDSA).',
    actualProposedChange: 'Add Wells PE and Modified Duke Criteria to active pre-flight rule checker.',
    boundaryEvaluation: 'WITHIN_AUTHORIZED_BOUNDS',
    verificationMethod: 'Unit testing against 50 published clinical trial score matrices.',
    acceptanceCriteria: '100% mathematical calculation match with gold-standard scoring.',
    approvalStatus: 'APPROVED',
    reviewedBy: 'Dr. Kwame Asante, MD',
    reviewedAt: '2026-09-08T09:00:00Z',
    regulatoryImpactRationale: 'Rule additions are deterministic clinical algorithms with independent medical validation.',
  },
  {
    protocolId: 'AMP-006',
    modificationType: 'OUT_OF_BOUNDS_ARCHITECTURE_SHIFT',
    description: 'Hypothetical autonomous treatment ordering without clinician sign-off.',
    allowedVarianceRange: 'ZERO tolerance — strictly outside cleared intended use.',
    actualProposedChange: 'Automated prescription dispatch directly to pharmacy system without human clinician review.',
    boundaryEvaluation: 'TRIGGERS_NEW_510K',
    verificationMethod: 'N/A — Prohibited under current Class II SaMD clearance.',
    acceptanceCriteria: 'Cannot be cleared under PCCP. Requires formal Pre-Market Notification 510(k) or De Novo request.',
    approvalStatus: 'REJECTED',
    regulatoryImpactRationale: 'Substantially alters the intended use from decision support to autonomous therapy execution.',
    reviewedBy: 'Nexus Regulatory Affairs Committee',
    reviewedAt: '2026-09-10T16:00:00Z',
  },
];

export const CURRENT_FDA_PCCP_PLAN: FdaPccpPlan = {
  id: 'PCCP-NEXUS-2026-01',
  deviceName: 'Nexus Clinical Workstation (Diagnostic Decision Support SaMD)',
  fdaProductCode: 'QAS', // Clinical Decision Support Software (FDA Guidance)
  samdClass: 'Class_II',
  version: '2.1.0',
  authorizedProtocols: INITIAL_PCCP_PROTOCOLS,
  lastUpdated: '2026-09-10T16:00:00Z',
};

/**
 * Evaluates whether a proposed model or system modification falls within authorized PCCP boundaries
 */
export function evaluateProposedModification(
  type: PccpModificationType,
  changeDescription: string,
  varianceMetric: number // e.g. percentage shift
): { boundary: PccpBoundaryResult; rationale: string; requires510k: boolean } {
  if (type === 'OUT_OF_BOUNDS_ARCHITECTURE_SHIFT') {
    return {
      boundary: 'TRIGGERS_NEW_510K',
      rationale: 'Autonomous clinical actuation or changes to intended use trigger mandatory FDA 510(k) pre-market notification.',
      requires510k: true,
    };
  }

  if (type === 'PROMPT_TEMPLATE_OPTIMIZATION' || type === 'CLINICAL_DECISION_RULE_ADDITION') {
    return {
      boundary: 'WITHIN_AUTHORIZED_BOUNDS',
      rationale: 'Change is governed by Authorized Modification Protocol AMP-001/005. Standard regression testing required.',
      requires510k: false,
    };
  }

  if (type === 'REASONING_TEMPERATURE_TUNING') {
    if (varianceMetric <= 0.25) {
      return {
        boundary: 'WITHIN_AUTHORIZED_BOUNDS',
        rationale: `Temperature parameter is within pre-authorized range (<= 0.25). Approved under AMP-002.`,
        requires510k: false,
      };
    } else {
      return {
        boundary: 'REQUIRES_INTERNAL_VALIDATION',
        rationale: `Temperature ${varianceMetric} exceeds conservative bounds. Requires full clinical review committee sign-off.`,
        requires510k: false,
      };
    }
  }

  if (type === 'RETRAINING_SET_EXPANSION' || type === 'WEIGHT_QUANTIZATION_CHANGE') {
    return {
      boundary: 'REQUIRES_INTERNAL_VALIDATION',
      rationale: 'Modification falls within PCCP scope but requires documented A/B concordance verification prior to production rollout.',
      requires510k: false,
    };
  }

  return {
    boundary: 'WITHIN_AUTHORIZED_BOUNDS',
    rationale: 'Evaluated within authorized modification bounds.',
    requires510k: false,
  };
}
