// ============================================================
// src/components/intelligence/rail/HypothesesRailPanel.tsx
// Core Rail Function 3: "Candidate Hypotheses"
// Shows candidate explanations from Nexus Assessment (preferred)
// or from case hypotheses if analysis not yet run.
// Strictly prohibited from emitting % odds (Rule 10)
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { GitBranch, ArrowRight, CheckCircle, XCircle, Cpu, Sparkles } from 'lucide-react';

export const HypothesesRailPanel: React.FC = () => {
  const { activeCase, nexusAssessment, setActiveCaseSubTab } = useCase();
  const { hypotheses } = activeCase;

  // Prefer Nexus AI hypotheses if assessment available
  const nexusHypothesisFindings = nexusAssessment?.nexusFindings.filter(
    (f) => f.findingType === 'SUPPORT'
  ) ?? [];

  const useNexusData = nexusHypothesisFindings.length > 0;

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
          {useNexusData ? (
            <Sparkles size={13} color="#0284C7" />
          ) : (
            <GitBranch size={13} color="#2563EB" />
          )}
          {useNexusData ? 'Nexus Differential' : 'Candidate Hypotheses'}
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
          All ({useNexusData ? nexusHypothesisFindings.length : hypotheses.length}) <ArrowRight size={11} />
        </button>
      </div>

      {useNexusData ? (
        // ── Nexus AI Assessment findings ──────────────────────
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {nexusHypothesisFindings.slice(0, 3).map((f, idx) => {
            const colonIdx = f.content.indexOf(':');
            const label = colonIdx > 0 ? f.content.slice(0, colonIdx) : f.content.slice(0, 50);
            const rationale = colonIdx > 0 ? f.content.slice(colonIdx + 1).trim() : '';

            return (
              <div
                key={f.id}
                onClick={() => setActiveCaseSubTab('reasoning')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '5px',
                  background: idx === 0 ? '#EFF6FF' : '#F8FAFC',
                  border: idx === 0 ? '1px solid #BFDBFE' : '1px solid #F1F5F9',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: idx === 0 ? '#1D4ED8' : '#64748B',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0F172A',
                      lineHeight: 1.3,
                    }}
                  >
                    {label}
                  </span>
                </div>
                {rationale && idx === 0 && (
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#64748B',
                      lineHeight: 1.4,
                      paddingLeft: '16px',
                    }}
                  >
                    {rationale.slice(0, 90)}{rationale.length > 90 ? '...' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    fontSize: '9px', fontWeight: 600,
                    background: '#EFF6FF', color: '#1D4ED8',
                    padding: '1px 5px', borderRadius: '8px',
                    border: '1px solid #BFDBFE',
                  }}>
                    <Cpu size={8} /> Nexus AI
                  </span>
                  {(f.findingIds?.length ?? 0) > 0 && (
                    <span style={{
                      fontSize: '9px', fontWeight: 600,
                      background: '#ECFDF5', color: '#065F46',
                      padding: '1px 5px', borderRadius: '8px',
                      border: '1px solid #A7F3D0',
                    }}>
                      <CheckCircle style={{ display: 'inline', verticalAlign: 'middle', width: '8px', height: '8px', marginRight: '2px' }} />
                      {f.findingIds?.length ?? 0} findings
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ── Case hypotheses fallback ───────────────────────────
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {hypotheses.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', padding: '8px', background: '#F8FAFC', borderRadius: '4px' }}>
              No candidate hypotheses yet.
              <br />
              <span style={{ fontSize: '10px' }}>Run Nexus Analysis to generate grounded differential diagnoses.</span>
            </div>
          ) : (
            hypotheses.slice(0, 3).map((h, idx) => (
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
            ))
          )}
        </div>
      )}
    </section>
  );
};
