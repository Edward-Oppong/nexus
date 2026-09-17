import React from 'react';
import { ShieldCheck, Lock, History, FileCheck, CheckCircle2 } from 'lucide-react';

export const TraceabilitySection: React.FC = () => {
  return (
    <section className="nexus-narrative-section" id="section-traceability">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label nexus-section-label--neutral">
          <ShieldCheck size={13} />
          <span>SECTION 12 · CHAIN OF RESPONSIBILITY</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          Uncompromising provenance and auditability.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          When AI contributes to clinical reasoning, every step must remain verifiable. Nexus maintains an unbroken, tamper-evident audit trail of what was suggested, who reviewed it, and why decisions were made.
        </p>
      </div>

      {/* Provenance Features Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <div className="nexus-clinical-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileCheck size={16} color="#0F766E" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Dual-State Preservation
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            Original AI suggestions are never overwritten. When a physician edits a hypothesis, both the pre-edit machine output and human revisions are preserved side-by-side.
          </p>
        </div>

        <div className="nexus-clinical-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <History size={16} color="#0F766E" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              W3C PROV-O Model
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            Every extracted finding and diagnostic reasoning card carries full attribution: source device or laboratory feed, ingestion timestamp, and human verification signature.
          </p>
        </div>

        <div className="nexus-clinical-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Lock size={16} color="#0F766E" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Cryptographic Integrity
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            Audit logs export directly into FHIR R4 AuditEvent bundles sealed with SHA-256 hashes for hospital compliance boards and regulatory notified bodies.
          </p>
        </div>
      </div>
    </section>
  );
};
