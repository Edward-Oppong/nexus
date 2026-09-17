import React from 'react';
import { WorkstationMockup } from '../visuals/WorkstationMockup';
import { Layout, ArrowRight } from 'lucide-react';

interface WorkstationSectionProps {
  onOpenWorkstation: () => void;
}

export const WorkstationSection: React.FC<WorkstationSectionProps> = ({
  onOpenWorkstation,
}) => {
  return (
    <section className="nexus-narrative-section" id="section-workstation">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      {/* Two-column: image left, text right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)',
          gap: '52px',
          alignItems: 'center',
          marginBottom: '56px',
        }}
      >
        {/* Left: Clinician photo */}
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 18px 48px rgba(15,23,42,0.12)',
            border: '1px solid #E8E6E1',
            position: 'relative',
          }}
        >
          <img
            src="/landing-clinician.jpg"
            alt="Clinical professional reviewing patient data on dual monitors in a hospital environment"
            style={{ width: '100%', display: 'block', height: '380px', objectFit: 'cover', objectPosition: 'center top' }}
            loading="lazy"
          />
          {/* Image caption badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(6px)',
              color: '#FFFFFF',
              fontSize: '10px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '4px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            CLINICAL WORKSTATION ENVIRONMENT
          </div>
        </div>

        {/* Right: Text block */}
        <div>
          <div className="nexus-section-label" style={{ marginBottom: '16px' }}>
            <Layout size={13} />
            <span>SECTION 06 · THE CLINICAL INTERFACE</span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: 'clamp(26px, 3.5vw, 44px)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              color: '#0F172A',
              margin: '0 0 18px',
            }}
          >
            Inside the Nexus Workstation.
          </h2>

          <p style={{ margin: '0 0 28px', fontSize: '16px', color: '#475569', lineHeight: 1.65 }}>
            An integrated clinical environment uniting case navigation, evidence evaluation, and embedded contextual intelligence into a single shared workspace for the entire care team.
          </p>

          {/* 3 pane bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0F766E', marginTop: '8px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Case Navigation — </span>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Rapid access to findings, investigations, evidence, timeline, and team activity.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#2563EB', marginTop: '8px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Clinical Workspace — </span>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Examine imaging studies, verify findings, apply scoring criteria, and review drug interactions.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#7C3AED', marginTop: '8px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Contextual Intelligence — </span>
                <span style={{ fontSize: '13px', color: '#64748B' }}>Live safety flags, evidentiary gaps, and differential synthesis surfaced without chat prompts.</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenWorkstation}
            className="nexus-btn nexus-btn--secondary"
            style={{ fontSize: '13px', padding: '10px 20px' }}
          >
            <span>Open Full Interactive Workstation</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Full-width workstation mockup */}
      <WorkstationMockup interactive={true} />
    </section>
  );
};
