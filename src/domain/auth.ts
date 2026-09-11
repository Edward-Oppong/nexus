// ============================================================
// src/domain/auth.ts
// Phase 6C–8: Canonical Role, Permission, Organization, and Profile Types
// Phase 8 adds: OrganizationFhirConfig, authorize() (org-scoped check)
// ============================================================

export type AppRole =
  | 'clinician'
  | 'nurse'
  | 'laboratory'
  | 'reviewer'
  | 'organization_admin'
  | 'platform_admin';

export type AppPermission =
  | 'case.view'
  | 'case.create'
  | 'case.edit'
  | 'case.close'
  | 'finding.view'
  | 'finding.create'
  | 'finding.edit'
  | 'finding.verify'
  | 'investigation.view'
  | 'investigation.request'
  | 'investigation.result.create'
  | 'investigation.result.verify'
  | 'nexus.view'
  | 'nexus.review'
  | 'nexus.accept'
  | 'nexus.edit'
  | 'nexus.reject'
  | 'decision.view'
  | 'decision.create'
  | 'decision.amend'
  | 'safety.view'
  | 'safety.resolve'
  | 'task.view'
  | 'task.create'
  | 'task.update'
  | 'team.view'
  | 'team.manage'
  | 'user.view'
  | 'user.manage'
  | 'organization.view'
  | 'organization.manage'
  | 'audit.view';

export interface Organization {
  id: string;
  name: string;
  organizationType?: string;
  countryCode?: string;
  timezone?: string;
  isActive: boolean;
}

/**
 * Phase 8: Organisation-scoped FHIR endpoint configuration.
 * Each organisation may register one or more external FHIR servers.
 * Stored in organization_fhir_configs table (migration 025).
 */
export interface OrganizationFhirConfig {
  id: string;
  organizationId: string;
  name: string;
  systemType: 'EHR' | 'LIS' | 'RIS' | 'PACS' | 'DEVICE' | 'PHARMACY' | 'REGISTRY' | 'RESEARCH_DB' | 'MANUAL_UPLOAD' | 'OTHER';
  protocol: 'FHIR_R4' | 'HL7_V2' | 'DICOM' | 'CSV' | 'PDF' | 'MANUAL' | 'API' | 'OTHER';
  baseUrl?: string;
  trustLevel: 'AUTHORITATIVE' | 'STANDARD' | 'SUPPLEMENTARY' | 'UNVERIFIED';
  isActive: boolean;
  circuitBreakerStatus: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  createdAt: string;
}

/**
 * Phase 8: Pending organisation invitation.
 * Stored in organization_invitations table (migration 025).
 */
export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: AppRole;
  invitedByUserId: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  profession?: string;
  licenseIdentifier?: string;
  avatarUrl?: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  organization: Organization;
  userId: string;
  role: AppRole;
  isActive: boolean;
  joinedAt: string;
}

/**
 * Section 6C.5: Canonical Role-Permission Matrix
 * Note: 'organization_admin' is strictly segregated from clinical decision authority.
 * Admin does not automatically receive clinical access.
 */
export const ROLE_PERMISSION_MATRIX: Record<AppRole, AppPermission[]> = {
  clinician: [
    'case.view',
    'case.create',
    'case.edit',
    'finding.view',
    'finding.create',
    'finding.edit',
    'finding.verify',
    'investigation.view',
    'investigation.request',
    'investigation.result.verify',
    'nexus.view',
    'nexus.review',
    'nexus.accept',
    'nexus.edit',
    'nexus.reject',
    'decision.view',
    'decision.create',
    'decision.amend',
    'safety.view',
    'safety.resolve',
    'task.view',
    'task.create',
    'task.update',
    'team.view',
  ],
  nurse: [
    'case.view',
    'finding.view',
    'finding.create',
    'investigation.view',
    'nexus.view',
    'safety.view',
    'task.view',
    'task.update',
    'team.view',
  ],
  laboratory: [
    'case.view',
    'investigation.view',
    'investigation.result.create',
    'task.view',
    'task.update',
  ],
  reviewer: [
    'case.view',
    'finding.view',
    'finding.verify',
    'investigation.view',
    'investigation.result.verify',
    'nexus.view',
    'nexus.review',
    'nexus.accept',
    'nexus.edit',
    'nexus.reject',
    'decision.view',
    'decision.create',
    'decision.amend',
    'safety.view',
    'safety.resolve',
    'task.view',
    'team.view',
    'audit.view',
  ],
  organization_admin: [
    'case.view',
    'case.create',
    'case.edit',
    'case.close',
    'team.view',
    'team.manage',
    'user.view',
    'user.manage',
    'organization.view',
    'organization.manage',
    'audit.view',
  ],
  platform_admin: [
    'organization.view',
    'organization.manage',
    'user.view',
    'user.manage',
    'audit.view',
  ],
};

export function hasRolePermission(role: AppRole, permission: AppPermission): boolean {
  const permissions = ROLE_PERMISSION_MATRIX[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * Phase 8 / ARCHITECTURE §4: Organisation-scoped permission check.
 *
 * Checks:
 *  1. The user has an active OrganizationMembership for targetOrganizationId
 *  2. That membership's role includes the requested permission
 *
 * The application-layer authorize() is the first line of defence.
 * PostgreSQL RLS is the final enforcement point (cannot be bypassed).
 *
 * @param permission - The permission being checked
 * @param targetOrganizationId - The org the action is being performed in
 * @param memberships - User's current OrganizationMembership array
 */
export function authorize(
  permission: AppPermission,
  targetOrganizationId: string,
  memberships: Array<{ organizationId: string; role: AppRole; isActive: boolean }>
): boolean {
  const membership = memberships.find(
    (m) => m.organizationId === targetOrganizationId && m.isActive
  );
  if (!membership) return false;
  return hasRolePermission(membership.role, permission);
}
