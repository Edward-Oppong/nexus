import React from 'react';
import { TraceabilityVisual } from '../visuals/TraceabilityVisual';
import { UserCheck } from 'lucide-react';

export const HumanReviewSection: React.FC = () => {
  return (
    <section id="section-human-review" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Full-bleed dark image panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '480px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          marginBottom: 0,
        }}
      >
        <img
          src="/landing-human-review.jpg"
          alt="Clinician approving a treatment plan on a large clinical touchscreen display in a hospital corridor"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 30%',
            zIndex: 0,
          }}
          loading="lazy"
        />
        {/* Dark left-side overlay so text is legible */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(10,18,32,0.90) 0%, rgba(10,18,32,0.55) 55%, transparent 100%)',
            zIndex: 1,
          }}
        />

        {/* Floating text block on the left */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '80px max(64px, 8vw)',
            maxWidth: '560px',
          }}
        >
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
            <UserCheck size={13} />
            <span>SECTION 11 · HUMAN-IN-THE-LOOP</span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: 'clamp(26px, 3.8vw, 48px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              margin: '0 0 18px',
            }}
          >
            The final call always belongs to the clinician.
          </h2>

          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(248,250,252,0.78)', lineHeight: 1.65 }}>
            Nexus surfaces reasoning and evidence, but never takes autonomous actions. Every recommendation requires explicit clinical review and approval before it influences care.
          </p>
        </div>
      </div>

      {/* Traceability Visual below */}
      <div className="nexus-narrative-section" style={{ paddingTop: '72px' }}>
        <TraceabilityVisual />
      </div>
    </section>
  );
};
