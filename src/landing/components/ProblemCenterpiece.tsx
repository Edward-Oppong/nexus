import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles, FileText, Activity } from 'lucide-react';

export const ProblemCenterpiece: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'fragmented' | 'unified'>('fragmented');

  return (
    <section
      id="problem-centerpiece"
      style={{
        padding: '72px 0 96px',
        backgroundColor: 'var(--surface-ground)',
      }}
    >
      <div className="nexus-container">
        {/* Section Header */}
        <div style={{ maxWidth: '780px', marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.2vw, 36px)',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              margin: '0 0 12px',
            }}
          >
            How clinical risk hides in fragmented hospital software
          </h2>
          <p
            style={{
              fontSize: '17px',
              color: 'var(--ink-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            A 42-year-old patient presents with a 3-week fever of unknown origin and a new murmur. The patient's critical data exists across four separate hospital databases. Toggle below to compare how care teams experience this case today versus inside Nexus.
          </p>
        </div>

        {/* Case Demo Container */}
        <div
          style={{
            backgroundColor: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* Top Control Bar: Case Identity + Interactive Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: '#FFFFFF',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--ink-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Case #10482
                </span>
                <span style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                  42M · Inpatient Cardiology / Infectious Disease Consult
                </span>
              </div>
            </div>

            {/* The One Orchestrated Moment of Motion */}
            <div
              role="radiogroup"
              aria-label="Clinical view switcher"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                padding: '3px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                role="radio"
                aria-checked={activeMode === 'fragmented'}
                onClick={() => setActiveMode('fragmented')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: activeMode === 'fragmented' ? 600 : 400,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeMode === 'fragmented' ? '#FFFFFF' : 'transparent',
                  color: activeMode === 'fragmented' ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                  boxShadow: activeMode === 'fragmented' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Fragmented hospital feeds
              </button>
              <button
                role="radio"
                aria-checked={activeMode === 'unified'}
                onClick={() => setActiveMode('unified')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: activeMode === 'unified' ? 600 : 400,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeMode === 'unified' ? 'var(--clinical-accent)' : 'transparent',
                  color: activeMode === 'unified' ? '#FFFFFF' : 'var(--ink-secondary)',
                  boxShadow: activeMode === 'unified' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Nexus unified context
              </button>
            </div>
          </div>

          {/* DYNAMIC VIEW BODY */}
          {activeMode === 'fragmented' ? (
            /* FRAGMENTED VIEW: Intentionally hard to parse, multi-window cognitive friction */
            <div style={{ padding: '24px', backgroundColor: '#F9FAFB' }}>
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <AlertCircle size={18} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
                  <strong>Current clinical workflow:</strong> Data is split across four distinct applications. The attending physician must manually open, reconcile, and correlate these entries across separate tabs. The documented allergy remains unlinked to the pharmacy order.
                </div>
              </div>

              {/* Scattered Disparate System Windows */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Window 1: Outpatient EHR Record */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--ink-secondary)',
                      fontFamily: 'var(--font-mono)',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '6px',
                      marginBottom: '10px',
                    }}
                  >
                    EPIC_AMBULATORY · Enc: 09/24
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                    <strong>Past Medical History:</strong> Congenital bicuspid aortic valve (mild AI). Dental extraction performed 4 weeks prior without antimicrobial prophylaxis.
                  </div>
                </div>

                {/* Window 2: Emergency Triage Note */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--ink-secondary)',
                      fontFamily: 'var(--font-mono)',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '6px',
                      marginBottom: '10px',
                    }}
                  >
                    CERNER_FIRSTNET · Triage 02:14
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                    <strong>Bedside Exam:</strong> Temp 38.8°C, HR 104. New Grade III/VI holosystolic regurgitant murmur at apex. Non-tender erythematous maculae on left thenar eminence (Janeway lesions noted).
                  </div>
                </div>

                {/* Window 3: LIS Lab Report (Raw) */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--ink-secondary)',
                      fontFamily: 'var(--font-mono)',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '6px',
                      marginBottom: '10px',
                    }}
                  >
                    SUNQUEST_LIS · Acc #904812
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-primary)', lineHeight: 1.6 }}>
                    BLD CULT X3: POSITIVE (3/3 bottles)<br />
                    ORGANISM: Streptococcus viridans<br />
                    MIC PENICILLIN: 0.06 mcg/mL (SUSC)<br />
                    CRP: 112 mg/L (Ref: &lt;5.0) · ESR: 84 mm/h
                  </div>
                </div>

                {/* Window 4: Pharmacy Order (Disjointed Allergy) */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--ink-secondary)',
                      fontFamily: 'var(--font-mono)',
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: '6px',
                      marginBottom: '10px',
                    }}
                  >
                    OMNICELL_MAR · Active Orders
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                    <strong>Active Med:</strong> Ceftriaxone 2g IV q24h ordered by ED resident.<br />
                    <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '6px', display: 'block' }}>
                      Allergy section in separate legacy tab: <em>Penicillin (severe hives, bronchospasm, 2019)</em> — unflagged cross-reactivity in triage screen.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* UNIFIED VIEW: Synthesized diagnostic graph + immediate contraindication alert */
            <div style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
              {/* Immediate Safety Contraindication Banner */}
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <ShieldAlert size={20} color="var(--contraindication)" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--contraindication)', marginBottom: '4px' }}>
                    Contraindication Flag: Ceftriaxone ordered with documented Penicillin Anaphylaxis
                  </div>
                  <div style={{ fontSize: '13px', color: '#7F1D1D', lineHeight: 1.5 }}>
                    Active pharmacy order for IV Ceftriaxone (Acc #904812) conflicts with documented anaphylaxis (hives, bronchospasm, 2019 allergy tab). Cephalosporin cross-reactivity risk estimated at 3–5%. Recommended alternative: Vancomycin 15–20 mg/kg IV q12h + Gentamicin.
                  </div>
                </div>
              </div>

              {/* Synthesized Differential & Duke Criteria Graph */}
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '20px',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--clinical-accent)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Diagnostic Synthesis
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-primary)', margin: '2px 0 0' }}>
                      Definite Infective Endocarditis (Modified Duke Criteria)
                    </h3>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--clinical-accent)',
                      backgroundColor: '#E6F4F2',
                      padding: '4px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    2 Major Criteria Met · Epistemic State: Supported
                  </div>
                </div>

                {/* Evidentiary Lineage Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--clinical-accent)" />
                      <span><strong>Major 1:</strong> Typical microorganism in consistent blood cultures (3/3 Streptococcus viridans)</span>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                      Source: SUNQUEST_LIS #904812
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--clinical-accent)" />
                      <span><strong>Major 2:</strong> Endocardial involvement (11mm oscillating vegetation on anterior mitral leaflet via TEE)</span>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                      Source: PACS Study #18420-TEE
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="var(--clinical-accent)" />
                      <span><strong>Minor:</strong> Predisposition (bicuspid aortic valve) + Fever (38.8°C) + Janeway lesions</span>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                      Source: EPIC Ambulatory & Cerner Triage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prose Summary Below the Demo (No duplicate red/teal cards) */}
        <p
          style={{
            fontSize: '15px',
            color: 'var(--ink-secondary)',
            lineHeight: 1.6,
            marginTop: '28px',
            maxWidth: '820px',
          }}
        >
          In a standard workflow, the attending physician spends 20–30 minutes navigating four separate applications to piece this timeline together — while the cross-reactivity between the ordered cephalosporin and the documented penicillin allergy remains buried in a legacy tab. Nexus synthesizes the evidence directly into the diagnostic criteria and flags the safety contradiction before the first dose is administered.
        </p>
      </div>
    </section>
  );
};
