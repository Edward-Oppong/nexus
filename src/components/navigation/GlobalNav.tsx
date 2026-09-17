import React, { useState } from 'react';
import { useCase, MainView } from '../../app/providers/CaseContext';
import { useDrawer } from '../../app/providers/DrawerContext';
import { useAuth } from '../../features/authentication/AuthProvider';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FlaskConical,
  BookOpen,
  CheckSquare,
  Sliders,
  HelpCircle,
  FileCheck2,
  BrainCircuit,
  ShieldCheck,
  AlertCircle,
  LogOut,
} from 'lucide-react';

interface NavItemConfig {
  id: MainView;
  label: string;
  icon: React.ReactNode;
  count?: number;
  isUrgentAlert?: boolean;
}

export const GlobalNav: React.FC = () => {
  const { activeView, setActiveView, pendingReviewCount, tasks, activeCase, casesList } = useCase();
  const { openShortcuts } = useDrawer();
  const { role, profile, signOut } = useAuth();
  const isAdmin = role === 'organization_admin' || role === 'platform_admin';

  const displayName = profile?.fullName || (isAdmin ? 'System Administrator' : 'Dr. Sarah Chen');
  const displayTitle = profile?.profession || (isAdmin ? 'Health System Administrator' : 'Consultant Acute Physician');
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'NX';

  const openTasksCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
  const [collapsed, setCollapsed] = useState(false);
  const W = collapsed ? 48 : 240;

  // Group 1: Shift-Critical Clinical Work
  const clinicalWorkGroup: NavItemConfig[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'cases', label: 'Cases', icon: <FolderKanban size={17} />, count: casesList.length },
    {
      id: 'review-queue',
      label: 'Needs Review',
      icon: <FileCheck2 size={17} />,
      count: pendingReviewCount,
      isUrgentAlert: true,
    },
    {
      id: 'investigations',
      label: 'Investigations',
      icon: <FlaskConical size={17} />,
      count: activeCase.investigations.filter((i) => i.status !== 'Result available').length,
    },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={17} />, count: openTasksCount },
  ];

  // Group 2: Reference & Lookup
  const referenceGroup: NavItemConfig[] = [
    { id: 'patients', label: 'Patients', icon: <Users size={17} /> },
    { id: 'evidence-catalog', label: 'Evidence', icon: <BookOpen size={17} /> },
  ];

  // Group 3: Governance & Operations
  const governanceGroup: NavItemConfig[] = [
    { id: 'ai-governance', label: 'AI Governance', icon: <BrainCircuit size={17} /> },
    { id: 'regulatory-compliance', label: 'Compliance', icon: <ShieldCheck size={17} /> },
    { id: 'administration', label: 'Administration', icon: <Sliders size={17} /> },
  ];

  const renderNavGroup = (items: NavItemConfig[]) => {
    return items.map((item) => {
      const isActive =
        activeView === item.id ||
        (item.id === 'cases' && activeView === 'case-workspace');

      return (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          title={collapsed ? `${item.label}${item.count ? ` (${item.count})` : ''}` : undefined}
          aria-label={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '8px 0' : '7px 10px',
            marginLeft: collapsed ? '4px' : '0',
            marginRight: collapsed ? '4px' : '0',
            width: collapsed ? '40px' : '100%',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? '#0F172A' : '#475569',
            backgroundColor: isActive ? '#F1F5F9' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.12s ease',
            position: 'relative',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : '10px',
            }}
          >
            <span
              style={{
                color: isActive ? '#0F172A' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            {!collapsed && item.label}
          </div>

          {/* Differentiated Badge System */}
          {!collapsed && item.count !== undefined && item.count > 0 && (
            item.isUrgentAlert ? (
              /* Urgent Safety / Contradiction Review Badge */
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <AlertCircle size={10} color="#B91C1C" />
                <span>{item.count}</span>
              </span>
            ) : (
              /* Quiet Informational Count Pill */
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: isActive ? '#E2E8F0' : '#F1F5F9',
                  color: '#475569',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.count}
              </span>
            )
          )}

          {/* Collapsed Rail Dot: ONLY the urgent flag shows an alert dot */}
          {collapsed && item.isUrgentAlert && item.count !== undefined && item.count > 0 && (
            <span
              aria-label={`${item.count} urgent items`}
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                border: '1.5px solid #FFFFFF',
              }}
            />
          )}
        </button>
      );
    });
  };

  return (
    <nav
      aria-label="Global clinical workstation navigation"
      style={{
        width: `${W}px`,
        minWidth: `${W}px`,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* ── Brand Header (No monospace tagline) ───────────── */}
      <div
        style={{
          padding: collapsed ? '16px 0' : '16px 18px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Hexagonal Logo Mark */}
          <div
            title={collapsed ? 'Click to expand sidebar' : 'Nexus Workstation'}
            onClick={collapsed ? () => setCollapsed(false) : undefined}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
              cursor: collapsed ? 'pointer' : 'default',
            }}
          >
            ⬡
          </div>

          {/* Wordmark (Expanded only, routes to landing) */}
          {!collapsed && (
            <div
              onClick={() => setActiveView('landing')}
              title="Return to Nexus Landing Page"
              style={{
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '-0.02em',
                color: '#0F172A',
              }}
            >
              Nexus
            </div>
          )}
        </div>

        {/* Collapse Button (Double-chevron left) */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#475569';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M9 3L5 7.5L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 3L9 7.5L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Grouped Clinical Navigation ───────────────────── */}
      <div
        style={{
          padding: collapsed ? '10px 0' : '14px 10px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Group 1: Shift-Critical Clinical Work */}
        {renderNavGroup(clinicalWorkGroup)}

        {/* Quiet Hairline Separator */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#F1F5F9',
            margin: collapsed ? '8px 6px' : '8px 4px',
          }}
        />

        {/* Group 2: Reference & Lookup */}
        {renderNavGroup(referenceGroup)}

        {/* Group 3: Governance & Operations (Admin Only) */}
        {isAdmin && (
          <>
            {/* Quiet Hairline Separator */}
            <div
              style={{
                height: '1px',
                backgroundColor: '#F1F5F9',
                margin: collapsed ? '8px 6px' : '8px 4px',
              }}
            />
            {renderNavGroup(governanceGroup)}
          </>
        )}
      </div>

      {/* ── Expand button (Collapsed state rail only) ─────── */}
      {collapsed && (
        <div style={{ padding: '6px 4px', flexShrink: 0 }}>
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            style={{
              width: '40px',
              padding: '8px 0',
              marginLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#475569';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M6 3L10 7.5L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 3L6 7.5L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Shortcuts Button (Low-emphasis utility) ──────── */}
      <div style={{ padding: collapsed ? '4px 4px' : '6px 10px', flexShrink: 0 }}>
        {!collapsed ? (
          <button
            onClick={openShortcuts}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#64748B',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={13} />
              <span>Shortcuts</span>
            </span>
            <kbd
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '1px 5px',
                borderRadius: '3px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
              }}
            >
              ?
            </kbd>
          </button>
        ) : (
          <button
            onClick={openShortcuts}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            style={{
              width: '40px',
              padding: '7px 0',
              marginLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <HelpCircle size={13} />
          </button>
        )}
      </div>

      {/* ── Clinician Profile & Persona Footer ─────────────── */}
      <div
        style={{
          padding: collapsed ? '10px 4px' : '12px 14px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FAFAFA',
          flexShrink: 0,
        }}
      >
        {!collapsed ? (
          <>
            {/* Clinician Identity Prominent */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {avatarInitials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0F172A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#64748B',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayTitle}
                </div>
              </div>

              {/* Subdued Role Tag */}
              <span
                style={{
                  fontSize: '9px',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  backgroundColor: role === 'organization_admin' ? '#FEF3C7' : '#E0F2FE',
                  color: role === 'organization_admin' ? '#92400E' : '#0369A1',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {role === 'organization_admin' ? 'Admin' : role === 'reviewer' ? 'Reviewer' : role === 'nurse' ? 'Nurse' : role === 'laboratory' ? 'Laboratory' : 'Clinician'}
              </span>

              {/* Sign Out Action Button */}
              <button
                type="button"
                onClick={() => signOut()}
                title="Sign out of workstation"
                aria-label="Sign out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '5px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#64748B',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                  e.currentTarget.style.borderColor = '#FCA5A5';
                  e.currentTarget.style.color = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#64748B';
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </>
        ) : (
          /* Collapsed State: Avatar + Sign Out Button */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div
              title={`${displayName} — ${displayTitle}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {avatarInitials}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              title="Sign out of workstation"
              aria-label="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '24px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
                e.currentTarget.style.color = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
