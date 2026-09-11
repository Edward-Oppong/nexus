// ============================================================
// src/lib/interoperability/fhir/validators.ts
// Phase 6H: FHIR R4 Resource Validation
//
// These are lightweight structural validators. They check that
// a received resource has the required fields for Nexus to
// safely process it. Full FHIR profile validation should be
// done by a FHIR server or validation service, not here.
// ============================================================

import type {
  FhirBundle,
  FhirPatient,
  FhirObservation,
  FhirCondition,
  FhirDiagnosticReport,
  FhirDocumentReference,
  FhirResource,
  FhirOperationOutcome,
} from './types';

export interface ValidationResult {
  valid: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ----------------------------------------------------------
// Primitive validators
// ----------------------------------------------------------

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(value);
}

function buildResult(errors: string[], warnings: string[] = []): ValidationResult {
  const valid = errors.length === 0;
  return { valid, isValid: valid, errors, warnings };
}

// ----------------------------------------------------------
// Resource-specific validators
// ----------------------------------------------------------

export function validatePatient(resource: FhirPatient): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (resource.resourceType !== 'Patient') {
    errors.push('resourceType must be "Patient"');
  }

  if (!resource.name || resource.name.length === 0) {
    errors.push('Patient must have at least one name');
  } else {
    const name = resource.name[0];
    if (!hasText(name.family) && !hasText(name.text) && (!name.given || name.given.length === 0)) {
      errors.push('Patient name must have family, given, or text');
    }
  }

  if (resource.birthDate && !isIsoDate(resource.birthDate)) {
    errors.push('Patient.birthDate must be ISO 8601 (YYYY-MM-DD)');
  }

  if (!resource.gender) {
    warnings.push('Patient.gender is missing — will default to "unknown"');
  }

  return buildResult(errors, warnings);
}

export function validateObservation(resource: FhirObservation): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (resource.resourceType !== 'Observation') {
    errors.push('resourceType must be "Observation"');
  }

  if (!resource.status) {
    errors.push('Observation.status is required');
  }

  if (!resource.code) {
    errors.push('Observation.code is required');
  } else if (!resource.code.coding?.length && !hasText(resource.code.text)) {
    errors.push('Observation.code must have coding or text');
  }

  const hasValue =
    resource.valueQuantity !== undefined ||
    resource.valueCodeableConcept !== undefined ||
    resource.valueString !== undefined ||
    resource.dataAbsentReason !== undefined ||
    (resource.component && resource.component.length > 0);

  if (!hasValue) {
    warnings.push('Observation has no value — dataAbsentReason should be set');
  }

  if (!resource.subject) {
    warnings.push('Observation.subject is missing — cannot link to patient');
  }

  if (resource.effectiveDateTime && !isIsoDate(resource.effectiveDateTime)) {
    errors.push('Observation.effectiveDateTime must be ISO 8601');
  }

  return buildResult(errors, warnings);
}

export function validateCondition(resource: FhirCondition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (resource.resourceType !== 'Condition') {
    errors.push('resourceType must be "Condition"');
  }

  if (!resource.clinicalStatus) {
    errors.push('Condition.clinicalStatus is required');
  }

  if (!resource.subject) {
    errors.push('Condition.subject is required');
  }

  if (!resource.code && !resource.clinicalStatus) {
    warnings.push('Condition should have a code describing the clinical finding');
  }

  return buildResult(errors, warnings);
}

export function validateDiagnosticReport(resource: FhirDiagnosticReport): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (resource.resourceType !== 'DiagnosticReport') {
    errors.push('resourceType must be "DiagnosticReport"');
  }

  if (!resource.status) {
    errors.push('DiagnosticReport.status is required');
  }

  if (!resource.code) {
    errors.push('DiagnosticReport.code is required');
  }

  if (!resource.subject) {
    warnings.push('DiagnosticReport.subject is missing — cannot link to patient');
  }

  if (!resource.conclusion && (!resource.result || resource.result.length === 0)) {
    warnings.push('DiagnosticReport has no conclusion or results');
  }

  return buildResult(errors, warnings);
}

export function validateDocumentReference(resource: FhirDocumentReference): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (resource.resourceType !== 'DocumentReference') {
    errors.push('resourceType must be "DocumentReference"');
  }

  if (!resource.status) {
    errors.push('DocumentReference.status is required');
  }

  if (!resource.content || resource.content.length === 0) {
    errors.push('DocumentReference.content must have at least one entry');
  } else {
    resource.content.forEach((c, i) => {
      if (!c.attachment) {
        errors.push(`DocumentReference.content[${i}].attachment is required`);
      } else if (!c.attachment.url && !c.attachment.contentType) {
        warnings.push(`DocumentReference.content[${i}].attachment should have url or contentType`);
      }
    });
  }

  return buildResult(errors, warnings);
}

// ----------------------------------------------------------
// Bundle validator
// ----------------------------------------------------------

export function validateBundle(bundle: FhirBundle): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (bundle.resourceType !== 'Bundle') {
    errors.push('resourceType must be "Bundle"');
  }

  if (!bundle.type) {
    errors.push('Bundle.type is required');
  }

  if (!bundle.entry || bundle.entry.length === 0) {
    warnings.push('Bundle has no entries');
    return buildResult(errors, warnings);
  }

  bundle.entry.forEach((entry, i) => {
    if (!entry.resource) {
      warnings.push(`Bundle.entry[${i}] has no resource`);
      return;
    }

    const resourceType = (entry.resource as FhirResource).resourceType;
    if (!resourceType) {
      errors.push(`Bundle.entry[${i}].resource has no resourceType`);
    }
  });

  return buildResult(errors, warnings);
}

// ----------------------------------------------------------
// Generic resource validator dispatcher
// ----------------------------------------------------------

export function validateFhirResource(resource: FhirResource): ValidationResult {
  switch (resource.resourceType) {
    case 'Patient':
      return validatePatient(resource as FhirPatient);
    case 'Observation':
      return validateObservation(resource as FhirObservation);
    case 'Condition':
      return validateCondition(resource as FhirCondition);
    case 'DiagnosticReport':
      return validateDiagnosticReport(resource as FhirDiagnosticReport);
    case 'DocumentReference':
      return validateDocumentReference(resource as FhirDocumentReference);
    default:
      return buildResult([], [
        `No specific validator for resourceType "${(resource as { resourceType: string }).resourceType}" — basic structure assumed valid`,
      ]);
  }
}

// ----------------------------------------------------------
// OperationOutcome parser
// ----------------------------------------------------------

export function parseOperationOutcome(outcome: FhirOperationOutcome): string[] {
  return outcome.issue.map((issue) => {
    const location = issue.expression?.join(', ') ?? 'unknown';
    const detail = issue.details?.text ?? issue.diagnostics ?? 'No detail';
    return `[${issue.severity.toUpperCase()}] ${location}: ${detail}`;
  });
}
