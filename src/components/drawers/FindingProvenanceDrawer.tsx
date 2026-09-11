import React from 'react';
import { useDrawer } from '../../app/providers/DrawerContext';
import { useCase } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import { X, CheckCircle2, XCircle, FileSearch, ShieldCheck, Clock, UserCheck } from 'lucide-react';

export const FindingProvenanceDrawer: React.FC = () => {
  const { selectedFinding, closeFindingDrawer } = useDrawer();
  const { updateFindingStatus } = useCase();
  const { currentPersona } = usePersona();

  if (!selectedFinding) return null;

  const { label, category, sourceDisplay, statusDisplay, provenance } = selectedFinding;

  return (
    <div className="drawer-overlay" onClick={closeFindingDrawer}>
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
                color: '#64748B',
                letterSpacing: '0.04em',
              }}
            >
              Finding Provenance · ID: {selectedFinding.id}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
              {label}
            </h2>
          </div>
          <button
            onClick={closeFindingDrawer}
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

        {/* Status Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: provenance.verificationStatus === 'Verified' ? '#ECFDF5' : provenance.verificationStatus === 'Rejected' ? '#FEF2F2' : '#FEF3C7',
            border: `1px solid ${provenance.verificationStatus === 'Verified' ? '#6EE7B7' : provenance.verificationStatus === 'Rejected' ? '#FCA5A5' : '#FCD34D'}`,
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px',
          }}
        >
          {provenance.verificationStatus === 'Verified' && <CheckCircle2 size={16} color="#059669" />}
          {provenance.verificationStatus === 'Rejected' && <XCircle size={16} color="#DC2626" />}
          {provenance.verificationStatus === 'Unverified' && <Clock size={16} color="#D97706" />}
          <div>
            <strong style={{ color: provenance.verificationStatus === 'Verified' ? '#065F46' : provenance.verificationStatus === 'Rejected' ? '#991B1B' : '#92400E' }}>
              Verification: {provenance.verificationStatus}
            </strong>
            <span style={{ color: '#64748B', marginLeft: '6px' }}>
              ({provenance.provenanceType})
            </span>
          </div>
        </div>

        {/* Provenance Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', flex: 1 }}>
          <section aria-labelledby="finding-source-origin-title">
            <h3 id="finding-source-origin-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
              Source Origin
            </h3>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{sourceDisplay}</div>
              <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>Context: {provenance.sourceContext}</div>
              <div style={{ color: '#64748B', fontSize: '12px' }}>Recorded by: {provenance.recordedBy} at {provenance.recordedAt}</div>
            </div>
          </section>

          {provenance.sourceText && (
            <section aria-labelledby="finding-source-text-title">
              <h3 id="finding-source-text-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Original Clinical Narrative
              </h3>
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontStyle: 'italic',
                  color: '#334155',
                  lineHeight: 1.4,
                }}
              >
                "{provenance.sourceText}"
              </div>
            </section>
          )}

          {provenance.extractionModel && (
            <section aria-labelledby="finding-extraction-model-title">
              <h3 id="finding-extraction-model-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Extraction Model Provenance
              </h3>
              <div style={{ background: '#0F172A', color: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#38BDF8' }}>
                  ⬡ {provenance.extractionModel}
                </div>
                <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '4px' }}>
                  Extracted from natural language clinical narrative. Flagged as unverified machine extraction until clinician confirmation.
                </div>
              </div>
            </section>
          )}

          {provenance.deviceModel && (
            <section aria-labelledby="finding-hardware-device-title">
              <h3 id="finding-hardware-device-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Hardware Measurement Device
              </h3>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>{provenance.deviceModel}</div>
                <div style={{ color: '#64748B', marginTop: '2px' }}>Direct telemetry feed via device interface protocol.</div>
              </div>
            </section>
          )}

          {provenance.rejectionReason && (
            <section aria-labelledby="finding-rejection-audit-title">
              <h3 id="finding-rejection-audit-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#DC2626', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Clinician Rejection Audit
              </h3>
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: '#991B1B' }}>Reason: {provenance.rejectionReason}</div>
                {provenance.rejectionNote && <div style={{ color: '#7F1D1D', marginTop: '4px' }}>Note: {provenance.rejectionNote}</div>}
                <div style={{ color: '#991B1B', fontSize: '11px', marginTop: '4px' }}>
                  Rejected by {provenance.rejectedBy} ({provenance.rejectedAt})
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={closeFindingDrawer} className="btn">
            Close
          </button>
          {currentPersona.allowedActions.canReviewNexusFindings && provenance.verificationStatus !== 'Verified' && (
            <button
              onClick={() => {
                updateFindingStatus(selectedFinding.id, 'Verified');
                closeFindingDrawer();
              }}
              className="btn btn-success"
            >
              <CheckCircle2 size={14} /> Verify & Accept Finding
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
