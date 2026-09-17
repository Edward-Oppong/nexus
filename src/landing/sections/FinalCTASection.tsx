import React from 'react';

interface FinalCTASectionProps {
  onExperienceCase: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onExperienceCase,
}) => {
  return (
    <footer
      style={{
        padding: '72px 0 64px',
        backgroundColor: 'var(--surface-ground)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div className="nexus-container">
        <div style={{ maxWidth: '680px', marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.5vw, 30px)',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              lineHeight: 1.25,
              margin: '0 0 12px',
            }}
          >
            Review the live endocarditis encounter in the workstation
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--ink-secondary)',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            Evaluate how the reasoning engine cross-checks evidence, inspect the full Duke Criteria evaluation, and sign off on the recommended regimen switch.
          </p>

          <button
            onClick={onExperienceCase}
            className="nexus-btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '15px',
            }}
          >
            Try the live case
          </button>
        </div>

        {/* Minimal Understated Healthcare Disclaimer */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--ink-secondary)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            Nexus Clinical Workstation · Designed for hospital inpatient consult services
          </div>
          <div>
            Synthetic clinical data for demonstration. Contains no Protected Health Information (PHI).
          </div>
        </div>
      </div>
    </footer>
  );
};
