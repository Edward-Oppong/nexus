// ============================================================
// src/components/intelligence/rail/EvidenceRailPanel.tsx
// Core Rail Function 2: "What evidence supports this?"
// Surfaces case-specific MedCPT-retrieved evidence when a
// Nexus assessment exists; falls back to baseline guidelines.
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { useDrawer } from '../../../app/providers/DrawerContext';
import { BookOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { MOCK_EVIDENCE_ITEMS } from '../../../data/evidence/mockEvidence';

export const EvidenceRailPanel: React.FC = () => {
  const { setActiveCaseSubTab, nexusAssessment } = useCase();
  const { openEvidenceDrawer } = useDrawer();

  // If a Nexus assessment has been run, match its retrieved evidence IDs
  // against the MOCK_EVIDENCE_ITEMS library (which mirrors what evidence-service returns).
  const assessmentSources = nexusAssessment?.evidenceSources ?? [];
  const isCaseAnalysed = assessmentSources.length > 0;

  const matchedEvidence = isCaseAnalysed
    ? assessmentSources
        .slice(0, 4)
        .map((src) => MOCK_EVIDENCE_ITEMS.find((ev) => ev.id === src.evidenceSourceId))
        .filter((ev): ev is NonNullable<typeof ev> => ev !== undefined)
        .slice(0, 2)
    : [];

  // Fall back to top-2 baseline guidelines when no case-matched evidence is available
  const displayEvidence =
    matchedEvidence.length > 0 ? matchedEvidence : MOCK_EVIDENCE_ITEMS.slice(0, 2);

  const isCaseSpecific = matchedEvidence.length > 0;

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
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: isCaseSpecific ? '#059669' : '#64748B',
            background: isCaseSpecific ? '#ECFDF5' : '#F1F5F9',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {isCaseSpecific ? 'Case-Matched' : 'MedCPT Reranked'}
        </span>
      </div>

      {/* Prompt to run analysis when no assessment exists */}
      {!isCaseAnalysed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            padding: '6px 8px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#92400E',
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={11} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>Run Nexus Analysis to retrieve case-specific evidence citations</span>
        </div>
      )}

      {/* Evidence cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayEvidence.map((ev) => (
          <div
            key={ev.id}
            onClick={() => openEvidenceDrawer(ev)}
            style={{
              padding: '8px 10px',
              borderRadius: '5px',
              background: isCaseSpecific ? '#F0FDF4' : '#F8FAFC',
              border: `1px solid ${isCaseSpecific ? '#BBF7D0' : '#F1F5F9'}`,
              cursor: 'pointer',
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
              {ev.title}
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
              <span>{ev.sourceOrganization} ({ev.publicationYear})</span>
              <span style={{ color: '#0284C7', display: 'flex', alignItems: 'center', gap: '2px' }}>
                Inspect <ExternalLink size={9} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer nav */}
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
        View Full Evidence Library ›
      </button>
    </section>
  );
};
