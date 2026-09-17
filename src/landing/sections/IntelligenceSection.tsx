import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export const IntelligenceSection: React.FC = () => {
  return (
    <section className="nexus-narrative-section" id="section-intelligence">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label">
          <Sparkles size={13} />
          <span>SECTION 08 · ARCHITECTURAL CLARITY</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          Intelligence, inside the case.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          Nexus brings contextual intelligence into the clinical workflow instead of asking clinicians to leave the case to interact with a separate AI chatbot.
        </p>
      </div>

      {/* Conceptual Continuum Diagram */}
      <div
        style={{
          maxWidth: '920px',
          margin: '0 auto 48px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {['CASE', 'CONTEXT', 'EVIDENCE', 'REASONING', 'REVIEW'].map((item, idx, arr) => (
          <React.Fragment key={item}>
            <div
              style={{
                background: '#FFFFFF',
                border: idx === arr.length - 1 ? '1.5px solid #059669' : '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '12px 18px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#64748B', marginBottom: '2px' }}>
                STAGE 0{idx + 1}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--nexus-font-mono)',
                  fontWeight: 700,
                  color: idx === arr.length - 1 ? '#059669' : '#0F172A',
                }}
              >
                {item}
              </div>
            </div>
            {idx < arr.length - 1 && (
              <ArrowRight size={16} color="#94A3B8" className="hidden sm:inline" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Core Architectural Principles (Anti-Black-Box) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <div className="nexus-clinical-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="#0F766E" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Embedded in Workflow
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            No prompt engineering or conversational back-and-forth. Reasoning is computed deterministically and contextually within the active case tabs.
          </p>
        </div>

        <div className="nexus-clinical-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="#0F766E" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Anchored to Evidence
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            Every statement generated links back to a specific patient observation, laboratory titer, or published clinical guideline.
          </p>
        </div>

        <div className="nexus-clinical-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="#0F766E" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Zero Autonomous Claims
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            Nexus never claims to be an autonomous diagnostic engine. It assists synthesis while holding a named clinician as the sole decision-maker.
          </p>
        </div>
      </div>
    </section>
  );
};
