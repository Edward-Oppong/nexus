-- ============================================================
-- supabase/migrations/027_phase10_advanced_interoperability.sql
-- Phase 10: Advanced Health Interoperability Database Schema
-- SMART on FHIR, CDA/C-CDA documents, IHE XDS.b, WHO SMART Guidelines, and Offline Outbox
-- ============================================================

-- ------------------------------------------------------------
-- 1. SMART ON FHIR LAUNCH SESSIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS smart_launch_sessions (
    id TEXT PRIMARY KEY,
    iss TEXT NOT NULL,
    launch_token TEXT,
    client_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    state TEXT NOT NULL,
    patient_id TEXT,
    encounter_id TEXT,
    user_id TEXT,
    fhir_version TEXT NOT NULL DEFAULT '4.0.1',
    access_token_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'AUTHORIZED', 'TOKEN_EXCHANGED', 'FAILED')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_smart_iss ON smart_launch_sessions(iss);
CREATE INDEX IF NOT EXISTS idx_smart_patient ON smart_launch_sessions(patient_id);

-- ------------------------------------------------------------
-- 2. CDA / C-CDA IMPORTED DOCUMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cda_imported_documents (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    organization_id UUID,
    document_title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_organization TEXT NOT NULL,
    effective_time TIMESTAMPTZ,
    raw_xml TEXT NOT NULL,
    parsed_sections JSONB NOT NULL DEFAULT '{}'::jsonb,
    extracted_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    validation_warnings TEXT[] NOT NULL DEFAULT '{}',
    imported_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_cda_case ON cda_imported_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_cda_org ON cda_imported_documents(organization_id);

-- ------------------------------------------------------------
-- 3. IHE XDS.b REGISTRY METADATA ENTRIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ihe_xds_registry_entries (
    entry_uuid TEXT PRIMARY KEY,
    unique_id TEXT NOT NULL UNIQUE,
    patient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    format_code JSONB NOT NULL,
    type_code JSONB NOT NULL,
    class_code JSONB NOT NULL,
    confidentiality_code TEXT NOT NULL DEFAULT 'N',
    creation_time TEXT NOT NULL,
    repository_unique_id TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    hash_sha1 TEXT NOT NULL,
    availability_status TEXT NOT NULL CHECK (availability_status IN ('Approved', 'Deprecated')),
    author_person TEXT NOT NULL,
    author_institution TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_xds_patient ON ihe_xds_registry_entries(patient_id);

-- ------------------------------------------------------------
-- 4. WHO SMART GUIDELINES COMPLIANCE AUDITS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS who_smart_compliance_audits (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    organization_id UUID,
    overall_status TEXT NOT NULL CHECK (overall_status IN ('COMPLIANT', 'NEEDS_ATTENTION', 'NON_COMPLIANT')),
    compliance_percentage INTEGER NOT NULL,
    total_checks INTEGER NOT NULL,
    passed_checks INTEGER NOT NULL,
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    who_smart_version TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_who_case ON who_smart_compliance_audits(case_id);

-- ------------------------------------------------------------
-- 5. OFFLINE SYNC TRANSACTIONAL OUTBOX
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offline_sync_outbox (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    case_id TEXT NOT NULL,
    organization_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    retry_attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_case ON offline_sync_outbox(case_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON offline_sync_outbox(status);

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE smart_launch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cda_imported_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ihe_xds_registry_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE who_smart_compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_outbox ENABLE ROW LEVEL SECURITY;

-- Read policies for authenticated clinicians
CREATE POLICY p10_smart_read ON smart_launch_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p10_smart_insert ON smart_launch_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p10_cda_read ON cda_imported_documents
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_cda_insert ON cda_imported_documents
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_xds_read ON ihe_xds_registry_entries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p10_who_read ON who_smart_compliance_audits
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_outbox_read ON offline_sync_outbox
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p10_outbox_insert ON offline_sync_outbox
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

-- ------------------------------------------------------------
-- 7. SEED REGIONAL DEMO ENTRIES
-- ------------------------------------------------------------
INSERT INTO ihe_xds_registry_entries (
    entry_uuid, unique_id, patient_id, title, mime_type, format_code, type_code, class_code,
    confidentiality_code, creation_time, repository_unique_id, size_bytes, hash_sha1,
    availability_status, author_person, author_institution
) VALUES 
    ('urn:uuid:7d1b33e4-8521-4f47-8a19-4f36402d8471', '2.16.840.1.113883.19.5.99999.1.2026.0941',
     'syn-pat-00482^^^&2.16.840.1.113883.19.5&ISO', 'Referral & Continuity of Care Document (C-CDA)',
     'text/xml', '{"code": "urn:hl7-org:sdwg:ccda-structuredBody:2.1", "codingScheme": "1.3.6.1.4.1.19376.1.2.3", "displayName": "HL7 C-CDA Structured Body R2.1"}'::jsonb,
     '{"code": "34133-9", "codingScheme": "2.16.840.1.113883.6.1", "displayName": "Summarization of Episode Note"}'::jsonb,
     '{"code": "DOC", "codingScheme": "1.3.6.1.4.1.19376.1.2.7", "displayName": "Clinical Document"}'::jsonb,
     'N', '20260910143000', '1.3.6.1.4.1.21367.2011.2.3.101', 42104, 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
     'Approved', 'Dr. Kwame Asante, MD', 'Korle Bu Teaching Hospital')
ON CONFLICT (entry_uuid) DO NOTHING;
