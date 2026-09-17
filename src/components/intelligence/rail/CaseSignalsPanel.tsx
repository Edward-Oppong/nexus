// ============================================================
// src/components/intelligence/rail/CaseSignalsPanel.tsx
// Core Rail Function 1: "What matters now"
// Deterministic engine flags, safety alerts, and unverified data
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { AlertTriangle, Clock, ShieldAlert, FileQuestion } from 'lucide-react';

export const CaseSignalsPanel: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const { safetyIssues, findings, investigations, informationGaps } = activeCase;

  const unreviewedFindingsCount = findings.filter(
    (f) => f.provenance.verificationStatus === 'Unverified'
  ).length;

  const pendingInvestigationsCount = investigations.filter(
    (inv) => inv.status !== 'COMPLETED' && inv.status !== 'Result available' && inv.status !== 'CANCELLED' && inv.status !== 'Cancelled'
  ).length;

  const highPriorityGapsCount = informationGaps.filter(
    (g) => g.priority === 'HIGH PRIORITY'
  ).length;

  const firstSafety = safetyIssues.length > 0 ? safetyIssues[0] : null;

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={13} color="#D97706" />
          Case Signals
        </span>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: '#64748B',
            background: '#F1F5F9',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          DETERMINISTIC
        </span>
      </div>

      {/* Safety alert if any */}
      {firstSafety && (
        <div
          onClick={() => setActiveCaseSubTab('safety')}
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '5px',
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700 }}>
              {(firstSafety.category ?? 'SAFETY').toUpperCase()} ALERT
            </div>
            <div style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '2px', lineHeight: 1.35 }}>
              {firstSafety.description}
            </div>
          </div>
        </div>
      )}

      {/* Unverified Findings */}
      {unreviewedFindingsCount > 0 && (
        <div
          onClick={() => setActiveCaseSubTab('findings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            background: '#FFFBEB',
            borderRadius: '4px',
            border: '1px solid #FDE68A',
            fontSize: '11px',
            color: '#92400E',
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileQuestion size={12} />
            {unreviewedFindingsCount} unverified finding(s)
          </span>
          <span style={{ fontWeight: 700, fontSize: '10px' }}>Review ›</span>
        </div>
      )}

      {/* Pending Investigations */}
      {pendingInvestigationsCount > 0 && (
        <div
          onClick={() => setActiveCaseSubTab('investigations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            background: '#F8FAFC',
            borderRadius: '4px',
            border: '1px solid #E2E8F0',
            fontSize: '11px',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} />
            {pendingInvestigationsCount} test(s) pending
          </span>
          <span style={{ fontWeight: 600, fontSize: '10px' }}>View ›</span>
        </div>
      )}

      {/* High Priority Missing Information */}
      {highPriorityGapsCount > 0 && (
        <div
          onClick={() => setActiveCaseSubTab('investigations')}
          style={{
            fontSize: '11px',
            color: '#64748B',
            lineHeight: 1.35,
            paddingLeft: '4px',
            cursor: 'pointer',
          }}
        >
          • {highPriorityGapsCount} critical information gap(s) identified
        </div>
      )}
    </section>
  );
};
