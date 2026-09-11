// ============================================================
// src/lib/interoperability/fhir/types.ts
// Phase 6H: FHIR R4 Resource Type Definitions
//
// These are the FHIR R4 resource shapes that Nexus produces
// and consumes. Only fields Nexus actually uses are included;
// the shapes are structurally valid FHIR R4 JSON.
//
// Reference: https://hl7.org/fhir/R4/
// WHO SMART Base: https://smart.who.int/base/
// ============================================================

// ----------------------------------------------------------
// Core FHIR Primitives
// ----------------------------------------------------------

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  tag?: FhirCoding[];
}

export interface FhirCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FhirCodeableConcept;
  system?: string;
  value?: string;
}

export interface FhirReference {
  reference?: string;
  type?: string;
  display?: string;
}

export interface FhirHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
}

export interface FhirContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

export interface FhirQuantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}

export interface FhirAnnotation {
  authorReference?: FhirReference;
  authorString?: string;
  time?: string;
  text: string;
}

export interface FhirNarrative {
  status: 'generated' | 'extensions' | 'additional' | 'empty';
  div: string;
}

export interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ----------------------------------------------------------
// FHIR R4: Patient
// https://hl7.org/fhir/R4/patient.html
// ----------------------------------------------------------
export interface FhirPatient {
  resourceType: 'Patient';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: FhirAddress[];
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: Encounter
// https://hl7.org/fhir/R4/encounter.html
// ----------------------------------------------------------
export type FhirEncounterStatus =
  | 'planned' | 'arrived' | 'triaged' | 'in-progress'
  | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';

export interface FhirEncounter {
  resourceType: 'Encounter';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirEncounterStatus;
  class: FhirCoding;
  type?: FhirCodeableConcept[];
  subject?: FhirReference;
  participant?: Array<{
    type?: FhirCodeableConcept[];
    individual?: FhirReference;
  }>;
  period?: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
  diagnosis?: Array<{
    condition: FhirReference;
    use?: FhirCodeableConcept;
    rank?: number;
  }>;
  serviceProvider?: FhirReference;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: Observation
// https://hl7.org/fhir/R4/observation.html
// ----------------------------------------------------------
export type FhirObservationStatus =
  | 'registered' | 'preliminary' | 'final' | 'amended'
  | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';

export interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  dataAbsentReason?: FhirCodeableConcept;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirObservationStatus;
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: FhirPeriod;
  issued?: string;
  performer?: FhirReference[];
  valueQuantity?: FhirQuantity;
  valueCodeableConcept?: FhirCodeableConcept;
  valueString?: string;
  dataAbsentReason?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  note?: FhirAnnotation[];
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    text?: string;
  }>;
  component?: FhirObservationComponent[];
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: Condition
// https://hl7.org/fhir/R4/condition.html
// ----------------------------------------------------------
export interface FhirCondition {
  resourceType: 'Condition';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  clinicalStatus: FhirCodeableConcept;
  verificationStatus?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  severity?: FhirCodeableConcept;
  code?: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  onsetDateTime?: string;
  abatementDateTime?: string;
  note?: FhirAnnotation[];
  evidence?: Array<{
    code?: FhirCodeableConcept[];
    detail?: FhirReference[];
  }>;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: ServiceRequest
// https://hl7.org/fhir/R4/servicerequest.html
// ----------------------------------------------------------
export type FhirServiceRequestStatus =
  | 'draft' | 'active' | 'on-hold' | 'revoked'
  | 'completed' | 'entered-in-error' | 'unknown';

export type FhirServiceRequestIntent =
  | 'proposal' | 'plan' | 'directive' | 'order'
  | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';

export interface FhirServiceRequest {
  resourceType: 'ServiceRequest';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirServiceRequestStatus;
  intent: FhirServiceRequestIntent;
  category?: FhirCodeableConcept[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code?: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  occurrenceDateTime?: string;
  requester?: FhirReference;
  reasonCode?: FhirCodeableConcept[];
  reasonReference?: FhirReference[];
  note?: FhirAnnotation[];
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: DiagnosticReport
// https://hl7.org/fhir/R4/diagnosticreport.html
// ----------------------------------------------------------
export type FhirDiagnosticReportStatus =
  | 'registered' | 'partial' | 'preliminary' | 'final'
  | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error';

export interface FhirDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirDiagnosticReportStatus;
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  issued?: string;
  performer?: FhirReference[];
  resultsInterpreter?: FhirReference[];
  result?: FhirReference[];
  conclusion?: string;
  conclusionCode?: FhirCodeableConcept[];
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: DocumentReference
// https://hl7.org/fhir/R4/documentreference.html
// ----------------------------------------------------------
export interface FhirDocumentReference {
  resourceType: 'DocumentReference';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: 'current' | 'superseded' | 'entered-in-error';
  docStatus?: 'preliminary' | 'final' | 'amended' | 'entered-in-error';
  type?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  subject?: FhirReference;
  date?: string;
  author?: FhirReference[];
  description?: string;
  content: Array<{
    attachment: {
      contentType?: string;
      url?: string;
      size?: number;
      title?: string;
      creation?: string;
    };
    format?: FhirCoding;
  }>;
  context?: {
    encounter?: FhirReference[];
    period?: FhirPeriod;
    facilityType?: FhirCodeableConcept;
    practiceSetting?: FhirCodeableConcept;
  };
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: Practitioner
// https://hl7.org/fhir/R4/practitioner.html
// ----------------------------------------------------------
export interface FhirPractitioner {
  resourceType: 'Practitioner';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  address?: FhirAddress[];
  qualification?: Array<{
    identifier?: FhirIdentifier[];
    code: FhirCodeableConcept;
    period?: FhirPeriod;
  }>;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: CareTeam
// https://hl7.org/fhir/R4/careteam.html
// ----------------------------------------------------------
export interface FhirCareTeam {
  resourceType: 'CareTeam';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status?: 'proposed' | 'active' | 'suspended' | 'inactive' | 'entered-in-error';
  name?: string;
  subject?: FhirReference;
  encounter?: FhirReference;
  period?: FhirPeriod;
  participant?: Array<{
    role?: FhirCodeableConcept[];
    member?: FhirReference;
    period?: FhirPeriod;
  }>;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: Task
// https://hl7.org/fhir/R4/task.html
// ----------------------------------------------------------
export type FhirTaskStatus =
  | 'draft' | 'requested' | 'received' | 'accepted' | 'rejected'
  | 'ready' | 'cancelled' | 'in-progress' | 'on-hold' | 'failed'
  | 'completed' | 'entered-in-error';

export interface FhirTask {
  resourceType: 'Task';
  id?: string;
  meta?: FhirMeta;
  identifier?: FhirIdentifier[];
  status: FhirTaskStatus;
  intent: 'unknown' | 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code?: FhirCodeableConcept;
  description?: string;
  focus?: FhirReference;
  for?: FhirReference;
  encounter?: FhirReference;
  executionPeriod?: FhirPeriod;
  authoredOn?: string;
  lastModified?: string;
  requester?: FhirReference;
  owner?: FhirReference;
  note?: FhirAnnotation[];
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: Provenance
// https://hl7.org/fhir/R4/provenance.html
// ----------------------------------------------------------
export interface FhirProvenance {
  resourceType: 'Provenance';
  id?: string;
  meta?: FhirMeta;
  target: FhirReference[];
  recorded: string;
  reason?: FhirCodeableConcept[];
  activity?: FhirCodeableConcept;
  agent: Array<{
    type?: FhirCodeableConcept;
    role?: FhirCodeableConcept[];
    who: FhirReference;
    onBehalfOf?: FhirReference;
  }>;
  entity?: Array<{
    role: 'derivation' | 'revision' | 'quotation' | 'source' | 'removal';
    what: FhirReference;
  }>;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: AuditEvent
// https://hl7.org/fhir/R4/auditevent.html
// ----------------------------------------------------------
export interface FhirAuditEvent {
  resourceType: 'AuditEvent';
  id?: string;
  meta?: FhirMeta;
  type: FhirCoding;
  subtype?: FhirCoding[];
  action?: 'C' | 'R' | 'U' | 'D' | 'E';
  period?: FhirPeriod;
  recorded: string;
  outcome?: '0' | '4' | '8' | '12';
  outcomeDesc?: string;
  agent: Array<{
    type?: FhirCodeableConcept;
    role?: FhirCodeableConcept[];
    who?: FhirReference;
    name?: string;
    requestor: boolean;
    network?: {
      address?: string;
      type?: '1' | '2' | '3' | '4' | '5';
    };
  }>;
  source: {
    site?: string;
    observer: FhirReference;
    type?: FhirCoding[];
  };
  entity?: Array<{
    what?: FhirReference;
    type?: FhirCoding;
    role?: FhirCoding;
    name?: string;
    description?: string;
  }>;
  text?: FhirNarrative;
}

// ----------------------------------------------------------
// FHIR R4: Bundle
// https://hl7.org/fhir/R4/bundle.html
// ----------------------------------------------------------
export type FhirBundleType =
  | 'document' | 'message' | 'transaction' | 'transaction-response'
  | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';

export type FhirResource =
  | FhirPatient
  | FhirEncounter
  | FhirObservation
  | FhirCondition
  | FhirServiceRequest
  | FhirDiagnosticReport
  | FhirDocumentReference
  | FhirPractitioner
  | FhirCareTeam
  | FhirTask
  | FhirProvenance
  | FhirAuditEvent;

export interface FhirBundleEntry {
  fullUrl?: string;
  resource?: FhirResource;
  request?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    ifMatch?: string;
    ifNoneExist?: string;
  };
  response?: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
  };
  search?: {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  };
}

export interface FhirBundle {
  resourceType: 'Bundle';
  id?: string;
  meta?: FhirMeta;
  type: FhirBundleType;
  timestamp?: string;
  total?: number;
  link?: Array<{ relation: string; url: string }>;
  entry?: FhirBundleEntry[];
}

// ----------------------------------------------------------
// FHIR Operation Outcome (error response)
// ----------------------------------------------------------
export interface FhirOperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    details?: FhirCodeableConcept;
    diagnostics?: string;
    expression?: string[];
  }>;
}
