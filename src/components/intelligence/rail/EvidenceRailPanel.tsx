// ============================================================
// src/components/intelligence/rail/EvidenceRailPanel.tsx
// Core Rail Function 3: "Why the AI thinks so"
// Direct line to literature and guideline grounding
// Zero mock/static data — rendered ONLY from live retrieved evidence
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { BookOpen, ExternalLink, ShieldCheck, ArrowRight, FlaskConical } from 'lucide-react';

export const EvidenceRailPanel: React.FC = () => {
  const { nexusAssessment, setActiveCaseSubTab } = useCase();

  // Extract evidence sources from nexusAssessment (populated from live PubMed)
  const assessmentSources = nexusAssessment?.evidenceSources ?? [];

  // Finding-level citations from the assessment findings
  const evidenceEntries = (nexusAssessment?.nexusFindings ?? [])
    .filter((f) => (f.evidenceSourceIds?.length ?? 0) > 0)
    .slice(0, 2);

  // Also check the flat evidenceSources list from the assessment
  const hasEvidence = assessmentSources.length > 0 || evidenceEntries.length > 0;

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
      {/* Header */}
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
          <BookOpen size={13} color="var(--status-success)" />
          Clinical Evidence
        </span>
        {hasEvidence && (
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--status-verified-text)',
              background: 'var(--status-verified-bg)',
              border: '1px solid var(--status-verified-border)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {assessmentSources.length} source{assessmentSources.length !== 1 ? 's' : ''} retrieved
          </span>
        )}
      </div>

      {/* Empty state — no analysis run yet */}
      {!hasEvidence && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '18px 10px',
            background: 'var(--bg-subtle)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}
        >
          <FlaskConical size={22} color="var(--text-muted)" />
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            No evidence retrieved yet
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Run Nexus Analysis to fetch live PubMed / Europe PMC clinical evidence for this case.
          </div>
        </div>
      )}

      {/* Live evidence sources from assessment */}
      {hasEvidence && assessmentSources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assessmentSources.slice(0, 3).map((src) => (
            <div
              key={src.evidenceSourceId}
              onClick={() => setActiveCaseSubTab('evidence')}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '4px',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {src.evidenceSourceId.replace(/-/g, ' ').toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  Rank #{src.retrievalRank}
                </span>
              </div>

              {src.relevanceScore !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <div
                    style={{
                      flex: 1,
                      height: '3px',
                      background: 'var(--border-subtle)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.round(src.relevanceScore * 100))}%`,
                        height: '100%',
                        background: 'var(--status-success)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(src.relevanceScore * 100)}% relevance
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Finding-linked evidence citations */}
      {hasEvidence && assessmentSources.length === 0 && evidenceEntries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {evidenceEntries.map((f) => (
            <div
              key={f.id}
              onClick={() => setActiveCaseSubTab('evidence')}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {f.content.slice(0, 45)}...
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={10} color="var(--status-success)" />
                <span>{f.evidenceSourceIds?.length} PubMed citation(s) linked</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasEvidence && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
          <button
            onClick={() => setActiveCaseSubTab('evidence')}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '4px 0',
            }}
          >
            <span>Open Evidence Workspace</span>
            <ArrowRight size={11} />
          </button>
        </div>
      )}
    </section>
  );
};
