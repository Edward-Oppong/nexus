import React from 'react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onExperienceCase: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onExperienceCase,
}) => {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        padding: '110px 0 80px',
        overflow: 'hidden',
      }}
    >
      {/* Background Image: Hospital clinical team collaborating at workstation */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/clinical-story.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />

      {/* Dark Slate Overlay: Calibrated for optical clarity and legibility */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.86) 0%, rgba(15, 23, 42, 0.78) 50%, rgba(15, 23, 42, 0.90) 100%)',
          zIndex: 1,
        }}
      />

      {/* Centered Foreground Content */}
      <div className="nexus-container" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Sub-statement: Clinical teal accent */}
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#5EEAD4',
              marginBottom: '16px',
              letterSpacing: '0.04em',
            }}
          >
            Nexus Clinical Workstation
          </p>

          {/* Core Headline (Centered) */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 54px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              margin: '0 auto 20px',
              maxWidth: '840px',
            }}
          >
            Clinical information is everywhere.{' '}
            <span style={{ color: '#5EEAD4' }}>
              Clinical understanding shouldn't be.
            </span>
          </h1>

          {/* Plain Clinician Explanation (Centered) */}
          <p
            style={{
              fontSize: 'clamp(17px, 2vw, 20px)',
              color: 'rgba(248, 250, 252, 0.88)',
              lineHeight: 1.6,
              margin: '0 auto 36px',
              maxWidth: '740px',
            }}
          >
            Internal medicine and cardiology consult teams use Nexus to synthesize scattered EHR notes, imaging, microbiology, and pharmacy feeds into a single context graph — surfacing verifiable differentials and catching hidden contraindications before orders are signed.
          </p>

          {/* Centered Active-Voice Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={onExperienceCase}
              className="nexus-btn-primary"
              style={{
                backgroundColor: '#0F766E',
                borderColor: '#14B8A6',
                padding: '12px 26px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Try the live case
            </button>

            <button
              onClick={onExploreClick}
              className="nexus-btn-secondary"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.28)',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.20)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              Read the clinical case ↓
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
