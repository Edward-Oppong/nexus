// ============================================================
// src/components/intelligence/rail/NexusAnalysisRailPanel.tsx
// Core Rail Function 7: "Live Nexus Analysis Output"
// Surfaces the most recent NexusAssessment in a compact,
// scannable format — hypotheses, contradictions, recommendations
// directly in the right sidebar without needing to switch tabs.
// ============================================================

import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Loader,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const NexusAnalysisRailPanel: React.FC = () => {
  const {
    nexusAssessment,
    isRunningAnalysis,
    analysisStage,
    runNexusAnalysis,
    setActiveCaseSubTab,
  } = useCase();

  const [isExpanded, setIsExpanded] = useState(true);

  // ── Running / Loading State ─────────────────────────────────
  if (isRunningAnalysis && analysisStage) {
    return (
      <section
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          color: '#F8FAFC',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="#38BDF8" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#F8FAFC',
            }}
          >
            Nexus Analysis Running
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#1E293B', borderRadius: '4px', overflow: 'hidden', height: '4px' }}>
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
              width: `${(analysisStage.stageIndex / analysisStage.totalStages) * 100}%`,
              transition: 'width 0.5s ease',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} color="#38BDF8" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#CBD5E1' }}>
              {analysisStage.stageName}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', lineHeight: 1.35 }}>
              {analysisStage.detail}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>
          Stage {analysisStage.stageIndex} / {analysisStage.totalStages}
        </div>
      </section>
    );
  }

  // ── Empty State ─────────────────────────────────────────────
  if (!nexusAssessment) {
    return (
      <section
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#38BDF8" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#F8FAFC',
            }}
          >
            Nexus Analysis
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
          Run the 4-stage clinical reasoning pipeline to generate grounded differential hypotheses,
          detect contradictions, and retrieve live PubMed evidence.
        </p>

        <button
          onClick={() => runNexusAnalysis()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: 'none',
            background: '#0284C7',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            width: '100%',
          }}
        >
          <RefreshCw size={12} />
          Run Nexus Analysis
        </button>
      </section>
    );
  }

  // ── Hypothesis findings ─────────────────────────────────────
  const hypFindings = nexusAssessment.nexusFindings.filter((f) => f.findingType === 'SUPPORT');
  const contradictions = nexusAssessment.contradictions ?? [];
  const recommendations = nexusAssessment.recommendations ?? [];
  const missingFindings = nexusAssessment.nexusFindings.filter((f) => f.findingType === 'MISSING_INFORMATION');

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        border: '1px solid #334155',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #1E293B' : 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} color="#38BDF8" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#F8FAFC',
            }}
          >
            Nexus Assessment
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              runNexusAnalysis();
            }}
            title="Re-run analysis"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={11} />
          </button>
          {isExpanded ? (
            <ChevronDown size={13} color="#64748B" />
          ) : (
            <ChevronRight size={13} color="#64748B" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '10px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Executive Summary */}
          {nexusAssessment.summary && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '5px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                fontSize: '11px',
                color: '#BAE6FD',
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '9px', letterSpacing: '0.08em', color: '#38BDF8', marginBottom: '4px', textTransform: 'uppercase' }}>
                SUMMARY
              </div>
              {nexusAssessment.summary.length > 200
                ? nexusAssessment.summary.slice(0, 197) + '...'
                : nexusAssessment.summary}
            </div>
          )}

          {/* Top Hypotheses (max 3) */}
          {hypFindings.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748B',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                Differential ({hypFindings.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {hypFindings.slice(0, 3).map((f, i) => {
                  const labelMatch = f.content.match(/^([^:]+):/);
                  const label = labelMatch ? labelMatch[1] : f.content.slice(0, 40);
                  const rationale = labelMatch ? f.content.slice(labelMatch[0].length).trim() : '';

                  return (
                    <div
                      key={f.id}
                      onClick={() => setActiveCaseSubTab('reasoning')}
                      style={{
                        padding: '7px 9px',
                        borderRadius: '5px',
                        background: i === 0 ? 'rgba(2, 132, 199, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        border: i === 0 ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(255,255,255,0.07)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: i === 0 ? '#38BDF8' : '#64748B',
                            fontFamily: 'monospace',
                            marginTop: '1px',
                            flexShrink: 0,
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: i === 0 ? '#E2E8F0' : '#94A3B8',
                            lineHeight: 1.3,
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      {rationale && i === 0 && (
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#64748B',
                            lineHeight: 1.4,
                            paddingLeft: '16px',
                          }}
                        >
                          {rationale.slice(0, 100)}{rationale.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contradictions (max 2) */}
          {contradictions.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748B',
                  marginBottom: '5px',
                }}
              >
                Contradictions ({contradictions.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {contradictions.slice(0, 2).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '6px 9px',
                      borderRadius: '4px',
                      background: 'rgba(220, 38, 38, 0.08)',
                      border: '1px solid rgba(220, 38, 38, 0.2)',
                      fontSize: '10px',
                      color: '#FCA5A5',
                      lineHeight: 1.4,
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <AlertTriangle size={11} color="#F87171" style={{ flexShrink: 0, marginTop: '1px' }} />
                    {c.explanation.length > 100 ? c.explanation.slice(0, 97) + '...' : c.explanation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing information count */}
          {missingFindings.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 9px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: '10px',
                color: '#FCD34D',
              }}
            >
              <Info size={11} color="#FBBF24" style={{ flexShrink: 0 }} />
              {missingFindings.length} investigation(s) recommended to confirm diagnosis
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#64748B',
                  marginBottom: '5px',
                }}
              >
                Recommendations ({recommendations.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recommendations.slice(0, 2).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '6px 9px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.07)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: '10px',
                      color: '#6EE7B7',
                      lineHeight: 1.4,
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <CheckCircle2 size={11} color="#34D399" style={{ flexShrink: 0, marginTop: '1px' }} />
                    {r.content.length > 100 ? r.content.slice(0, 97) + '...' : r.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: metadata + view full */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '4px',
              borderTop: '1px solid #1E293B',
            }}
          >
            <span style={{ fontSize: '9px', color: '#475569', fontFamily: 'monospace' }}>
              {nexusAssessment.modelName} · {nexusAssessment.promptVersion}
            </span>
            <button
              onClick={() => setActiveCaseSubTab('reasoning')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '10px',
                fontWeight: 600,
                color: '#38BDF8',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              Full Report <ArrowRight size={10} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
