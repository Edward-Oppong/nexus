// ============================================================
// src/features/authentication/AuthProvider.tsx
// Authentication & Organization Access Provider
// Implements Supabase Auth session listener with seamless
// Demo Persona switching for local and evaluation environments.
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import {
  AppRole,
  AppPermission,
  Organization,
  OrganizationFhirConfig,
  Profile,
  OrganizationMembership,
  ROLE_PERMISSION_MATRIX,
  hasRolePermission,
  authorize as domainAuthorize,
} from '../../domain/auth';

// ----------------------------------------------------------
// Default Demo Organizations
// ----------------------------------------------------------
export const DEMO_ORGANIZATIONS: Organization[] = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    name: 'Nexus Teaching Hospital [DEMO]',
    organizationType: 'ACADEMIC_MEDICAL_CENTER',
    countryCode: 'GB',
    timezone: 'Europe/London',
    isActive: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    name: 'Community Health Centre West',
    organizationType: 'AMBULATORY_CARE',
    countryCode: 'GB',
    timezone: 'Europe/London',
    isActive: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    name: 'Clinical AI Research Consortium',
    organizationType: 'RESEARCH_INSTITUTE',
    countryCode: 'GB',
    timezone: 'Europe/London',
    isActive: true,
  },
];

// ----------------------------------------------------------
// Demo FHIR Endpoint Configurations (Phase 8)
// Per-organisation FHIR endpoint registry (mirrors organization_fhir_configs table)
// ----------------------------------------------------------
export const DEMO_FHIR_CONFIGS: OrganizationFhirConfig[] = [
  {
    id: 'fhir-cfg-001',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    name: 'Epic EHR — Teaching Hospital',
    systemType: 'EHR',
    protocol: 'FHIR_R4',
    baseUrl: 'https://epic.nexus-hospital.demo/api/FHIR/R4',
    trustLevel: 'AUTHORITATIVE',
    isActive: true,
    circuitBreakerStatus: 'CLOSED',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'fhir-cfg-002',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    name: 'Mindray BeneVision — Bedside Devices',
    systemType: 'DEVICE',
    protocol: 'HL7_V2',
    baseUrl: 'https://hl7.mindray.nexus-hospital.demo/mllp',
    trustLevel: 'STANDARD',
    isActive: true,
    circuitBreakerStatus: 'CLOSED',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'fhir-cfg-003',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    name: 'LabSystems LIS — Pathology',
    systemType: 'LIS',
    protocol: 'FHIR_R4',
    baseUrl: 'https://lis.nexus-hospital.demo/fhir/r4',
    trustLevel: 'AUTHORITATIVE',
    isActive: true,
    circuitBreakerStatus: 'HALF_OPEN',
    createdAt: '2026-03-10T09:30:00Z',
  },
  {
    id: 'fhir-cfg-004',
    organizationId: 'c0000001-0000-0000-0000-000000000002',
    name: 'Community EHR — Primary Care',
    systemType: 'EHR',
    protocol: 'FHIR_R4',
    baseUrl: 'https://community-ehr.demo/fhir/r4',
    trustLevel: 'STANDARD',
    isActive: true,
    circuitBreakerStatus: 'CLOSED',
    createdAt: '2026-01-20T12:00:00Z',
  },
  {
    id: 'fhir-cfg-005',
    organizationId: 'c0000001-0000-0000-0000-000000000003',
    name: 'Research Registry — Clinical Trials',
    systemType: 'REGISTRY',
    protocol: 'FHIR_R4',
    baseUrl: 'https://registry.ai-research.demo/fhir/r4',
    trustLevel: 'SUPPLEMENTARY',
    isActive: false,
    circuitBreakerStatus: 'OPEN',
    createdAt: '2026-04-05T14:00:00Z',
  },
];

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organizations: OrganizationMembership[];
  activeOrganization: Organization | null;
  role: AppRole;
  permissions: AppPermission[];
  loading: boolean;
  isDemoMode: boolean;
  /** Simple role-level permission check (no org scope). First line of UI defence. */
  can: (permission: AppPermission) => boolean;
  /**
   * Phase 8 / ARCHITECTURE §4: Org-scoped permission check.
   * Validates active membership for targetOrganizationId + role permission.
   * DB RLS is the final enforcement — this is the application-layer guard.
   */
  authorize: (permission: AppPermission, targetOrganizationId: string) => boolean;
  switchOrganization: (orgId: string) => void;
  switchDemoPersona: (role: AppRole, name?: string) => void;
  signIn: (email: string, password?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>({
    id: 'd0000001-0000-0000-0000-000000000001',
    fullName: 'Dr. Sarah Chen, MD',
    email: 'dr.sarah.chen@nexus-hospital.demo',
    profession: 'Attending Physician, Acute Internal Medicine',
    licenseIdentifier: 'GMC-7412890',
  });
  const [activeOrg, setActiveOrg] = useState<Organization>(DEMO_ORGANIZATIONS[0]);
  const [role, setRole] = useState<AppRole>('clinician');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Derived memberships across organizations
  const memberships = useMemo<OrganizationMembership[]>(() => {
    return DEMO_ORGANIZATIONS.map((org) => ({
      id: `mem-${org.id}`,
      organizationId: org.id,
      organization: org,
      userId: profile?.id || 'demo-user',
      role: role,
      isActive: true,
      joinedAt: '2026-01-01T00:00:00Z',
    }));
  }, [profile?.id, role]);

  // Derived current permissions from the active role in active organization
  const permissions = useMemo<AppPermission[]>(() => {
    return ROLE_PERMISSION_MATRIX[role] || [];
  }, [role]);

  // Permission check helper function (Section 6C.17)
  const can = useCallback(
    (permission: AppPermission): boolean => {
      return hasRolePermission(role, permission);
    },
    [role]
  );

  // Org-scoped permission check (Phase 8 / ARCHITECTURE §4)
  const authorize = useCallback(
    (permission: AppPermission, targetOrganizationId: string): boolean => {
      return domainAuthorize(permission, targetOrganizationId, memberships);
    },
    [memberships]
  );

  // Switch active organization (Section 6C.15)
  const switchOrganization = useCallback((orgId: string) => {
    const found = DEMO_ORGANIZATIONS.find((o) => o.id === orgId);
    if (found) {
      setActiveOrg(found);
    }
  }, []);

  // Demo Persona Switcher (Section 6C.31 & 6C.32)
  const switchDemoPersona = useCallback((newRole: AppRole, name?: string) => {
    setRole(newRole);
    setIsDemoMode(true);
    if (name) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: name,
              profession: newRole === 'clinician' ? 'Attending Physician' : newRole === 'reviewer' ? 'Clinical Reviewer' : newRole === 'nurse' ? 'Clinical Nurse' : newRole === 'laboratory' ? 'Laboratory Specialist' : 'System Administrator',
            }
          : null
      );
    }
  }, []);

  // Real Supabase Auth sign-in
  const signIn = useCallback(
    async (email: string, password?: string): Promise<{ error: Error | null }> => {
      setLoading(true);
      try {
        if (isSupabaseConfigured && password) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.user) {
            setUser(data.user);
            setIsDemoMode(false);
            setProfile({
              id: data.user.id,
              fullName: data.user.user_metadata?.full_name || email.split('@')[0],
              email: data.user.email || email,
            });
          }
        } else {
          // Synthetic demo sign-in for evaluation
          setIsDemoMode(true);
          setUser(null);
          setProfile({
            id: 'd0000001-0000-0000-0000-000000000001',
            fullName: email.includes('admin') ? 'System Administrator' : 'Dr. Sarah Chen, MD',
            email,
            profession: email.includes('admin') ? 'Clinical Systems Administrator' : 'Attending Physician',
          });
          if (email.includes('admin')) {
            setRole('organization_admin');
          } else if (email.includes('review')) {
            setRole('reviewer');
          } else {
            setRole('clinician');
          }
        }
        return { error: null };
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Authentication failed');
        return { error };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sign out
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoMode(true);
    setRole('clinician');
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsDemoMode(false);
          setProfile({
            id: session.user.id,
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Clinician',
            email: session.user.email || '',
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      organizations: memberships,
      activeOrganization: activeOrg,
      role,
      permissions,
      loading,
      isDemoMode,
      can,
      authorize,
      switchOrganization,
      switchDemoPersona,
      signIn,
      signOut,
    }),
    [
      user,
      profile,
      memberships,
      activeOrg,
      role,
      permissions,
      loading,
      isDemoMode,
      can,
      authorize,
      switchOrganization,
      switchDemoPersona,
      signIn,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
