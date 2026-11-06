import React from 'react';
import { useCase, CaseSubTab } from '../../app/providers/CaseContext';
import {
  FileText,
  Activity,
  Search,
  GitBranch,
  BookOpen,
  Clock,
  Users2,
  CheckCircle,
  FileCheck2,
  ShieldAlert,
  FolderOpen,
  Cpu,
} from 'lucide-react';

export const CaseNav: React.FC = () => {
  const { activeCaseSubTab, setActiveCaseSubTab, activeCase } = useCase();

  const navLinks: Array<{ id: CaseSubTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    { id: 'summary', label: 'Summary', icon: <FileText size={15} /> },
    { id: 'clinical', label: 'Clinical data', icon: <Activity size={15} /> },
    { id: 'findings', label: 'Findings', icon: <Search size={15} />, badge: `${activeCase.findings.length}` },
    { id: 'reasoning', label: 'Reasoning', icon: <GitBranch size={15} />, badge: `${activeCase.hypotheses.length}` },
    { id: 'evidence', label: 'Evidence', icon: <BookOpen size={15} /> },
    { id: 'documents', label: 'Documents & FHIR', icon: <FolderOpen size={15} /> },
    { id: 'rules', label: 'Rules & CDS', icon: <Cpu size={15} />, badge: 'CDS', badgeColor: 'var(--accent-primary)' },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={15} /> },
    { id: 'team', label: 'Team', icon: <Users2 size={15} /> },
    { id: 'review', label: 'Nexus Review', icon: <CheckCircle size={15} />, badge: 'Review', badgeColor: 'var(--status-warning)' },
    { id: 'decision', label: 'Clinical Decision', icon: <FileCheck2 size={15} /> },
    { id: 'safety', label: 'Safety Issues', icon: <ShieldAlert size={15} />, badge: `${activeCase.safetyIssues.length}`, badgeColor: 'var(--status-danger)' },
  ];

  return (
    <nav
      aria-label="Case navigation tabs"
      style={{
        width: '210px',
        minWidth: '210px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        flexShrink: 0,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          padding: '0 10px 8px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Case Navigation
      </div>

      {navLinks.map((tab) => {
        const isActive = activeCaseSubTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveCaseSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-subtle)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </div>

            {tab.badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: tab.badgeColor ? 'var(--bg-surface)' : 'var(--text-muted)',
                  background: tab.badgeColor || 'var(--bg-subtle)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
