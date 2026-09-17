import React, { useState } from 'react';
import {
  Database,
  Layers,
  Activity,
  BookOpen,
  GitMerge,
  BrainCircuit,
  UserCheck,
  ChevronRight,
  ArrowDown,
} from 'lucide-react';

export const ContextPipelineSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(5);

  const stages = [
    {
      step: '01',
      title: 'Clinical Data',
      icon: <Database size={18} color="#64748B" />,
      tag: 'INGESTION',
      desc: 'Raw EHR records, FHIR bundles, DICOM studies, and HL7 feeds arrive from clinical sources.',
      example: 'Blood culture report + TEE study + ED triage notes',
    },
    {
      step: '02',
      title: 'Case Context',
      icon: <Layers size={18} color="#0F766E" />,
      tag: 'SYNCHRONIZATION',
      desc: 'Encounters, patient baseline demographics, and clinical timeline are aligned to this specific case.',
      example: 'Case #10482 · Adult Inpatient Cardiology encounter',
    },
    {
      step: '03',
      title: 'Findings',
      icon: <Activity size={18} color="#059669" />,
      tag: 'PROVENANCE',
      desc: 'Observations, vitals, and signs are parsed and explicitly tagged with verification status.',
      example: '3/3 S. viridans bottles + Grade III/VI apical systolic murmur',
    },
    {
      step: '04',
      title: 'Evidence',
      icon: <BookOpen size={18} color="#2563EB" />,
      tag: 'GROUNDING',
      desc: 'Peer-reviewed clinical guidelines, literature, and scoring criteria are matched to patient findings.',
      example: 'Modified Duke Criteria 2023 for Infective Endocarditis',
    },
    {
      step: '05',
      title: 'Relationships',
      icon: <GitMerge size={18} color="#7C3AED" />,
      tag: 'PATHOPHYSIOLOGY',
      desc: 'Ontological connections map bacteremia to valvular endothelitis and embolic Janeway lesions.',
      example: 'S. viridans bacteremia → mitral endothelial colonization → 11mm vegetation',
    },
    {
      step: '06',
      title: 'Candidate Hypotheses',
      icon: <BrainCircuit size={18} color="#D97706" />,
      tag: 'QUALITATIVE EVALUATION',
      desc: 'Differential hypotheses are ranked qualitatively (Supported, Insufficient Data, Contradicted) without opaque percentages.',
      example: 'Subacute Infective Endocarditis: SUPPORTED (2 Major Duke Criteria)',
    },
    {
      step: '07',
      title: 'Human Review',
      icon: <UserCheck size={18} color="#DC2626" />,
      tag: 'DECISION OWNERSHIP',
      desc: 'Named attending physician inspects, verifies, amends, or overrides the assessment before orders are executed.',
      example: 'Dr. Sarah Chen accepts diagnosis & selects Vancomycin due to penicillin allergy',
    },
  ];

  return (
    <section className="nexus-narrative-section" id="section-pipeline">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label nexus-section-label--neutral">
          <Layers size={13} />
          <span>SECTION 05 · THE REASONING CONTINUUM</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          From raw information to clinical context.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          Nexus guides evidence through a rigorous seven-stage pipeline, transforming unorganized patient signals into structured, transparent reasoning.
        </p>
      </div>

      {/* Interactive Horizontal/Vertical Stage Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          marginBottom: '32px',
        }}
      >
        {stages.map((stage, idx) => {
          const isCurrent = idx === activeStage;
          return (
            <button
              key={stage.step}
              onClick={() => setActiveStage(idx)}
              style={{
                background: isCurrent ? '#FFFFFF' : '#F8FAFC',
                border: `1.5px solid ${isCurrent ? '#0F766E' : '#E2E8F0'}`,
                borderTop: isCurrent ? '3px solid #0F766E' : '1.5px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 10px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isCurrent ? '0 4px 12px rgba(15, 118, 110, 0.08)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: isCurrent ? '#0F766E' : '#94A3B8' }}>
                  {stage.step}
                </span>
                {stage.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }}>
                {stage.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed Callout Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #99F6E4',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 8px 24px rgba(15, 118, 110, 0.06)',
          maxWidth: '820px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--nexus-font-mono)',
              fontWeight: 700,
              color: '#0F766E',
              background: '#F0FDFA',
              border: '1px solid #99F6E4',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            STAGE {stages[activeStage].step} · {stages[activeStage].tag}
          </span>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Pipeline Transformation
          </span>
        </div>

        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
          {stages[activeStage].title}
        </h3>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
          {stages[activeStage].desc}
        </p>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#0F766E',
            fontFamily: 'var(--nexus-font-mono)',
          }}
        >
          <strong>Clinical Case Demonstration: </strong>
          {stages[activeStage].example}
        </div>
      </div>
    </section>
  );
};
