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
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
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
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={13} color="var(--status-warning)" />
          Case Signals
        </span>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
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
            background: 'var(--status-safety-bg)',
            border: '1px solid var(--status-safety-border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: '11px',
            color: 'var(--status-safety-text)',
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
            <div style={{ fontSize: '11px', marginTop: '2px', lineHeight: 1.35, opacity: 0.9 }}>
              {firstSafety.details.slice(0, 70)}...
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                marginTop: '4px',
                textDecoration: 'underline',
              }}
            >
              Review in Safety Tab &rarr;
            </div>
          </div>
        </div>
      )}

      {/* Count Signals */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '12px',
        }}
      >
        {unreviewedFindingsCount > 0 && (
          <div
            onClick={() => setActiveCaseSubTab('findings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <FileQuestion size={13} color="var(--status-warning)" />
              <span>Unverified findings</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'var(--status-review-bg)',
                color: 'var(--status-review-text)',
                padding: '1px 6px',
                borderRadius: '9999px',
              }}
            >
              {unreviewedFindingsCount}
            </span>
          </div>
        )}

        {pendingInvestigationsCount > 0 && (
          <div
            onClick={() => setActiveCaseSubTab('clinical')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <Clock size={13} color="var(--accent-primary)" />
              <span>Pending investigations</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              {pendingInvestigationsCount}
            </span>
          </div>
        )}

        {highPriorityGapsCount > 0 && (
          <div
            onClick={() => setActiveCaseSubTab('summary')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <AlertTriangle size={13} color="var(--status-danger)" />
              <span>High priority gaps</span>
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'var(--status-safety-bg)',
                color: 'var(--status-safety-text)',
                padding: '1px 6px',
                borderRadius: '9999px',
              }}
            >
              {highPriorityGapsCount}
            </span>
          </div>
        )}

        {unreviewedFindingsCount === 0 &&
          pendingInvestigationsCount === 0 &&
          highPriorityGapsCount === 0 &&
          !firstSafety && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '8px 0',
              }}
            >
              No active acute signals flagged.
            </div>
          )}
      </div>
    </section>
  );
};
