// ============================================================
// src/domain/auth.ts
// Phase 6C Canonical Role, Permission, Organization, and Profile Types
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
