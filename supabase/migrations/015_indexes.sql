-- ============================================================
-- 015_indexes.sql
-- Critical indexes for query performance across high-volume
-- clinical entities and relationships.
-- ============================================================

-- Cases and membership
create index if not exists idx_cases_patient on public.cases(patient_id);
create index if not exists idx_cases_organization on public.cases(organization_id);
create index if not exists idx_cases_status on public.cases(status);
create index if not exists idx_case_members_case on public.case_members(case_id);
create index if not exists idx_case_members_user on public.case_members(user_id);

-- Encounters & Patients
create index if not exists idx_patients_organization on public.patients(organization_id);
create index if not exists idx_encounters_patient on public.encounters(patient_id);
create index if not exists idx_encounters_organization on public.encounters(organization_id);

-- Clinical core
create index if not exists idx_observations_case on public.observations(case_id);
create index if not exists idx_observations_category on public.observations(case_id, category);
create index if not exists idx_findings_case on public.clinical_findings(case_id);
create index if not exists idx_findings_status on public.clinical_findings(case_id, status);
create index if not exists idx_hypotheses_case on public.hypotheses(case_id);
create index if not exists idx_hypothesis_findings_hyp on public.hypothesis_findings(hypothesis_id);
create index if not exists idx_hypothesis_findings_find on public.hypothesis_findings(finding_id);

-- Investigations & Reports
create index if not exists idx_investigations_case on public.investigations(case_id);
create index if not exists idx_investigations_status on public.investigations(status);
create index if not exists idx_investigation_results_inv on public.investigation_results(investigation_id);
create index if not exists idx_diagnostic_reports_case on public.diagnostic_reports(case_id);

-- Evidence
create index if not exists idx_evidence_links_case on public.evidence_links(case_id);
create index if not exists idx_evidence_links_hypothesis on public.evidence_links(hypothesis_id);
create index if not exists idx_evidence_sources_type on public.evidence_sources(source_type);

-- Nexus Intelligence
create index if not exists idx_assessments_case on public.nexus_assessments(case_id);
create index if not exists idx_nexus_findings_assessment on public.nexus_findings(assessment_id);
create index if not exists idx_nexus_recommendations_assessment on public.nexus_recommendations(assessment_id);
create index if not exists idx_reviews_assessment on public.reviews(assessment_id);

-- Governance & Safety
create index if not exists idx_decisions_case on public.decisions(case_id);
create index if not exists idx_safety_concerns_case on public.safety_concerns(case_id);
create index if not exists idx_safety_concerns_status on public.safety_concerns(case_id, status);
create index if not exists idx_tasks_case on public.tasks(case_id);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to, status);

-- Timeline & Audit
create index if not exists idx_timeline_case_time on public.timeline_events(case_id, occurred_at);
create index if not exists idx_audit_resource on public.audit_events(resource_type, resource_id);
create index if not exists idx_audit_organization on public.audit_events(organization_id, created_at);

-- Documents
create index if not exists idx_documents_case on public.documents(case_id);
create index if not exists idx_documents_org on public.documents(organization_id);
