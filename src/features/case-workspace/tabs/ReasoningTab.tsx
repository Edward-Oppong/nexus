import React, { useState, useMemo } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { useDrawer } from '../../../app/providers/DrawerContext';
import { usePersona } from '../../../app/providers/PersonaContext';
import {
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  BrainCircuit,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { CandidateHypothesis } from '../../../domain/hypothesis';
import { NexusAssessmentPanel } from '../../../components/intelligence/NexusAssessmentPanel';
import { computeHypothesisExplainability } from '../../../lib/intelligence/governance/explainability-engine';

export const ReasoningTab: React.FC = () => {
  const { activeCase, setActiveCaseSubTab, requestInvestigation, setActiveView } = useCase();
  const { openEvidenceDrawer } = useDrawer();
  const { currentPersona } = usePersona();
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>('hyp-1');
  const [showExplainability, setShowExplainability] = useState<boolean>(false);

  const { hypotheses, findings, uncertainty, informationGaps } = activeCase;
  const activeHypothesis = hypotheses.find((h) => h.id === selectedHypothesisId) || hypotheses[0];

  const explainability = useMemo(() => {
    return computeHypothesisExplainability(activeCase, activeHypothesis.id);
  }, [activeCase, activeHypothesis.id]);

  const getFindingLabel = (id: string) => {
    return findings.find((f) => f.id === id)?.label || id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 10px', marginBottom: '4px' }}>
            <span className="badge badge-nexus" style={{ whiteSpace: 'nowrap' }}>
              ⬡ Nexus Reasoning Engine v2.1 (Simulated)
            </span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Multi-hypothesis differential decomposition & human review
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
            Clinical Reasoning & Candidate Hypotheses
          </h2>
        </div>

        <button
          onClick={() => setActiveCaseSubTab('review')}
          className="btn btn-sm btn-primary"
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Begin Clinician Review <ArrowRight size={13} />
        </button>
      </div>

      {/* Phase 6F: Nexus Assessment & Adjudication Panel */}
      <NexusAssessmentPanel />

      {/* Candidate Hypotheses Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {hypotheses.map((hyp, index) => {
          const isSelected = hyp.id === activeHypothesis.id;
          const statusBg =
            hyp.status === 'Supported' ? '#ECFDF5' : hyp.status === 'Uncertain' ? '#FFFBEB' : '#FEF2F2';
          const statusColor =
            hyp.status === 'Supported' ? '#065F46' : hyp.status === 'Uncertain' ? '#92400E' : '#991B1B';
          const statusBorder =
            hyp.status === 'Supported' ? '#6EE7B7' : hyp.status === 'Uncertain' ? '#FCD34D' : '#FCA5A5';

          return (
            <div
              key={hyp.id}
              onClick={() => setSelectedHypothesisId(hyp.id)}
              style={{
                background: isSelected ? '#FFFFFF' : '#F8FAFC',
                border: `2px solid ${isSelected ? '#0F172A' : '#E2E8F0'}`,
                borderRadius: '6px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    HYPOTHESIS 0{index + 1}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      background: statusBg,
                      color: statusColor,
                      border: `1px solid ${statusBorder}`,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    ● {hyp.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '6px', lineHeight: 1.3 }}>
                  {hyp.title}
                </h3>
                <p style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4, marginBottom: '12px' }}>
                  {hyp.statusDetail}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#475569',
                }}
              >
                <span>✓ {hyp.supportingFindingIds.length} sup</span>
                <span>! {hyp.contradictingFindingIds.length} con</span>
                <span>? {hyp.informationGapIds.length} gap</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Hypothesis In-Depth Clinical Decomposition */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Detailed Decomposition
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              {activeHypothesis.title}
            </h3>
          </div>
          <span className="badge badge-neutral">
            Status: {activeHypothesis.status}
          </span>
        </div>

        {/* Nexus Clinical Assessment Text */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderLeft: '4px solid #0F172A',
            borderRadius: '4px',
            padding: '14px',
            fontSize: '13px',
            color: '#1E293B',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: '#0F172A', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Nexus Assessment
          </strong>
          {activeHypothesis.nexusAssessment}
        </div>

        {/* Section 20: Evidence Balance / Contradiction View */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px' }}>
            Evidence Balance & Contradiction Analysis
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            {/* Supporting Column */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
                <CheckCircle2 size={15} /> Supporting Findings ({activeHypothesis.supportingFindingIds.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeHypothesis.supportingFindingIds.map((id) => (
                  <div
                    key={id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #DCFCE7',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#166534',
                      lineHeight: 1.3,
                    }}
                  >
                    ✓ {getFindingLabel(id)}
                  </div>
                ))}
              </div>
            </div>

            {/* Contradicting Column */}
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B91C1C', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
                <AlertTriangle size={15} /> Contradicting / Atypical ({activeHypothesis.contradictingFindingIds.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeHypothesis.contradictingFindingIds.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#991B1B', fontStyle: 'italic' }}>
                    No contradicting findings observed.
                  </div>
                ) : (
                  activeHypothesis.contradictingFindingIds.map((id) => (
                    <div
                      key={id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #FEE2E2',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#991B1B',
                        lineHeight: 1.3,
                      }}
                    >
                      ! {getFindingLabel(id)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unresolved / Missing Gaps Column */}
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B45309', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
                <HelpCircle size={15} /> Unresolved Information Gaps
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {informationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FEF3C7',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#92400E' }}>? {gap.testName}</div>
                    <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px' }}>
                      Status: {gap.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phase 11: Point-of-Care Feature Attribution & Sensitivity Simulation */}
          <div style={{ marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setShowExplainability(!showExplainability)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563EB',
                }}
              >
                <BrainCircuit size={15} />
                <span>{showExplainability ? 'Hide Feature Attribution & Explainability' : 'Show Feature Attribution & Explainability Weights'}</span>
                {showExplainability ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                Likelihood: {explainability.qualitativeLikelihood}
              </span>
            </div>

            {showExplainability && (
              <div style={{ marginTop: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: '#6366F1' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      Shapley-Proxy Clinical Feature Attribution
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveView('ai-governance')}
                    className="btn btn-xs btn-outline"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    AI Governance Console &rarr;
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {explainability.attributions.slice(0, 4).map((attr) => {
                    const isPos = attr.direction === 'POSITIVE_SUPPORT';
                    return (
                      <div
                        key={attr.findingId}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '4px',
                          padding: '8px 10px',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={attr.findingLabel}>
                            {attr.findingLabel}
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: isPos ? '#16A34A' : '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {attr.attributionPercentage}%
                          </span>
                        </div>
                        <div style={{ color: '#64748B', fontSize: '10px', lineHeight: 1.3 }}>
                          {attr.counterfactualImpact}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {explainability.counterfactuals.length > 0 && (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '4px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#1E40AF', marginBottom: '4px' }}>
                      Counterfactual Sensitivity Simulation
                    </div>
                    <div style={{ fontSize: '11px', color: '#1E3A8A', lineHeight: 1.4 }}>
                      <strong>{explainability.counterfactuals[0].findingModified}: </strong>
                      {explainability.counterfactuals[0].predictedHypothesisRankShift}
                    </div>
                    <div style={{ fontSize: '10px', color: '#3B82F6', marginTop: '4px', fontStyle: 'italic' }}>
                      {explainability.counterfactuals[0].clinicalRationale}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 21 & Expert Correction #5: Multi-Dimensional Qualitative Uncertainty */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em' }}>
              Qualitative Uncertainty Assessment
            </h3>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Transparent clinical confidence dimensions (Zero arbitrary percentage meters)
            </div>
          </div>
          <span className="badge badge-review">
            {uncertainty.overallState}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
          {/* Data Completeness */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Data Completeness
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '4px 0' }}>
              {uncertainty.dataCompleteness}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
              {uncertainty.dataCompletenessReason}
            </div>
          </div>

          {/* Evidence Consistency */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Evidence Consistency
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#D97706', margin: '4px 0' }}>
              {uncertainty.evidenceConsistency}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
              {uncertainty.evidenceConsistencyReason}
            </div>
          </div>

          {/* Model Applicability */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Model Applicability
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#DC2626', margin: '4px 0' }}>
              {uncertainty.modelApplicability}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
              {uncertainty.modelApplicabilityReason}
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#334155',
          }}
        >
          <strong>Primary clinical rationale: </strong>
          {uncertainty.primaryReason}
        </div>
      </section>

      {/* Section 22: High-Priority Information Gap Action */}
      <section
        style={{
          background: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: '6px',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#B45309', letterSpacing: '0.06em' }}>
              High-Priority Information Gap Detected
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#92400E', marginTop: '2px' }}>
              {informationGaps[0].testName}
            </h3>
            <p style={{ fontSize: '12px', color: '#78350F', marginTop: '4px', maxWidth: '720px', lineHeight: 1.5 }}>
              {informationGaps[0].whyItMatters}
            </p>
          </div>

          {currentPersona.allowedActions.canRequestInvestigations && (
            <button
              onClick={() => {
                requestInvestigation(
                  'Transesophageal Echocardiography (TEE)',
                  'Cardiovascular',
                  'Urgent',
                  'Urgent TEE to resolve infective endocarditis vegetation stigmata'
                );
                alert('Urgent TEE successfully requested and logged in case timeline.');
              }}
              className="btn btn-primary"
              style={{ background: '#92400E', borderColor: '#92400E' }}
            >
              Request Investigation
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
