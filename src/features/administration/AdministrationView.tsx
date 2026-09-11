// ============================================================
// src/features/administration/AdministrationView.tsx
// Phase 8: Multi-tenant Organisation Administration Workstation
//
// Tab inventory:
//   1. Organisation Settings (organization.manage)
//   2. Team Members        (user.manage)
//   3. FHIR Endpoints      (organization.manage)
//   4. Audit Log           (audit.view)
//   5. System Disclosure   (all authenticated users)
//
// Permission gates operate at two levels:
//   - Tab visibility: shown to all but with locked indicator if no access
//   - Tab content: ProtectedRoute-equivalent message inside the tab
//
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../authentication/AuthProvider';
import { OrgSettingsTab } from './tabs/OrgSettingsTab';
import { TeamMembersTab } from './tabs/TeamMembersTab';
import { FhirEndpointsTab } from './tabs/FhirEndpointsTab';
import { AuditLogTab } from './tabs/AuditLogTab';
import { SystemDisclosureTab } from './tabs/SystemDisclosureTab';
import { Building2, Users, Globe, Shield, Cpu, Lock } from 'lucide-react';

type AdminTab = 'org-settings' | 'team' | 'fhir-endpoints' | 'audit-log' | 'system-disclosure';

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  requiredPermission?: 'organization.manage' | 'user.manage' | 'audit.view';
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'org-settings',
    label: 'Organisation',
    icon: <Building2 size={15} />,
    requiredPermission: 'organization.manage',
    description: 'Name, type, country, timezone',
  },
  {
    id: 'team',
    label: 'Team Members',
    icon: <Users size={15} />,
    requiredPermission: 'user.manage',
    description: 'Roster, roles, invitations',
  },
  {
    id: 'fhir-endpoints',
    label: 'FHIR Endpoints',
    icon: <Globe size={15} />,
    requiredPermission: 'organization.manage',
    description: 'External system connections',
  },
  {
    id: 'audit-log',
    label: 'Audit Log',
    icon: <Shield size={15} />,
    requiredPermission: 'audit.view',
    description: 'Immutable event ledger',
  },
  {
    id: 'system-disclosure',
    label: 'System Disclosure',
    icon: <Cpu size={15} />,
    description: 'AI model registry & provenance reference',
  },
];

export const AdministrationView: React.FC = () => {
  const { activeOrganization, can, role } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    // Default to the first tab the current role has access to
    const firstAccessible = TABS.find(
      (t) => !t.requiredPermission || can(t.requiredPermission)
    );
    return firstAccessible?.id || 'system-disclosure';
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'org-settings':       return <OrgSettingsTab />;
      case 'team':               return <TeamMembersTab />;
      case 'fhir-endpoints':     return <FhirEndpointsTab />;
      case 'audit-log':          return <AuditLogTab />;
      case 'system-disclosure':  return <SystemDisclosureTab />;
    }
  };

  // Count accessible tabs for summary
  const accessibleCount = TABS.filter(
    (t) => !t.requiredPermission || can(t.requiredPermission)
  ).length;

  return (
    <main
      aria-label="Administration and Clinical Governance"
      style={{
        flex: 1,
        overflowY: 'auto',
        background: '#F8FAFC',
      }}
    >
      {/* Page Header */}
      <div
        style={{
          padding: '28px 40px 0',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: '#64748B',
              letterSpacing: '0.06em',
              marginBottom: '4px',
            }}
          >
            System Governance · Phase 8 — Multi-tenant Organisation Model
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
                Administration &amp; Governance
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748B' }}>
                {activeOrganization ? (
                  <>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{activeOrganization.name}</span>
                    <span>·</span>
                    <span>
                      Role: <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#0F172A',
                          color: '#F8FAFC',
                        }}
                      >
                        {role}
                      </span>
                    </span>
                    <span>·</span>
                    <span>{accessibleCount} of {TABS.length} panels accessible</span>
                  </>
                ) : (
                  <span>No active organisation</span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '-1px' }}>
            {TABS.map((tab) => {
              const hasAccess = !tab.requiredPermission || can(tab.requiredPermission);
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={!hasAccess ? `Requires ${tab.requiredPermission} permission` : tab.description}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '6px 6px 0 0',
                    border: '1px solid',
                    borderBottom: 'none',
                    borderColor: isActive ? '#E2E8F0' : 'transparent',
                    background: isActive ? '#F8FAFC' : 'transparent',
                    color: isActive ? '#0F172A' : hasAccess ? '#64748B' : '#CBD5E1',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    fontFamily: 'var(--font-body)',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      color: isActive
                        ? '#0F172A'
                        : hasAccess
                        ? '#64748B'
                        : '#CBD5E1',
                    }}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                  {!hasAccess && (
                    <Lock
                      size={10}
                      style={{ color: '#CBD5E1', marginLeft: '2px' }}
                      aria-label={`Requires ${tab.requiredPermission}`}
                    />
                  )}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: '#0F172A',
                        borderRadius: '2px 2px 0 0',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 40px' }}>
        {renderTabContent()}
      </div>
    </main>
  );
};
