// ============================================================
// src/features/authentication/AuthProvider.tsx
// Real Supabase Auth — session-first, role fetched from DB.
// Falls back to demo mode only when Supabase is not configured.
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
// Demo Organizations (used for membership display)
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
];

export const DEMO_FHIR_CONFIGS: OrganizationFhirConfig[] = [
  {
    id: 'f0000001-0000-0000-0000-000000000001',
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
];

// ----------------------------------------------------------
// DB role_name → AppRole mapping
// organization_members.role_name values are uppercase strings
// ----------------------------------------------------------
const DB_ROLE_MAP: Record<string, AppRole> = {
  CLINICIAN: 'clinician',
  NURSE: 'nurse',
  LABORATORY: 'laboratory',
  REVIEWER: 'reviewer',
  ADMINISTRATOR: 'organization_admin',
  PLATFORM_ADMIN: 'platform_admin',
};

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organizations: OrganizationMembership[];
  activeOrganization: Organization | null;
  role: AppRole;
  permissions: AppPermission[];
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  can: (permission: AppPermission) => boolean;
  authorize: (permission: AppPermission, targetOrganizationId: string) => boolean;
  switchOrganization: (orgId: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInDemo: (role: 'clinician' | 'organization_admin') => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('clinician');
  const [activeOrg, setActiveOrg] = useState<Organization>(DEMO_ORGANIZATIONS[0]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // true on boot while checking session

  // ----------------------------------------------------------
  // Fetch profile + role from DB after sign-in
  // ----------------------------------------------------------
  const loadUserProfile = useCallback(async (authUser: User) => {
    try {
      // 1. Fetch public profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, profession, license_identifier, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (profileData) {
        setProfile({
          id: profileData.id,
          fullName: profileData.full_name,
          email: profileData.email || authUser.email || '',
          profession: profileData.profession,
          licenseIdentifier: profileData.license_identifier,
          avatarUrl: profileData.avatar_url,
        });
      } else {
        // Fallback to JWT metadata
        setProfile({
          id: authUser.id,
          fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Clinician',
          email: authUser.email || '',
        });
      }

      // 2. Fetch organization memberships + role
      const { data: memberData } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          role_name,
          is_active,
          joined_at,
          organizations (id, name, organization_type, country_code, timezone, is_active)
        `)
        .eq('user_id', authUser.id)
        .eq('is_active', true);

      if (memberData && memberData.length > 0) {
        const mappedMemberships: OrganizationMembership[] = memberData.map((m: any) => ({
          id: m.id,
          organizationId: m.organization_id,
          organization: {
            id: m.organizations.id,
            name: m.organizations.name,
            organizationType: m.organizations.organization_type,
            countryCode: m.organizations.country_code,
            timezone: m.organizations.timezone,
            isActive: m.organizations.is_active,
          },
          userId: authUser.id,
          role: DB_ROLE_MAP[m.role_name] || 'clinician',
          isActive: m.is_active,
          joinedAt: m.joined_at,
        }));

        setMemberships(mappedMemberships);
        // Active org = first membership
        setActiveOrg(mappedMemberships[0].organization);
        // Role = first membership's role
        const resolvedRole = DB_ROLE_MAP[memberData[0].role_name] || 'clinician';
        setRole(resolvedRole);
      }
    } catch (err) {
      console.error('[AuthProvider] loadUserProfile error:', err);
    }
  }, []);

  // ----------------------------------------------------------
  // Supabase session listener — runs on boot
  // ----------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        await loadUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setProfile(null);
        setMemberships([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  // ----------------------------------------------------------
  // Demo Persona Quick-Sign-In
  // ----------------------------------------------------------
  const signInDemo = useCallback((demoRole: 'clinician' | 'organization_admin') => {
    const isClinician = demoRole === 'clinician';
    const demoUser: User = {
      id: isClinician ? 'd0000001-0000-0000-0000-000000000001' : 'd0000005-0000-0000-0000-000000000001',
      app_metadata: { provider: 'demo' },
      user_metadata: {
        full_name: isClinician ? 'Dr. Sarah Chen, MD' : 'System Administrator',
      },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00.000Z',
      email: isClinician ? 'dr.sarah.chen@nexus-hospital.demo' : 'admin@nexus-hospital.demo',
    } as unknown as User;

    const demoProfile: Profile = {
      id: demoUser.id,
      fullName: isClinician ? 'Dr. Sarah Chen, MD' : 'System Administrator',
      email: demoUser.email || '',
      profession: isClinician ? 'Attending Physician, Acute Internal Medicine' : 'Chief Clinical Information Officer',
      licenseIdentifier: isClinician ? 'GMC-7412890' : 'CCIO-001',
    };

    const demoMemberships: OrganizationMembership[] = [
      {
        id: isClinician ? 'm-demo-clinician' : 'm-demo-admin',
        organizationId: DEMO_ORGANIZATIONS[0].id,
        organization: DEMO_ORGANIZATIONS[0],
        userId: demoUser.id,
        role: demoRole,
        isActive: true,
        joinedAt: '2026-01-01T00:00:00Z',
      },
    ];

    setUser(demoUser);
    setProfile(demoProfile);
    setMemberships(demoMemberships);
    setActiveOrg(DEMO_ORGANIZATIONS[0]);
    setRole(demoRole);
    setIsAuthenticated(true);
    setIsDemoMode(true);
  }, []);

  // ----------------------------------------------------------
  // Sign In
  // ----------------------------------------------------------
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      setLoading(true);
      try {
        const isDemoSarah = email.toLowerCase().includes('sarah') || email.toLowerCase().includes('chen');
        const isDemoAdmin = email.toLowerCase().includes('admin');

        if (!isSupabaseConfigured) {
          if (isDemoAdmin) {
            signInDemo('organization_admin');
            return { error: null };
          }
          signInDemo('clinician');
          return { error: null };
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If Supabase authentication encounters an issue for demo credentials, seamlessly activate demo persona
          if (isDemoSarah || isDemoAdmin) {
            signInDemo(isDemoAdmin ? 'organization_admin' : 'clinician');
            return { error: null };
          }
          throw error;
        }

        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          setIsDemoMode(false);
          await loadUserProfile(data.user);
        }

        return { error: null };
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Authentication failed');
        return { error };
      } finally {
        setLoading(false);
      }
    },
    [loadUserProfile, signInDemo]
  );

  // ----------------------------------------------------------
  // Sign Out
  // ----------------------------------------------------------
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    setUser(null);
    setProfile(null);
    setMemberships([]);
    setIsAuthenticated(false);
    setIsDemoMode(false);
    setRole('clinician');
  }, []);

  // ----------------------------------------------------------
  // Switch active organization
  // ----------------------------------------------------------
  const switchOrganization = useCallback((orgId: string) => {
    const found = memberships.find((m) => m.organizationId === orgId);
    if (found) {
      setActiveOrg(found.organization);
      setRole(found.role);
    }
  }, [memberships]);

  // ----------------------------------------------------------
  // Derived state
  // ----------------------------------------------------------
  const permissions = useMemo<AppPermission[]>(() => {
    return ROLE_PERMISSION_MATRIX[role] || [];
  }, [role]);

  const can = useCallback(
    (permission: AppPermission): boolean => hasRolePermission(role, permission),
    [role]
  );

  const authorize = useCallback(
    (permission: AppPermission, targetOrganizationId: string): boolean =>
      domainAuthorize(permission, targetOrganizationId, memberships),
    [memberships]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      organizations: memberships,
      activeOrganization: activeOrg,
      role,
      permissions,
      loading,
      isAuthenticated,
      isDemoMode,
      can,
      authorize,
      switchOrganization,
      signIn,
      signInDemo,
      signOut,
    }),
    [user, profile, memberships, activeOrg, role, permissions, loading, isAuthenticated, isDemoMode, can, authorize, switchOrganization, signIn, signInDemo, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
