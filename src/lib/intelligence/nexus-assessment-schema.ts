// ============================================================
// src/lib/intelligence/nexus-assessment-schema.ts
// Phase 6F: Strict Schema & Grounding Validation
// Enforces the 18 Non-Negotiable Rules:
// - Prohibits numerical diagnostic probabilities (Rule 10)
// - Prohibits definitive diagnosis declarations (Rule 13)
// - Enforces strict ID grounding against input context (Rule 6, 7)
// ============================================================

import { RawReasoningOutput } from '../../domain/nexus-assessment';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate raw generative reasoning output against strict clinical schema
 */
export function validateAssessmentOutput(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Output is not an object'], warnings };
  }

  const obj = raw as Record<string, unknown>;

  // summary: required string
  if (typeof obj.summary !== 'string' || obj.summary.trim().length === 0) {
    errors.push('summary is required and must be a non-empty string');
  }

  // Check for prohibited numerical diagnostic probabilities (Rule 10)
  const allText = JSON.stringify(raw);
  const probabilityPattern = /\b(?:\d{1,3}(?:\.\d+)?%)\s*(?:probability|risk|certainty|chance|confidence|likely)\b/i;
  if (probabilityPattern.test(allText)) {
    errors.push('Rule 10 Violation: Generative output contains numerical diagnostic probabilities/percentages, which is strictly prohibited.');
  }

  // Check for prohibited definitive diagnostic declarations (Rule 13)
  const definitivePattern = /\b(?:definitive diagnosis is|diagnosed with certainty|confirming the final diagnosis)\b/i;
  if (definitivePattern.test(allText)) {
    errors.push('Rule 13 Violation: Generative model declared a definitive clinical diagnosis. Final clinical decisions belong solely to the physician.');
  }

  // hypotheses: required array
  if (!Array.isArray(obj.hypotheses)) {
    errors.push('hypotheses must be an array');
  } else {
    (obj.hypotheses as unknown[]).forEach((h, i) => {
      const hyp = h as Record<string, unknown>;
      if (typeof hyp.label !== 'string') errors.push(`hypotheses[${i}].label must be a string`);
      if (typeof hyp.rationale !== 'string') errors.push(`hypotheses[${i}].rationale must be a string`);
      if (!Array.isArray(hyp.supportingFindingIds)) errors.push(`hypotheses[${i}].supportingFindingIds must be an array`);
      if (!Array.isArray(hyp.contradictingFindingIds)) errors.push(`hypotheses[${i}].contradictingFindingIds must be an array`);
      if (!Array.isArray(hyp.missingInformation)) errors.push(`hypotheses[${i}].missingInformation must be an array`);
      if (!Array.isArray(hyp.evidenceSourceIds)) errors.push(`hypotheses[${i}].evidenceSourceIds must be an array`);
    });
  }

  // contradictions: required array (can be empty)
  if (!Array.isArray(obj.contradictions)) {
    errors.push('contradictions must be an array');
  } else {
    (obj.contradictions as unknown[]).forEach((c, i) => {
      const con = c as Record<string, unknown>;
      if (typeof con.findingAId !== 'string') errors.push(`contradictions[${i}].findingAId must be a string`);
      if (typeof con.findingBId !== 'string') errors.push(`contradictions[${i}].findingBId must be a string`);
      if (typeof con.explanation !== 'string') errors.push(`contradictions[${i}].explanation must be a string`);
    });
  }

  // limitations: required array
  if (!Array.isArray(obj.limitations)) {
    errors.push('limitations must be an array');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Strict Grounding Validation (Rule 6 & 7)
 * Every findingId and evidenceSourceId referenced by the output must exist
 * in the supplied context. The model cannot invent IDs or citations.
 */
export function validateGrounding(
  output: RawReasoningOutput,
  contextFindingIds: Set<string>,
  contextEvidenceIds: Set<string>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  output.hypotheses.forEach((h, i) => {
    h.supportingFindingIds.forEach((id) => {
      if (!contextFindingIds.has(id)) {
        errors.push(`Rule 7 Grounding Violation: hypotheses[${i}].supportingFindingIds references unknown/ungrounded findingId "${id}"`);
      }
    });
    h.contradictingFindingIds.forEach((id) => {
      if (!contextFindingIds.has(id)) {
        errors.push(`Rule 7 Grounding Violation: hypotheses[${i}].contradictingFindingIds references unknown/ungrounded findingId "${id}"`);
      }
    });
    h.evidenceSourceIds.forEach((id) => {
      if (!contextEvidenceIds.has(id)) {
        errors.push(`Rule 6 Grounding Violation: hypotheses[${i}].evidenceSourceIds references ungrounded citation/evidenceId "${id}"`);
      }
    });
  });

  output.contradictions.forEach((c, i) => {
    if (!contextFindingIds.has(c.findingAId) && c.findingAId !== 'measurement') {
      errors.push(`Rule 7 Grounding Violation: contradictions[${i}].findingAId references unknown findingId "${c.findingAId}"`);
    }
    if (!contextFindingIds.has(c.findingBId) && c.findingBId !== 'measurement') {
      errors.push(`Rule 7 Grounding Violation: contradictions[${i}].findingBId references unknown findingId "${c.findingBId}"`);
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}
