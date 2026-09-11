import React from 'react';
import { useDrawer } from '../../app/providers/DrawerContext';
import { X, ExternalLink, BookOpen, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';

export const EvidenceDrawer: React.FC = () => {
  const { selectedEvidence, closeEvidenceDrawer } = useDrawer();

  if (!selectedEvidence) return null;

  const {
    title,
    sourceOrganization,
    documentType,
    publicationYear,
    retrievalDate,
    authority,
    applicability,
    applicabilityReason,
    relationship,
    relevantPassage,
    citation,
    relevanceExplanation,
  } = selectedEvidence;

  return (
    <div className="drawer-overlay" onClick={closeEvidenceDrawer}>
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#2563EB',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              Clinical Evidence Record · {documentType}
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginTop: '4px', lineHeight: 1.3 }}>
              {title}
            </h2>
          </div>
          <button
            onClick={closeEvidenceDrawer}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Authority & Relationship Badges */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: authority === 'High' ? '#ECFDF5' : '#F8FAFC',
              color: authority === 'High' ? '#065F46' : '#334155',
              border: `1px solid ${authority === 'High' ? '#6EE7B7' : '#E2E8F0'}`,
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={12} /> Authority: {authority}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: relationship === 'Supports' ? '#EFF6FF' : relationship === 'Contradicts' ? '#FEF2F2' : '#F1F5F9',
              color: relationship === 'Supports' ? '#1E40AF' : relationship === 'Contradicts' ? '#991B1B' : '#475569',
              border: `1px solid ${relationship === 'Supports' ? '#93C5FD' : relationship === 'Contradicts' ? '#FCA5A5' : '#CBD5E1'}`,
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            ● Relationship: {relationship}
          </span>
        </div>

        {/* Content Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', flex: 1 }}>
          <section aria-labelledby="evidence-why-relevant-title">
            <h3 id="evidence-why-relevant-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
              Why Am I Seeing This Evidence?
            </h3>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', color: '#334155', lineHeight: 1.4 }}>
              {relevanceExplanation}
            </div>
          </section>

          <section aria-labelledby="evidence-relevant-passage-title">
            <h3 id="evidence-relevant-passage-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
              Relevant Guideline Passage
            </h3>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderLeft: '4px solid #2563EB',
                padding: '12px',
                borderRadius: '4px',
                color: '#0F172A',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              "{relevantPassage}"
            </div>
          </section>

          <section aria-labelledby="evidence-source-provenance-title">
            <h3 id="evidence-source-provenance-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
              Source Provenance & Metadata
            </h3>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Issuing Body:</strong> {sourceOrganization}</div>
              <div><strong>Publication Year:</strong> {publicationYear}</div>
              <div><strong>Retrieved for Nexus:</strong> {retrievalDate}</div>
              <div><strong>Applicability:</strong> {applicability} ({applicabilityReason})</div>
            </div>
          </section>

          <section aria-labelledby="evidence-citation-title">
            <h3 id="evidence-citation-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
              Citation Reference
            </h3>
            <div style={{ background: '#F1F5F9', padding: '8px 10px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#334155' }}>
              {citation}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={closeEvidenceDrawer} className="btn">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
