import React from 'react';
import { CaseOrbitVisual } from '../visuals/CaseOrbitVisual';
import { FileText, ShieldAlert } from 'lucide-react';

export const CaseIntroSection: React.FC = () => {
  return (
    <section className="nexus-narrative-section" id="section-case">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      {/* Two-column layout: text left, image right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: '56px',
          alignItems: 'center',
          marginBottom: '64px',
        }}
      >
        {/* Left: Text */}
        <div>
          <div className="nexus-section-label nexus-section-label--neutral" style={{ marginBottom: '16px' }}>
            <FileText size={13} />
            <span>SECTION 02 · THE CLINICAL REALITY</span>
          </div>

          {/* Mandatory Disclosure */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              color: '#92400E',
              fontSize: '11px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '4px',
              marginBottom: '20px',
              letterSpacing: '0.04em',
            }}
          >
            <ShieldAlert size={13} />
            <span>DEMO CASE · SYNTHETIC CLINICAL DATA · NOT A REAL PATIENT</span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: 'clamp(26px, 3.5vw, 42px)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: '#0F172A',
              margin: '0 0 18px',
            }}
          >
            One patient encounter. Dozens of disconnected origins.
          </h2>

          <p style={{ margin: 0, fontSize: '16px', color: '#475569', lineHeight: 1.65, maxWidth: '480px' }}>
            A 42-year-old patient presents with a 3-week fever of unknown origin, daily night sweats, and joint stiffness. Critical context is already scattered across outpatient charts, laboratory feeds, imaging archives, and triage notes.
          </p>
        </div>

        {/* Right: Fragmented clinical data illustration */}
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
            border: '1px solid #E8E6E1',
          }}
        >
          <img
            src="/landing-fragmented.jpg"
            alt="Scattered clinical documents representing fragmented patient data across multiple hospital systems"
            style={{ width: '100%', display: 'block', height: '340px', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      </div>

      {/* Spatial Central Case Orbit Visual */}
      <CaseOrbitVisual mode="initial" interactive={false} />
    </section>
  );
};
