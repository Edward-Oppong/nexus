-- ============================================================
-- 024_phase6h_interoperability.sql
-- Phase 6H: Interoperability, Documents & External Data
--
-- Core principle: Every clinical datum must carry its origin.
-- FHIR R4 mappings are stored alongside native Nexus IDs so
-- that records can always be round-tripped through an HL7 FHIR
-- server without loss of clinical meaning.
--
-- WHO SMART / FHIR R4 alignment:
--   fhir_resource_maps  → tracks every Nexus↔FHIR ID binding
--   external_sources    → authoritative catalogue of external systems
--   import_events       → structured intake log (provenance chain)
--   clinical_documents  → rich, typed document intake (replaces 014)
--   fhir_export_bundles → generated FHIR Bundles ready for export
-- ============================================================

-- ----------------------------------------------------------
-- 1. External Sources Registry
-- Authoritative catalogue of every external system Nexus
-- connects to. Each record carries the trust level and the
-- integration protocol so operators can review data lineage.
-- ----------------------------------------------------------
create table if not exists public.external_sources (
  id                uuid        primary key default gen_random_uuid(),
  organization_id   uuid        not null references public.organizations(id) on delete cascade,
  name              text        not null,
  system_type       text        not null check (system_type in (
                                  'EHR', 'LIS', 'RIS', 'PACS', 'DEVICE',
                                  'PHARMACY', 'REGISTRY', 'RESEARCH_DB',
                                  'MANUAL_UPLOAD', 'OTHER'
                                )),
  protocol          text        not null default 'MANUAL' check (protocol in (
                                  'FHIR_R4', 'HL7_V2', 'DICOM',
                                  'CSV', 'PDF', 'MANUAL', 'API', 'OTHER'
                                )),
  base_url          text,
  trust_level       text        not null default 'STANDARD' check (trust_level in (
                                  'AUTHORITATIVE', 'STANDARD', 'SUPPLEMENTARY', 'UNVERIFIED'
                                )),
  is_active         boolean     not null default true,
  created_by        uuid        references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.external_sources is
  'Registry of all external clinical systems that feed data into Nexus. '
  'Each record carries protocol, trust level, and FHIR endpoint for provenance and interoperability.';

-- ----------------------------------------------------------
-- 2. Import Events Table
-- Structured intake log for every batch of data arriving from
-- an external source. Individual records reference their
-- import event for a complete provenance chain.
-- ----------------------------------------------------------
create table if not exists public.import_events (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete cascade,
  external_source_id  uuid        references public.external_sources(id) on delete set null,
  case_id             uuid        references public.cases(id) on delete set null,
  patient_id          uuid        references public.patients(id) on delete set null,
  import_type         text        not null check (import_type in (
                                    'FHIR_BUNDLE', 'HL7_MESSAGE', 'DOCUMENT_UPLOAD',
                                    'OBSERVATION_BATCH', 'LAB_RESULT_BATCH',
                                    'IMAGING_REPORT', 'MANUAL_ENTRY', 'OTHER'
                                  )),
  status              text        not null default 'PENDING' check (status in (
                                    'PENDING', 'PROCESSING', 'COMPLETED',
                                    'PARTIAL', 'FAILED', 'REJECTED'
                                  )),
  records_received    integer     not null default 0,
  records_imported    integer     not null default 0,
  records_failed      integer     not null default 0,
  raw_payload         jsonb,
  error_log           text[],
  reviewed_by         uuid        references public.profiles(id),
  reviewed_at         timestamptz,
  imported_by         uuid        references public.profiles(id),
  imported_at         timestamptz not null default now(),
  notes               text
);

comment on table public.import_events is
  'Structured log of every external data intake event. '
  'Preserves raw payload, record counts, and clinician review for FHIR/HL7 audit trails.';

-- ----------------------------------------------------------
-- 3. Clinical Documents Table (enhanced, supersedes 014)
-- Rich, typed document intake for the full lifecycle:
-- intake → classification → extraction → attestation → FHIR.
-- FHIR R4 alignment: DocumentReference + Composition resources
-- ----------------------------------------------------------
create table if not exists public.clinical_documents (
  id                    uuid        primary key default gen_random_uuid(),
  organization_id       uuid        not null references public.organizations(id) on delete restrict,
  case_id               uuid        references public.cases(id) on delete cascade,
  patient_id            uuid        references public.patients(id) on delete set null,
  import_event_id       uuid        references public.import_events(id) on delete set null,

  -- Classification
  document_class        text        not null check (document_class in (
                                      'DISCHARGE_SUMMARY', 'REFERRAL_LETTER',
                                      'CONSULTATION_NOTE', 'LAB_REPORT',
                                      'IMAGING_REPORT', 'PATHOLOGY_REPORT',
                                      'OPERATIVE_NOTE', 'NURSING_NOTE',
                                      'PRESCRIPTION', 'CONSENT_FORM',
                                      'ADVANCE_DIRECTIVE', 'CORRESPONDENCE',
                                      'EXTERNAL_RECORD', 'OTHER'
                                    )),
  document_status       text        not null default 'RECEIVED' check (document_status in (
                                      'RECEIVED', 'PROCESSING', 'REVIEWED',
                                      'ATTESTED', 'SUPERSEDED', 'REJECTED'
                                    )),

  -- Core content
  title                 text        not null,
  description           text,
  source_facility       text,
  authored_by           text,
  authored_at           timestamptz,
  received_at           timestamptz not null default now(),

  -- Storage
  storage_path          text,
  storage_bucket        text        not null default 'clinical-documents',
  file_name             text,
  mime_type             text,
  file_size_bytes       bigint,

  -- Extracted structured content
  extracted_findings    jsonb,
  extracted_diagnoses   jsonb,
  extracted_medications jsonb,
  extracted_at          timestamptz,
  extracted_by_model    text,

  -- Clinician attestation
  attested_by           uuid        references public.profiles(id),
  attested_at           timestamptz,
  attestation_note      text,

  -- FHIR linkage
  fhir_document_reference_id   text,
  fhir_composition_id          text,

  -- External source
  external_source_id    uuid        references public.external_sources(id) on delete set null,
  external_document_id  text,

  uploaded_by           uuid        references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.clinical_documents is
  'Rich clinical document intake with full lifecycle: receive → classify → extract → attest. '
  'Aligned with FHIR R4 DocumentReference and Composition resources.';

-- ----------------------------------------------------------
-- 4. FHIR Resource Maps
-- Bidirectional index linking every Nexus domain object to
-- its corresponding FHIR resource on external servers.
-- FHIR R4 alignment: Patient, Observation, DiagnosticReport,
--   Condition, Procedure, MedicationRequest, Provenance
-- ----------------------------------------------------------
create table if not exists public.fhir_resource_maps (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete cascade,

  -- Nexus side
  nexus_resource_type text        not null check (nexus_resource_type in (
                                    'PATIENT', 'ENCOUNTER', 'CASE',
                                    'OBSERVATION', 'FINDING', 'INVESTIGATION',
                                    'DIAGNOSTIC_REPORT', 'HYPOTHESIS', 'DECISION',
                                    'DOCUMENT', 'SAFETY_CONCERN', 'PROVENANCE'
                                  )),
  nexus_resource_id   uuid        not null,

  -- FHIR side
  fhir_resource_type  text        not null,
  fhir_resource_id    text        not null,
  fhir_version_id     text,
  fhir_server_url     text,
  fhir_last_updated   timestamptz,

  -- Sync metadata
  sync_direction      text        not null default 'EXPORT' check (sync_direction in (
                                    'EXPORT', 'IMPORT', 'BIDIRECT'
                                  )),
  last_synced_at      timestamptz,
  sync_status         text        not null default 'PENDING' check (sync_status in (
                                    'PENDING', 'SYNCED', 'CONFLICT', 'ERROR'
                                  )),
  sync_error          text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (nexus_resource_type, nexus_resource_id, fhir_server_url)
);

comment on table public.fhir_resource_maps is
  'Bidirectional FHIR resource identity map. Links every Nexus domain object '
  'to its corresponding FHIR resource on external servers.';

-- ----------------------------------------------------------
-- 5. FHIR Export Bundles
-- Immutable point-in-time FHIR R4 Bundle snapshots generated
-- for transfer, referral, registry submission, or audit.
-- FHIR R4 alignment: Bundle resource (transaction, document)
-- ----------------------------------------------------------
create table if not exists public.fhir_export_bundles (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete restrict,
  case_id             uuid        references public.cases(id) on delete set null,
  patient_id          uuid        references public.patients(id) on delete set null,

  bundle_type         text        not null check (bundle_type in (
                                    'TRANSACTION', 'DOCUMENT', 'COLLECTION',
                                    'HISTORY', 'SEARCHSET'
                                  )),
  purpose             text        not null check (purpose in (
                                    'TRANSFER_OF_CARE', 'REFERRAL', 'RESEARCH_EXPORT',
                                    'AUDIT_DISCLOSURE', 'PATIENT_REQUEST',
                                    'REGISTRY_SUBMISSION', 'INTERNAL_SYNC', 'OTHER'
                                  )),

  recipient_name      text,
  recipient_fhir_url  text,

  fhir_bundle         jsonb       not null,
  resource_count      integer     not null default 0,
  fhir_version        text        not null default 'R4',

  status              text        not null default 'DRAFT' check (status in (
                                    'DRAFT', 'READY', 'TRANSMITTED',
                                    'ACKNOWLEDGED', 'FAILED'
                                  )),
  generated_by        uuid        references public.profiles(id),
  generated_at        timestamptz not null default now(),
  transmitted_at      timestamptz,
  acknowledged_at     timestamptz,
  error_message       text
);

comment on table public.fhir_export_bundles is
  'Immutable FHIR R4 Bundle export records. Each bundle is a point-in-time '
  'clinical data snapshot for transfer, referral, or registry submission.';

-- ----------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------
create index if not exists idx_external_sources_org       on public.external_sources(organization_id);
create index if not exists idx_import_events_org          on public.import_events(organization_id);
create index if not exists idx_import_events_case         on public.import_events(case_id);
create index if not exists idx_import_events_patient      on public.import_events(patient_id);
create index if not exists idx_import_events_status       on public.import_events(status, organization_id);
create index if not exists idx_clinical_docs_case         on public.clinical_documents(case_id);
create index if not exists idx_clinical_docs_patient      on public.clinical_documents(patient_id);
create index if not exists idx_clinical_docs_class        on public.clinical_documents(organization_id, document_class);
create index if not exists idx_clinical_docs_status       on public.clinical_documents(document_status, case_id);
create index if not exists idx_fhir_maps_nexus            on public.fhir_resource_maps(nexus_resource_type, nexus_resource_id);
create index if not exists idx_fhir_maps_fhir             on public.fhir_resource_maps(fhir_resource_type, fhir_resource_id);
create index if not exists idx_fhir_maps_org              on public.fhir_resource_maps(organization_id);
create index if not exists idx_fhir_bundles_case          on public.fhir_export_bundles(case_id);
create index if not exists idx_fhir_bundles_org           on public.fhir_export_bundles(organization_id, status);

-- ----------------------------------------------------------
-- 7. Row Level Security
-- ----------------------------------------------------------
alter table public.external_sources     enable row level security;
alter table public.import_events        enable row level security;
alter table public.clinical_documents   enable row level security;
alter table public.fhir_resource_maps   enable row level security;
alter table public.fhir_export_bundles  enable row level security;

-- External sources
create policy "external_sources_select_org"
  on public.external_sources for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "external_sources_manage_admin"
  on public.external_sources for all to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
        and role in ('organization_admin', 'platform_admin')
    )
  );

-- Import events
create policy "import_events_select_org"
  on public.import_events for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "import_events_insert_org"
  on public.import_events for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "import_events_update_org"
  on public.import_events for update to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

-- Clinical documents
create policy "clinical_documents_select_org"
  on public.clinical_documents for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "clinical_documents_insert_org"
  on public.clinical_documents for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "clinical_documents_update_org"
  on public.clinical_documents for update to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

-- FHIR resource maps
create policy "fhir_maps_select_org"
  on public.fhir_resource_maps for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "fhir_maps_insert_org"
  on public.fhir_resource_maps for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

-- FHIR export bundles
create policy "fhir_bundles_select_org"
  on public.fhir_export_bundles for select to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "fhir_bundles_insert_org"
  on public.fhir_export_bundles for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );

create policy "fhir_bundles_update_org"
  on public.fhir_export_bundles for update to authenticated
  using (
    organization_id in (
      select organization_id from public.organization_memberships
      where profile_id = auth.uid() and status = 'ACTIVE'
    )
  );
