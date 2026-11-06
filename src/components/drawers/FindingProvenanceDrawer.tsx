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
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              Finding Provenance · ID: {selectedFinding.id}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {label}
            </h2>
          </div>
          <button
            onClick={closeFindingDrawer}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
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
            background: provenance.verificationStatus === 'Verified' ? 'var(--success-subtle)' : provenance.verificationStatus === 'Rejected' ? 'var(--danger-subtle)' : 'var(--warning-subtle)',
            border: `1px solid ${provenance.verificationStatus === 'Verified' ? 'var(--success-border)' : provenance.verificationStatus === 'Rejected' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px',
          }}
        >
          {provenance.verificationStatus === 'Verified' && <CheckCircle2 size={16} color="var(--status-success)" />}
          {provenance.verificationStatus === 'Rejected' && <XCircle size={16} color="var(--status-danger)" />}
          {provenance.verificationStatus === 'Unverified' && <Clock size={16} color="var(--status-warning)" />}
          <div>
            <strong style={{ color: provenance.verificationStatus === 'Verified' ? 'var(--status-success)' : provenance.verificationStatus === 'Rejected' ? 'var(--status-danger)' : 'var(--status-warning)' }}>
              Verification: {provenance.verificationStatus}
            </strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({provenance.provenanceType})
            </span>
          </div>
        </div>

        {/* Provenance Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', flex: 1 }}>
          <section aria-labelledby="finding-source-origin-title">
            <h3 id="finding-source-origin-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
              Source Origin
            </h3>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sourceDisplay}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>Context: {provenance.sourceContext}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Recorded by: {provenance.recordedBy} at {provenance.recordedAt}</div>
            </div>
          </section>

          {provenance.sourceText && (
            <section aria-labelledby="finding-source-text-title">
              <h3 id="finding-source-text-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Original Clinical Narrative
              </h3>
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                "{provenance.sourceText}"
              </div>
            </section>
          )}

          {provenance.extractionModel && (
            <section aria-labelledby="finding-extraction-model-title">
              <h3 id="finding-extraction-model-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Extraction Model Provenance
              </h3>
              <div style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  ⬡ {provenance.extractionModel}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                  Extracted from natural language clinical narrative. Flagged as unverified machine extraction until clinician confirmation.
                </div>
              </div>
            </section>
          )}

          {provenance.deviceModel && (
            <section aria-labelledby="finding-hardware-device-title">
              <h3 id="finding-hardware-device-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Hardware Measurement Device
              </h3>
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{provenance.deviceModel}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Direct telemetry feed via device interface protocol.</div>
              </div>
            </section>
          )}

          {provenance.rejectionReason && (
            <section aria-labelledby="finding-rejection-audit-title">
              <h3 id="finding-rejection-audit-title" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--status-danger)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
                Clinician Rejection Audit
              </h3>
              <div style={{ background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: 'var(--status-danger)' }}>Reason: {provenance.rejectionReason}</div>
                {provenance.rejectionNote && <div style={{ color: 'var(--status-danger)', marginTop: '4px' }}>Note: {provenance.rejectionNote}</div>}
                <div style={{ color: 'var(--status-danger)', fontSize: '11px', marginTop: '4px' }}>
                  Rejected by {provenance.rejectedBy} ({provenance.rejectedAt})
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
