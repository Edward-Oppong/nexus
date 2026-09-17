-- ============================================================
-- 018_seed_demo_data.sql
-- Canonical synthetic demo data for Nexus Clinical Workstation.
-- All data points are explicitly marked: SYNTHETIC DEMO DATA.
-- Contains:
-- 1. Standard Permissions and Role Assignments
-- 2. Organization: Nexus Teaching Hospital [DEMO]
-- 3. Demo Personas (Clinician, Reviewer, Nurse, Lab, Admin)
-- 4. Patients: A (Respiratory/Sepsis), B (Cardiac), C (Renal)
-- 5. Cases: CASE-10482 (Primary Demo), CASE-10483, CASE-10484
-- 6. Clinical Observations, Findings, Hypotheses, Evidence Links
-- ============================================================

-- ----------------------------------------------------------
-- 1. Standard Permissions
-- ----------------------------------------------------------
insert into public.permissions (id, code, description) values
  ('a0000001-0000-0000-0000-000000000001', 'case.view', 'View case details and history'),
  ('a0000001-0000-0000-0000-000000000002', 'case.create', 'Open new clinical case'),
  ('a0000001-0000-0000-0000-000000000003', 'case.edit', 'Modify case parameters and status'),
  ('a0000001-0000-0000-0000-000000000004', 'case.close', 'Finalize and close a case'),
  ('a0000001-0000-0000-0000-000000000005', 'finding.create', 'Record new clinical finding'),
  ('a0000001-0000-0000-0000-000000000006', 'finding.edit', 'Edit recorded clinical finding'),
  ('a0000001-0000-0000-0000-000000000007', 'finding.verify', 'Formally verify a clinical finding'),
  ('a0000001-0000-0000-0000-000000000008', 'investigation.request', 'Order lab or imaging investigation'),
  ('a0000001-0000-0000-0000-000000000009', 'investigation.view', 'View ordered investigations and reports'),
  ('a0000001-0000-0000-0000-000000000010', 'investigation.result.create', 'Upload or enter investigation results'),
  ('a0000001-0000-0000-0000-000000000011', 'nexus.review', 'Access Nexus intelligence and conduct review'),
  ('a0000001-0000-0000-0000-000000000012', 'nexus.accept', 'Accept an AI suggestion or finding'),
  ('a0000001-0000-0000-0000-000000000013', 'nexus.edit', 'Edit an AI suggestion prior to accepting'),
  ('a0000001-0000-0000-0000-000000000014', 'nexus.reject', 'Reject an AI suggestion with mandatory rationale'),
  ('a0000001-0000-0000-0000-000000000015', 'decision.create', 'Record authoritative clinician decision'),
  ('a0000001-0000-0000-0000-000000000016', 'decision.amend', 'Amend an existing clinical decision'),
  ('a0000001-0000-0000-0000-000000000017', 'safety.view', 'View safety alerts and contradictions'),
  ('a0000001-0000-0000-0000-000000000018', 'safety.resolve', 'Acknowledge or resolve safety concerns'),
  ('a0000001-0000-0000-0000-000000000019', 'team.manage', 'Assign and reassign case team members'),
  ('a0000001-0000-0000-0000-000000000020', 'users.manage', 'Manage organization member accounts'),
  ('a0000001-0000-0000-0000-000000000021', 'organization.manage', 'Configure organization settings'),
  ('a0000001-0000-0000-0000-000000000022', 'audit.view', 'Inspect immutable audit logs')
on conflict (code) do nothing;

-- ----------------------------------------------------------
-- 2. Standard Roles
-- ----------------------------------------------------------
insert into public.roles (id, name, description) values
  ('b0000001-0000-0000-0000-000000000001', 'ADMINISTRATOR', 'Full system and organizational governance access'),
  ('b0000001-0000-0000-0000-000000000002', 'CLINICIAN', 'Attending physician: orders, decisions, case management'),
  ('b0000001-0000-0000-0000-000000000003', 'REVIEWER', 'Senior specialist or consultant with review authority'),
  ('b0000001-0000-0000-0000-000000000004', 'NURSE', 'Clinical observation logging, vitals recording, care tasks'),
  ('b0000001-0000-0000-0000-000000000005', 'LABORATORY', 'Diagnostic test processing and result entry')
on conflict (name) do nothing;

-- Grant permissions to CLINICIAN
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'CLINICIAN'
  and p.code in (
    'case.view', 'case.create', 'case.edit', 'case.close',
    'finding.create', 'finding.edit', 'finding.verify',
    'investigation.request', 'investigation.view',
    'nexus.review', 'nexus.accept', 'nexus.edit', 'nexus.reject',
    'decision.create', 'decision.amend',
    'safety.view', 'safety.resolve', 'team.manage'
  )
on conflict do nothing;

-- Grant permissions to REVIEWER
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'REVIEWER'
  and p.code in (
    'case.view', 'finding.verify', 'investigation.view',
    'nexus.review', 'nexus.accept', 'nexus.edit', 'nexus.reject',
    'decision.create', 'decision.amend', 'safety.view', 'safety.resolve', 'audit.view'
  )
on conflict do nothing;

-- Grant permissions to ADMINISTRATOR
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'ADMINISTRATOR'
on conflict do nothing;

-- ----------------------------------------------------------
-- 3. Demo Organization
-- ----------------------------------------------------------
insert into public.organizations (id, name, organization_type, country_code, timezone, is_active)
values (
  'c0000001-0000-0000-0000-000000000001',
  'Nexus Teaching Hospital [DEMO]',
  'DEMO_ACADEMIC_MEDICAL_CENTER',
  'GB',
  'Europe/London',
  true
)
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 4. Auth Users & Profiles (Deterministic IDs for Demo)
-- ----------------------------------------------------------
-- Seed into auth.users if available
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      ('d0000001-0000-0000-0000-000000000001', 'dr.sarah.chen@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"Dr. Sarah Chen"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000002', 'prof.marcus.vance@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"Prof. Marcus Vance"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000003', 'nurse.elena.rostova@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"Elena Rostova, RN"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000004', 'lab.david.kim@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"David Kim, MLS"}', now(), now()),
      ('d0000001-0000-0000-0000-000000000005', 'admin@nexus-hospital.demo', '', now(), '{"provider":"email"}', '{"name":"System Administrator"}', now(), now())
    on conflict (id) do nothing;
  end if;
end $$;

-- Public Profiles
insert into public.profiles (id, full_name, email, profession, license_identifier, avatar_url)
values
  ('d0000001-0000-0000-0000-000000000001', 'Dr. Sarah Chen, MD', 'dr.sarah.chen@nexus-hospital.demo', 'Attending Physician, Acute Internal Medicine', 'GMC-7412890', null),
  ('d0000001-0000-0000-0000-000000000002', 'Prof. Marcus Vance, FRCP', 'prof.marcus.vance@nexus-hospital.demo', 'Consultant Pulmonologist & Clinical Reviewer', 'GMC-4819033', null),
  ('d0000001-0000-0000-0000-000000000003', 'Elena Rostova, RN', 'nurse.elena.rostova@nexus-hospital.demo', 'Lead Triage & Critical Care Nurse', 'NMC-18B0421E', null),
  ('d0000001-0000-0000-0000-000000000004', 'David Kim, MLS', 'lab.david.kim@nexus-hospital.demo', 'Senior Clinical Pathologist / Laboratory Specialist', 'HCPC-CS19022', null),
  ('d0000001-0000-0000-0000-000000000005', 'System Administrator', 'admin@nexus-hospital.demo', 'Chief Clinical Information Officer', 'CCIO-001', null)
on conflict (id) do nothing;

-- Organization Memberships
insert into public.organization_members (organization_id, user_id, role_name, is_active)
values
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'CLINICIAN', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'REVIEWER', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'NURSE', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000004', 'LABORATORY', true),
  ('c0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000005', 'ADMINISTRATOR', true)
on conflict (organization_id, user_id) do nothing;

-- ----------------------------------------------------------
-- 5. Synthetic Patients
-- ----------------------------------------------------------
insert into public.patients (id, organization_id, external_patient_id, given_name, family_name, date_of_birth, sex, phone)
values
  ('e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'SYNTH-PT-10482', 'Arthur', 'Pendleton', '1961-04-18', 'MALE', '+44 7700 900142'),
  ('e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'SYNTH-PT-10483', 'Beatriz', 'Moreno-Silva', '1984-11-03', 'FEMALE', '+44 7700 900581'),
  ('e0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'SYNTH-PT-10484', 'Chukwuemeka', 'Okonkwo', '1955-08-22', 'MALE', '+44 7700 900729')
on conflict (id) do nothing;

-- Encounters
insert into public.encounters (id, patient_id, organization_id, encounter_type, started_at, status, location)
values
  ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'EMERGENCY_ADMISSION', now() - interval '6 hours', 'ACTIVE', 'Resus Bay 3 -> Acute Assessment Unit'),
  ('f0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'INPATIENT', now() - interval '2 days', 'ACTIVE', 'Cardiology Ward 4B Bed 12'),
  ('f0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'OUTPATIENT_DIAGNOSTIC', now() - interval '1 day', 'ACTIVE', 'Renal Day Unit')
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 6. Demo Cases
-- ----------------------------------------------------------
insert into public.cases (id, organization_id, patient_id, encounter_id, case_number, title, status, priority, opened_at, created_by)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000001',
    'f0000001-0000-0000-0000-000000000001',
    'CASE-10482',
    'Acute respiratory deterioration in immunocompromised host with persistent fever [SYNTHETIC DEMO]',
    'REVIEW_REQUIRED',
    'HIGH',
    now() - interval '5 hours',
    'd0000001-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000002',
    'f0000001-0000-0000-0000-000000000002',
    'CASE-10483',
    'Atypical chest pain with discordant biomarker kinetics and prior stent [SYNTHETIC DEMO]',
    'ACTIVE',
    'NORMAL',
    now() - interval '18 hours',
    'd0000001-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'c0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000003',
    'f0000001-0000-0000-0000-000000000003',
    'CASE-10484',
    'Rapid progressive renal decline with cutaneous vasculitic purpura [SYNTHETIC DEMO]',
    'PRELIMINARY',
    'URGENT',
    now() - interval '1 day',
    'd0000001-0000-0000-0000-000000000001'
  )
on conflict (id) do nothing;

-- Case Team Members
insert into public.case_members (case_id, user_id, role_name)
values
  ('00000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'Attending Clinician'),
  ('00000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 'Clinical Reviewer'),
  ('00000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 'Triage Nurse')
on conflict (case_id, user_id) do nothing;

-- ----------------------------------------------------------
-- 7. Provenance & Clinical Data for CASE-10482
-- ----------------------------------------------------------
-- Provenance entries
insert into public.provenance_records (id, provenance_type, source_system, actor_user_id, model_name, model_version, captured_at, notes)
values
  ('10000001-0000-0000-0000-000000000001', 'DEVICE_MEASURED', 'Mindray BeneVision N12', null, null, null, now() - interval '4 hours', 'Continuous automated telemetry feed'),
  ('10000001-0000-0000-0000-000000000002', 'HUMAN_ENTERED', 'Nexus Bedside Workstation', 'd0000001-0000-0000-0000-000000000001', null, null, now() - interval '3 hours', 'Direct admission clerking examination'),
  ('10000001-0000-0000-0000-000000000003', 'AI_EXTRACTED', 'Nexus Clinical NLP Pipeline', null, 'Nexus-Reasoning-Core', 'v2.4-clinical', now() - interval '2 hours', 'Automated extraction from referral text and vitals telemetry')
on conflict (id) do nothing;

-- Observations (Structured vitals and lab numbers)
insert into public.observations (case_id, category, label, value_numeric, unit, reference_low, reference_high, observed_at, provenance_id)
values
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Body Temperature', 38.9, '°C', 36.1, 37.5, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Oxygen Saturation (SpO2)', 91.0, '%', 95.0, 100.0, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Respiratory Rate', 28.0, '/min', 12.0, 20.0, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'VITAL_SIGN', 'Heart Rate', 114.0, 'bpm', 60.0, 100.0, now() - interval '4 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'LABORATORY', 'C-Reactive Protein (CRP)', 184.0, 'mg/L', 0.0, 5.0, now() - interval '3 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'LABORATORY', 'Serum Procalcitonin', 2.8, 'ng/mL', 0.0, 0.5, now() - interval '3 hours', '10000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'LABORATORY', 'White Blood Cell Count', 16.8, '10^9/L', 4.0, 11.0, now() - interval '3 hours', '10000001-0000-0000-0000-000000000001');

-- Clinical Findings
insert into public.clinical_findings (id, case_id, category, label, description, status, provenance_id, created_by)
values
  ('20000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'SYMPTOM', 'Persistent high fever (38.9°C) unresponsive to oral paracetamol', 'Patient reports rigors and nocturnal drenching sweats for 6 days', 'ACTIVE', '10000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('20000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'SIGN', 'Bilateral fine inspiratory crackles in basal zones', 'Auscultation confirms focal bronchial breathing at right lower lobe base', 'ACTIVE', '10000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('20000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'HISTORY', 'Immunosuppressed state secondary to rituximab maintenance', 'Completed cycle 4 three weeks prior for follicular lymphoma', 'ACTIVE', '10000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('20000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'SIGN', 'Hypoxemic respiratory failure requiring 4L supplemental O2', 'Resting SpO2 drops to 87% on room air', 'ACTIVE', '10000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Hypotheses
insert into public.hypotheses (id, case_id, label, status, rationale, created_by, provenance_id)
values
  ('30000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Community-Acquired Bacterial Pneumonia with Sepsis Risk', 'SUPPORTED', 'Marked fever, elevated CRP/procalcitonin, focal lung findings, and tachypnoea in elderly host', 'd0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000002'),
  ('30000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Pneumocystis Jirovecii Pneumonia (PJP) / Opportunistic Fungal Infection', 'CANDIDATE', 'Prolonged hypoxaemia disproportionate to physical findings in rituximab-treated patient', 'd0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000003'),
  ('30000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Acute Pulmonary Embolism with Secondary Infarction', 'DISMISSED', 'CTPA negative for filling defect; tachypnoea explained by parenchymal consolidation', 'd0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000002')
on conflict (id) do nothing;

-- Hypothesis-Finding Junctions
insert into public.hypothesis_findings (hypothesis_id, finding_id, relationship, rationale)
values
  ('30000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000001', 'SUPPORTS', 'High continuous fever consistent with acute pyogenic infection'),
  ('30000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000002', 'SUPPORTS', 'Focal crackles confirm lower lobe consolidation'),
  ('30000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000003', 'SUPPORTS', 'B-cell depletion from rituximab dramatically increases opportunistic risk'),
  ('30000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000004', 'SUPPORTS', 'Severe hypoxaemia with exertional desaturation is hallmark of PJP')
on conflict (hypothesis_id, finding_id) do nothing;

-- ----------------------------------------------------------
-- 8. Nexus Intelligence Synthesis
-- ----------------------------------------------------------
insert into public.nexus_assessments (id, case_id, status, summary, data_completeness, evidence_consistency, applicability, limitations, model_name, model_version)
values (
  '40000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'REVIEW_REQUIRED',
  'Nexus Case Synthesis: 63yo male with severe community-acquired pneumonia physiology complicated by B-cell depletion immunosuppression. Elevated procalcitonin (2.8 ng/mL) and high inflammatory markers favor pyogenic bacterial etiology, but atypical fungal opportunistic process (PJP) cannot be excluded without induced sputum or beta-D-glucan.',
  'Moderate (blood cultures pending; induced sputum pending; initial HRCT pending)',
  'High concordance between physiological vitals, auscultatory signs, and laboratory inflammatory markers',
  'Adult acute hospital inpatient; immunocompromised oncology protocol',
  'Synthesized from synthetic training records. Clinical evaluation by attending physician mandatory before therapy initiation.',
  'Nexus-Reasoning-Core',
  'v2.4-clinical'
)
on conflict (id) do nothing;

insert into public.nexus_findings (id, assessment_id, finding_type, content, status)
values
  ('50000001-0000-0000-0000-000000000001', '40000001-0000-0000-0000-000000000001', 'OBSERVATION', 'Procalcitonin 2.8 ng/mL strongly correlates with systemic bacterial invasion versus viral respiratory infection alone', 'PENDING_REVIEW'),
  ('50000001-0000-0000-0000-000000000002', '40000001-0000-0000-0000-000000000001', 'RISK_FACTOR', 'Recent rituximab exposure reduces humoral response, impairing sputum antibody diagnostic reliability', 'PENDING_REVIEW')
on conflict (id) do nothing;

insert into public.nexus_recommendations (id, assessment_id, category, content, rationale, status)
values
  ('60000001-0000-0000-0000-000000000001', '40000001-0000-0000-0000-000000000001', 'INVESTIGATION', 'Order serum (1,3)-beta-D-glucan assay and fungal galactomannan antigen test', 'Rule out atypical opportunistic fungal infection given B-cell depletion', 'PENDING_REVIEW'),
  ('60000001-0000-0000-0000-000000000002', '40000001-0000-0000-0000-000000000001', 'MONITORING', 'Institute continuous pulse oximetry and q1h NEWS2 scoring protocol', 'High risk of acute hypoxic decompensation within initial 24 hours', 'PENDING_REVIEW')
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 9. Safety Concerns
-- ----------------------------------------------------------
insert into public.safety_concerns (id, case_id, severity, category, description, trigger_source, recommended_action, status)
values
  ('70000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'URGENT_REVIEW', 'HYPOXIA_DECOMPENSATION', 'Oxygen requirement increased from 2L to 4L in past 3 hours to maintain SpO2 >= 92%', 'Automated vitals rate-of-change monitor', 'Urgent review by respiratory registrar; prepare High Flow Nasal Cannula (HFNC)', 'OPEN'),
  ('70000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ATTENTION', 'CONTRADICTION', 'Normal leukocyte count reported on baseline lab vs leukocytosis on current differential', 'Nexus Contradiction Detector', 'Verify whether sample was drawn post-steroid administration or reflects true marrow response', 'OPEN')
on conflict (id) do nothing;

-- ----------------------------------------------------------
-- 10. Clinical Timeline Events
-- ----------------------------------------------------------
insert into public.timeline_events (case_id, actor_type, actor_user_id, event_type, title, description, occurred_at)
values
  ('00000000-0000-0000-0000-000000000001', 'CLINICIAN', 'd0000001-0000-0000-0000-000000000001', 'CASE_OPENED', 'Case opened in Emergency Assessment Unit', 'Admitted via ambulance triage for severe pyrexial respiratory distress', now() - interval '5 hours'),
  ('00000000-0000-0000-0000-000000000001', 'DEVICE', null, 'OBSERVATION_ADDED', 'Multiparameter telemetry vitals synchronized', 'Temperature 38.9°C, SpO2 91% on room air, HR 114 bpm', now() - interval '4 hours'),
  ('00000000-0000-0000-0000-000000000001', 'NEXUS_AI', null, 'NEXUS_SYNTHESIS', 'Nexus Clinical Synthesis generated', 'Assessment v2.4 generated with 2 candidate hypotheses and 2 recommendations', now() - interval '2 hours')
on conflict do nothing;
