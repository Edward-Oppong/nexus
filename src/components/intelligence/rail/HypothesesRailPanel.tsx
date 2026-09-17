// ============================================================
// src/components/intelligence/rail/HypothesesRailPanel.tsx
// Core Rail Function 3: "Candidate Hypotheses"
// Shows candidate explanations, supporting/contradicting points
// Strictly prohibited from emitting % odds (Rule 10)
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { GitBranch, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export const HypothesesRailPanel: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const { hypotheses } = activeCase;

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
          <GitBranch size={13} color="#2563EB" />
          Candidate Hypotheses
        </span>
        <button
          onClick={() => setActiveCaseSubTab('reasoning')}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '11px',
            fontWeight: 600,
            color: '#2563EB',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          All ({hypotheses.length}) <ArrowRight size={11} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {hypotheses.slice(0, 3).map((h, idx) => (
          <div
            key={h.id}
            onClick={() => setActiveCaseSubTab('reasoning')}
            style={{
              padding: '8px 10px',
              borderRadius: '5px',
              background: '#F8FAFC',
              border: '1px solid #F1F5F9',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#64748B',
                }}
              >
                0{idx + 1}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0F172A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {h.title}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '10px',
                color: '#64748B',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#059669' }}>
                <CheckCircle size={10} />
                {h.supportingFindingIds.length} support
              </span>
              {h.contradictingFindingIds.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#DC2626' }}>
                  <XCircle size={10} />
                  {h.contradictingFindingIds.length} contradict
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
