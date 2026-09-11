// ============================================================
// src/domain/external-source.ts
// Phase 6H: External Integration Sources & Sync Events
//
// Defines the registry of external systems that feed data into
// Nexus, and the idempotent sync event log that prevents
// duplicate imports and tracks retry state.
//
// Security rule: credentials (API keys, client secrets) are
// NEVER stored in this model. They live in server-side secrets
// management and are injected only inside Edge Functions.
// ============================================================

// ----------------------------------------------------------
// External Source (Integration Source Registry)
// ----------------------------------------------------------

export type SystemType =
  | 'EHR'           // Electronic Health Record (Epic, Cerner, OpenMRS)
  | 'LIS'           // Laboratory Information System
  | 'RIS'           // Radiology Information System
  | 'PACS'          // Picture Archiving & Communication System
  | 'DEVICE'        // Bedside monitor or medical device gateway
  | 'PHARMACY'      // Pharmacy system
  | 'REGISTRY'      // National or disease registry
  | 'RESEARCH_DB'   // Research database
  | 'MANUAL_UPLOAD' // Manual file upload by a clinician
  | 'OTHER';

export type IntegrationProtocol =
  | 'FHIR_R4'   // HL7 FHIR R4 REST API
  | 'HL7_V2'    // HL7 v2 messages (ADT, ORM, ORU)
  | 'DICOM'     // DICOM WADO-RS / STOW-RS
  | 'CSV'       // CSV or spreadsheet bulk upload
  | 'PDF'       // PDF document upload
  | 'MANUAL'    // Manually entered or described data
  | 'API'       // Proprietary REST API
  | 'OTHER';

export type TrustLevel =
  | 'AUTHORITATIVE'  // Primary source of truth (patient's home EHR)
  | 'STANDARD'       // Trusted peer system
  | 'SUPPLEMENTARY'  // Additional context only
  | 'UNVERIFIED';    // Source authenticity not confirmed

export type SourceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_SETUP';

export interface ExternalSource {
  id: string;
  organizationId: string;
  name: string;                  // "KBTH Epic EHR", "Quest Diagnostics"
  systemType: SystemType;
  protocol: IntegrationProtocol;
  baseUrl?: string;              // FHIR server base URL or API endpoint
  trustLevel: TrustLevel;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Runtime status (not stored in DB — computed from sync events)
  runtimeStatus?: SourceStatus;
  lastSyncAt?: string;
  lastSyncError?: string;
}

// ----------------------------------------------------------
// External Identifiers (Identity Bridge)
// Links a Nexus internal UUID to an external system's ID.
// This prevents us from assuming external IDs as primary keys.
// ----------------------------------------------------------

export type NexusResourceType =
  | 'PATIENT'
  | 'ENCOUNTER'
  | 'CASE'
  | 'OBSERVATION'
  | 'FINDING'
  | 'INVESTIGATION'
  | 'DIAGNOSTIC_REPORT'
  | 'HYPOTHESIS'
  | 'DECISION'
  | 'DOCUMENT'
  | 'SAFETY_CONCERN'
  | 'PROVENANCE';

export interface ExternalIdentifier {
  id: string;
  organizationId: string;
  nexusResourceType: NexusResourceType;
  nexusResourceId: string;       // Nexus UUID
  externalSourceId: string;
  externalSystem: string;        // Human-readable system name
  externalResourceType: string;  // FHIR resource type
  externalResourceId: string;    // ID in the external system
  identifierType: 'FHIR_ID' | 'MRN' | 'ACCESSION' | 'ORDER_ID' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------
// Import Event
// A single batch intake from an external source.
// ----------------------------------------------------------

export type ImportType =
  | 'FHIR_BUNDLE'
  | 'HL7_MESSAGE'
  | 'DOCUMENT_UPLOAD'
  | 'OBSERVATION_BATCH'
  | 'LAB_RESULT_BATCH'
  | 'IMAGING_REPORT'
  | 'MANUAL_ENTRY'
  | 'OTHER';

export type ImportStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIAL'    // Some records imported, some failed
  | 'FAILED'
  | 'REJECTED';  // Clinician reviewed and rejected

export interface ImportEvent {
  id: string;
  organizationId: string;
  externalSourceId?: string;
  caseId?: string;
  patientId?: string;
  importType: ImportType;
  status: ImportStatus;
  recordsReceived: number;
  recordsImported: number;
  recordsFailed: number;
  rawPayload?: unknown;         // Original payload for full audit
  errorLog?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  importedBy?: string;
  importedAt: string;
  notes?: string;
}

// ----------------------------------------------------------
// Sync Event (Idempotency Log)
// Each attempt to import a specific external resource creates
// a sync event. Before processing, we check whether this
// externalResourceId has already been successfully imported.
// ----------------------------------------------------------

export type SyncOperation = 'IMPORT' | 'EXPORT' | 'UPDATE' | 'DELETE';

export type SyncStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'        // Idempotency: already processed
  | 'CONFLICT'       // Imported value conflicts with verified local value
  | 'REVIEW_REQUIRED'; // Requires clinician adjudication

export interface SyncEvent {
  id: string;
  integrationSourceId: string;
  externalResourceType: string;     // FHIR resource type
  externalResourceId: string;       // ID in the external system
  operation: SyncOperation;
  status: SyncStatus;
  attemptCount: number;
  maxAttempts: number;
  errorMessage?: string;
  conflictDetail?: string;          // What conflicted and with what
  processedAt?: string;
  nextRetryAt?: string;
  createdAt: string;
}

// ----------------------------------------------------------
// FHIR Resource Map
// Runtime binding between a Nexus resource and a FHIR resource.
// ----------------------------------------------------------

export type SyncDirection = 'EXPORT' | 'IMPORT' | 'BIDIRECT';

export interface FhirResourceMap {
  id: string;
  organizationId: string;
  nexusResourceType: NexusResourceType;
  nexusResourceId: string;
  fhirResourceType: string;
  fhirResourceId: string;
  fhirVersionId?: string;
  fhirServerUrl?: string;
  fhirLastUpdated?: string;
  syncDirection: SyncDirection;
  lastSyncedAt?: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'ERROR';
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------
// Integration Target (used for export)
// ----------------------------------------------------------
export interface IntegrationTarget {
  sourceId: string;
  name: string;
  fhirBaseUrl: string;
  description?: string;
}

// ----------------------------------------------------------
// Service result types
// ----------------------------------------------------------
export interface ImportResult {
  success: boolean;
  importEventId: string;
  recordsImported: number;
  recordsFailed: number;
  errors?: string[];
  conflicts?: Array<{
    resourceType: string;
    resourceId: string;
    detail: string;
  }>;
}

export interface ExportResult {
  success: boolean;
  bundleId: string;
  resourceCount: number;
  targetUrl?: string;
  transmittedAt?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  integrationId: string;
  eventsProcessed: number;
  eventsFailed: number;
  nextSyncAt?: string;
}

// ----------------------------------------------------------
// Display helpers
// ----------------------------------------------------------

export const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  EHR: 'Electronic Health Record',
  LIS: 'Laboratory Information System',
  RIS: 'Radiology Information System',
  PACS: 'Picture Archiving (PACS)',
  DEVICE: 'Medical Device Gateway',
  PHARMACY: 'Pharmacy System',
  REGISTRY: 'Disease / National Registry',
  RESEARCH_DB: 'Research Database',
  MANUAL_UPLOAD: 'Manual Upload',
  OTHER: 'Other',
};

export const PROTOCOL_LABELS: Record<IntegrationProtocol, string> = {
  FHIR_R4: 'FHIR R4',
  HL7_V2: 'HL7 v2',
  DICOM: 'DICOM',
  CSV: 'CSV / Spreadsheet',
  PDF: 'PDF Upload',
  MANUAL: 'Manual Entry',
  API: 'Proprietary API',
  OTHER: 'Other',
};

export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  AUTHORITATIVE: 'Authoritative (Primary Source)',
  STANDARD: 'Standard (Trusted Peer)',
  SUPPLEMENTARY: 'Supplementary (Context Only)',
  UNVERIFIED: 'Unverified',
};
