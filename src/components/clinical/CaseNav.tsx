import React from 'react';
import { useCase, CaseSubTab } from '../../app/providers/CaseContext';
import {
  FileText,
  Activity,
  Search,
  GitBranch,
  FlaskConical,
  BookOpen,
  Clock,
  Users2,
  CheckCircle,
  FileCheck2,
  ShieldAlert,
  FolderOpen,
} from 'lucide-react';

export const CaseNav: React.FC = () => {
  const { activeCaseSubTab, setActiveCaseSubTab, activeCase } = useCase();

  const navLinks: Array<{ id: CaseSubTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }> = [
    { id: 'summary', label: 'Summary', icon: <FileText size={15} /> },
    { id: 'clinical', label: 'Clinical data', icon: <Activity size={15} /> },
    { id: 'findings', label: 'Findings', icon: <Search size={15} />, badge: `${activeCase.findings.length}` },
    { id: 'reasoning', label: 'Reasoning', icon: <GitBranch size={15} />, badge: `${activeCase.hypotheses.length}` },
    { id: 'investigations', label: 'Investigations', icon: <FlaskConical size={15} />, badge: `${activeCase.investigations.length}` },
    { id: 'evidence', label: 'Evidence', icon: <BookOpen size={15} /> },
    { id: 'documents', label: 'Documents & FHIR', icon: <FolderOpen size={15} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={15} /> },
    { id: 'team', label: 'Team', icon: <Users2 size={15} /> },
    { id: 'review', label: 'Nexus Review', icon: <CheckCircle size={15} />, badge: 'Action', badgeColor: '#D97706' },
    { id: 'decision', label: 'Clinical Decision', icon: <FileCheck2 size={15} /> },
    { id: 'safety', label: 'Safety Issues', icon: <ShieldAlert size={15} />, badge: `${activeCase.safetyIssues.length}`, badgeColor: '#DC2626' },
  ];

  return (
    <nav
      aria-label="Case navigation tabs"
      style={{
        width: '210px',
        background: '#FAFAFA',
        borderRight: '1px solid #E2E8F0',
        padding: '16px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748B',
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
              borderRadius: '5px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#0F172A' : '#475569',
              background: isActive ? '#FFFFFF' : 'transparent',
              border: isActive ? '1px solid #E2E8F0' : '1px solid transparent',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.1s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: isActive ? '#0F172A' : '#94A3B8' }}>{tab.icon}</span>
              {tab.label}
            </div>

            {tab.badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: tab.badgeColor ? '#FFFFFF' : '#475569',
                  background: tab.badgeColor || '#E2E8F0',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  fontFamily: 'var(--font-mono)',
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
