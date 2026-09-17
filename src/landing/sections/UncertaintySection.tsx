import React from 'react';
import { UncertaintyMatrix } from '../visuals/UncertaintyMatrix';
import { HelpCircle } from 'lucide-react';

export const UncertaintySection: React.FC = () => {
  return (
    <section className="nexus-narrative-section" id="section-uncertainty">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      {/* Two-column: text left, image right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: '52px',
          alignItems: 'center',
          marginBottom: '56px',
        }}
      >
        {/* Left: Section header text */}
        <div>
          <div className="nexus-section-label" style={{ marginBottom: '16px' }}>
            <HelpCircle size={13} />
            <span>SECTION 09 · QUALITATIVE CERTAINTY</span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: 'clamp(24px, 3.5vw, 42px)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: '#0F172A',
              margin: '0 0 18px',
            }}
          >
            Good clinical reasoning includes knowing what you don't know.
          </h2>

          <p style={{ margin: 0, fontSize: '16px', color: '#475569', lineHeight: 1.65 }}>
            Real clinical medicine is qualitative. Nexus rejects misleading percentage probability scores in favor of transparent epistemic states: <strong>Supported</strong>, <strong>Insufficient Data</strong>, <strong>Contradicted</strong>, and <strong>Needs Review</strong>.
          </p>
        </div>

        {/* Right: Epistemic uncertainty illustration */}
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
            border: '1px solid #E8E6E1',
          }}
        >
          <img
            src="/landing-uncertainty.jpg"
            alt="Decision tree visualization showing clear clinical evidence paths on one side and uncertain unknown paths on the other"
            style={{ width: '100%', display: 'block', height: '360px', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      </div>

      {/* Primary Signature Visual: Uncertainty Matrix */}
      <UncertaintyMatrix />
    </section>
  );
};
