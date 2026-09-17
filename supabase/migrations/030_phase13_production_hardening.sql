-- ============================================================
-- supabase/migrations/030_phase13_production_hardening.sql
-- Phase 13: Enterprise Production Hardening Database Schema
-- DICOM Imaging, HL7 v2.x Hospital Messaging, Knowledge Graph & Collaboration
-- ============================================================

-- ------------------------------------------------------------
-- 1. DICOM STUDIES & SERIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dicom_studies (
    study_instance_uid TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    accession_number TEXT NOT NULL,
    study_date DATE NOT NULL,
    study_time TIME NOT NULL,
    modalities_in_study TEXT[] NOT NULL,
    study_description TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    referring_physician_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_dicom_patient ON dicom_studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_dicom_accession ON dicom_studies(accession_number);

CREATE TABLE IF NOT EXISTS dicom_series (
    series_instance_uid TEXT PRIMARY KEY,
    study_instance_uid TEXT NOT NULL REFERENCES dicom_studies(study_instance_uid) ON DELETE CASCADE,
    series_number INTEGER NOT NULL,
    modality TEXT NOT NULL,
    series_description TEXT NOT NULL,
    body_part_examined TEXT NOT NULL,
    number_of_instances INTEGER NOT NULL DEFAULT 1,
    instances_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_series_study ON dicom_series(study_instance_uid);

-- ------------------------------------------------------------
-- 2. HL7 V2.x INCOMING MESSAGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hl7v2_incoming_messages (
    id TEXT PRIMARY KEY,
    message_type TEXT NOT NULL,
    sending_application TEXT NOT NULL,
    sending_facility TEXT NOT NULL,
    receiving_application TEXT NOT NULL,
    receiving_facility TEXT NOT NULL,
    message_datetime TIMESTAMPTZ NOT NULL,
    message_control_id TEXT NOT NULL,
    processing_id TEXT NOT NULL DEFAULT 'P',
    version_id TEXT NOT NULL DEFAULT '2.5.1',
    raw_er7_text TEXT NOT NULL,
    parsed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_hl7_control ON hl7v2_incoming_messages(message_control_id);
CREATE INDEX IF NOT EXISTS idx_hl7_type ON hl7v2_incoming_messages(message_type);

-- ------------------------------------------------------------
-- 3. CLINICAL KNOWLEDGE GRAPH (UMLS & SNOMED CT)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_knowledge_nodes (
    cui TEXT PRIMARY KEY,
    snomed_code TEXT,
    preferred_term TEXT NOT NULL,
    node_type TEXT NOT NULL,
    definition TEXT,
    synonyms TEXT[] NOT NULL DEFAULT '{}',
    semantic_category TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kg_snomed ON clinical_knowledge_nodes(snomed_code);

CREATE TABLE IF NOT EXISTS clinical_knowledge_edges (
    id TEXT PRIMARY KEY,
    source_cui TEXT NOT NULL REFERENCES clinical_knowledge_nodes(cui) ON DELETE CASCADE,
    target_cui TEXT NOT NULL REFERENCES clinical_knowledge_nodes(cui) ON DELETE CASCADE,
    predicate TEXT NOT NULL,
    evidence_strength TEXT NOT NULL,
    clinical_mechanism TEXT NOT NULL,
    reference_pmids TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_kg_source ON clinical_knowledge_edges(source_cui);
CREATE INDEX IF NOT EXISTS idx_kg_target ON clinical_knowledge_edges(target_cui);

-- ------------------------------------------------------------
-- 4. ACTIVE COLLABORATIVE SESSIONS (PRESENCE)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS active_collaborative_sessions (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    user_id UUID,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#2563EB',
    initials TEXT NOT NULL,
    current_tab TEXT NOT NULL DEFAULT 'reasoning',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_collab_case ON active_collaborative_sessions(case_id);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE dicom_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicom_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE hl7v2_incoming_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_collaborative_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY p13_dicom_studies_select ON dicom_studies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_dicom_series_select ON dicom_series
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_hl7_select ON hl7v2_incoming_messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_hl7_insert ON hl7v2_incoming_messages
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p13_kg_nodes_select ON clinical_knowledge_nodes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_kg_edges_select ON clinical_knowledge_edges
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_collab_select ON active_collaborative_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p13_collab_all ON active_collaborative_sessions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. SEED DICOM & KNOWLEDGE GRAPH DATA
-- ------------------------------------------------------------
INSERT INTO dicom_studies (
    study_instance_uid, patient_id, patient_name, accession_number,
    study_date, study_time, modalities_in_study, study_description,
    institution_name, referring_physician_name
) VALUES (
    '1.2.840.113619.2.55.3.2831154.20260910.1048201',
    'syn-pat-00482',
    'Okafor^Amara',
    'ACC-2026-TEE-0482',
    '2026-09-10',
    '11:30:00',
    ARRAY['US'],
    'TEE (Transesophageal Echocardiography) Comprehensive Diagnostic Protocol',
    'Korle Bu Teaching Hospital / Heart & Vascular Institute',
    'Dr. Kwame Asante, MD'
) ON CONFLICT (study_instance_uid) DO NOTHING;

INSERT INTO clinical_knowledge_nodes (cui, snomed_code, preferred_term, node_type, definition, synonyms, semantic_category)
VALUES
('C0038397', '115329001', 'Streptococcus viridans group', 'ORGANISM', 'Commensal oral streptococci with affinity for damaged endocardial surfaces.', ARRAY['Viridans streptococci'], 'Bacterium'),
('C0011849', '301011002', 'Bacteremia', 'FINDING', 'Presence of viable bacteria circulating within the bloodstream.', ARRAY['Bacterial bloodstream infection'], 'Pathologic Finding'),
('C0155668', '277472004', 'Endocardial Vegetation', 'FINDING', 'Amorphous mass composed of fibrin, platelets, microbial colonies, and sparse inflammatory cells on valve leaflets.', ARRAY['Valvular vegetation'], 'Pathologic Finding'),
('C0014144', '301011002', 'Infective Endocarditis (Subacute Bacterial)', 'DISEASE_OR_SYNDROME', 'Microbial infection of the endocardial surface of the heart, characterized by valvular vegetations.', ARRAY['Subacute bacterial endocarditis', 'SBE'], 'Disease or Syndrome'),
('C0026266', '48724000', 'Mitral Valve Regurgitation', 'FINDING', 'Retrograde blood flow from left ventricle into left atrium during ventricular systole.', ARRAY['Mitral insufficiency'], 'Pathologic Function')
ON CONFLICT (cui) DO NOTHING;

INSERT INTO clinical_knowledge_edges (id, source_cui, target_cui, predicate, evidence_strength, clinical_mechanism, reference_pmids)
VALUES
('edge-01', 'C0038397', 'C0011849', 'CAUSES', 'DEFINITIVE', 'Transient mucosal breach during dental manipulation allows oral viridans flora into systemic circulation.', ARRAY['26377488']),
('edge-02', 'C0011849', 'C0155668', 'CAUSES', 'DEFINITIVE', 'Circulating bacteria adhere to sterile platelet-fibrin thrombi on pre-damaged endocardial surfaces.', ARRAY['15944423']),
('edge-03', 'C0155668', 'C0014144', 'MANIFESTATION_OF', 'DEFINITIVE', 'Valvular vegetation with persistent bacteremia establishes diagnostic endocarditis.', ARRAY['10774614']),
('edge-04', 'C0155668', 'C0026266', 'CAUSES', 'DEFINITIVE', 'Mechanical coaptation failure and leaflet perforation produce regurgitant jet.', ARRAY['28434756'])
ON CONFLICT (id) DO NOTHING;
