import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { AlertTriangle, ShieldAlert, ArrowRight, Activity, FileText, FlaskConical } from 'lucide-react';

export const SummaryTab: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const { chiefComplaint, historyOfPresentIllness, hypotheses, uncertainty, safetyIssues, informationGaps } = activeCase;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Summary Card */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>
          Executive Case Summary
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.4 }}>
          {chiefComplaint}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {historyOfPresentIllness}
        </p>
      </section>

      {/* Triage & Next Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Candidate Hypotheses Snapshot */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Candidate Hypotheses
            </h3>
            <button
              onClick={() => setActiveCaseSubTab('reasoning')}
              style={{ border: 'none', background: 'transparent', fontSize: '11px', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
            >
              Explore reasoning <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hypotheses.map((h, idx) => (
              <div
                key={h.id}
                onClick={() => setActiveCaseSubTab('reasoning')}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  transition: 'background 0.15s ease',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{idx + 1}. {h.title}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{h.statusDetail}</div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: h.status === 'Supported' ? 'var(--status-success)' : h.status === 'Uncertain' ? 'var(--status-warning)' : 'var(--status-danger)',
                    background: h.status === 'Supported' ? 'var(--success-subtle)' : h.status === 'Uncertain' ? 'var(--warning-subtle)' : 'var(--danger-subtle)',
                    border: `1px solid ${h.status === 'Supported' ? 'var(--success-border)' : h.status === 'Uncertain' ? 'var(--warning-border)' : 'var(--danger-border)'}`,
                    padding: '2px 7px',
                    borderRadius: '4px',
                  }}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Unresolved Clinical Gaps */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              High-Priority Clinical Gaps
            </h3>
            <button
              onClick={() => setActiveCaseSubTab('clinical')}
              style={{ border: 'none', background: 'transparent', fontSize: '11px', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
            >
              View clinical data <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {informationGaps.map((gap) => (
              <div
                key={gap.id}
                style={{
                  padding: '10px 12px',
                  background: 'var(--warning-subtle)',
                  border: '1px solid var(--warning-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{gap.testName}</strong>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-warning)', textTransform: 'uppercase' }}>{gap.priority}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
                  {gap.whyItMatters}
                </p>
              </div>
            ))}

            {safetyIssues.length > 0 && (
              <div
                onClick={() => setActiveCaseSubTab('safety')}
                style={{
                  padding: '10px 12px',
                  background: 'var(--danger-subtle)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-danger)', fontWeight: 700 }}>
                  <ShieldAlert size={14} /> Active Safety Review
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                  {safetyIssues[0].title}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
