import React, { useState, useMemo } from 'react';
import { useDrawer } from '../../../app/providers/DrawerContext';
import { useCase } from '../../../app/providers/CaseContext';
import {
  BookOpen,
  ExternalLink,
  Filter,
  Search,
  FlaskConical,
  CheckCircle2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { AuthorityTier, AUTHORITY_TIER_LABELS } from '../../../domain/evidence';

// ============================================================
// EvidenceTab — displays ONLY evidence retrieved by Nexus
// analysis (live PubMed + MedCPT). No static mock items.
// ============================================================

export const EvidenceTab: React.FC = () => {
  const { openEvidenceDrawer } = useDrawer();
  const { activeCase, nexusAssessment } = useCase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHypothesis, setSelectedHypothesis] = useState<string>('ALL');

  // Build evidence list from nexusAssessment findings that carry evidence source IDs
  // These are populated after retrieveEvidenceForCase() runs during Nexus analysis.
  const evidenceFromAssessment = useMemo(() => {
    if (!nexusAssessment) return [];

    const sources = nexusAssessment.evidenceSources ?? [];
    const findings = nexusAssessment.nexusFindings ?? [];

    // Map each evidence source to a display object
    return sources.map((src) => {
      // Find which hypothesis findings cite this source
      const linkedFindings = findings.filter(
        (f) => f.evidenceSourceIds?.includes(src.evidenceSourceId)
      );

      // Try to match a hypothesis from the case
      const linkedHyps = activeCase.hypotheses.filter((h) =>
        linkedFindings.some((f) => f.findingIds?.includes(h.id) || f.content?.toLowerCase().includes(h.title.toLowerCase()))
      );

      return {
        id: src.evidenceSourceId,
        retrievalRank: src.retrievalRank,
        relevanceScore: src.relevanceScore,
        linkedFindings,
        linkedHyps,
      };
    });
  }, [nexusAssessment, activeCase.hypotheses]);

  const filtered = useMemo(() => {
    return evidenceFromAssessment.filter((ev) => {
      if (selectedHypothesis !== 'ALL') {
        if (!ev.linkedHyps.some((h) => h.id === selectedHypothesis)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!ev.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [evidenceFromAssessment, selectedHypothesis, searchQuery]);

  const hasEvidence = evidenceFromAssessment.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <BookOpen size={20} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Traceable Clinical Evidence
          </h2>
          {hasEvidence && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'var(--success-subtle)',
                color: 'var(--status-success)',
                border: '1px solid var(--success-border)',
                padding: '2px 10px',
                borderRadius: '20px',
              }}
            >
              {evidenceFromAssessment.length} sources retrieved
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          Evidence is retrieved live from PubMed/Europe PMC via MedCPT ranking during Nexus Analysis.
          All citations are case-specific — no generic static guidelines are shown.
        </p>
      </div>

      {/* Not-yet-analysed state */}
      {!nexusAssessment && (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            border: '1px dashed var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FlaskConical size={40} color="var(--border-medium)" />
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            No evidence retrieved yet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6 }}>
            Run Nexus Analysis to retrieve case-specific PubMed citations, clinical guidelines,
            and peer-reviewed evidence ranked by MedCPT relevance to this case's hypotheses.
          </div>
        </div>
      )}

      {/* Analysis ran but returned no evidence */}
      {nexusAssessment && !hasEvidence && (
        <div
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            background: 'var(--warning-subtle)',
            borderRadius: '12px',
            border: '1px solid var(--warning-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={32} color="var(--status-warning)" />
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-warning)' }}>
            No evidence sources were retrieved for this analysis
          </div>
          <div style={{ fontSize: '12px', color: 'var(--status-warning)', maxWidth: '380px', lineHeight: 1.6 }}>
            PubMed retrieval may have been unavailable at analysis time, or the case presentation
            did not match any indexed clinical guidelines. Try re-running Nexus Analysis.
          </div>
        </div>
      )}

      {/* Filter bar — only shown when there is evidence */}
      {hasEvidence && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by source ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: 'var(--text-primary)',
                background: 'transparent',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Hypothesis:</span>
            <select
              value={selectedHypothesis}
              onChange={(e) => setSelectedHypothesis(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                maxWidth: '220px',
              }}
            >
              <option value="ALL">All Hypotheses</option>
              {activeCase.hypotheses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Evidence cards */}
      {hasEvidence && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '36px',
                textAlign: 'center',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No evidence matching the selected filters.
            </div>
          ) : (
            filtered.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--status-success)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,150,105,0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  {/* Top badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--status-success)',
                        background: 'var(--success-subtle)',
                        border: '1px solid var(--success-border)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Rank #{ev.retrievalRank}
                    </span>
                    {ev.relevanceScore !== undefined && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          background: 'var(--accent-subtle)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        Score: {ev.relevanceScore.toFixed ? ev.relevanceScore.toFixed(2) : ev.relevanceScore}
                      </span>
                    )}
                  </div>

                  {/* Source ID */}
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-mono)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {ev.id}
                  </div>

                  {/* What nexus finding cited this */}
                  {ev.linkedFindings.length > 0 && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: '8px',
                        background: 'var(--bg-subtle)',
                        padding: '8px 10px',
                        borderRadius: '5px',
                        border: '1px solid var(--bg-subtle)',
                      }}
                    >
                      <strong>Referenced in assessment:</strong>{' '}
                      {ev.linkedFindings[0].content.slice(0, 160)}
                      {ev.linkedFindings[0].content.length > 160 ? '…' : ''}
                    </div>
                  )}

                  {/* Linked hypotheses */}
                  {ev.linkedHyps.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Linked to:</span>
                      {ev.linkedHyps.map((h) => (
                        <span
                          key={h.id}
                          style={{
                            fontSize: '11px',
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-primary)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-medium)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Tag size={10} />
                          {h.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <CheckCircle2 size={18} color="var(--status-success)" />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MedCPT Retrieved</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
