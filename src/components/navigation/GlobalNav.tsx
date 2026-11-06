import React, { useState } from 'react';
import { useCase, MainView } from '../../app/providers/CaseContext';
import { useDrawer } from '../../app/providers/DrawerContext';
import { useAuth } from '../../features/authentication/AuthProvider';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BookOpen,
  CheckSquare,
  Sliders,
  HelpCircle,
  FileCheck2,
  AlertCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface NavItemConfig {
  id: MainView;
  label: string;
  icon: React.ReactNode;
  count?: number;
  isUrgentAlert?: boolean;
}

export const GlobalNav: React.FC = () => {
  const { activeView, setActiveView, pendingReviewCount, tasks, casesList } = useCase();
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
  const W = collapsed ? 56 : 240;

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
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={17} />, count: openTasksCount },
  ];

  // Group 2: Reference & Lookup
  const referenceGroup: NavItemConfig[] = [
    { id: 'patients', label: 'Patients', icon: <Users size={17} /> },
    { id: 'evidence-catalog', label: 'Evidence', icon: <BookOpen size={17} /> },
  ];

  // Group 3: Governance & Operations
  const governanceGroup: NavItemConfig[] = [
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
            padding: collapsed ? '9px 0' : '8px 12px',
            marginLeft: collapsed ? '6px' : '0',
            marginRight: collapsed ? '6px' : '0',
            width: collapsed ? '44px' : '100%',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
            border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            position: 'relative',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
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
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'color 0.15s ease',
              }}
            >
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
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
                  backgroundColor: 'var(--status-safety-bg)',
                  color: 'var(--status-safety-text)',
                  border: '1px solid var(--status-safety-border)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <AlertCircle size={10} />
                <span>{item.count}</span>
              </span>
            ) : (
              /* Quiet Informational Count Pill */
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: isActive ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  padding: '1px 6px',
                  borderRadius: '9999px',
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
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-danger)',
                border: '1.5px solid var(--bg-surface)',
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
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {/* ── Brand Header ───────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '16px 0' : '16px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          {/* Logo Mark with subtle glow */}
          <div
            title={collapsed ? 'Click to expand sidebar' : 'Nexus Workstation'}
            onClick={collapsed ? () => setCollapsed(false) : undefined}
            style={{
              width: '26px',
              height: '26px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary) 100%)',
              color: 'var(--bg-surface)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
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
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.1,
                }}
              >
                Nexus
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  letterSpacing: '0.02em',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    display: 'inline-block',
                  }}
                />
                Clinical Station
              </div>
            </div>
          )}
        </div>

        {/* Collapse Button */}
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
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
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

        {/* Hairline Separator */}
        <div
          style={{
            height: '1px',
            backgroundColor: 'var(--border-subtle)',
            margin: collapsed ? '8px 6px' : '8px 4px',
          }}
        />

        {/* Group 2: Reference & Lookup */}
        {renderNavGroup(referenceGroup)}

        {/* Group 3: Governance & Operations (Admin Only) */}
        {isAdmin && (
          <>
            <div
              style={{
                height: '1px',
                backgroundColor: 'var(--border-subtle)',
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
              width: '44px',
              padding: '8px 0',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
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

      {/* ── Theme Switcher Section ────────────────────────── */}
      <div style={{ padding: collapsed ? '4px 6px' : '8px 12px', flexShrink: 0 }}>
        <ThemeToggle collapsed={collapsed} />
      </div>

      {/* ── Shortcuts Button ──────────────────────────────── */}
      <div style={{ padding: collapsed ? '4px 6px' : '4px 12px', flexShrink: 0 }}>
        {!collapsed ? (
          <button
            onClick={openShortcuts}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={13} />
              <span>Keyboard Shortcuts</span>
            </span>
            <kbd
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-muted)',
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
              width: '44px',
              padding: '7px 0',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <HelpCircle size={13} />
          </button>
        )}
      </div>

      {/* ── Clinician Profile & Persona Footer ─────────────── */}
      <div
        style={{
          padding: collapsed ? '10px 6px' : '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-subtle)',
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
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {avatarInitials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
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
                    color: 'var(--text-muted)',
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
                  backgroundColor: role === 'organization_admin' ? 'var(--status-review-bg)' : 'var(--accent-subtle)',
                  color: role === 'organization_admin' ? 'var(--status-review-text)' : 'var(--accent-text)',
                  border: role === 'organization_admin' ? '1px solid var(--status-review-border)' : '1px solid var(--accent-subtle)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {role === 'organization_admin' ? 'Admin' : role === 'reviewer' ? 'Reviewer' : role === 'nurse' ? 'Nurse' : role === 'laboratory' ? 'Lab' : 'Clinician'}
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
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--status-safety-bg)';
                  e.currentTarget.style.borderColor = 'var(--status-safety-border)';
                  e.currentTarget.style.color = 'var(--status-safety-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-muted)';
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
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
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
                width: '30px',
                height: '26px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--status-safety-bg)';
                e.currentTarget.style.color = 'var(--status-safety-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
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
