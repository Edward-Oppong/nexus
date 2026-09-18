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

export const MOCK_TEAM_MEMBERS: DemoTeamMember[] = [];


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

export const MOCK_AUDIT_EVENTS: DemoAuditEvent[] = [];


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
