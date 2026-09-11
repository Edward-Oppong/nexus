-- ============================================================
-- supabase/migrations/029_phase12_regulatory_compliance.sql
-- Phase 12: Regulatory & Compliance Database Schema
-- MDCG 2021-6, FDA PCCP Modification Protocols, GDPR/POPIA Sovereignty & FHIR Audit Exports
-- ============================================================

-- ------------------------------------------------------------
-- 1. REGULATORY COMPLIANCE AUDITS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regulatory_compliance_audits (
    id TEXT PRIMARY KEY,
    standard TEXT NOT NULL CHECK (standard IN ('MDCG_2021_6', 'EU_AI_ACT_HIGH_RISK', 'FDA_PCCP', 'GDPR_HEALTH')),
    target_workstation_version TEXT NOT NULL,
    classification_rule TEXT NOT NULL,
    overall_score NUMERIC(5, 2) NOT NULL,
    total_clauses INTEGER NOT NULL,
    compliant_count INTEGER NOT NULL,
    partially_compliant_count INTEGER NOT NULL,
    non_compliant_count INTEGER NOT NULL,
    clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
    audited_by TEXT NOT NULL,
    audited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_reg_audit_standard ON regulatory_compliance_audits(standard);
CREATE INDEX IF NOT EXISTS idx_reg_audit_time ON regulatory_compliance_audits(audited_at DESC);

-- ------------------------------------------------------------
-- 2. FDA PCCP MODIFICATION PROTOCOLS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fda_pccp_modifications (
    protocol_id TEXT PRIMARY KEY,
    modification_type TEXT NOT NULL,
    description TEXT NOT NULL,
    allowed_variance_range TEXT NOT NULL,
    actual_proposed_change TEXT NOT NULL,
    boundary_evaluation TEXT NOT NULL CHECK (boundary_evaluation IN (
        'WITHIN_AUTHORIZED_BOUNDS',
        'REQUIRES_INTERNAL_VALIDATION',
        'TRIGGERS_NEW_510K'
    )),
    verification_method TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    approval_status TEXT NOT NULL CHECK (approval_status IN ('APPROVED', 'PENDING_REVIEW', 'REJECTED')),
    regulatory_impact_rationale TEXT NOT NULL,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_pccp_type ON fda_pccp_modifications(modification_type);
CREATE INDEX IF NOT EXISTS idx_pccp_status ON fda_pccp_modifications(approval_status);

-- ------------------------------------------------------------
-- 3. PATIENT AI CONSENT RECORDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_consent_records (
    patient_id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    scopes JSONB NOT NULL DEFAULT '{}'::jsonb,
    consented_by TEXT NOT NULL,
    consent_recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    expiration_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_consent_patient ON patient_consent_records(patient_id);

-- ------------------------------------------------------------
-- 4. DATA SUBJECT RIGHTS (DSR) REQUESTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN (
        'RIGHT_TO_ACCESS',
        'RIGHT_TO_RECTIFICATION',
        'RIGHT_TO_ERASURE',
        'RIGHT_TO_RESTRICTION'
    )),
    jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('EU_GDPR', 'ZA_POPIA', 'GH_DPA', 'US_HIPAA')),
    status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'IDENTITY_VERIFIED', 'PROCESSING', 'FULFILLED', 'REJECTED')),
    request_details TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    fulfilled_at TIMESTAMPTZ,
    certified_by TEXT,
    audit_evidence_ref TEXT
);

CREATE INDEX IF NOT EXISTS idx_dsr_patient ON data_subject_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_jurisdiction ON data_subject_requests(jurisdiction);

-- ------------------------------------------------------------
-- 5. REGULATORY AUDIT EXPORT MANIFESTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regulatory_audit_exports (
    export_id TEXT PRIMARY KEY,
    target_authority TEXT NOT NULL,
    format TEXT NOT NULL,
    date_range_start TIMESTAMPTZ NOT NULL,
    date_range_end TIMESTAMPTZ NOT NULL,
    total_event_count INTEGER NOT NULL,
    sha256_checksum TEXT NOT NULL,
    exported_by TEXT NOT NULL,
    exported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_export_target ON regulatory_audit_exports(target_authority);
CREATE INDEX IF NOT EXISTS idx_audit_export_time ON regulatory_audit_exports(exported_at DESC);

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE regulatory_compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE fda_pccp_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_audit_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY p12_audits_select ON regulatory_compliance_audits
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_audits_insert ON regulatory_compliance_audits
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_pccp_select ON fda_pccp_modifications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_pccp_insert ON fda_pccp_modifications
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_pccp_update ON fda_pccp_modifications
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p12_consent_select ON patient_consent_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_consent_insert ON patient_consent_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_consent_update ON patient_consent_records
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p12_dsr_select ON data_subject_requests
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_dsr_insert ON data_subject_requests
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p12_dsr_update ON data_subject_requests
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p12_exports_select ON regulatory_audit_exports
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p12_exports_insert ON regulatory_audit_exports
    FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. SEED REGULATORY RECORDS
-- ------------------------------------------------------------
INSERT INTO fda_pccp_modifications (
    protocol_id, modification_type, description, allowed_variance_range,
    actual_proposed_change, boundary_evaluation, verification_method,
    acceptance_criteria, approval_status, regulatory_impact_rationale,
    reviewed_by, reviewed_at
) VALUES
(
    'AMP-001',
    'PROMPT_TEMPLATE_OPTIMIZATION',
    'Refinements to clinical reasoning prompt templates for differential synthesis.',
    'Wording updates preserving strict JSON output schema and non-numeric probability constraint.',
    'Incorporate explicit Duke Minor vascular criteria guidance into system prompt.',
    'WITHIN_AUTHORIZED_BOUNDS',
    'Regression testing against 200 synthetic reference case trajectories with automated schema validation.',
    '100% schema conformance; no regression on primary differential recall.',
    'APPROVED',
    'Does not alter intended use or clinical output format. Within pre-authorized modification boundaries.',
    'Dr. Sarah Lin, MD (Regulatory Clinical Lead)',
    '2026-09-02T10:15:00Z'
),
(
    'AMP-002',
    'REASONING_TEMPERATURE_TUNING',
    'Adjusting LLM decoding temperature for diagnostic reasoning stability.',
    'Temperature range 0.00 to 0.25; top-p 0.90 to 0.98.',
    'Lower primary reasoning temperature from 0.20 to 0.12 to reduce candidate hypothesis variance.',
    'WITHIN_AUTHORIZED_BOUNDS',
    'Monte Carlo temperature stability trial across 50 clinical edge cases.',
    'Hallucination rate remains under 2.0%; zero omitted high-risk safety flags.',
    'APPROVED',
    'Maintains conservative deterministic generation bounds. Well within authorized parameters.',
    'Dr. Marcus Vance, Chief Medical Officer',
    '2026-09-05T14:30:00Z'
),
(
    'AMP-003',
    'WEIGHT_QUANTIZATION_CHANGE',
    'Quantization optimization for reduced inference latency on edge nodes.',
    'Quantization format change (FP16 -> AWQ-4bit / GGUF-Q8) with MedQA degradation < 1.5%.',
    'Deploy AWQ-4bit quantized checkpoint for Meditron-70b auxiliary model.',
    'REQUIRES_INTERNAL_VALIDATION',
    'Side-by-side A/B assessment against full FP16 baseline across 100 benchmark clinical vignettes.',
    'Concordance score > 0.90; MedQA benchmark delta <= 1.0%.',
    'PENDING_REVIEW',
    'Permissible within PCCP upon verified completion of full A/B concordance evaluation.',
    NULL,
    NULL
)
ON CONFLICT (protocol_id) DO NOTHING;

INSERT INTO patient_consent_records (
    patient_id, patient_name, consent_given, scopes, consented_by, consent_recorded_at
) VALUES
(
    'syn-pat-00482',
    'Amara Okafor',
    true,
    '{"realTimeDiagnosticAssistance": true, "retrospectiveQualityAudit": true, "deIdentifiedModelTraining": false, "crossInstitutionalResearch": true}'::jsonb,
    'Dr. Kwame Asante, MD',
    '2026-09-08T08:30:00Z'
)
ON CONFLICT (patient_id) DO NOTHING;

INSERT INTO data_subject_requests (
    id, patient_id, patient_name, request_type, jurisdiction, status,
    request_details, requested_at, fulfilled_at, certified_by, audit_evidence_ref
) VALUES
(
    'DSR-2026-001',
    'syn-pat-00482',
    'Amara Okafor',
    'RIGHT_TO_ACCESS',
    'GH_DPA',
    'FULFILLED',
    'Full export of all AI diagnostic inferences, clinical reasoning traces, and audit logs.',
    '2026-09-09T14:20:00Z',
    '2026-09-09T16:00:00Z',
    'Legal & Privacy Officer (K. Mensah)',
    'export-dsr-482-signed.zip (SHA-256 verified)'
)
ON CONFLICT (id) DO NOTHING;
