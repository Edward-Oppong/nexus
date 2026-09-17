import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowRight,
  FileText,
  Activity,
  FlaskConical,
  HeartPulse,
  Pill,
  History,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Split,
  Search,
} from 'lucide-react';

export const ProblemSolutionSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'fragmented' | 'unified'>('unified');

  return (
    <section
      id="section-problem-solution"
      style={{
        padding: '80px 24px 100px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 52px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F0FDFA',
            border: '1px solid #99F6E4',
            color: '#0F766E',
            fontSize: '11px',
            fontFamily: 'var(--nexus-font-mono)',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '4px',
            marginBottom: '18px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <Split size={13} />
          <span>THE CLINICAL CHALLENGE & NEXUS CONVERGENCE</span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--nexus-font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: '#0F172A',
            margin: '0 0 16px',
          }}
        >
          Clinical context is fragmented.{' '}
          <span style={{ color: '#0F766E' }}>Nexus brings it together.</span>
        </h2>

        <p
          style={{
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            color: '#475569',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Modern hospitals scatter patient records across dozens of siloed EHRs, imaging archives, and laboratory feeds. Clinicians lose hours mentally piecing together fragmented data. Nexus turns isolated records into a live, unified clinical reasoning environment.
        </p>
      </div>

      {/* EXPANSIVE CLINICAL CASE STAGE — OCCUPIES BROAD SPACE */}
      <div
        style={{
          background: viewMode === 'unified' ? '#FFFFFF' : '#F8FAFC',
          border: `1.5px solid ${viewMode === 'unified' ? '#0F766E' : '#CBD5E1'}`,
          borderRadius: '16px',
          boxShadow: viewMode === 'unified'
            ? '0 20px 50px rgba(15, 118, 110, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)'
            : '0 12px 30px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          marginBottom: '56px',
        }}
      >
        {/* Top Case Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 28px',
            background: viewMode === 'unified' ? '#0F172A' : '#1E293B',
            color: '#FFFFFF',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: viewMode === 'unified' ? '#5EEAD4' : '#F59E0B',
                  boxShadow: viewMode === 'unified' ? '0 0 10px #5EEAD4' : 'none',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--nexus-font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                CASE #10482 · SYNTHETIC DEMO ENCOUNTER
              </span>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: '#94A3B8',
                background: 'rgba(255,255,255,0.08)',
                padding: '3px 10px',
                borderRadius: '4px',
              }}
            >
              42yo M · Cardiology / ID Inpatient Consult
            </span>
          </div>

          {/* Interactive State Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.1)',
              padding: '3px',
              borderRadius: '8px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setViewMode('fragmented')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'fragmented' ? '#EF4444' : 'transparent',
                color: viewMode === 'fragmented' ? '#FFFFFF' : '#CBD5E1',
                transition: 'all 0.2s ease',
              }}
            >
              <AlertTriangle size={13} />
              <span>Siloed Fragmentation</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'unified' ? '#0F766E' : 'transparent',
                color: viewMode === 'unified' ? '#FFFFFF' : '#CBD5E1',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={13} />
              <span>Nexus Context Unification</span>
            </button>
          </div>
        </div>

        {/* Mode Status Banner */}
        <div
          style={{
            padding: '12px 28px',
            background: viewMode === 'unified' ? '#F0FDFA' : '#FEF2F2',
            borderBottom: `1px solid ${viewMode === 'unified' ? '#CCFBF1' : '#FECACA'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: viewMode === 'unified' ? '#0F766E' : '#B91C1C',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewMode === 'unified' ? (
              <>
                <ShieldCheck size={16} />
                <span>Nexus Unified Graph: 6 clinical streams synthesized into coherent differential reasoning with instant safety contradiction alert.</span>
              </>
            ) : (
              <>
                <ShieldAlert size={16} />
                <span>Siloed Disconnection: Evidence scattered across 4 standalone systems. Penicillin allergy & cephalosporin cross-reactivity unflagged.</span>
              </>
            )}
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--nexus-font-mono)', opacity: 0.85 }}>
            {viewMode === 'unified' ? 'DUKE CRITERIA MET · PROVENANCE TRACEABLE' : 'HIGH COGNITIVE LOAD · SILO WARNING'}
          </span>
        </div>

        {/* Expansive 3-Column Patient Data Streams Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            padding: '28px',
          }}
        >
          {/* Card 1: History & Bedside Exam */}
          <div
            style={{
              background: '#FFFFFF',
              border: `1.5px solid ${viewMode === 'unified' ? '#E2E8F0' : '#FECACA'}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', background: '#F1F5F9', borderRadius: '6px', color: '#0F172A' }}>
                  <History size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  History & Clinical Exam
                </h4>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--nexus-font-mono)',
                  background: viewMode === 'unified' ? '#F0FDFA' : '#FEE2E2',
                  color: viewMode === 'unified' ? '#0F766E' : '#DC2626',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {viewMode === 'unified' ? 'EHR INTEGRATED' : 'AMBULATORY EHR SILO'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>History: </span>
                <strong style={{ color: '#0F172A' }}>Bicuspid aortic valve</strong>, dental extraction 4 weeks prior without prophylaxis.
              </div>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Vitals & Murmur: </span>
                <strong style={{ color: '#0F172A' }}>T 38.8°C</strong>, new Grade III/VI holosystolic regurgitant murmur.
              </div>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Peripheral Stigmata: </span>
                <strong style={{ color: '#0F172A' }}>Janeway lesions</strong> on left palm & subungual splinter hemorrhages.
              </div>
            </div>
          </div>

          {/* Card 2: Diagnostics, LIS & Imaging */}
          <div
            style={{
              background: '#FFFFFF',
              border: `1.5px solid ${viewMode === 'unified' ? '#E2E8F0' : '#FECACA'}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', background: '#F1F5F9', borderRadius: '6px', color: '#0F172A' }}>
                  <HeartPulse size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Diagnostic Evidence & Imaging
                </h4>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--nexus-font-mono)',
                  background: viewMode === 'unified' ? '#F0FDFA' : '#FEE2E2',
                  color: viewMode === 'unified' ? '#0F766E' : '#DC2626',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {viewMode === 'unified' ? 'LIS/PACS LINKED' : 'STANDALONE PACS/LIS'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Microbiology: </span>
                <strong style={{ color: '#059669' }}>3/3 Blood Cultures positive</strong> for Streptococcus viridans.
              </div>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>TEE Echocardiogram: </span>
                <strong style={{ color: '#0F172A' }}>11mm oscillating vegetation</strong> on anterior mitral leaflet with mild MR.
              </div>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Inflammatory Markers: </span>
                <strong style={{ color: '#0F172A' }}>CRP 112 mg/L</strong>, ESR 84 mm/hr (severely elevated).
              </div>
            </div>
          </div>

          {/* Card 3: Medications & Safety Contradiction */}
          <div
            style={{
              background: '#FFFFFF',
              border: `1.5px solid ${viewMode === 'unified' ? (viewMode === 'unified' ? '#F59E0B' : '#E2E8F0') : '#FECACA'}`,
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', background: '#F1F5F9', borderRadius: '6px', color: '#0F172A' }}>
                  <Pill size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Pharmacotherapy & Safety
                </h4>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--nexus-font-mono)',
                  background: '#FEF3C7',
                  color: '#92400E',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                SAFETY AUDIT
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Current Prescription: </span>
                <strong style={{ color: '#0F172A' }}>Empiric Ceftriaxone IV 2g q24h</strong> ordered at triage.
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  background: viewMode === 'unified' ? '#FEF2F2' : '#F8FAFC',
                  borderRadius: '6px',
                  border: viewMode === 'unified' ? '1px solid #FECACA' : 'none',
                }}
              >
                <span style={{ color: '#DC2626', fontWeight: 600 }}>Allergy Conflict: </span>
                <strong style={{ color: '#991B1B' }}>Documented Penicillin Anaphylaxis</strong> in archived chart notes.
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  background: viewMode === 'unified' ? '#FFFBEB' : '#F8FAFC',
                  borderRadius: '6px',
                }}
              >
                <span style={{ color: '#D97706', fontWeight: 600 }}>Nexus Safety Flag: </span>
                <span style={{ color: '#78350F' }}>
                  {viewMode === 'unified'
                    ? 'Cephalosporin cross-reactivity warning active. Suggested regimen switch to Vancomycin + Gentamicin.'
                    : 'Unflagged in standard pharmacy silo due to fragmented note archives.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Synthesized Output Panel (in Unified mode) */}
        {viewMode === 'unified' && (
          <div
            style={{
              margin: '0 28px 28px',
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              borderRadius: '12px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#5EEAD4',
                  fontSize: '11px',
                  fontFamily: 'var(--nexus-font-mono)',
                  fontWeight: 700,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                <Sparkles size={14} />
                <span>Synthesized Clinical Graph Differential</span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>
                Definite Infective Endocarditis (Modified Duke Criteria: 2 Major Criteria Met)
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8', maxWidth: '720px' }}>
                Positive blood cultures (S. viridans) + 11mm oscillating mitral valve vegetation on TEE echo. Full evidentiary traceability to primary laboratory and imaging artifacts.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div
                style={{
                  background: 'rgba(5,150,105,0.2)',
                  border: '1px solid #059669',
                  color: '#34D399',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--nexus-font-mono)',
                  fontWeight: 600,
                }}
              >
                STATE: SUPPORTED
              </div>
              <div
                style={{
                  background: 'rgba(217,119,6,0.2)',
                  border: '1px solid #D97706',
                  color: '#FBBF24',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--nexus-font-mono)',
                  fontWeight: 600,
                }}
              >
                1 SAFETY ALERT
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side: The Problem We Address vs The Nexus Architecture */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '32px',
        }}
      >
        {/* The Problem */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #DC2626',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              color: '#DC2626',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <AlertTriangle size={13} />
            <span>THE PROBLEM WE ADDRESS</span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: '#0F172A',
              margin: '0 0 14px',
            }}
          >
            Cognitive overload and diagnostic blind spots.
          </h3>

          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
            Clinicians today switch between an average of 6 to 12 separate software interfaces per shift. This structural fragmentation creates severe risks:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', marginTop: '7px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#334155' }}>
                <strong>Siloed EHRs & PACs:</strong> Imaging, microbiology, and notes live in disconnected databases with no automatic correlation.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', marginTop: '7px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#334155' }}>
                <strong>Missed Contradictions:</strong> Critical allergy details and drug-drug interactions buried in narrative notes are easily overlooked.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', marginTop: '7px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#334155' }}>
                <strong>Black-Box Hallucinations:</strong> Generic LLM chatbots make confident but unverified diagnoses without clinical evidentiary provenance.
              </div>
            </div>
          </div>
        </div>

        {/* The Nexus Solution */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #0F766E',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              color: '#0F766E',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <CheckCircle2 size={13} />
            <span>THE NEXUS SOLUTION</span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: '#0F172A',
              margin: '0 0 14px',
            }}
          >
            Embedded contextual intelligence & unified workspace.
          </h3>

          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
            Nexus embeds reasoning directly inside the clinical workstation, uniting evidence, hypotheses, and uncertainties into one auditable graph:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0F766E', marginTop: '7px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#334155' }}>
                <strong>Unified Context Engine:</strong> Automatically builds a patient context graph from FHIR, HL7, DICOM, and unstructured notes.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0F766E', marginTop: '7px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#334155' }}>
                <strong>Transparent Epistemic States:</strong> Categorizes hypotheses into Supported, Contradicted, or Insufficient Data — never arbitrary percentages.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0F766E', marginTop: '7px', flexShrink: 0 }} />
              <div style={{ fontSize: '13px', color: '#334155' }}>
                <strong>Human Authority & Audit Lineage:</strong> Every claim links to primary evidence; the clinician always reviews and authorizes all actions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
