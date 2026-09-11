// ============================================================
// src/lib/intelligence/nexus-assessment-schema.ts
// Phase 6F: Zod Validation Schema for Structured AI Output
// All reasoning provider output must pass this schema before
// being persisted or displayed. Prevents unstructured/unsafe output.
// Reference: WHO SMART — decision logic must be machine-readable and testable.
// ============================================================

// Note: We implement a lightweight structural validator without
// installing Zod as an external dependency. The schema mirrors
// the shape a full Zod implementation would validate.

import { RawReasoningOutput } from '../../domain/nexus-assessment';

// ----------------------------------------------------------
// Validation result
// ----------------------------------------------------------
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ----------------------------------------------------------
// Validate a raw reasoning output from any provider
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// Grounding validation
// Every findingId referenced by the output must exist in the
// supplied context. The model cannot invent IDs.
// ----------------------------------------------------------
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
        errors.push(`hypotheses[${i}].supportingFindingIds contains unknown findingId: "${id}"`);
      }
    });
    h.contradictingFindingIds.forEach((id) => {
      if (!contextFindingIds.has(id)) {
        errors.push(`hypotheses[${i}].contradictingFindingIds contains unknown findingId: "${id}"`);
      }
    });
    h.evidenceSourceIds.forEach((id) => {
      if (!contextEvidenceIds.has(id)) {
        warnings.push(`hypotheses[${i}].evidenceSourceIds references unknown evidenceSourceId: "${id}" — will be excluded`);
      }
    });
  });

  output.contradictions.forEach((c, i) => {
    if (!contextFindingIds.has(c.findingAId)) {
      errors.push(`contradictions[${i}].findingAId references unknown findingId: "${c.findingAId}"`);
    }
    if (!contextFindingIds.has(c.findingBId)) {
      errors.push(`contradictions[${i}].findingBId references unknown findingId: "${c.findingBId}"`);
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}
