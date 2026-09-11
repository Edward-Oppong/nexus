-- ============================================================
-- supabase/migrations/026_phase9_clinical_decision_rules.sql
-- Phase 9: Clinical Decision Rules Engine, Pharmacotherapy Dosing,
-- Drug-Drug Interactions (RxNorm), and Allergy Cross-Reactivity Schema
-- ============================================================

-- ------------------------------------------------------------
-- 1. CLINICAL DECISION RULES DEFINITIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_decision_rules (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('DIAGNOSTIC_CRITERIA', 'PROGNOSTIC_SCORE', 'SEVERITY_INDEX', 'CLINICAL_TRIGGER')),
    specialty TEXT NOT NULL,
    guideline_citation TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    evaluation_logic TEXT NOT NULL CHECK (evaluation_logic IN ('SUM_POINTS', 'MAJOR_MINOR_CRITERIA', 'THRESHOLD_MATCH')),
    criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------
-- 2. CLINICAL RULE EXECUTIONS (AUDIT LOG FOR CDS RUNS)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_rule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id TEXT NOT NULL REFERENCES clinical_decision_rules(id) ON DELETE CASCADE,
    case_id TEXT,
    organization_id UUID,
    evaluated_by UUID,
    score NUMERIC,
    major_count INTEGER,
    minor_count INTEGER,
    matched_tier_label TEXT NOT NULL,
    matched_risk_severity TEXT NOT NULL CHECK (matched_risk_severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    criteria_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    clinical_summary TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_rule_exec_case ON clinical_rule_executions(case_id);
CREATE INDEX IF NOT EXISTS idx_rule_exec_org ON clinical_rule_executions(organization_id);

-- ------------------------------------------------------------
-- 3. DRUG-DRUG INTERACTIONS (RxNorm)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drug_interactions (
    id TEXT PRIMARY KEY,
    drug_a_name TEXT NOT NULL,
    drug_a_rxnorm TEXT NOT NULL,
    drug_b_name TEXT NOT NULL,
    drug_b_rxnorm TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('CONTRAINDICATED', 'MAJOR', 'MODERATE', 'MINOR')),
    mechanism TEXT NOT NULL,
    clinical_consequence TEXT NOT NULL,
    evidence_level TEXT NOT NULL CHECK (evidence_level IN ('DEFINITIVE', 'PROBABLE', 'SUSPECTED')),
    management_recommendation TEXT NOT NULL,
    guideline_reference TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ddi_rxnorm_a ON drug_interactions(drug_a_rxnorm);
CREATE INDEX IF NOT EXISTS idx_ddi_rxnorm_b ON drug_interactions(drug_b_rxnorm);

-- ------------------------------------------------------------
-- 4. ALLERGY CROSS-REACTIVITY RULES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allergy_cross_reactivities (
    id TEXT PRIMARY KEY,
    allergen_class TEXT NOT NULL,
    offending_agent TEXT NOT NULL,
    target_agent TEXT NOT NULL,
    target_drug_class TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('CONTRAINDICATED', 'HIGH_RISK', 'MODERATE_RISK', 'LOW_RISK', 'SAFE_ALTERNATIVE')),
    estimated_cross_reactivity_percent TEXT NOT NULL,
    immunological_mechanism TEXT NOT NULL,
    clinical_guidance TEXT NOT NULL,
    recommended_action TEXT NOT NULL CHECK (recommended_action IN ('AVOID', 'USE_WITH_MONITORING', 'SAFE_TO_ADMINISTER', 'SKIN_TEST_FIRST')),
    safe_alternatives TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_allergy_class ON allergy_cross_reactivities(allergen_class);

-- ------------------------------------------------------------
-- 5. PATIENT PHARMACOTHERAPY & RENAL DOSING ASSESSMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_dosing_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id TEXT,
    organization_id UUID,
    patient_id TEXT,
    drug_id TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    patient_metrics JSONB NOT NULL,
    renal_metrics JSONB NOT NULL,
    calculated_loading_dose TEXT,
    calculated_maintenance_dose TEXT NOT NULL,
    calculated_interval TEXT NOT NULL,
    monitoring_plan TEXT NOT NULL,
    safety_alerts TEXT[] NOT NULL DEFAULT '{}',
    calculated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_dosing_case ON patient_dosing_calculations(case_id);
CREATE INDEX IF NOT EXISTS idx_dosing_org ON patient_dosing_calculations(organization_id);

-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE clinical_decision_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_cross_reactivities ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_dosing_calculations ENABLE ROW LEVEL SECURITY;

-- Knowledge base tables are globally readable by all authenticated clinicians
CREATE POLICY p9_rules_read ON clinical_decision_rules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p9_ddi_read ON drug_interactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY p9_allergy_read ON allergy_cross_reactivities
    FOR SELECT TO authenticated USING (true);

-- Execution & calculation records are scoped by organization
CREATE POLICY p9_rule_exec_select ON clinical_rule_executions
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p9_rule_exec_insert ON clinical_rule_executions
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p9_dosing_select ON patient_dosing_calculations
    FOR SELECT TO authenticated USING (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

CREATE POLICY p9_dosing_insert ON patient_dosing_calculations
    FOR INSERT TO authenticated WITH CHECK (
        organization_id IS NULL OR user_is_member_of(organization_id)
    );

-- ------------------------------------------------------------
-- 7. SEED INITIAL CLINICAL DATA
-- ------------------------------------------------------------
INSERT INTO clinical_decision_rules (id, code, title, short_description, category, specialty, guideline_citation, version, evaluation_logic)
VALUES 
    ('rule-duke-endocarditis', 'DUKE_IE_2023', 'Modified Duke Criteria for Infective Endocarditis', 'Stratifies major and minor criteria for infective endocarditis.', 'DIAGNOSTIC_CRITERIA', 'Infectious Disease / Cardiology', '2023 Duke-ISCVID Criteria for Infective Endocarditis; Clin Infect Dis 2023.', '2023.1', 'MAJOR_MINOR_CRITERIA'),
    ('rule-curb-65', 'CURB_65', 'CURB-65 Score for Pneumonia Severity', 'Stratifies mortality risk in community-acquired pneumonia.', 'SEVERITY_INDEX', 'Pulmonology / Emergency Medicine', 'Lim WS, et al. Defining community acquired pneumonia severity on presentation to hospital. Thorax. 2003.', '2003.1', 'SUM_POINTS'),
    ('rule-wells-pe', 'WELLS_PE', 'Wells Criteria for Pulmonary Embolism', 'Pre-test clinical probability of pulmonary embolism.', 'PROGNOSTIC_SCORE', 'Vascular Medicine / Pulmonology / ER', 'Wells PS, et al. Thromb Haemost. 2000.', '2000.2', 'SUM_POINTS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO drug_interactions (id, drug_a_name, drug_a_rxnorm, drug_b_name, drug_b_rxnorm, severity, mechanism, clinical_consequence, evidence_level, management_recommendation, guideline_reference)
VALUES
    ('ddi-vanc-gent', 'Vancomycin', '11124', 'Gentamicin', '4734', 'MAJOR', 'Additive proximal tubular necrosis and hair cell ototoxicity.', 'Marked increase in acute kidney injury incidence and irreversible vestibulotoxicity.', 'DEFINITIVE', 'Limit synergy to 2-3 days; monitor daily serum creatinine and trough levels.', 'AHA 2015 Infective Endocarditis Guidelines; ASHP/IDSA 2020.'),
    ('ddi-warf-amiodarone', 'Warfarin', '11289', 'Amiodarone', '703', 'MAJOR', 'Inhibition of CYP2C9 and CYP1A2 by amiodarone impairing S-warfarin clearance.', 'Dramatic elevation in INR with substantial risk of life-threatening hemorrhage.', 'DEFINITIVE', 'Proactively reduce warfarin dose by 33-50% upon initiating amiodarone.', 'CHEST 2021 Antithrombotic Guidelines.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO allergy_cross_reactivities (id, allergen_class, offending_agent, target_agent, target_drug_class, risk_level, estimated_cross_reactivity_percent, immunological_mechanism, clinical_guidance, recommended_action, safe_alternatives)
VALUES
    ('allergy-pen-amox-amp', 'PENICILLIN', 'Penicillin / Amoxicillin', 'Ampicillin', 'Aminopenicillin', 'CONTRAINDICATED', '100%', 'Identical 6-APA nucleus and aminopenicillin epitopes.', 'Direct class cross-reactivity. Contraindicated in confirmed penicillin allergy.', 'AVOID', ARRAY['Vancomycin', 'Daptomycin', 'Aztreonam', 'Levofloxacin']),
    ('allergy-pen-ceph-3rd', 'PENICILLIN', 'Penicillin', 'Ceftriaxone / Cefotaxime / Cefepime', '3rd / 4th Generation Cephalosporin', 'LOW_RISK', '< 1%', 'Distinct 7-ACA core and methoxyimino R1 side chains.', 'Safe in non-severe penicillin allergy and under observation.', 'SAFE_TO_ADMINISTER', ARRAY['Ceftriaxone', 'Cefepime', 'Vancomycin', 'Aztreonam'])
ON CONFLICT (id) DO NOTHING;
