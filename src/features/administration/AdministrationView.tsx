import React from 'react';
import { Sliders, Shield, Terminal, Database, Cpu } from 'lucide-react';

export const AdministrationView: React.FC = () => {
  return (
    <main
      aria-label="Administration and Clinical Governance"
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: '#F8FAFC',
      }}
    >
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.06em' }}>
            System Architecture & Governance
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginTop: '2px' }}>
            Administration & Governance
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            System health, synthetic data registry, and simulated AI component specifications.
          </p>
        </div>

        {/* Prototype Transparency Notice */}
        <section
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Cpu size={16} color="#38BDF8" />
            <strong style={{ fontSize: '14px', color: '#F8FAFC' }}>
              Simulated Architectural Models Disclosure (Phase 5)
            </strong>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
            Models identified across the workstation (e.g. <code>Nexus NLP v1.3</code>, <code>Nexus Reasoning v2.1</code>) represent simulated architectural components configured to test workflow usability, provenance tracking, and clinical safety handoffs. They do not represent validated diagnostic medical devices.
          </p>
        </section>

        {/* Simulated Models Registry Table */}
        <section style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
            Registered Simulated Components
          </div>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Component Identifier</th>
                <th>Subsystem Role</th>
                <th>Status</th>
                <th>Provenance Tag</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Nexus NLP v1.3 (Simulated)</td>
                <td>Clinical narrative concept extraction & entity recognition</td>
                <td><span className="badge badge-verified">Active</span></td>
                <td><code>AI-extracted</code></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Nexus Reasoning v2.1 (Simulated)</td>
                <td>Modified Duke & EULAR differential rule evaluation</td>
                <td><span className="badge badge-verified">Active</span></td>
                <td><code>AI-generated</code></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>FHIR R4 Adapter v0.9 (Simulated)</td>
                <td>Synthetic EHR telemetry and laboratory ingestion bridge</td>
                <td><span className="badge badge-neutral">Standby</span></td>
                <td><code>Imported</code></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
};
