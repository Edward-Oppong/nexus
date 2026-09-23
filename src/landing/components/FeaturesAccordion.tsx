import React, { useState } from 'react';
import { Layout, GitFork, HelpCircle, ShieldAlert, CheckSquare } from 'lucide-react';

interface FeatureFacet {
  id: string;
  label: string;
  icon: React.ReactNode;
  heading: string;
  body: string;
  points: string[];
  graphicTitle: string;
  graphicData: Array<{ label: string; value: string; detail?: string }>;
}

export const FeaturesAccordion: React.FC = () => {
  const [activeFacet, setActiveFacet] = useState<string>('workstation');

  const facets: FeatureFacet[] = [
    {
      id: 'workstation',
      label: 'Contextual workstation',
      icon: <Layout size={16} />,
      heading: 'All patient evidence in one clinical viewport',
      body: 'Consult teams lose significant time moving between clinical notes, microbiology reports, and outpatient records. Nexus brings these sources into a single organized workspace arranged around the patient’s active clinical problem.',
      points: [
        'Integrated timeline aligning microbiology, vital sign trends, and clinical notes',
        'Direct MedCPT evidence retrieval and laboratory preview without opening external systems',
        'Persistent case summary shared across cardiology, ID, and internal medicine consults',
      ],
      graphicTitle: 'CLINICAL VIEWPORT ARCHITECTURE',
      graphicData: [
        { label: 'Timeline feed', value: '4 EHR databases synchronized', detail: 'Real-time FHIR & HL7 stream' },
        { label: 'Evidence integration', value: 'MedCPT semantic search', detail: 'Peer-reviewed guidelines linked' },
        { label: 'Consult notes', value: 'Cardiology + ID co-workspace', detail: 'Shared diagnostic scratchpad' },
      ],
    },
    {
      id: 'differential',
      label: 'Differential reasoning',
      icon: <GitFork size={16} />,
      heading: 'Hypothesis evaluation against published clinical criteria',
      body: 'Rather than generating speculative text like a conversational chatbot, Nexus maps active patient findings directly to established clinical guidelines and diagnostic algorithms such as Duke, Wells, and CURB-65.',
      points: [
        'Criteria matching showing exact met and unmet criteria points',
        'Dynamic ranking of competing differential diagnoses as new labs arrive',
        'Explicit sensitivity and specificity weighting for diagnostic tests',
      ],
      graphicTitle: 'CRITERIA EVALUATION MATRIX',
      graphicData: [
        { label: 'Modified Duke Criteria', value: '2 Major, 1 Minor met', detail: 'Status: Definite Infective Endocarditis' },
        { label: 'Wells PE Score', value: '1.5 points (Low probability)', detail: 'Status: Alternative diagnosis more likely' },
        { label: 'SIRS / Sepsis Criteria', value: '2/4 criteria met (T 38.8, HR 104)', detail: 'Status: Alert active, lactate normal' },
      ],
    },
    {
      id: 'uncertainty',
      label: 'Uncertainty shown honestly',
      icon: <HelpCircle size={16} />,
      heading: 'Transparent epistemic states, not artificial confidence scores',
      body: 'Complex medicine is qualitative. Nexus never outputs arbitrary percentage probabilities. Instead, every hypothesis is classified into verifiable epistemic states: Supported, Contradicted, or Insufficient Data.',
      points: [
        'Highlights critical missing investigations required before initiating high-risk therapy',
        'Distinguishes between lack of evidence and contradictory evidence',
        'Prevents premature diagnostic closure by keeping competing differentials visible',
      ],
      graphicTitle: 'EPISTEMIC STATE CLASSIFICATION',
      graphicData: [
        { label: 'Infective Endocarditis', value: 'Supported by evidence', detail: 'Bacteremia + TEE vegetation confirmed' },
        { label: 'Systemic Lupus Erythematosus', value: 'Insufficient data', detail: 'ANA and complement levels pending' },
        { label: 'Viral Myopericarditis', value: 'Contradicted by findings', detail: 'Valvular vegetation incompatible' },
      ],
    },
    {
      id: 'contradictions',
      label: 'Safety and contraindication auditing',
      icon: <ShieldAlert size={16} />,
      heading: 'Cross-referencing orders against notes and organ function',
      body: 'Safety risks often hide across departmental boundaries — an allergy documented three years ago in an outpatient clinic, or an antibiotic dosage incompatible with morning creatinine clearance. Nexus audits orders continuously.',
      points: [
        'Flags drug-allergy cross-reactivity risks across all active orders',
        'Alerts when medication dosing exceeds renal or hepatic clearance thresholds',
        'Detects temporal discrepancies between clinical specimen collection and result reporting',
      ],
      graphicTitle: 'ACTIVE SAFETY CONFLICT MONITOR',
      graphicData: [
        { label: 'Drug-Allergy Risk', value: 'Ceftriaxone vs. Penicillin Anaphylaxis', detail: 'Severe cross-reactivity alert' },
        { label: 'Renal Clearance', value: 'CrCl 78 mL/min (Normal)', detail: 'Vancomycin trough monitoring required' },
        { label: 'Anticoagulation conflict', value: 'No active antiplatelet order', detail: 'Post-dental extraction safe' },
      ],
    },
    {
      id: 'traceability',
      label: 'Traceable evidence and human sign-off',
      icon: <CheckSquare size={16} />,
      heading: 'Clinician authority with verifiable audit trails',
      body: 'Nexus never acts autonomously. Every diagnostic suggestion and safety flag links directly to its primary source artifact in the patient chart. The physician retains full decision-making responsibility and must explicitly authorize all clinical actions.',
      points: [
        'Every claim cites specific lab accession numbers, PACS image series, and note timestamps',
        'Zero autonomous modifications to the hospital EHR or pharmacy order queue',
        'Full audit logging of all clinician reviews, overrides, and final authorizations',
      ],
      graphicTitle: 'EVIDENTIARY LINEAGE AUDIT',
      graphicData: [
        { label: 'Microbiology proof', value: 'Specimen #904812 · LIS verified', detail: 'Clinician: Dr. J. Martinez (Signed)' },
        { label: 'Echocardiogram proof', value: 'Study #18420-TEE · Series 3, Frame 42', detail: 'Reviewed: 09/24 14:10' },
        { label: 'Final regimen sign-off', value: 'Pending physician authorization', detail: 'Clinician sign-off required' },
      ],
    },
  ];

  const current = facets.find((f) => f.id === activeFacet) || facets[0];

  return (
    <section
      id="features"
      style={{
        padding: '80px 0 96px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="nexus-container">
        {/* Section Heading */}
        <div style={{ maxWidth: '720px', marginBottom: '36px' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 34px)',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              margin: '0 0 12px',
            }}
          >
            Built for clinical decision-making, not administrative billing
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--ink-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Nexus is engineered specifically for hospital consult services. Explore the five core clinical capabilities below.
          </p>
        </div>

        {/* Facet Navigation Tabs (No numbering, clean horizontal list) */}
        <div
          role="tablist"
          aria-label="Clinical capability facets"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: '32px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {facets.map((facet) => (
            <button
              key={facet.id}
              role="tab"
              aria-selected={activeFacet === facet.id}
              onClick={() => setActiveFacet(facet.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeFacet === facet.id ? 600 : 500,
                border: activeFacet === facet.id ? '1px solid var(--clinical-accent)' : '1px solid transparent',
                backgroundColor: activeFacet === facet.id ? '#E6F4F2' : 'transparent',
                color: activeFacet === facet.id ? 'var(--clinical-accent)' : 'var(--ink-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {facet.icon}
              <span>{facet.label}</span>
            </button>
          ))}
        </div>

        {/* Active Facet Display: Left Prose + Right Static Clinical Artifact Diagram */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Plain Clinical Explanation */}
          <div>
            <h3
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                lineHeight: 1.3,
                margin: '0 0 14px',
              }}
            >
              {current.heading}
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--ink-secondary)',
                lineHeight: 1.6,
                margin: '0 0 20px',
              }}
            >
              {current.body}
            </p>

            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {current.points.map((point, index) => (
                <li key={index} style={{ fontSize: '14px', color: 'var(--ink-primary)', lineHeight: 1.5 }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Static Clinical Diagram (No duplicate interactive demo) */}
          <div
            style={{
              backgroundColor: 'var(--surface-ground)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink-secondary)',
                fontWeight: 600,
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '8px',
                marginBottom: '16px',
                letterSpacing: '0.04em',
              }}
            >
              {current.graphicTitle}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {current.graphicData.map((item, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ink-secondary)', marginBottom: '3px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-primary)', marginBottom: '2px' }}>
                    {item.value}
                  </div>
                  {item.detail && (
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--clinical-accent)' }}>
                      {item.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
