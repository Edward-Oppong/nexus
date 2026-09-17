import React from 'react';
import { CaseOrbitVisual } from '../visuals/CaseOrbitVisual';
import { Sparkles } from 'lucide-react';

export const NexusRevealSection: React.FC = () => {
  return (
    <section
      id="section-nexus-reveal"
      style={{
        position: 'relative',
        padding: '120px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Full-bleed convergence background image */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/landing-convergence.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }}
      />
      {/* Dark overlay so cards remain legible */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,18,32,0.80)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(15,118,110,0.25)',
              border: '1px solid rgba(94,234,212,0.35)',
              color: '#5EEAD4',
              fontSize: '11px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '4px',
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <Sparkles size={13} />
            <span>SECTION 04 · CONTEXTUAL UNIFICATION</span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: 'clamp(30px, 4.5vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              margin: '0 auto 18px',
            }}
          >
            Nexus connects the context.
          </h2>

          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'rgba(248,250,252,0.75)',
              lineHeight: 1.65,
              maxWidth: '620px',
              margin: '0 auto',
            }}
          >
            Relevant clinical information is brought together around the case, so teams can work from a shared clinical context.
          </p>
        </div>

        {/* Orbit visual on dark background */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <CaseOrbitVisual mode="converged" interactive={true} />
        </div>
      </div>

      {/* Bottom fade to body color */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'linear-gradient(to bottom, transparent, #FAF9F6)',
          zIndex: 3,
        }}
      />
    </section>
  );
};
