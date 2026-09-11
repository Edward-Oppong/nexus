// ============================================================
// src/lib/interoperability/normalization/identifiers.ts
// Phase 6H: Identifier Management & Idempotency Key Generation
// ============================================================

import type { FhirIdentifier } from '../fhir/types';

export interface ParsedIdentifier {
  system: string;
  value: string;
  use?: string;
  typeText?: string;
}

/**
 * Extracts the primary official or secondary identifier from a FHIR identifier list.
 */
export function extractPrimaryIdentifier(identifiers?: FhirIdentifier[]): ParsedIdentifier | undefined {
  if (!identifiers || identifiers.length === 0) return undefined;

  const official = identifiers.find((id) => id.use === 'official') || identifiers[0];
  if (!official.value) return undefined;

  return {
    system: official.system || 'unknown',
    value: official.value,
    use: official.use,
    typeText: official.type?.text,
  };
}

/**
 * Generates an idempotent deduplication key from resource provenance and source identifiers.
 * This prevents duplicate creation of findings or investigations when re-syncing from EHR or Lab.
 */
export function generateIdempotencyKey(
  sourceSystem: string,
  resourceType: string,
  sourceId: string,
  versionOrTimestamp?: string
): string {
  const parts = [
    sourceSystem.trim().toLowerCase(),
    resourceType.trim().toLowerCase(),
    sourceId.trim(),
    versionOrTimestamp ? versionOrTimestamp.trim() : '',
  ].filter(Boolean);

  return parts.join(':');
}

/**
 * Builds a standard FHIR identifier object.
 */
export function createFhirIdentifier(
  system: string,
  value: string,
  use: 'usual' | 'official' | 'temp' | 'secondary' = 'official'
): FhirIdentifier {
  return {
    system,
    value,
    use,
  };
}
