import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { useDrawer } from '../../app/providers/DrawerContext';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  ShieldAlert,
  GitBranch,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

export const IntelligenceRail: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const { openContextualAi } = useDrawer();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { overview, hypotheses, informationGaps, safetyIssues, uncertainty } = activeCase;

  if (isCollapsed) {
    return (
      <aside
        aria-label="Nexus intelligence rail (collapsed)"
        style={{
          width: '40px',
          background: '#FAFAFA',
          borderLeft: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(false)}
        title="Expand Nexus Intelligence Rail"
      >
        <button
          style={{
            border: 'none',
            background: 'transparent',
            color: '#64748B',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#0F172A',
            marginTop: '20px',
            textTransform: 'uppercase',
          }}
        >
          ⬡ NEXUS INTELLIGENCE
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Nexus intelligence rail"
      style={{
        width: '280px',
        background: '#FAFAFA',
        borderLeft: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Intelligence Rail Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '3px',
              background: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            ⬡
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#0F172A' }}>
              Nexus Intelligence
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
              Simulated Clinical Reasoning
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '2px',
          }}
          title="Collapse rail"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Case State & Rationale */}
        <section
          aria-labelledby="rail-case-state-title"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div id="rail-case-state-title" style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Case State
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="badge badge-review">
              {overview.state}
            </span>
          </div>

          <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
            Why review required?
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
            {uncertainty.primaryReason}
          </div>
        </section>

        {/* Hypotheses Summary */}
        <section
          aria-labelledby="rail-hypotheses-title"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div id="rail-hypotheses-title" style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Candidate Hypotheses
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
              {hypotheses.length} candidates
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {hypotheses.map((h, i) => (
              <div
                key={h.id}
                onClick={() => setActiveCaseSubTab('reasoning')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  background: '#F8FAFC',
                  border: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong style={{ color: '#0F172A', fontSize: '11px' }}>
                    {i + 1}. {h.title}
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        h.status === 'Supported'
                          ? '#047857'
                          : h.status === 'Uncertain'
                          ? '#B45309'
                          : '#B91C1C',
                    }}
                  >
                    ● {h.status}
                  </span>
                  <span style={{ color: '#94A3B8' }}>
                    {h.supportingFindingIds.length} supporting · {h.contradictingFindingIds.length} contradicting
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Evidence & Gaps Summary */}
        <section
          aria-labelledby="rail-evidence-title"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div id="rail-evidence-title" style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Clinical Evidence & Gaps
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div
              onClick={() => setActiveCaseSubTab('evidence')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: '#F8FAFC',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                <BookOpen size={13} color="#2563EB" /> Relevant Guidelines
              </span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>4 sources</span>
            </div>

            <div
              onClick={() => setActiveCaseSubTab('investigations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: '#F8FAFC',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                <AlertCircle size={13} color="#D97706" /> Information Gaps
              </span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#D97706' }}>
                {informationGaps.length} unresolved
              </span>
            </div>

            {safetyIssues.length > 0 && (
              <div
                onClick={() => setActiveCaseSubTab('safety')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B' }}>
                  <ShieldAlert size={13} color="#DC2626" /> Safety Issues
                </span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#DC2626' }}>
                  {safetyIssues.length} active
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Contextual Inquiries (Section 41 & 42) */}
        <section
          aria-labelledby="rail-inquiries-title"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div id="rail-inquiries-title" style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Ask Nexus About This Case
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              {
                title: 'Evidence Supporting Hypothesis 1 (Endocarditis)',
                query: 'What evidence supports Subacute Bacterial Endocarditis?',
                response:
                  'Candidate Hypothesis 1 is supported by the triad of persistent fever, subungual splinter hemorrhages, and positive blood cultures growing Streptococcus viridans in 3/3 sets following dental instrumentation. This aligns with AHA 2025 guidelines and satisfies 1 Major and 2 Minor Duke Criteria.',
                scope: {
                  purpose: 'HYPOTHESIS_REVIEW',
                  allowedOutputs: ['Supporting findings', 'Duke criteria mapping', 'Guideline references'],
                  prohibitedOutputs: ['Autonomous diagnosis', 'Prescription orders'],
                },
                safetyBoundary: 'OK',
                groundedFindings: ['f-2', 'f-3', 'f-4', 'f-5', 'inv-1'],
                groundedEvidence: ['ev-aha-2025', 'ev-duke-2024'],
              },
              {
                title: 'Information Gaps & Next Steps',
                query: 'What information is missing to confirm diagnosis?',
                response:
                  'A definitive Transesophageal Echocardiogram (TEE) is the primary information gap required to visualize valvular vegetations (>95% sensitivity) and assess leaflet perforation or root abscess, distinguishing bacterial endocarditis from sterile Libman-Sacks lesions.',
                scope: {
                  purpose: 'MISSING_INFORMATION',
                  allowedOutputs: ['Diagnostic investigations', 'Sensitivity thresholds'],
                  prohibitedOutputs: ['Definitive diagnostic conclusion'],
                },
                safetyBoundary: 'OK',
                groundedFindings: ['gap-1'],
                groundedEvidence: ['ev-aha-2025'],
              },
              {
                title: 'Endocarditis vs SLE Differential Tension',
                query: 'Why are Endocarditis and SLE both considered candidates?',
                response:
                  'The patient presents with diffuse arthralgias and a borderline ANA (1:40). However, the ANA titer is below the ACR/EULAR entry criteria (1:80), and persistent bacteremia with typical viridans organisms strongly favors infective endocarditis over an isolated primary lupus flare.',
                scope: {
                  purpose: 'CONTRADICTION_REVIEW',
                  allowedOutputs: ['Differential comparison', 'Criteria differentiation'],
                  prohibitedOutputs: ['Definitive exclusion without imaging'],
                },
                safetyBoundary: 'OK',
                groundedFindings: ['f-1', 'f-6', 'inv-1'],
                groundedEvidence: ['ev-eular-2023'],
              },
              {
                title: 'Safety Boundary: Severe Penicillin Allergy',
                query: 'Summarize active safety issues and allergy contraindications',
                response:
                  'CRITICAL SAFETY WARNING: Patient has documented severe anaphylactoid urticaria and bronchospasm to Penicillins/Amoxicillin. Standard first-line penicillin or ampicillin regimens are strictly contraindicated. Recommended guideline alternative is intravenous Vancomycin with AUC-targeted trough monitoring.',
                scope: {
                  purpose: 'CASE_REVIEW',
                  allowedOutputs: ['Allergy contraindication alert', 'Alternative antimicrobial classes'],
                  prohibitedOutputs: ['Direct prescription ordering'],
                },
                safetyBoundary: 'SAFETY_CRITICAL',
                groundedFindings: ['f-7', 'safe-1'],
                groundedEvidence: ['ev-aha-2025'],
              },
              {
                title: 'Contradiction Analysis: Arthralgias vs Murmur',
                query: 'What contradictions exist in the current findings?',
                response:
                  'Deterministic checks identify diagnostic tension between diffuse joint arthralgias (f-6, suggestive of systemic inflammatory/rheumatologic disease) and focal splinter hemorrhages with new regurgitant murmur (f-4, f-5, suggestive of acute embolic phenomenon). Infective endocarditis with immune-complex mediated arthralgia resolves this tension.',
                scope: {
                  purpose: 'CONTRADICTION_REVIEW',
                  allowedOutputs: ['Contradiction explanation', 'Clinical reconciliation'],
                  prohibitedOutputs: ['Autonomous clinical adjudication'],
                },
                safetyBoundary: 'CONTRADICTION',
                groundedFindings: ['f-4', 'f-6'],
                groundedEvidence: ['ev-duke-2024'],
              },
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => openContextualAi(prompt)}
                style={{
                  textAlign: 'left',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '7px 9px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#1E293B',
                  cursor: 'pointer',
                  lineHeight: 1.3,
                  transition: 'all 0.1s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F1F5F9';
                  e.currentTarget.style.borderColor = '#94A3B8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <span>"{prompt.query}"</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '8px',
                    background: prompt.safetyBoundary === 'SAFETY_CRITICAL' ? '#FEE2E2' : '#E0F2FE',
                    color: prompt.safetyBoundary === 'SAFETY_CRITICAL' ? '#DC2626' : '#0369A1',
                    flexShrink: 0,
                  }}
                >
                  {prompt.safetyBoundary}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Phase 6H: Interoperability Boundary Section */}
        <section style={{ padding: '14px 16px', borderTop: '1px solid #E2E8F0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#64748B',
                fontFamily: 'var(--font-mono)',
              }}
            >
              FHIR R4 Boundary
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '8px',
                background: '#DCFCE7',
                color: '#15803D',
              }}
            >
              CONNECTED
            </span>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '11px',
              color: '#334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Inbound Protocol:</span>
              <span style={{ fontWeight: 600 }}>FHIR R4 / LOINC / UCUM</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Connected Feeds:</span>
              <span style={{ fontWeight: 600 }}>4 Active Sources</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Audit Log:</span>
              <span style={{ fontWeight: 600 }}>Append-only (Active)</span>
            </div>

            <button
              onClick={() => setActiveCaseSubTab('documents')}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '6px',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Open Documents & FHIR Hub →
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
};
