import React from 'react';
import { ArrowRight, ShieldAlert, Sparkles, Stethoscope } from 'lucide-react';

interface DemoExperienceSectionProps {
  onExperienceCase: () => void;
}

export const DemoExperienceSection: React.FC<DemoExperienceSectionProps> = ({
  onExperienceCase,
}) => {
  return (
    <section className="nexus-narrative-section" id="section-experience">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1.5px solid #CBD5E1',
          borderRadius: '16px',
          padding: '48px 36px',
          textAlign: 'center',
          boxShadow: '0 20px 48px -12px rgba(15, 23, 42, 0.1)',
        }}
      >
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
            padding: '3px 12px',
            borderRadius: '20px',
            marginBottom: '24px',
            letterSpacing: '0.04em',
          }}
        >
          <ShieldAlert size={14} />
          <span>DEMO ENVIRONMENT · SYNTHETIC CLINICAL DATA · NOT FOR CLINICAL DECISION-MAKING</span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--nexus-font-display)',
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: '0 0 16px 0',
          }}
        >
          See the case for yourself.
        </h2>

        <p
          style={{
            fontSize: '16px',
            color: '#475569',
            maxWidth: '620px',
            lineHeight: 1.6,
            margin: '0 auto 36px auto',
          }}
        >
          Open Case #10482 directly inside the production clinical workstation. Examine the multi-slice TEE echo viewer, inspect the qualitative reasoning tree, and test the clinician review workflow.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={onExperienceCase}
            className="nexus-btn nexus-btn--primary"
            style={{
              padding: '14px 32px',
              fontSize: '15px',
              borderRadius: '8px',
            }}
          >
            <span>Experience Nexus</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: '#94A3B8',
            marginTop: '28px',
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          No account registration required for demonstration access. Simulated clinical context preloaded.
        </p>
      </div>
    </section>
  );
};
