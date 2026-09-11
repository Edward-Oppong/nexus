// ============================================================
// src/data/administration/mockAdminData.ts
// Phase 8: Demo data for Administration UI
// Team members, org settings, and audit events across 3 demo orgs.
// ============================================================

import { OrganizationMembership, AppRole } from '../../domain/auth';

// ----------------------------------------------------------
// Demo Team Members
// Synthetic profiles — not real individuals
// ----------------------------------------------------------
export interface DemoTeamMember {
  membership: OrganizationMembership;
  fullName: string;
  email: string;
  profession: string;
  licenseIdentifier?: string;
  avatarInitials: string;
  avatarColor: string;
  lastActive: string;
  isActive: boolean;
}

const ORG_1 = 'c0000001-0000-0000-0000-000000000001';
const ORG_2 = 'c0000001-0000-0000-0000-000000000002';
const ORG_3 = 'c0000001-0000-0000-0000-000000000003';

export const MOCK_TEAM_MEMBERS: DemoTeamMember[] = [
  // --- Nexus Teaching Hospital [DEMO] (ORG_1) ---
  {
    membership: {
      id: 'mem-001',
      organizationId: ORG_1,
      organization: { id: ORG_1, name: 'Nexus Teaching Hospital [DEMO]', organizationType: 'ACADEMIC_MEDICAL_CENTER', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000001-0000-0000-0000-000000000001',
      role: 'clinician',
      isActive: true,
      joinedAt: '2026-01-10T08:00:00Z',
    },
    fullName: 'Dr. Sarah Chen, MD',
    email: 'sarah.chen@nexus-hospital.demo',
    profession: 'Attending Physician, Acute Internal Medicine',
    licenseIdentifier: 'GMC-7412890',
    avatarInitials: 'SC',
    avatarColor: '#0284C7',
    lastActive: '2026-09-11T14:32:00Z',
    isActive: true,
  },
  {
    membership: {
      id: 'mem-002',
      organizationId: ORG_1,
      organization: { id: ORG_1, name: 'Nexus Teaching Hospital [DEMO]', organizationType: 'ACADEMIC_MEDICAL_CENTER', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000002-0000-0000-0000-000000000002',
      role: 'clinician',
      isActive: true,
      joinedAt: '2026-01-12T09:00:00Z',
    },
    fullName: 'Dr. Marcus Okafor, MD',
    email: 'marcus.okafor@nexus-hospital.demo',
    profession: 'Consultant Cardiologist',
    licenseIdentifier: 'GMC-8834521',
    avatarInitials: 'MO',
    avatarColor: '#7C3AED',
    lastActive: '2026-09-11T11:15:00Z',
    isActive: true,
  },
  {
    membership: {
      id: 'mem-003',
      organizationId: ORG_1,
      organization: { id: ORG_1, name: 'Nexus Teaching Hospital [DEMO]', organizationType: 'ACADEMIC_MEDICAL_CENTER', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000003-0000-0000-0000-000000000003',
      role: 'nurse',
      isActive: true,
      joinedAt: '2026-01-15T10:00:00Z',
    },
    fullName: 'Priya Nair, RN',
    email: 'priya.nair@nexus-hospital.demo',
    profession: 'Senior Clinical Nurse, Acute Medicine',
    licenseIdentifier: 'NMC-2039847',
    avatarInitials: 'PN',
    avatarColor: '#059669',
    lastActive: '2026-09-11T14:01:00Z',
    isActive: true,
  },
  {
    membership: {
      id: 'mem-004',
      organizationId: ORG_1,
      organization: { id: ORG_1, name: 'Nexus Teaching Hospital [DEMO]', organizationType: 'ACADEMIC_MEDICAL_CENTER', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000004-0000-0000-0000-000000000004',
      role: 'laboratory',
      isActive: true,
      joinedAt: '2026-02-01T08:30:00Z',
    },
    fullName: 'James Osei, MSc',
    email: 'james.osei@nexus-hospital.demo',
    profession: 'Senior Biomedical Scientist, Haematology',
    licenseIdentifier: 'HCPC-BS42018',
    avatarInitials: 'JO',
    avatarColor: '#D97706',
    lastActive: '2026-09-10T16:45:00Z',
    isActive: true,
  },
  {
    membership: {
      id: 'mem-005',
      organizationId: ORG_1,
      organization: { id: ORG_1, name: 'Nexus Teaching Hospital [DEMO]', organizationType: 'ACADEMIC_MEDICAL_CENTER', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000005-0000-0000-0000-000000000005',
      role: 'reviewer',
      isActive: true,
      joinedAt: '2026-01-20T11:00:00Z',
    },
    fullName: 'Dr. Amara Diallo, MD',
    email: 'amara.diallo@nexus-hospital.demo',
    profession: 'Clinical Quality & Safety Reviewer',
    licenseIdentifier: 'GMC-5521903',
    avatarInitials: 'AD',
    avatarColor: '#DC2626',
    lastActive: '2026-09-11T09:22:00Z',
    isActive: true,
  },
  {
    membership: {
      id: 'mem-006',
      organizationId: ORG_1,
      organization: { id: ORG_1, name: 'Nexus Teaching Hospital [DEMO]', organizationType: 'ACADEMIC_MEDICAL_CENTER', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000006-0000-0000-0000-000000000006',
      role: 'organization_admin',
      isActive: true,
      joinedAt: '2026-01-05T08:00:00Z',
    },
    fullName: 'Helen Mackenzie',
    email: 'helen.mackenzie@nexus-hospital.demo',
    profession: 'Clinical Systems Administrator',
    avatarInitials: 'HM',
    avatarColor: '#475569',
    lastActive: '2026-09-11T13:55:00Z',
    isActive: true,
  },
  {
    membership: {
      id: 'mem-007',
      organizationId: ORG_1,
      organization: { id: ORG_1, name: 'Nexus Teaching Hospital [DEMO]', organizationType: 'ACADEMIC_MEDICAL_CENTER', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000007-0000-0000-0000-000000000007',
      role: 'clinician',
      isActive: false,
      joinedAt: '2026-03-01T09:00:00Z',
    },
    fullName: 'Dr. Kwame Asante, MD',
    email: 'kwame.asante@nexus-hospital.demo',
    profession: 'Registrar, Emergency Medicine',
    licenseIdentifier: 'GMC-6638210',
    avatarInitials: 'KA',
    avatarColor: '#64748B',
    lastActive: '2026-07-30T17:00:00Z',
    isActive: false,
  },
  // --- Community Health Centre West (ORG_2) ---
  {
    membership: {
      id: 'mem-008',
      organizationId: ORG_2,
      organization: { id: ORG_2, name: 'Community Health Centre West', organizationType: 'AMBULATORY_CARE', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000008-0000-0000-0000-000000000008',
      role: 'clinician',
      isActive: true,
      joinedAt: '2026-01-10T09:00:00Z',
    },
    fullName: 'Dr. Fatima Al-Hassan, MBBS',
    email: 'fatima.alhassan@community-health.demo',
    profession: 'GP Principal',
    licenseIdentifier: 'GMC-7741209',
    avatarInitials: 'FA',
    avatarColor: '#0891B2',
    lastActive: '2026-09-11T12:30:00Z',
    isActive: true,
  },
  {
    membership: {
      id: 'mem-009',
      organizationId: ORG_2,
      organization: { id: ORG_2, name: 'Community Health Centre West', organizationType: 'AMBULATORY_CARE', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000009-0000-0000-0000-000000000009',
      role: 'organization_admin',
      isActive: true,
      joinedAt: '2026-01-08T08:00:00Z',
    },
    fullName: 'Tom Reeves',
    email: 'tom.reeves@community-health.demo',
    profession: 'Practice Manager',
    avatarInitials: 'TR',
    avatarColor: '#475569',
    lastActive: '2026-09-10T15:00:00Z',
    isActive: true,
  },
  // --- Clinical AI Research Consortium (ORG_3) ---
  {
    membership: {
      id: 'mem-010',
      organizationId: ORG_3,
      organization: { id: ORG_3, name: 'Clinical AI Research Consortium', organizationType: 'RESEARCH_INSTITUTE', countryCode: 'GB', timezone: 'Europe/London', isActive: true },
      userId: 'd0000010-0000-0000-0000-000000000010',
      role: 'reviewer',
      isActive: true,
      joinedAt: '2026-02-15T10:00:00Z',
    },
    fullName: 'Prof. Elena Vasquez, PhD',
    email: 'elena.vasquez@ai-research.demo',
    profession: 'Principal Investigator, Clinical AI',
    licenseIdentifier: 'HCPC-CL90231',
    avatarInitials: 'EV',
    avatarColor: '#7C3AED',
    lastActive: '2026-09-09T18:00:00Z',
    isActive: true,
  },
];

// ----------------------------------------------------------
// Demo Audit Events
// Immutable audit ledger samples (mirrors audit_events table)
// ----------------------------------------------------------
export interface DemoAuditEvent {
  id: string;
  organizationId: string;
  caseId?: string;
  actorUserId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  recordedAt: string;
}

export const MOCK_AUDIT_EVENTS: DemoAuditEvent[] = [
  {
    id: 'audit-001',
    organizationId: ORG_1,
    caseId: 'case-001',
    actorUserId: 'd0000001-0000-0000-0000-000000000001',
    actorName: 'Dr. Sarah Chen',
    action: 'status_transition',
    resourceType: 'case',
    resourceId: 'case-001',
    detail: { from: 'ACTIVE', to: 'ANALYZING' },
    recordedAt: '2026-09-11T14:30:00Z',
  },
  {
    id: 'audit-002',
    organizationId: ORG_1,
    caseId: 'case-001',
    actorUserId: 'd0000001-0000-0000-0000-000000000001',
    actorName: 'Dr. Sarah Chen',
    action: 'finding_created',
    resourceType: 'finding',
    resourceId: 'finding-001',
    detail: { provenanceType: 'HUMAN_ENTERED', findingType: 'Symptom', description: 'Dyspnoea on exertion' },
    recordedAt: '2026-09-11T14:15:00Z',
  },
  {
    id: 'audit-003',
    organizationId: ORG_1,
    caseId: 'case-002',
    actorUserId: 'd0000005-0000-0000-0000-000000000005',
    actorName: 'Dr. Amara Diallo',
    action: 'nexus_assessment_accepted',
    resourceType: 'nexus_assessment',
    resourceId: 'assessment-v3',
    detail: { hypothesisId: 'hyp-001', clinicalReviewStatus: 'Accepted', assessmentVersion: 3 },
    recordedAt: '2026-09-11T11:45:00Z',
  },
  {
    id: 'audit-004',
    organizationId: ORG_1,
    caseId: 'case-003',
    actorUserId: 'd0000001-0000-0000-0000-000000000001',
    actorName: 'Dr. Sarah Chen',
    action: 'safety_issue_resolved',
    resourceType: 'safety_issue',
    resourceId: 'safety-001',
    detail: { severity: 'High', clinicalNote: 'Sepsis protocol initiated. Antibiotics commenced. Patient stable.' },
    recordedAt: '2026-09-11T10:22:00Z',
  },
  {
    id: 'audit-005',
    organizationId: ORG_1,
    caseId: 'case-001',
    actorUserId: 'system',
    actorName: 'Nexus System',
    action: 'nexus_assessment_generated',
    resourceType: 'nexus_assessment',
    resourceId: 'assessment-v1',
    detail: { modelName: 'Nexus Reasoning v2.1', modelVersion: '2.1.0', provenanceType: 'AI_GENERATED', assessmentVersion: 1 },
    recordedAt: '2026-09-11T09:55:00Z',
  },
  {
    id: 'audit-006',
    organizationId: ORG_1,
    caseId: 'case-004',
    actorUserId: 'd0000003-0000-0000-0000-000000000003',
    actorName: 'Priya Nair',
    action: 'finding_created',
    resourceType: 'finding',
    resourceId: 'finding-002',
    detail: { provenanceType: 'DEVICE_MEASURED', deviceSource: 'Mindray BeneVision', parameter: 'SpO2', value: '94%' },
    recordedAt: '2026-09-11T09:30:00Z',
  },
  {
    id: 'audit-007',
    organizationId: ORG_1,
    actorUserId: 'd0000006-0000-0000-0000-000000000006',
    actorName: 'Helen Mackenzie',
    action: 'member_role_changed',
    resourceType: 'organization_membership',
    resourceId: 'mem-007',
    detail: { previousRole: 'nurse', newRole: 'clinician', targetUserId: 'd0000007-0000-0000-0000-000000000007' },
    recordedAt: '2026-09-10T14:00:00Z',
  },
  {
    id: 'audit-008',
    organizationId: ORG_1,
    caseId: 'case-002',
    actorUserId: 'd0000004-0000-0000-0000-000000000004',
    actorName: 'James Osei',
    action: 'investigation_result_created',
    resourceType: 'investigation',
    resourceId: 'inv-001',
    detail: { investigationType: 'FBC', provenanceType: 'DEVICE_MEASURED', resultStatus: 'FINAL' },
    recordedAt: '2026-09-10T11:15:00Z',
  },
  {
    id: 'audit-009',
    organizationId: ORG_1,
    actorUserId: 'd0000006-0000-0000-0000-000000000006',
    actorName: 'Helen Mackenzie',
    action: 'fhir_import_completed',
    resourceType: 'fhir_bundle',
    resourceId: 'bundle-001',
    detail: { recordsImported: 14, recordsSkipped: 2, recordsFailed: 0, sourceSystem: 'Epic EHR' },
    recordedAt: '2026-09-10T08:45:00Z',
  },
  {
    id: 'audit-010',
    organizationId: ORG_1,
    caseId: 'case-005',
    actorUserId: 'd0000001-0000-0000-0000-000000000001',
    actorName: 'Dr. Sarah Chen',
    action: 'decision_recorded',
    resourceType: 'decision',
    resourceId: 'decision-001',
    detail: { hypothesisAccepted: 'Acute Decompensated Heart Failure', clinicalConfidence: 'SUPPORTED', clinicianId: 'd0000001-0000-0000-0000-000000000001' },
    recordedAt: '2026-09-09T16:30:00Z',
  },
  {
    id: 'audit-011',
    organizationId: ORG_1,
    caseId: 'case-001',
    actorUserId: 'd0000005-0000-0000-0000-000000000005',
    actorName: 'Dr. Amara Diallo',
    action: 'status_transition',
    resourceType: 'case',
    resourceId: 'case-001',
    detail: { from: 'PRELIMINARY', to: 'REVIEW_REQUIRED' },
    recordedAt: '2026-09-09T14:00:00Z',
  },
  {
    id: 'audit-012',
    organizationId: ORG_1,
    actorUserId: 'd0000006-0000-0000-0000-000000000006',
    actorName: 'Helen Mackenzie',
    action: 'member_deactivated',
    resourceType: 'organization_membership',
    resourceId: 'mem-007',
    detail: { targetUserId: 'd0000007-0000-0000-0000-000000000007', reason: 'Staff departure — rotation completed' },
    recordedAt: '2026-09-08T17:30:00Z',
  },
  {
    id: 'audit-013',
    organizationId: ORG_1,
    caseId: 'case-003',
    actorUserId: 'system',
    actorName: 'Nexus System',
    action: 'safety_issue_escalated',
    resourceType: 'safety_issue',
    resourceId: 'safety-001',
    detail: { trigger: 'AI_GENERATED', severity: 'High', autoTransition: 'ACTIVE → SAFETY_REVIEW' },
    recordedAt: '2026-09-08T09:10:00Z',
  },
  {
    id: 'audit-014',
    organizationId: ORG_1,
    caseId: 'case-004',
    actorUserId: 'd0000002-0000-0000-0000-000000000002',
    actorName: 'Dr. Marcus Okafor',
    action: 'finding_verified',
    resourceType: 'finding',
    resourceId: 'finding-003',
    detail: { previousProvenanceType: 'AI_EXTRACTED', newProvenanceType: 'CLINICIAN_VERIFIED' },
    recordedAt: '2026-09-07T15:22:00Z',
  },
  {
    id: 'audit-015',
    organizationId: ORG_2,
    actorUserId: 'd0000009-0000-0000-0000-000000000009',
    actorName: 'Tom Reeves',
    action: 'fhir_endpoint_registered',
    resourceType: 'organization_fhir_config',
    resourceId: 'fhir-cfg-004',
    detail: { systemType: 'EHR', protocol: 'FHIR_R4', trustLevel: 'STANDARD' },
    recordedAt: '2026-09-05T10:00:00Z',
  },
];

// ----------------------------------------------------------
// Organisation type labels (human-readable)
// ----------------------------------------------------------
export const ORG_TYPE_LABELS: Record<string, string> = {
  ACADEMIC_MEDICAL_CENTER: 'Academic Medical Centre',
  AMBULATORY_CARE: 'Ambulatory / Outpatient Care',
  COMMUNITY_HOSPITAL: 'Community Hospital',
  RESEARCH_INSTITUTE: 'Research Institute',
  PRIVATE_CLINIC: 'Private Clinic',
  LONG_TERM_CARE: 'Long-term Care Facility',
  PUBLIC_HEALTH: 'Public Health Authority',
  OTHER: 'Other',
};

// ----------------------------------------------------------
// Role display labels and colours
// ----------------------------------------------------------
export const ROLE_DISPLAY: Record<string, { label: string; bg: string; text: string; border: string }> = {
  clinician:            { label: 'Clinician',      bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  nurse:                { label: 'Nurse',           bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  laboratory:           { label: 'Laboratory',     bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  reviewer:             { label: 'Reviewer',       bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  organization_admin:   { label: 'Org Admin',      bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' },
  platform_admin:       { label: 'Platform Admin', bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
};

// ----------------------------------------------------------
// Action display labels (for audit log)
// ----------------------------------------------------------
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  status_transition:          'Case Status Transition',
  finding_created:            'Finding Created',
  finding_verified:           'Finding Verified',
  nexus_assessment_generated: 'Nexus Assessment Generated',
  nexus_assessment_accepted:  'Hypothesis Accepted',
  nexus_assessment_rejected:  'Hypothesis Rejected',
  safety_issue_escalated:     'Safety Issue Escalated',
  safety_issue_resolved:      'Safety Issue Resolved',
  decision_recorded:          'Clinical Decision Recorded',
  investigation_result_created: 'Investigation Result Created',
  fhir_import_completed:      'FHIR Import Completed',
  fhir_endpoint_registered:   'FHIR Endpoint Registered',
  member_role_changed:        'Member Role Changed',
  member_deactivated:         'Member Deactivated',
  member_invited:             'Member Invited',
};
