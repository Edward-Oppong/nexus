// ============================================================
// src/components/intelligence/rail/EvidenceRailPanel.tsx
// Core Rail Function 2: "What evidence supports this?"
// Surfaces MedCPT-retrieved guidelines and literature excerpts
// ============================================================

import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { useDrawer } from '../../../app/providers/DrawerContext';
import { BookOpen, ExternalLink } from 'lucide-react';
import { MOCK_EVIDENCE_ITEMS } from '../../../data/evidence/mockEvidence';

export const EvidenceRailPanel: React.FC = () => {
  const { setActiveCaseSubTab } = useCase();
  const { openEvidenceDrawer } = useDrawer();

  // Pick top 2 high-authority guidelines from the MedCPT retrieval store
  const topEvidence = MOCK_EVIDENCE_ITEMS.slice(0, 2);

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
          <BookOpen size={13} color="#059669" />
          Clinical Evidence
        </span>
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
          MedCPT Reranked
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {topEvidence.map((ev) => (
          <div
            key={ev.id}
            onClick={() => openEvidenceDrawer(ev)}
            style={{
              padding: '8px 10px',
              borderRadius: '5px',
              background: '#F8FAFC',
              border: '1px solid #F1F5F9',
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
