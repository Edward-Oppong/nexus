import React from 'react';

interface LandingNavbarProps {
  onExperienceCase: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onExperienceCase,
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Brand Wordmark + Clinical Sub-label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: '17px',
            color: 'var(--ink-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Nexus
        </span>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--ink-secondary)',
          }}
        >
          Clinical Workstation
        </span>
      </div>

      {/* Two Clean Anchor Links (Center/Right) */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <button
          onClick={() => scrollTo('problem-centerpiece')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--ink-secondary)',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          Problem
        </button>
        <button
          onClick={() => scrollTo('features')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--ink-secondary)',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          Features
        </button>

        {/* Primary CTA (Active-voice, no arrow) */}
        <button
          onClick={onExperienceCase}
          className="nexus-btn-primary"
          style={{
            fontSize: '13px',
            padding: '7px 14px',
          }}
        >
          Try the live case
        </button>
      </nav>
    </header>
  );
};
