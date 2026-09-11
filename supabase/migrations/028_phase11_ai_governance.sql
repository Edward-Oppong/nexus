-- ============================================================
-- supabase/migrations/028_phase11_ai_governance.sql
-- Phase 11: AI Governance, Model Management, A/B Testing & Explainability Schema
-- Tracks Model Versions, A/B Adjudication, Human Feedback / DPO, and Explainability Cache
-- ============================================================

-- ------------------------------------------------------------
-- 1. AI MODEL REGISTRY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_model_registry (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    family TEXT NOT NULL,
    parameters_billion NUMERIC(6, 1) NOT NULL,
    context_window_tokens INTEGER NOT NULL,
    quantization TEXT NOT NULL,
    deployment_status TEXT NOT NULL CHECK (deployment_status IN ('PRODUCTION_PRIMARY', 'PRODUCTION_CANARY', 'EVALUATION', 'SHADOW', 'DEPRECATED')),
    medqa_score NUMERIC(5, 2) NOT NULL,
    mmlu_clinical_score NUMERIC(5, 2) NOT NULL,
    hallucination_rate NUMERIC(5, 2) NOT NULL,
    median_latency_ms INTEGER NOT NULL,
    training_cutoff_date DATE NOT NULL,
    license TEXT NOT NULL,
    is_fine_tuned BOOLEAN NOT NULL DEFAULT true,
    compliance_tags TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_model_registry_status ON ai_model_registry(deployment_status);
CREATE INDEX IF NOT EXISTS idx_model_registry_family ON ai_model_registry(family);

-- ------------------------------------------------------------
-- 2. A/B COMPARISON SESSIONS & ADJUDICATION
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_comparison_sessions (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    prompt_template_id TEXT NOT NULL,
    model_a_id TEXT NOT NULL REFERENCES ai_model_registry(id) ON DELETE CASCADE,
    model_b_id TEXT NOT NULL REFERENCES ai_model_registry(id) ON DELETE CASCADE,
    model_a_output JSONB NOT NULL,
    model_b_output JSONB NOT NULL,
    concordance_score NUMERIC(5, 4) NOT NULL,
    discrepancy_count INTEGER NOT NULL DEFAULT 0,
    clinician_preference TEXT CHECK (clinician_preference IN ('MODEL_A', 'MODEL_B', 'EQUIVALENT', 'BOTH_UNSATISFACTORY')),
    clinician_adjudication_notes TEXT,
    evaluator_user_id UUID,
    evaluator_persona TEXT,
    adjudicated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ab_case ON ab_comparison_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_ab_models ON ab_comparison_sessions(model_a_id, model_b_id);

-- ------------------------------------------------------------
-- 3. HUMAN FEEDBACK & DPO CURATION RECORDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS human_feedback_records (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    model_id TEXT NOT NULL REFERENCES ai_model_registry(id) ON DELETE CASCADE,
    hypothesis_id TEXT,
    finding_id TEXT,
    error_taxonomy TEXT NOT NULL CHECK (error_taxonomy IN (
        'HALLUCINATED_FINDING',
        'UNSUPPORTED_LEAP',
        'OVERCONFIDENCE',
        'CONTRADICTION_MISSED',
        'SEVERITY_UNDERESTIMATION',
        'OMITTED_DIFFERENTIAL',
        'IRRELEVANT_INVESTIGATION',
        'TERMINOLOGY_INACCURACY'
    )),
    original_claim TEXT NOT NULL,
    clinician_correction TEXT NOT NULL,
    clinician_rationale TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL_SAFETY')),
    dpo_export_eligible BOOLEAN NOT NULL DEFAULT true,
    clinician_id UUID,
    clinician_role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_feedback_model ON human_feedback_records(model_id);
CREATE INDEX IF NOT EXISTS idx_feedback_case ON human_feedback_records(case_id);
CREATE INDEX IF NOT EXISTS idx_feedback_dpo ON human_feedback_records(dpo_export_eligible);

-- ------------------------------------------------------------
-- 4. HYPOTHESIS EXPLAINABILITY & ATTRIBUTION CACHE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hypothesis_explainability_cache (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    hypothesis_id TEXT NOT NULL,
    base_prior_probability NUMERIC(5, 4) NOT NULL,
    posterior_probability NUMERIC(5, 4) NOT NULL,
    attributions JSONB NOT NULL DEFAULT '[]'::jsonb,
    counterfactuals JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_explain_case_hyp ON hypothesis_explainability_cache(case_id, hypothesis_id);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE ai_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_comparison_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypothesis_explainability_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY p11_model_registry_select ON ai_model_registry
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p11_ab_comparison_select ON ab_comparison_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p11_ab_comparison_insert ON ab_comparison_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p11_ab_comparison_update ON ab_comparison_sessions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY p11_feedback_select ON human_feedback_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p11_feedback_insert ON human_feedback_records
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY p11_explain_select ON hypothesis_explainability_cache
    FOR SELECT TO authenticated USING (true);

-- ------------------------------------------------------------
-- 6. SEED FOUNDATION MODELS & DEMO GOVERNANCE DATA
-- ------------------------------------------------------------
INSERT INTO ai_model_registry (
    id, name, version, family, parameters_billion, context_window_tokens,
    quantization, deployment_status, medqa_score, mmlu_clinical_score,
    hallucination_rate, median_latency_ms, training_cutoff_date,
    license, is_fine_tuned, compliance_tags, description
) VALUES
(
    'nexus-clinical-70b-v2.1',
    'Nexus Clinical Reasoning LLM',
    '2.1.0',
    'Llama-3-NexusFineTune',
    70.0,
    131072,
    'FP16',
    'PRODUCTION_PRIMARY',
    91.4,
    88.7,
    1.8,
    420,
    '2026-03-01',
    'Nexus Enterprise Clinical License',
    true,
    ARRAY['HIPAA', 'GDPR-Health', 'FDA-SaMD-Class-II-Ready', 'CE-MDR'],
    'Flagship diagnostic reasoning foundation model fine-tuned on verified multi-specialty clinical trajectories.'
),
(
    'meditron-70b-v1.2',
    'Meditron Clinical Foundation',
    '1.2.4',
    'Meditron-EPFL',
    70.0,
    32768,
    'AWQ-4bit',
    'PRODUCTION_CANARY',
    86.8,
    84.2,
    3.2,
    310,
    '2025-11-15',
    'Apache-2.0',
    false,
    ARRAY['HIPAA', 'Research-Approved'],
    'Open-source clinical foundational benchmark model curated by EPFL for medical literature reasoning.'
),
(
    'clinical-camel-70b-v1.0',
    'ClinicalCamel Diagnostic Engine',
    '1.0.8',
    'Camel-Health',
    70.0,
    32768,
    'FP16',
    'EVALUATION',
    83.5,
    81.9,
    4.5,
    580,
    '2025-08-01',
    'Non-Commercial Clinical Research',
    true,
    ARRAY['Research-Only'],
    'Dialogue-specialized clinical consultation model benchmarked for differential diagnostic generation.'
),
(
    'nexus-lite-8b-v2.0',
    'Nexus Edge Diagnostic Lite',
    '2.0.1',
    'Llama-3.1-EdgeNexus',
    8.0,
    65536,
    'GGUF-Q8',
    'SHADOW',
    79.6,
    77.3,
    4.1,
    95,
    '2026-01-10',
    'Nexus Edge License',
    true,
    ARRAY['Offline-Capable', 'Edge-Optimized'],
    'Ultra-low latency edge model for real-time mobile and local bedside clinical decision support.'
)
ON CONFLICT (id) DO UPDATE SET
    medqa_score = EXCLUDED.medqa_score,
    deployment_status = EXCLUDED.deployment_status,
    updated_at = timezone('utc', now());

INSERT INTO human_feedback_records (
    id, case_id, model_id, hypothesis_id, finding_id, error_taxonomy,
    original_claim, clinician_correction, clinician_rationale,
    severity, dpo_export_eligible
) VALUES
(
    'fb-001',
    'case-10482',
    'nexus-clinical-70b-v2.1',
    'hyp-1',
    'f-002',
    'UNSUPPORTED_LEAP',
    'Holosystolic murmur at cardiac apex definitively indicates acute mitral valve leaflet perforation.',
    'Murmur stigmata confirms severe mitral regurgitation; leaflet perforation requires TEE visualization to verify anatomical defect.',
    'Avoid asserting definitive anatomical perforation without structural echocardiographic confirmation.',
    'MODERATE',
    true
),
(
    'fb-002',
    'case-10482',
    'meditron-70b-v1.2',
    'hyp-2',
    'f-004',
    'OVERCONFIDENCE',
    'Presence of elevated ESR rules out viral myocarditis with 99% certainty.',
    'Elevated ESR is non-specific inflammatory marker elevated in both bacterial endocarditis and myocarditis.',
    'Model inflated diagnostic certainty of a non-specific acute phase reactant.',
    'HIGH',
    true
)
ON CONFLICT (id) DO NOTHING;
