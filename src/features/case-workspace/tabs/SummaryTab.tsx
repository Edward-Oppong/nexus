import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { AlertTriangle, ShieldAlert, ArrowRight, Activity, FileText, FlaskConical } from 'lucide-react';

export const SummaryTab: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const { chiefComplaint, historyOfPresentIllness, hypotheses, uncertainty, safetyIssues, informationGaps } = activeCase;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Executive Summary Card */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
          Executive Case Summary
        </div>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '10px', lineHeight: 1.4 }}>
          {chiefComplaint}
        </h2>
        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
          {historyOfPresentIllness}
        </p>
      </section>

      {/* Triage & Next Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Candidate Hypotheses Snapshot */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em' }}>
              Candidate Hypotheses
            </h3>
            <button
              onClick={() => setActiveCaseSubTab('reasoning')}
              style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
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
                  padding: '8px 10px',
                  background: '#F8FAFC',
                  borderRadius: '4px',
                  border: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{idx + 1}. {h.title}</span>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{h.statusDetail}</div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: h.status === 'Supported' ? '#047857' : h.status === 'Uncertain' ? '#B45309' : '#B91C1C',
                    background: h.status === 'Supported' ? '#ECFDF5' : h.status === 'Uncertain' ? '#FEF3C7' : '#FEF2F2',
                    padding: '2px 6px',
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
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em' }}>
              High-Priority Clinical Gaps
            </h3>
            <button
              onClick={() => setActiveCaseSubTab('investigations')}
              style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              View orders <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {informationGaps.map((gap) => (
              <div
                key={gap.id}
                style={{
                  padding: '10px 12px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#92400E' }}>{gap.testName}</strong>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#B45309' }}>{gap.priority}</span>
                </div>
                <p style={{ color: '#78350F', fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
                  {gap.whyItMatters}
                </p>
              </div>
            ))}

            {safetyIssues.length > 0 && (
              <div
                onClick={() => setActiveCaseSubTab('safety')}
                style={{
                  padding: '10px 12px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B', fontWeight: 700 }}>
                  <ShieldAlert size={14} /> Active Safety Review
                </div>
                <div style={{ color: '#7F1D1D', fontSize: '11px', marginTop: '2px' }}>
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
