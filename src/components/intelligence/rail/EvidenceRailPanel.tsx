// ============================================================
// src/components/intelligence/rail/EvidenceRailPanel.tsx
// Core Rail Function 2: "What evidence supports this?"
// Shows evidence retrieved by Nexus after analysis.
// No static mock data — empty state shown until analysis runs.
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { useDrawer } from '../../../app/providers/DrawerContext';
import { BookOpen, ExternalLink, FlaskConical } from 'lucide-react';

export const EvidenceRailPanel: React.FC = () => {
  const { setActiveCaseSubTab, nexusAssessment } = useCase();
  const { openEvidenceDrawer } = useDrawer();

  const assessmentSources = nexusAssessment?.evidenceSources ?? [];
  const nexusFindings = nexusAssessment?.nexusFindings ?? [];

  // Build display evidence from nexus assessment findings that have evidence source IDs
  // These are populated after retrieveEvidenceForCase() runs during Nexus analysis.
  const evidenceEntries = nexusFindings
    .filter((f) => f.evidenceSourceIds && f.evidenceSourceIds.length > 0)
    .flatMap((f) => (f.evidenceSourceIds || []).map((id) => ({ id, content: f.content })))
    .slice(0, 2);

  // Also check the flat evidenceSources list from the assessment
  const hasEvidence = assessmentSources.length > 0 || evidenceEntries.length > 0;

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
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <BookOpen size={13} color="#059669" />
          Clinical Evidence
        </span>
        {hasEvidence && (
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: '#059669',
              background: '#ECFDF5',
              padding: '2px 6px',
              borderRadius: '4px',
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
            padding: '16px 8px',
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <FlaskConical size={22} color="#94A3B8" />
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
            No evidence retrieved yet
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', lineHeight: 1.5 }}>
            Run Nexus Analysis to retrieve case-specific PubMed citations and clinical guidelines
          </div>
        </div>
      )}

      {/* Evidence source cards (if assessment ran and returned sources) */}
      {hasEvidence && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assessmentSources.slice(0, 2).map((src, idx) => (
            <div
              key={src.evidenceSourceId}
              style={{
                padding: '8px 10px',
                borderRadius: '5px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0F172A',
                  lineHeight: 1.35,
                }}
              >
                Evidence Source #{idx + 1}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: '#64748B',
                    wordBreak: 'break-all',
                  }}
                >
                  {src.evidenceSourceId}
                </span>
                <span
                  style={{
                    color: '#059669',
                    fontSize: '10px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    whiteSpace: 'nowrap',
                    marginLeft: '6px',
                  }}
                >
                  Rank #{src.retrievalRank} <ExternalLink size={9} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigate to full evidence tab */}
      <button
        onClick={() => setActiveCaseSubTab('evidence')}
        style={{
          border: '1px solid #E2E8F0',
          background: '#F8FAFC',
          borderRadius: '4px',
          padding: '6px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#334155',
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        {hasEvidence
          ? `View All ${assessmentSources.length} Evidence Sources ›`
          : 'Open Evidence Library ›'}
      </button>
    </section>
  );
};
