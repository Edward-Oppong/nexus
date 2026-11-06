// ============================================================
// src/components/intelligence/rail/HypothesesRailPanel.tsx
// Core Rail Function 2: "Where the case is pointing"
// Candidate differential diagnoses ranked by evidence
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { GitBranch, ArrowRight, CheckCircle, Sparkles, Cpu } from 'lucide-react';

export const HypothesesRailPanel: React.FC = () => {
  const { activeCase, setActiveCaseSubTab, nexusAssessment } = useCase();
  const { hypotheses } = activeCase;

  // Use live assessment hypotheses if available, otherwise case hypotheses
  const nexusHypothesisFindings = nexusAssessment?.nexusFindings?.filter(
    (f) => f.findingType === 'SUPPORT'
  ) ?? [];

  const useNexusData = nexusHypothesisFindings.length > 0;

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
          {useNexusData ? (
            <Sparkles size={13} color="var(--accent-primary)" />
          ) : (
            <GitBranch size={13} color="var(--accent-primary)" />
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
            color: 'var(--accent-primary)',
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
                  padding: '9px 11px',
                  borderRadius: 'var(--radius-md)',
                  background: idx === 0 ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
                  border: idx === 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: idx === 0 ? 'var(--accent-primary)' : 'var(--text-muted)',
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
                      color: 'var(--text-primary)',
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
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                      paddingLeft: '16px',
                    }}
                  >
                    {rationale.slice(0, 90)}{rationale.length > 90 ? '...' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    fontSize: '9px', fontWeight: 600,
                    background: 'var(--bg-surface)', color: 'var(--accent-primary)',
                    padding: '1px 5px', borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <Cpu size={8} /> Nexus AI
                  </span>
                  {(f.findingIds?.length ?? 0) > 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      fontSize: '9px', fontWeight: 600,
                      background: 'var(--status-verified-bg)', color: 'var(--status-verified-text)',
                      padding: '1px 5px', borderRadius: '4px',
                      border: '1px solid var(--status-verified-border)',
                    }}>
                      <CheckCircle size={8} />
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
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              No candidate hypotheses yet.
              <br />
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Run Nexus Analysis to generate grounded differential diagnoses.</span>
            </div>
          ) : (
            hypotheses.slice(0, 3).map((h, idx) => (
              <div
                key={h.id}
                onClick={() => setActiveCaseSubTab('reasoning')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
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
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
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
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {h.title}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background:
                        h.status === 'Supported'
                          ? 'var(--status-verified-bg)'
                          : h.status === 'Contradicted'
                          ? 'var(--status-safety-bg)'
                          : 'var(--status-neutral-bg)',
                      color:
                        h.status === 'Supported'
                          ? 'var(--status-verified-text)'
                          : h.status === 'Contradicted'
                          ? 'var(--status-safety-text)'
                          : 'var(--status-neutral-text)',
                      border: `1px solid ${
                        h.status === 'Supported'
                          ? 'var(--status-verified-border)'
                          : h.status === 'Contradicted'
                          ? 'var(--status-safety-border)'
                          : 'var(--status-neutral-border)'
                      }`,
                    }}
                  >
                    {h.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};
