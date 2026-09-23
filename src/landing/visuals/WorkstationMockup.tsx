import React, { useState } from 'react';
import {
  FolderKanban,
  Activity,
  BrainCircuit,
  FlaskConical,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Eye,
  UserCheck,
  Sparkles,
  Search,
} from 'lucide-react';

export type WorkstationRegion = 'all' | 'nav' | 'workspace' | 'intelligence';
export type TourStep = 'findings' | 'investigations' | 'evidence' | 'timeline' | 'assessment' | 'review';

interface WorkstationMockupProps {
  activeTourStep?: TourStep;
  onSelectTourStep?: (step: TourStep) => void;
  interactive?: boolean;
}

export const WorkstationMockup: React.FC<WorkstationMockupProps> = ({
  activeTourStep: externalStep,
  onSelectTourStep,
  interactive = true,
}) => {
  const [internalStep, setInternalStep] = useState<TourStep>('findings');
  const [highlightedRegion, setHighlightedRegion] = useState<WorkstationRegion>('all');

  const activeStep = externalStep || internalStep;

  const handleStepChange = (step: TourStep) => {
    if (onSelectTourStep) {
      onSelectTourStep(step);
    } else {
      setInternalStep(step);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Interactive Region Selector Bar */}
      {interactive && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0F172A',
            padding: '10px 18px',
            borderBottom: '1px solid #1E293B',
            color: '#F8FAFC',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#059669',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '12px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 600 }}>
              NEXUS WORKSTATION ARCHITECTURE · LIVE INTERACTION VIEW
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', marginRight: '4px' }}>Highlight Region:</span>
            <button
              onClick={() => setHighlightedRegion('all')}
              style={{
                background: highlightedRegion === 'all' ? '#334155' : 'transparent',
                color: highlightedRegion === 'all' ? '#FFFFFF' : '#94A3B8',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Full Workspace
            </button>
            <button
              onClick={() => setHighlightedRegion('nav')}
              style={{
                background: highlightedRegion === 'nav' ? '#334155' : 'transparent',
                color: highlightedRegion === 'nav' ? '#FFFFFF' : '#94A3B8',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              1. Left: Case Nav
            </button>
            <button
              onClick={() => setHighlightedRegion('workspace')}
              style={{
                background: highlightedRegion === 'workspace' ? '#334155' : 'transparent',
                color: highlightedRegion === 'workspace' ? '#FFFFFF' : '#94A3B8',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              2. Center: Clinical Space
            </button>
            <button
              onClick={() => setHighlightedRegion('intelligence')}
              style={{
                background: highlightedRegion === 'intelligence' ? '#334155' : 'transparent',
                color: highlightedRegion === 'intelligence' ? '#FFFFFF' : '#94A3B8',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              3. Right: Contextual AI
            </button>
          </div>
        </div>
      )}

      {/* Realistic Workstation Patient Header */}
      <div
        style={{
          background: '#F8FAFC',
          padding: '12px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Synthetic Patient A
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--nexus-font-mono)',
                  color: '#475569',
                  background: '#E2E8F0',
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}
              >
                Case #10482
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--nexus-font-mono)',
                  fontWeight: 700,
                  color: '#92400E',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}
              >
                CLINICIAN_REVIEW
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              42 y/o Female · Adult Inpatient Cardiology · Admitted 09 Sep 2026
            </div>
          </div>
        </div>

        {/* Real-time Collaboration Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#0F766E',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
              }}
              title="Dr. Sarah Chen, MD (Attending Cardiologist)"
            >
              SC
            </div>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
              }}
              title="Dr. Marcus Vance, MD (Infectious Disease)"
            >
              MV
            </div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>2 Clinicians Active</span>
          </div>
        </div>
      </div>

      {/* Main 3-Pane Workstation Structure */}
      <div style={{ display: 'flex', minHeight: '440px', position: 'relative' }}>
        {/* Pane 1: Left Case Navigation */}
        <div
          style={{
            width: '190px',
            background: '#F8FAFC',
            borderRight: '1px solid #E2E8F0',
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            opacity: highlightedRegion === 'all' || highlightedRegion === 'nav' ? 1 : 0.35,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              color: '#94A3B8',
              padding: '4px 8px',
              textTransform: 'uppercase',
            }}
          >
            Case Navigation
          </div>

          {[
            { id: 'findings', label: 'Findings', count: 12, active: activeStep === 'findings' },
            { id: 'investigations', label: 'Investigations', count: 5, active: activeStep === 'investigations' },
            { id: 'reasoning', label: 'Reasoning', count: 3, active: activeStep === 'assessment' },
            { id: 'evidence', label: 'Evidence', count: 6, active: activeStep === 'evidence' },
            { id: 'timeline', label: 'Timeline', count: 8, active: activeStep === 'timeline' },
            { id: 'review', label: 'Decision & Review', count: 1, active: activeStep === 'review' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleStepChange(item.id as TourStep)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: item.active ? 600 : 500,
                background: item.active ? '#FFFFFF' : 'transparent',
                color: item.active ? '#0F172A' : '#64748B',
                border: item.active ? '1px solid #CBD5E1' : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: item.active ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <span>{item.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--nexus-font-mono)',
                  color: item.active ? '#0F766E' : '#94A3B8',
                }}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Pane 2: Center Clinical Workspace */}
        <div
          style={{
            flex: 1,
            padding: '18px 22px',
            background: '#FFFFFF',
            overflowY: 'auto',
            opacity: highlightedRegion === 'all' || highlightedRegion === 'workspace' ? 1 : 0.35,
            transition: 'opacity 0.2s ease',
          }}
        >
          {/* Findings View */}
          {activeStep === 'findings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Extracted & Verified Clinical Findings
                </h4>
                <span style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600 }}>
                  W3C PROV-O Anchored
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      Blood cultures positive (3/3 bottles Streptococcus viridans)
                    </span>
                    <span style={{ fontSize: '10px', color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: '2px', fontWeight: 700 }}>
                      VERIFIED · LAB
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
                    Persistent bacteremia matching Major Duke Criterion 1 · Provenance: LIS feed
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      New Grade III/VI holosystolic regurgitant murmur at apex
                    </span>
                    <span style={{ fontSize: '10px', color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: '2px', fontWeight: 700 }}>
                      VERIFIED · EXAM
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
                    Documented by Dr. Sarah Chen, MD · Major Duke Criterion 2
                  </p>
                </div>

                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400E' }}>
                      Splinter hemorrhages & Janeway lesions (soles of feet)
                    </span>
                    <span style={{ fontSize: '10px', color: '#B45309', background: '#FEF3C7', padding: '1px 6px', borderRadius: '2px', fontWeight: 700 }}>
                      AI EXTRACTED · NEEDS REVIEW
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#78350F' }}>
                    Extracted from triage triage intake notes · Pending clinician signoff
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Investigations View */}
          {activeStep === 'investigations' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Investigations & Imaging Orders
                </h4>
                <span style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600 }}>
                  Clinical LIS & Radiology
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      Transesophageal Echocardiogram (TEE)
                    </span>
                    <span style={{ fontSize: '10px', color: '#0F766E', background: '#F0FDFA', border: '1px solid #99F6E4', padding: '2px 6px', borderRadius: '3px', fontWeight: 700 }}>
                      REPORT VERIFIED
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#334155' }}>
                    11mm mobile oscillating vegetation on anterior mitral leaflet with moderate regurgitant jet.
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      12-Lead Electrocardiogram (ECG)
                    </span>
                    <span style={{ fontSize: '10px', color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: '3px', fontWeight: 700 }}>
                      COMPLETED
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748B' }}>
                    Sinus tachycardia with PR prolongation (210 ms) — alert: monitor for aortic root abscess.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Evidence View */}
          {activeStep === 'evidence' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Clinical Guidelines & Ontological Evidence
                </h4>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                  Modified Duke Criteria 2023
                </span>
              </div>
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F766E' }}>
                    Duke Criteria Status: DEFINITE ENDOCARDITIS
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#0F766E', fontWeight: 700 }}>
                    2 Major Criteria Met
                  </span>
                </div>
                <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '11px', color: '#134E4A', lineHeight: 1.6 }}>
                  <li>Major 1: Positive blood cultures for typical microorganism (S. viridans)</li>
                  <li>Major 2: Positive echocardiogram for oscillatory cardiac mass (TEE Mitral)</li>
                  <li>Minor 1: Predisposing heart condition (bicuspid valve) + fever ≥38.0°C</li>
                </ul>
              </div>
            </div>
          )}

          {/* Timeline View */}
          {activeStep === 'timeline' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Longitudinal Clinical Trajectory
                </h4>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Chronological Event Sequence
                </span>
              </div>
              <div style={{ borderLeft: '2px solid #E2E8F0', marginLeft: '8px', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#94A3B8' }}>4 WEEKS AGO</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Dental extraction without prophylactic antibiotics</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#94A3B8' }}>2 WEEKS AGO</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Onset of daily night sweats, chills, and progressive fatigue</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#0F766E' }}>TODAY (09 SEP)</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>ED presentation · Temp 38.8°C · New murmur · S. viridans flagged</div>
                </div>
              </div>
            </div>
          )}

          {/* Assessment View */}
          {activeStep === 'assessment' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Nexus Differential Decomposition
                </h4>
                <span style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600 }}>
                  Qualitative Ranks (No Fake Probabilities)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ border: '1px solid #A7F3D0', background: '#ECFDF5', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>
                      Subacute Infective Endocarditis
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#047857' }}>
                      SUPPORTED (2 MAJOR DUKE)
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#064E3B' }}>
                    Strong causal alignment across microbiology, auscultation, and echocardiography.
                  </p>
                </div>

                <div style={{ border: '1px solid #FDE68A', background: '#FFFBEB', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }}>
                      Systemic Lupus Erythematosus (SLE)
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#B45309' }}>
                      INSUFFICIENT DATA
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#78350F' }}>
                    Joint stiffness noted, but ANA and double-stranded DNA antibodies are unmeasured.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Review View */}
          {activeStep === 'review' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Clinician Review & Adjudication
                </h4>
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>
                  Human In The Loop
                </span>
              </div>
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '14px', background: '#F8FAFC' }}>
                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                  Adjudicate Candidate Hypothesis: Subacute Infective Endocarditis
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: '#059669', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 600 }}>
                    ✓ Accept Hypothesis
                  </button>
                  <button style={{ background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 600 }}>
                    ✎ Edit / Refine
                  </button>
                  <button style={{ background: '#FFFFFF', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 600 }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pane 3: Right Contextual Intelligence Rail */}
        <div
          style={{
            width: '240px',
            background: '#F8FAFC',
            borderLeft: '1px solid #E2E8F0',
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            opacity: highlightedRegion === 'all' || highlightedRegion === 'intelligence' ? 1 : 0.35,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#0F766E" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
              Contextual Intelligence
            </span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#0F766E', fontWeight: 700, marginBottom: '2px' }}>
              SAFETY NOTICE
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#991B1B' }}>
              Penicillin Cross-Reactivity
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#64748B', lineHeight: 1.35 }}>
              Patient has documented anaphylactoid reaction to amoxicillin. Beta-lactam therapy requires caution.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#2563EB', fontWeight: 700, marginBottom: '2px' }}>
              MISSING INVESTIGATION
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>
              Repeat Blood Cultures (Post-Abx)
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#64748B', lineHeight: 1.35 }}>
              Repeat sets recommended at 48 hours to confirm bacterial clearance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
