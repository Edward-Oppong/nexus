import React, { useState } from 'react';
import {
  BrainCircuit,
  HelpCircle,
  AlertOctagon,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layout,
  GitFork,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { WorkstationMockup } from '../visuals/WorkstationMockup';

interface NexusFeaturesSectionProps {
  onOpenWorkstation: () => void;
}

export const NexusFeaturesSection: React.FC<NexusFeaturesSectionProps> = ({
  onOpenWorkstation,
}) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);

  const features = [
    {
      id: 'workstation',
      icon: <Layout size={20} className="text-teal-600" />,
      tag: '01 · UNIFIED WORKSPACE',
      title: 'Contextual Clinical Workstation',
      summary:
        'A single pane of glass uniting multi-source patient context, high-resolution diagnostic timelines, laboratory feeds, and clinical evidence retrieval without system hopping.',
      details: [
        'Multi-column clinical overview with active case navigation',
        'Direct evidence retrieval and LIS result preview alongside patient history',
        'Integrated clinical calculators and guideline scoring systems',
      ],
    },
    {
      id: 'reasoning',
      icon: <BrainCircuit size={20} className="text-blue-600" />,
      tag: '02 · REASONING ENGINE',
      title: 'Embedded Differential Intelligence',
      summary:
        'Unlike generative chatbots that hallucinate in a black box, Nexus uses a verifiable knowledge graph to synthesize diagnostic differentials against established clinical criteria.',
      details: [
        'Continuous hypothesis evaluation against criteria (Duke, Wells, etc.)',
        'Evidence weighting based on test sensitivity and specificity',
        'No prompt engineering required — intelligence is native to the case',
      ],
    },
    {
      id: 'uncertainty',
      icon: <HelpCircle size={20} className="text-amber-600" />,
      tag: '03 · EPISTEMIC MODELING',
      title: 'Transparent Qualitative Uncertainty',
      summary:
        'Medicine is qualitative, not a game of arbitrary percentages. Nexus models epistemic states: Supported, Insufficient Data, and Contradicted.',
      details: [
        'Clearly flags missing investigations needed to confirm hypotheses',
        'Prevents premature diagnostic closure by highlighting known unknowns',
        'Synthesizes Bayesian likelihood without artificial confidence scores',
      ],
    },
    {
      id: 'contradictions',
      icon: <AlertOctagon size={20} className="text-rose-600" />,
      tag: '04 · SAFETY AUDITING',
      title: 'Active Contradiction & Safety Auditing',
      summary:
        'Automatically cross-examines clinical documentation, pharmacy orders, and lab trends to surface latent drug interactions, allergy discrepancies, and conflicting notes.',
      details: [
        'Instant detection of drug-allergy cross-reactivity risks',
        'Reconciles conflicting statements between specialist consults',
        'Temporal mismatch alerts between lab timings and medication doses',
      ],
    },
    {
      id: 'provenance',
      icon: <ShieldCheck size={20} className="text-emerald-600" />,
      tag: '05 · HUMAN OVERSIGHT',
      title: 'Traceable Lineage & Human Authority',
      summary:
        'Every assertion links directly to primary sources. Nexus never makes autonomous clinical decisions — the clinician retains absolute authority and sign-off.',
      details: [
        'Click-through citation to exact lab accession IDs and PACS studies',
        'Audit log records all team member reviews, edits, and approvals',
        'Full compatibility with FHIR R4, US Core, and HL7 v2 standards',
      ],
    },
  ];

  return (
    <section
      id="section-features"
      style={{
        padding: '90px 24px 100px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 56px' }}>
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
          <Sparkles size={13} />
          <span>NEXUS FEATURES</span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--nexus-font-display)',
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: '#0F172A',
            margin: '0 0 16px',
          }}
        >
          Everything a clinical team needs to reason clearly.
        </h2>

        <p
          style={{
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            color: '#475569',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Nexus replaces fragmented tools with a single, highly integrated workstation built on verifiable reasoning, epistemic transparency, and strict clinician oversight.
        </p>
      </div>

      {/* Feature Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '16px',
          marginBottom: '32px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        {features.map((feature, idx) => (
          <button
            key={feature.id}
            onClick={() => setActiveFeatureTab(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--nexus-font-body)',
              border: activeFeatureTab === idx ? '1px solid #0F766E' : '1px solid transparent',
              background: activeFeatureTab === idx ? '#F0FDFA' : 'transparent',
              color: activeFeatureTab === idx ? '#0F766E' : '#64748B',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s ease',
            }}
          >
            {feature.icon}
            <span>{feature.title}</span>
          </button>
        ))}
      </div>

      {/* Active Feature Deep Dive Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #0F766E',
          borderRadius: '16px',
          padding: '32px 36px',
          boxShadow: '0 8px 24px rgba(15, 118, 110, 0.08)',
          marginBottom: '56px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              color: '#0F766E',
              letterSpacing: '0.08em',
            }}
          >
            {features[activeFeatureTab].tag}
          </span>
          <h3
            style={{
              fontFamily: 'var(--nexus-font-display)',
              fontSize: '26px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '8px 0 14px',
            }}
          >
            {features[activeFeatureTab].title}
          </h3>
          <p
            style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.65,
              margin: '0 0 24px',
            }}
          >
            {features[activeFeatureTab].summary}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {features[activeFeatureTab].details.map((detail, dIdx) => (
              <div key={dIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={16} color="#0F766E" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>
                  {detail}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenWorkstation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0F766E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '11px 22px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.18s ease',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0D9488')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0F766E')}
          >
            <span>Launch Live Workstation</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Dynamic Graphic Preview */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--nexus-font-mono)', color: '#64748B', fontWeight: 600 }}>
              CLINICAL WORKSTATION
            </span>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>● PRODUCTION READY</span>
          </div>
          <div style={{ height: '180px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
            <img
              src="/landing-clinician.jpg"
              alt="Clinician utilizing Nexus workstation in hospital setting"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
            Designed according to strict clinical engineering standards, ensuring high throughput, zero lag, and instant contextual synthesis for multi-disciplinary teams.
          </p>
        </div>
      </div>

      {/* Interactive Workstation Visual Demo */}
      <div style={{ marginTop: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 4px',
              }}
            >
              Interactive Product Walkthrough
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
              Explore the live workstation interface layout below. Click tabs to inspect differentials, evidence graphs, and safety checks.
            </p>
          </div>
          <button
            onClick={onOpenWorkstation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            <span>Open in Full Screen</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Embedded Workstation Mockup */}
        <WorkstationMockup interactive={true} />
      </div>
    </section>
  );
};
