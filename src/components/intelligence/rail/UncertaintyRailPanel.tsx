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
          <HelpCircle size={13} color="#64748B" />
          Uncertainty & Gaps
        </span>
        <span
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: '#B45309',
            background: '#FEF3C7',
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
              background: '#F8FAFC',
              borderLeft: '3px solid #94A3B8',
              fontSize: '11px',
              color: '#334155',
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
              color: '#64748B',
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
            onClick={() => setActiveCaseSubTab('investigations')}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              fontSize: '11px',
              color: '#64748B',
              cursor: 'pointer',
              paddingTop: '2px',
            }}
          >
            <Clock size={12} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
            <span>
              Assessment conditioned on {pendingTests.length} pending test(s) ({pendingTests.map((t) => t.testName || t.id).slice(0, 2).join(', ')})
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
