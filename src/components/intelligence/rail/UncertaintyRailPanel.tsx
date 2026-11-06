// ============================================================
// src/components/intelligence/rail/UncertaintyRailPanel.tsx
// Core Rail Function 4: "Uncertainty & Contradictions"
// Explicitly surfaces what Nexus cannot assess, conflicting vitals,
// and unresolved data gaps to counteract automation bias
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { HelpCircle, Clock } from 'lucide-react';

export const UncertaintyRailPanel: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const { uncertainty, investigations } = activeCase;

  const pendingTests = investigations.filter(
    (inv) => inv.status !== 'COMPLETED' && inv.status !== 'Result available' && inv.status !== 'CANCELLED' && inv.status !== 'Cancelled'
  );

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
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
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <HelpCircle size={13} color="var(--text-muted)" />
          Uncertainty & Gaps
        </span>
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--status-warning)',
            background: 'var(--warning-subtle)',
            border: '1px solid var(--warning-border)',
            padding: '2px 5px',
            borderRadius: '3px',
          }}
        >
          {uncertainty.overallState}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Primary Qualitative Uncertainty Reason */}
        {uncertainty.primaryReason && (
          <div
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              background: 'var(--bg-subtle)',
              borderLeft: '3px solid var(--border-strong)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            {uncertainty.primaryReason}
          </div>
        )}

        {/* Evidence Consistency Detail */}
        {uncertainty.evidenceConsistencyReason && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.35,
              paddingLeft: '4px',
            }}
          >
            • {uncertainty.evidenceConsistencyReason}
          </div>
        )}

        {/* Pending Tests limiting assessment */}
        {pendingTests.length > 0 && (
          <div
            onClick={() => setActiveCaseSubTab('clinical')}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              paddingTop: '2px',
            }}
          >
            <Clock size={12} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--status-warning)' }} />
            <span>
              Assessment conditioned on {pendingTests.length} pending test(s) ({pendingTests.map((t) => t.testName || t.id).slice(0, 2).join(', ')})
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
