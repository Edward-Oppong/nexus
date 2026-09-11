import React, { useState, useEffect } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  Database,
  Lock,
  ExternalLink,
  Users,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Award,
} from 'lucide-react';

interface SlideData {
  num: string;
  tag: string;
  title: string;
  headlineLead: string;
  headlineBold: string;
  headlineTail: string;
  content: React.ReactNode;
}

export const LandingView: React.FC = () => {
  const { setActiveView, setActiveCaseSubTab, openCaseById } = useCase();
  const [activeSlide, setActiveSlide] = useState<number>(0);

  // Keyboard navigation for scrubber (< and > arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowLeft') {
        setActiveSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slides: SlideData[] = [
    {
      num: '01',
      tag: 'DIFFERENTIAL REASONING',
      title: 'Differential Decomposition',
      headlineLead: 'What makes Nexus unique is its ',
      headlineBold: 'grounded differential reasoning',
      headlineTail: ' — decomposing complex patient encounters into verifiable hypotheses without opaque probability scores.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Encounter · Case #10482 · Differential Set
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#0F172A', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              3 Hypotheses Formulated
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {/* Hypothesis 1 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #A7F3D0', borderTop: '3px solid #059669', borderRadius: '8px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#047857', fontWeight: 700 }}>
                  HYPOTHESIS 01
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                  SUPPORTED
                </span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                Subacute Bacterial Endocarditis
              </h4>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                S. viridans bacteremia (3/3 bottles) + new regurgitant murmur + Janeway lesions.
              </p>
            </div>

            {/* Hypothesis 2 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #FDE68A', borderTop: '3px solid #D97706', borderRadius: '8px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#B45309', fontWeight: 700 }}>
                  HYPOTHESIS 02
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
                  UNCERTAIN
                </span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                Systemic Lupus Erythematosus
              </h4>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                Borderline ANA (1:40) & arthralgia, but fails 2019 EULAR/ACR classification criteria.
              </p>
            </div>

            {/* Hypothesis 3 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #FECACA', borderTop: '3px solid #DC2626', borderRadius: '8px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#B91C1C', fontWeight: 700 }}>
                  HYPOTHESIS 03
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
                  REFUTED
                </span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                Acute Myocardial Infarction
              </h4>
              <p style={{ fontSize: '11px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                Serial high-sensitivity troponin negative x3; ECG normal sinus rhythm without ST changes.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', borderRadius: '6px', padding: '10px 14px', fontSize: '11px', border: '1px solid #E2E8F0' }}>
            <span style={{ color: '#334155' }}>
              Qualitative Uncertainty: <strong style={{ color: '#0F172A' }}>High Data Completeness</strong> · <strong style={{ color: '#D97706' }}>Moderate Evidence Consistency</strong>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#64748B', fontWeight: 600 }}>Zero Gimmick Scores</span>
          </div>
        </div>
      ),
    },
    {
      num: '02',
      tag: 'DETERMINISTIC SAFETY',
      title: 'Workflow Interrupt Guardrails',
      headlineLead: 'Deterministic guardrails enforce ',
      headlineBold: 'hard safety interrupts',
      headlineTail: ' — halting contraindicated regimens and drug-allergy interactions before therapeutic decisions can be recorded.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderLeft: '5px solid #DC2626',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#DC2626" />
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: '#991B1B', textTransform: 'uppercase' }}>
                  Safety Review Required — Workflow Interrupt
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: '#DC2626', color: '#FFFFFF' }}>
                  SAFETY_CRITICAL
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#991B1B', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Status: OPEN</span>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#1E293B', lineHeight: 1.5, fontWeight: 500 }}>
              Patient has documented history of severe anaphylactoid urticaria and bronchospasm to Penicillins/Amoxicillin. Standard first-line endocarditis regimen (Ampicillin/Ceftriaxone) is strictly contraindicated.
            </p>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(220, 38, 38, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 600 }}>
                ⚠️ Clinical Decision Recording blocked until explicit acknowledgment.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#334155', fontWeight: 600 }}>
                  Acknowledge
                </span>
                <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '4px', background: '#DC2626', color: '#FFFFFF', fontWeight: 600 }}>
                  Resolve Concern ✓
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Allergy Verification</div>
              <div style={{ fontSize: '12px', color: '#0F172A', fontWeight: 600, marginTop: '2px' }}>Verified in FHIR AllergyIntolerance R4</div>
            </div>
            <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Recommended Substitute Protocol</div>
              <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: 600, marginTop: '2px' }}>Vancomycin IV + Gentamicin Protocol</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: '03',
      tag: 'WHO SMART PROVENANCE',
      title: 'Auditable Evidence Trails',
      headlineLead: 'Every clinical assertion is grounded in ',
      headlineBold: 'WHO SMART Level 2–4 clinical guidelines',
      headlineTail: ' — linking observations directly to codified standards and primary clinical consensus.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#0F172A', textTransform: 'uppercase', fontWeight: 700 }}>
              Guideline Provenance Chain
            </span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>AHA/ACC 2020 Infective Endocarditis Guidelines</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', borderRadius: '6px', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>L2</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Narrative Guideline Source</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>AHA/ACC 2020 Guideline for the Management of Infective Endocarditis §4.2</div>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#0284C7', fontWeight: 600 }}>NARRATIVE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', borderRadius: '6px', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>L3</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Codified Clinical Logic (CQL)</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Modified Duke Criteria: 2 Major criteria met (Blood Culture + Valvular Regurgitation)</div>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#7C3AED', fontWeight: 600 }}>EXECUTABLE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', borderRadius: '6px', padding: '10px 14px', border: '1px solid #E2E8F0' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>L4</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>Deterministic Evaluation Engine</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Encounter satisfies 2 major criteria. Provenance stored with SHA-256 hash.</div>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>VERIFIED</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: '04',
      tag: 'HUMAN ADJUDICATION',
      title: 'Human-in-the-Loop Ownership',
      headlineLead: 'Artificial intelligence proposes; ',
      headlineBold: 'licensed human clinicians',
      headlineTail: ' explicitly adjudicate each finding. Rejections require mandatory rationale capture for regulatory auditing.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#D97706', textTransform: 'uppercase', fontWeight: 700 }}>
              Pending Clinician Adjudication
            </span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Dr. A. Chen, MD · Attending Physician</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>AI SYNTHESIS FINDING #04</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#FFFBEB', color: '#B45309', fontWeight: 700, border: '1px solid #FDE68A' }}>
                UNREVIEWED
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#1E293B', margin: '0 0 12px', lineHeight: 1.5 }}>
              "Recommend immediate transesophageal echocardiography (TEE) to evaluate aortic valve vegetation size prior to procedural intervention."
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '4px', border: '1px solid #FECACA', color: '#DC2626', background: '#FEF2F2', fontWeight: 600 }}>
                Reject (Req. Rationale)
              </span>
              <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '4px', border: '1px solid #CBD5E1', color: '#334155', background: '#FFFFFF', fontWeight: 600 }}>
                Edit Finding
              </span>
              <span style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '4px', background: '#059669', color: '#FFFFFF', fontWeight: 600 }}>
                Accept Finding ✓
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
            Non-delegable clinical responsibility complies with FDA CDS Guidance & EU AI Act Class IIa.
          </div>
        </div>
      ),
    },
    {
      num: '05',
      tag: 'WORKSTATION UX',
      title: '3-Zone Clinical Workstation',
      headlineLead: 'The purpose-built ',
      headlineBold: '3-zone workstation architecture',
      headlineTail: ' eliminates cognitive fatigue — organizing case navigation, differential reasoning canvases, and contextual intelligence side-by-side.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
              Tri-Zone Ergonomic Workstation Layout
            </span>
            <span style={{ fontSize: '11px', color: '#0F172A', fontWeight: 600 }}>Collapsible Sidebar Active</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.2fr', gap: '8px', height: '140px' }}>
            {/* Zone 1 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Zone 1</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>Case Navigation</div>
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Patient Timeline, Investigations, Cohort List</div>
            </div>

            {/* Zone 2 */}
            <div style={{ background: '#F8FAFC', border: '1.5px solid #0F172A', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>Zone 2: Main Canvas</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>Clinical Workspace</div>
              </div>
              <div style={{ fontSize: '10px', color: '#475569' }}>Safety Banners, Differential Hypotheses, Adjudication</div>
            </div>

            {/* Zone 3 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Zone 3</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>Intelligence Rail</div>
              </div>
              <div style={{ fontSize: '10px', color: '#64748B' }}>Guideline Citations, Audit Logs, Evidence Drawers</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[activeSlide];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* ── Top Masthead ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid rgba(15, 23, 42, 0.1)',
          padding: '14px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            ⬡
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '17px',
              letterSpacing: '-0.02em',
              color: '#0F172A',
            }}
          >
            nexus
          </span>
        </div>

        {/* Center Editorial Metadata */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#475569',
            fontWeight: 600,
          }}
        >
          <span>MAY @2026</span>
          <span style={{ color: '#CBD5E1' }}>·</span>
          <span>CLINICAL REASONING ARCHITECTURE</span>
          <span style={{ color: '#CBD5E1' }}>·</span>
          <span>MULTIDISCIPLINARY WORKSTATION</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              setActiveView('case-workspace');
              setActiveCaseSubTab('reasoning');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              borderRadius: '6px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
              transition: 'background 0.15s ease',
            }}
          >
            Launch Workstation <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* ── HERO SECTION: Asymmetric Editorial Canvas with Natural Photographic Visibility ── */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '660px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        {/* Full-width Background Photo - Clinicians in Clinical Setting */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/clinical-story.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'right 30%',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none',
            filter: 'contrast(1.05) saturate(1.08) brightness(0.98)',
          }}
        />

        {/* Soft, Transparent Ambient Gradient Scrim (No heavy white blocks; photo remains visible everywhere) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, rgba(248, 250, 252, 0.76) 0%, rgba(248, 250, 252, 0.52) 38%, rgba(248, 250, 252, 0.18) 68%, rgba(248, 250, 252, 0.02) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top & Bottom subtle vignettes to anchor the editorial frame */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '80px',
            background: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.4), transparent)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            background: 'linear-gradient(to top, rgba(248, 250, 252, 0.5), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Editorial Narrative Content - Pure Typography Floating Over Scene (NO background div containers) */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1280px',
            width: '100%',
            margin: '0 auto',
            padding: '56px 48px',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            {/* Minimal Tagline Badge - Transparent with crisp border, no opaque container */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(15, 23, 42, 0.25)',
                background: 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#0F172A',
                fontWeight: 700,
                marginBottom: '20px',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
              }}
            >
              <HeartPulse size={13} color="#DC2626" />
              WHO SMART · ISO 14971 · HUMAN-IN-THE-LOOP CDS
            </div>

            {/* Wordmark Title - Razor-sharp with subtle diffuse text illumination, NO background div */}
            <h1
              style={{
                fontSize: 'clamp(68px, 8.5vw, 108px)',
                fontWeight: 900,
                letterSpacing: '-0.07em',
                lineHeight: 0.88,
                color: '#070D18',
                margin: '0 0 16px',
                fontFamily: 'var(--font-display)',
                textShadow: '0 1px 3px rgba(255, 255, 255, 0.95), 0 0 24px rgba(255, 255, 255, 0.85), 0 0 45px rgba(255, 255, 255, 0.6)',
              }}
            >
              nexus
            </h1>

            {/* Subtitle - Vivid cobalt with diffuse shadow for instant readability */}
            <div
              style={{
                fontSize: '13px',
                color: '#0369A1',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                marginBottom: '16px',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.9), 0 0 14px rgba(255, 255, 255, 0.75)',
              }}
            >
              Clinical Workstation & Reasoning Architecture
            </div>

            {/* Narrative Paragraph - High contrast slate floating cleanly over the clinical setting */}
            <p
              style={{
                fontSize: '17px',
                color: '#1E293B',
                lineHeight: 1.6,
                margin: '0 0 32px',
                fontWeight: 600,
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.95), 0 0 16px rgba(255, 255, 255, 0.8), 0 0 32px rgba(255, 255, 255, 0.5)',
              }}
            >
              Where multidisciplinary medical intuition meets deterministic clinical guardrails. Designed for high-stakes inpatient encounters to structure observations, surface diagnostic uncertainty, and prevent catastrophic contraindications.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setActiveView('case-workspace');
                  setActiveCaseSubTab('reasoning');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 28px',
                  borderRadius: '6px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.3)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                Launch Workstation <ArrowRight size={15} />
              </button>

              <button
                onClick={() => openCaseById('10482')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 24px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(15, 23, 42, 0.25)',
                  color: '#0F172A',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                }}
              >
                Explore Synthetic Case #10482 (SBE)
              </button>
            </div>

            {/* Live Clinical Storyline Inset - Micro story context floating directly under actions */}
            <div
              style={{
                marginTop: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#334155',
                fontWeight: 600,
                letterSpacing: '0.03em',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
              <span>LIVE STORY · 42F INPATIENT · FEVER OF UNKNOWN ORIGIN · BED 4B · S. VIRIDANS IDENTIFIED</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 1: THE REASONING PIPELINE (Interactive Scrubber & Dynamic Content) ── */}
      <section
        style={{
          padding: '64px 48px',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: '#0284C7',
              letterSpacing: '0.08em',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            CHAPTER 01 · SYSTEM REASONING STAGES
          </div>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              margin: '0 0 10px',
            }}
          >
            How Nexus Operates Inside the Encounter
          </h2>
          <p style={{ fontSize: '15px', color: '#64748B', maxWidth: '620px', margin: '0 auto' }}>
            Scrub through the five foundational dimensions of the clinical reasoning architecture.
          </p>
        </div>

        {/* ── The Minimalist Scrubber Bar (ABOVE THE CONTENTS) ── */}
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            margin: '0 auto 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid #0F172A',
            borderBottom: '2px solid #0F172A',
            padding: '12px 24px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            background: '#FFFFFF',
            borderRadius: '6px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
            disabled={activeSlide === 0}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: activeSlide === 0 ? 'not-allowed' : 'pointer',
              opacity: activeSlide === 0 ? 0.25 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0F172A',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 700,
              transition: 'opacity 0.15s ease',
            }}
          >
            <ChevronLeft size={15} /> BACK
          </button>

          {/* Numbers: 01 02 03 04 05 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            {slides.map((s, idx) => {
              const isActive = activeSlide === idx;
              return (
                <button
                  key={s.num}
                  onClick={() => setActiveSlide(idx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isActive ? '#0F172A' : '#94A3B8',
                    fontWeight: isActive ? 900 : 600,
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    position: 'relative',
                    padding: '2px 4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s.num}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '0',
                        right: '0',
                        height: '2px',
                        background: '#0F172A',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={activeSlide === slides.length - 1}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: activeSlide === slides.length - 1 ? 'not-allowed' : 'pointer',
              opacity: activeSlide === slides.length - 1 ? 0.25 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0F172A',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontWeight: 700,
              transition: 'opacity 0.15s ease',
            }}
          >
            NEXT <ChevronRight size={15} />
          </button>
        </div>

        {/* ── DYNAMIC CONTENTS THAT CHANGE (BELOW THE NUMBERS) ── */}

        {/* Dynamic Editorial Headline */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: '820px',
            margin: '0 auto 24px',
            background: '#FFFFFF',
            padding: '14px 28px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E2E8F0',
          }}
        >
          <p
            style={{
              fontSize: '18px',
              lineHeight: 1.5,
              color: '#1E293B',
              margin: 0,
            }}
          >
            {current.headlineLead}
            <strong style={{ color: '#0F172A', fontWeight: 800 }}>
              {current.headlineBold}
            </strong>
            {current.headlineTail}
          </p>
        </div>

        {/* Dynamic Showcase Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '920px',
            margin: '0 auto',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#CBD5E1' }} />
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#CBD5E1' }} />
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#CBD5E1' }} />
              <span
                style={{
                  marginLeft: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: '#64748B',
                }}
              >
                https://nexus.health/cases/10482/{current.tag.toLowerCase().replace(/ /g, '-')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: '#F1F5F9',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {current.tag}
              </span>
            </div>
          </div>

          {/* Dynamic Card Body */}
          <div style={{ padding: '24px 28px', minHeight: '220px' }}>
            {current.content}
          </div>
        </div>
      </section>

      {/* ── CHAPTER 2: STORYTELLING ENCOUNTER (A Real Clinical Journey) ── */}
      <section
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          padding: '72px 48px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: '#059669',
                letterSpacing: '0.08em',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              CHAPTER 02 · ENCOUNTER STORYTELLING
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
              The Anatomy of a High-Stakes Patient Encounter
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#64748B' }}>
              How Nexus protects patient safety when routine EHRs trigger alert fatigue.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {/* Step 1 */}
            <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#64748B', fontWeight: 700, marginBottom: '8px' }}>
                STAGE 01 · ADMISSION
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
                Fever of Unknown Origin
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                42F admitted with night sweats, dyspnea, and splinter hemorrhages. Blood cultures draw 3 sets. The EHR lists an extensive 14-page allergy history that clinicians rarely have time to parse entirely.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '3px solid #DC2626', padding: '24px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#DC2626', fontWeight: 700, marginBottom: '8px' }}>
                STAGE 02 · HARD STOP
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
                Catastrophic Allergy Detected
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Junior resident attempts to order standard first-line Ampicillin/Ceftriaxone for endocarditis. Nexus triggers a deterministic workflow interrupt: patient suffered anaphylactoid bronchospasm in 2021. Decision recording is halted.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', borderTop: '3px solid #059669', padding: '24px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 700, marginBottom: '8px' }}>
                STAGE 03 · GUIDELINE RESOLUTION
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>
                Attending Adjudication
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Nexus surfaces AHA/ACC Guideline §4.2 Level A substitute (Vancomycin IV + Gentamicin protocol). Attending physician explicitly signs off, recording an immutable legal audit log with cryptographic hash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 3: MULTIDISCIPLINARY COLLABORATION (Doctors, Nurses, Specialists) ── */}
      <section style={{ padding: '72px 48px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: '#7C3AED',
              letterSpacing: '0.08em',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            CHAPTER 03 · COLLABORATIVE CARE TEAMS
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
            Three Clinical Personas. One Grounded Truth.
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#64748B' }}>
            How different roles inside the workstation collaborate without fragmented silos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* Persona 1 */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                AC
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Dr. Aris Chen, MD</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Attending Cardiologist</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              "I don't need a bot guessing diagnoses. I need an engine that synthesizes 300 pages of telemetry, Duke criteria, and drug sensitivities, and leaves the therapeutic verdict to me."
            </p>
          </div>

          {/* Persona 2 */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                MV
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Marcus Vance, NP</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Clinical Nurse Specialist</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              "The hard safety stop saved us from an anaphylaxis crisis on Bed 4B. The system blocked the penicillin infusion order before the pharmacy could even dispense it."
            </p>
          </div>

          {/* Persona 3 */}
          <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                ER
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Dr. Elena Rostova, MD</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Infectious Disease Specialist</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              "The WHO SMART guideline provenance gives me exact paragraph citations. When I'm defending a regimen change, I can trace every fact back to primary consensus literature."
            </p>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 4: CLINICAL PHILOSOPHY (The Non-Negotiables) ── */}
      <section
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '72px 48px',
          borderTop: '1px solid #1E293B',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: '#38BDF8',
              letterSpacing: '0.08em',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            CHAPTER 04 · ETHICAL CLINICAL PRINCIPLES
          </div>
          <h2
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#F8FAFC',
              letterSpacing: '-0.03em',
              margin: '0 0 16px',
            }}
          >
            We do not sell "AI Diagnosis."
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: '#94A3B8',
              lineHeight: 1.7,
              margin: '0 auto 32px',
            }}
          >
            Medicine is an accountable human craft. Autonomous black-box AI diagnosis creates legal liability, alert numbness, and dangerous hallucinations. Nexus is engineered as a reasoning workstation that organizes facts, enforces safety boundaries, and leaves the therapeutic ownership with the licensed medical team.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', fontSize: '13px', color: '#CBD5E1', fontFamily: 'var(--font-mono)', flexWrap: 'wrap', marginBottom: '36px' }}>
            <span>✓ WHO SMART Guidelines L2–L4</span>
            <span>✓ Deterministic Hard Stops</span>
            <span>✓ Immutable Audit Outbox Pattern</span>
            <span>✓ Multi-Tenant Row-Level Security</span>
          </div>

          <button
            onClick={() => {
              setActiveView('case-workspace');
              setActiveCaseSubTab('reasoning');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 34px',
              borderRadius: '6px',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
            }}
          >
            Launch Clinical Workstation <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: '#020617',
          borderTop: '1px solid #1E293B',
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748B',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div>NEXUS CLINICAL REASONING ARCHITECTURE · VERSION 0.6.0</div>
        <div>STRICT CLINICAL USE ONLY · NON-DELEGABLE MEDICAL ACCOUNTABILITY</div>
      </footer>
    </div>
  );
};
