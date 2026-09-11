// ============================================================
// src/lib/interoperability/normalization/dates.ts
// Phase 6H: Date/Time Normalization for FHIR R4 Compatibility
// ============================================================

/**
 * Normalizes any date representation (string, timestamp, Date) to a strict ISO 8601 UTC string.
 * Returns undefined if input is invalid or absent.
 */
export function normalizeIsoDate(input?: string | number | Date | null): string | undefined {
  if (!input) return undefined;

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? undefined : input.toISOString();
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const str = input.trim();
  if (!str) return undefined;

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(`${str}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  // Handle YYYY-MM
  if (/^\d{4}-\d{2}$/.test(str)) {
    const d = new Date(`${str}-01T00:00:00.000Z`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  // Handle YYYY
  if (/^\d{4}$/.test(str)) {
    const d = new Date(`${str}-01-01T00:00:00.000Z`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/**
 * Formats an ISO date into FHIR 'date' type (YYYY-MM-DD).
 */
export function toFhirDate(input?: string | number | Date | null): string | undefined {
  const iso = normalizeIsoDate(input);
  if (!iso) return undefined;
  return iso.split('T')[0];
}

/**
 * Formats an ISO date into FHIR 'dateTime' type (YYYY-MM-DDThh:mm:ssZ).
 */
export function toFhirDateTime(input?: string | number | Date | null): string | undefined {
  return normalizeIsoDate(input);
}
