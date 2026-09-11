// ============================================================
// src/domain/interoperability-advanced.ts
// Phase 10: Advanced Interoperability Domain Types
// SMART on FHIR, CDA/C-CDA, IHE XDS.b, WHO SMART Guidelines, and Offline-First Sync
// ============================================================

// ------------------------------------------------------------
// 1. SMART on FHIR Launch Protocol
// ------------------------------------------------------------

export type SmartLaunchMode = 'EHR_LAUNCH' | 'STANDALONE_LAUNCH';

export interface SmartWellKnownConfig {
  authorization_endpoint: string;
  token_endpoint: string;
  token_endpoint_auth_methods_supported: string[];
  registration_endpoint?: string;
  scopes_supported: string[];
  response_types_supported: string[];
  management_endpoint?: string;
  introspection_endpoint?: string;
  capabilities: string[];
}

export interface SmartLaunchContext {
  launchId: string;
  iss: string; // FHIR Base URL from EHR
  launchToken?: string; // opaque string passed by EHR
  clientId: string;
  scope: string; // e.g. "launch launch/patient patient/*.read openid fhirUser"
  redirectUri: string;
  state: string;
  patientId?: string;
  encounterId?: string;
  userId?: string;
  userRole?: string;
  fhirVersion: '4.0.1' | '1.0.2' | '3.0.1';
  wellKnownConfig?: SmartWellKnownConfig;
  status: 'PENDING' | 'AUTHORIZED' | 'TOKEN_EXCHANGED' | 'FAILED';
  createdAt: string;
}

export interface SmartTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  patient?: string;
  encounter?: string;
  need_patient_banner?: boolean;
  smart_style_url?: string;
  id_token?: string;
  fhirUser?: string;
  issuedAt: string;
}

// ------------------------------------------------------------
// 2. CDA / C-CDA Document Architecture
// ------------------------------------------------------------

export type CdaDocumentType =
  | 'CONTINUITY_OF_CARE_DOCUMENT'
  | 'DISCHARGE_SUMMARY'
  | 'CONSULTATION_NOTE'
  | 'REFERRAL_NOTE'
  | 'DIAGNOSTIC_IMAGING_REPORT';

export interface CdaHeader {
  documentId: string;
  setId?: string;
  versionNumber?: number;
  title: string;
  documentType: CdaDocumentType;
  effectiveTime: string;
  confidentialityCode: string;
  languageCode: string;
  patient: {
    id: string;
    family: string;
    given: string;
    gender: 'M' | 'F' | 'UN';
    birthTime: string;
    address?: string;
    telecom?: string;
  };
  author: {
    id: string;
    name: string;
    organization: string;
  };
  custodian: {
    organizationId: string;
    organizationName: string;
  };
}

export interface CdaClinicalEntry {
  id: string;
  code: string;
  codeSystem: string; // e.g. SNOMED-CT, RxNorm, LOINC, ICD-10
  codeSystemName: string;
  displayName: string;
  value?: string | number;
  unit?: string;
  statusCode: string;
  effectiveTime?: string;
  interpretation?: string;
  narrativeText?: string;
}

export interface CdaSection {
  templateId: string;
  code: string;
  title: string;
  narrativeHtml: string;
  entries: CdaClinicalEntry[];
}

export interface CdaDocument {
  header: CdaHeader;
  sections: {
    allergies?: CdaSection;
    problemList?: CdaSection;
    medications?: CdaSection;
    vitalSigns?: CdaSection;
    results?: CdaSection;
    procedures?: CdaSection;
    planOfCare?: CdaSection;
  };
  rawXml: string;
}

export interface CdaImportResult {
  documentId: string;
  patientName: string;
  documentTitle: string;
  extractedFindingsCount: number;
  extractedMedicationsCount: number;
  extractedVitalsCount: number;
  extractedProblemsCount: number;
  mappedFindingIds: string[];
  validationWarnings: string[];
  importedAt: string;
}

// ------------------------------------------------------------
// 3. IHE XDS.b / MHD Document Exchange
// ------------------------------------------------------------

export interface IheXdsDocumentEntry {
  entryUuid: string;
  uniqueId: string; // OID.unique
  patientId: string;
  title: string;
  mimeType: string;
  formatCode: {
    code: string;
    codingScheme: string;
    displayName: string;
  };
  typeCode: {
    code: string;
    codingScheme: string;
    displayName: string;
  };
  classCode: {
    code: string;
    codingScheme: string;
    displayName: string;
  };
  confidentialityCode: string;
  creationTime: string;
  repositoryUniqueId: string;
  sizeBytes: number;
  hashSha1: string;
  availabilityStatus: 'Approved' | 'Deprecated';
  authorPerson: string;
  authorInstitution: string;
  sourcePatientId: string;
}

export interface IheXdsQuery {
  patientId: string;
  status: Array<'Approved' | 'Deprecated'>;
  typeCodes?: string[];
  creationTimeFrom?: string;
  creationTimeTo?: string;
}

export interface IheXdsQueryResult {
  queryId: string;
  executedAt: string;
  matchedDocuments: IheXdsDocumentEntry[];
  totalCount: number;
  registryStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE';
}

// ------------------------------------------------------------
// 4. WHO SMART Guidelines Base Profile
// ------------------------------------------------------------

export type WhoSmartProfileCategory =
  | 'IMMUNIZATION'
  | 'ANTENATAL_CARE'
  | 'HIV_TB'
  | 'COVID19'
  | 'CLINICAL_ENCOUNTER';

export interface WhoSmartValidationRule {
  id: string;
  ruleCode: string;
  profileName: string;
  description: string;
  resourceType: 'Patient' | 'Encounter' | 'Condition' | 'Observation' | 'Immunization';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  category: WhoSmartProfileCategory;
  standardCodingSystems: Array<'ICD-11' | 'SNOMED-GPS' | 'LOINC' | 'WHO-ATC'>;
  checkFn: (resource: any) => { passed: boolean; message: string; offendingField?: string };
}

export interface WhoSmartValidationIssue {
  ruleId: string;
  ruleCode: string;
  resourceType: string;
  resourceId?: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  field?: string;
  recommendedFix: string;
}

export interface WhoSmartComplianceReport {
  reportId: string;
  evaluatedAt: string;
  caseId: string;
  overallStatus: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT';
  compliancePercentage: number;
  totalChecks: number;
  passedChecks: number;
  issues: WhoSmartValidationIssue[];
  whoSmartGuidelineVersion: string; // e.g. "WHO SMART Guidelines Base IG v1.0.0"
}

// ------------------------------------------------------------
// 5. Offline-First Sync Engine
// ------------------------------------------------------------

export type NetworkConnectionTier = '4g' | '3g' | '2g' | 'slow-2g' | 'offline';

export interface OfflineNetworkStatus {
  isOnline: boolean;
  connectionTier: NetworkConnectionTier;
  rttMs: number;
  downlinkMbps: number;
  lastOnlineAt: string;
  lastSyncAt: string | null;
  pendingMutationCount: number;
  syncState: 'IDLE' | 'SYNCING' | 'RETRY_WAITING' | 'ERROR';
}

export type OfflineMutationAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RECORD_DECISION' | 'SUBMIT_INVESTIGATION';

export interface OfflineQueuedMutation {
  id: string;
  idempotencyKey: string;
  caseId: string;
  organizationId: string;
  action: OfflineMutationAction;
  entityType: 'Case' | 'Finding' | 'Decision' | 'Investigation' | 'SafetyIssue';
  entityId: string;
  payload: any;
  createdAt: string;
  retryAttempts: number;
  lastError?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface OfflineSyncStats {
  storedCasesCount: number;
  storedDocumentsCount: number;
  queuedMutationsCount: number;
  localStorageSizeBytes: number;
  lastPurgedAt: string | null;
}
