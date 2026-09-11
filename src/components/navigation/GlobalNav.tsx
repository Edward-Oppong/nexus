import React, { useState } from 'react';
import { useCase, MainView } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import { useDrawer } from '../../app/providers/DrawerContext';
import { useAuth } from '../../features/authentication/AuthProvider';
import { OrganizationSwitcher } from '../../features/authentication/OrganizationSwitcher';
import { Shield } from 'lucide-react';
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
} from 'lucide-react';

export const GlobalNav: React.FC = () => {
  const { activeView, setActiveView, pendingReviewCount, tasks } = useCase();
  const { currentPersona, allPersonas, setPersonaById } = usePersona();
  const { openShortcuts } = useDrawer();
  const { role } = useAuth();

  const openTasksCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
  const [collapsed, setCollapsed] = useState(false);
  const W = collapsed ? 48 : 240;

  const navItems: Array<{
    id: MainView;
    label: string;
    icon: React.ReactNode;
    count?: number;
    badgeBg?: string;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'cases', label: 'Cases', icon: <FolderKanban size={17} />, count: 4 },
    {
      id: 'review-queue',
      label: 'Needs Review',
      icon: <FileCheck2 size={17} />,
      count: pendingReviewCount,
      badgeBg: '#FEF3C7',
      badgeColor: '#B45309',
    },
    { id: 'patients', label: 'Patients', icon: <Users size={17} /> },
    { id: 'investigations', label: 'Investigations', icon: <FlaskConical size={17} />, count: 2 },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={17} />, count: openTasksCount },
    { id: 'evidence-catalog', label: 'Evidence', icon: <BookOpen size={17} /> },
    { id: 'ai-governance', label: 'AI Governance', icon: <BrainCircuit size={17} /> },
    { id: 'administration', label: 'Administration', icon: <Sliders size={17} /> },
  ];

  return (
    <nav
      aria-label="Global application navigation"
      style={{
        width: `${W}px`,
        minWidth: `${W}px`,
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* ── Brand Header ─────────────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '16px 0' : '18px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          {/* Logo mark — clicking it when collapsed expands the sidebar */}
          <div
            title={collapsed ? 'Expand sidebar' : 'NEXUS Clinical Workstation'}
            onClick={collapsed ? () => setCollapsed(false) : undefined}
            style={{
              width: '22px',
              height: '22px',
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
              cursor: collapsed ? 'pointer' : 'default',
            }}
          >
            ⬡
          </div>

          {/* Wordmark — hidden when collapsed, routes to landing on click */}
          {!collapsed && (
            <div
              onClick={() => setActiveView('landing')}
              title="Return to Nexus Overview & Landing Page"
              style={{ overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '15px',
                  letterSpacing: '-0.02em',
                  color: '#0F172A',
                }}
              >
                NEXUS
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Clinical Workstation
              </div>
            </div>
          )}
        </div>

        {/* Collapse button — visible only in expanded state */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '4px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#475569';
              (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            {/* Double-chevron left */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M9 3L5 7.5L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 3L9 7.5L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Org Switcher (expanded only) ─────────────────── */}
      {!collapsed && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #F1F5F9',
            background: '#FAFAFA',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
              color: '#64748B',
              marginBottom: '4px',
            }}
          >
            Tenant Context
          </div>
          <OrganizationSwitcher />
        </div>
      )}

      {/* ── Primary Navigation ───────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '12px 0' : '16px 12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '2px',
          overflowY: 'auto' as const,
          overflowX: 'hidden' as const,
        }}
      >
        {!collapsed && (
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              color: '#94A3B8',
              padding: '0 8px 6px',
            }}
          >
            Workspace
          </div>
        )}

        {navItems.map((item) => {
          const isActive =
            activeView === item.id ||
            (item.id === 'cases' && activeView === 'case-workspace');

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '9px 0' : '8px 10px',
                marginLeft: collapsed ? '4px' : '0',
                marginRight: collapsed ? '4px' : '0',
                width: collapsed ? '40px' : '100%',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#0F172A' : '#475569',
                background: isActive ? '#F1F5F9' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left' as const,
                transition: 'all 0.1s ease',
                position: 'relative' as const,
                flexShrink: 0,
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
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </div>

              {/* Badge — expanded only */}
              {!collapsed && item.count ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: item.badgeBg || (isActive ? '#E2E8F0' : '#F1F5F9'),
                    color: item.badgeColor || '#334155',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {item.count}
                </span>
              ) : null}

              {/* Dot indicator — collapsed with count */}
              {collapsed && item.count ? (
                <span
                  style={{
                    position: 'absolute' as const,
                    top: '6px',
                    right: '5px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: item.badgeColor || '#334155',
                    border: '1.5px solid #FFFFFF',
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── Expand button (collapsed only) ──────────────── */}
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
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#475569';
              (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            {/* Double-chevron right — expand */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M6 3L10 7.5L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 3L6 7.5L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Shortcuts button ─────────────────────────────── */}
      <div style={{ padding: collapsed ? '4px 4px' : '8px 12px', flexShrink: 0 }}>
        {!collapsed ? (
          <button
            onClick={openShortcuts}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={13} /> Shortcuts
            </span>
            <kbd
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '1px 5px',
                borderRadius: '3px',
                fontFamily: 'var(--font-mono)',
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
              background: '#F8FAFC',
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

      {/* ── User / Persona Section ───────────────────────── */}
      <div
        style={{
          padding: collapsed ? '10px 4px' : '14px 16px',
          borderTop: '1px solid #E2E8F0',
          background: '#FAFAFA',
          flexShrink: 0,
        }}
      >
        {!collapsed ? (
          <>
            <div style={{ marginBottom: '8px' }}>
              <label
                htmlFor="demo-persona-select"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.04em',
                  color: '#64748B',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Demo Persona Switcher
              </label>
              <select
                id="demo-persona-select"
                aria-label="Demo Persona Switcher"
                value={currentPersona.id}
                onChange={(e) => setPersonaById(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {allPersonas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.roleDisplay} ({p.name})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '3px', lineHeight: 1.2 }}>
                Prototype demonstration mechanism; does not represent production authorization.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {currentPersona.avatarInitials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0F172A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {currentPersona.name}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>{currentPersona.title}</div>
              </div>
            </div>

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: role === 'organization_admin' ? '#FEF3C7' : '#E0F2FE',
                  color: role === 'organization_admin' ? '#92400E' : '#0369A1',
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.04em',
                }}
              >
                ROLE: {role}
              </span>
              <span style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} style={{ color: '#059669' }} /> RLS Guarded
              </span>
            </div>

            <div style={{ marginTop: '6px', textAlign: 'right' as const }}>
              <button
                type="button"
                onClick={() => setActiveView('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '10px',
                  color: '#0284c7',
                  cursor: 'pointer',
                  padding: '2px 0',
                  textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >
                Sign in with credentials →
              </button>
            </div>
          </>
        ) : (
          /* Collapsed: avatar only */
          <div
            title={`${currentPersona.name} — ${currentPersona.title}`}
            style={{
              width: '40px',
              height: '32px',
              marginLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {currentPersona.avatarInitials}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
