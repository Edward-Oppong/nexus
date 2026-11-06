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
  Network,
  Printer,
} from 'lucide-react';
import { CandidateHypothesis } from '../../../domain/hypothesis';
import { NexusAssessmentPanel } from '../../../components/intelligence/NexusAssessmentPanel';
import { computeHypothesisExplainability } from '../../../lib/intelligence/governance/explainability-engine';
import { KnowledgeGraphDrawer } from '../../../components/clinical/KnowledgeGraphDrawer';
import { exportCaseToPdf } from '../../cases/services/pdf-export-service';

export const ReasoningTab: React.FC = () => {
  const { activeCase, setActiveCaseSubTab, requestInvestigation, setActiveView } = useCase();
  const { openEvidenceDrawer } = useDrawer();
  const { currentPersona } = usePersona();
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>('hyp-1');
  const [showExplainability, setShowExplainability] = useState<boolean>(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState<boolean>(false);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  const { hypotheses = [], findings = [], uncertainty = {
    overallState: 'UNCERTAIN',
    dataCompleteness: 'PENDING',
    dataCompletenessReason: 'Initial data assessment pending.',
    evidenceConsistency: 'PENDING',
    evidenceConsistencyReason: 'Evaluating clinical presentations.',
    modelApplicability: 'STANDARD',
    modelApplicabilityReason: 'Standard clinical models active.',
    primaryReason: 'Initial intake phase.'
  }, informationGaps = [] } = activeCase || {};
  const activeHypothesis = hypotheses.find((h) => h.id === selectedHypothesisId) || hypotheses[0] || null;

  const explainability = useMemo(() => {
    if (!activeHypothesis) return null;
    return computeHypothesisExplainability(activeCase, activeHypothesis.id);
  }, [activeCase, activeHypothesis?.id]);

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
              ⬡ Nexus Clinical Intelligence Engine v2.5 (Production Live)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Multi-hypothesis differential decomposition & human review
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Clinical Reasoning & Candidate Hypotheses
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => exportCaseToPdf({ fullCase: activeCase, assessment: activeCase.nexusAssessment })}
            className="btn btn-sm"
            style={{
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
            title="Export complete case inputs and AI diagnostic assessment to PDF"
          >
            <Printer size={13} /> Export PDF Report
          </button>

          <button
            onClick={() => setActiveCaseSubTab('review')}
            className="btn btn-sm btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            Begin Clinician Review <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Phase 6F: Nexus Assessment & Adjudication Panel */}
      <NexusAssessmentPanel />

      {/* Candidate Hypotheses Cards Grid */}
      {hypotheses.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-medium)',
            borderRadius: '6px',
            padding: '36px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '50%', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <BrainCircuit size={26} />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Candidate Hypotheses Generated
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.5 }}>
            No candidate differential diagnoses have been established for this case yet. Ingest clinical documents or run the Nexus reasoning analysis above to generate hypotheses.
          </p>
          <button
            onClick={() => setActiveCaseSubTab('documents')}
            className="btn btn-sm btn-outline"
            style={{ fontSize: '12px' }}
          >
            Review Clinical Documents &rarr;
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {hypotheses.map((hyp, index) => {
            const isSelected = activeHypothesis ? hyp.id === activeHypothesis.id : false;
            const statusBg =
              hyp.status === 'Supported' ? 'var(--success-subtle)' : hyp.status === 'Uncertain' ? 'var(--warning-subtle)' : 'var(--danger-subtle)';
            const statusColor =
              hyp.status === 'Supported' ? 'var(--status-success)' : hyp.status === 'Uncertain' ? 'var(--status-warning)' : 'var(--status-danger)';
            const statusBorder =
              hyp.status === 'Supported' ? 'var(--success-border)' : hyp.status === 'Uncertain' ? 'var(--warning-border)' : 'var(--danger-border)';

            return (
              <div
                key={hyp.id}
                onClick={() => setSelectedHypothesisId(hyp.id)}
                style={{
                  background: isSelected ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                  border: `2px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
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
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
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

                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                    {hyp.title}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '12px' }}>
                    {hyp.statusDetail}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
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
      )}

      {/* Selected Hypothesis In-Depth Clinical Decomposition */}
      {activeHypothesis && (
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                Detailed Decomposition
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
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
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-medium)',
              borderLeft: '4px solid var(--text-primary)',
              borderRadius: '4px',
              padding: '14px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}
          >
            <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Nexus Assessment
            </strong>
            {activeHypothesis.nexusAssessment}
          </div>

          {/* Section 20: Evidence Balance / Contradiction View */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px' }}>
              Evidence Balance & Contradiction Analysis
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              {/* Supporting Column */}
              <div
                style={{
                  background: 'var(--success-subtle)',
                  border: '1px solid var(--success-border)',
                  borderRadius: '6px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  <CheckCircle2 size={15} /> Supporting Findings ({activeHypothesis.supportingFindingIds.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeHypothesis.supportingFindingIds.map((id) => (
                    <div
                      key={id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--success-subtle)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: 'var(--status-success)',
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
                  background: 'var(--danger-subtle)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: '6px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-danger)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  <AlertTriangle size={15} /> Contradicting / Atypical ({activeHypothesis.contradictingFindingIds.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeHypothesis.contradictingFindingIds.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--status-danger)', fontStyle: 'italic' }}>
                      No contradicting findings observed.
                    </div>
                  ) : (
                    activeHypothesis.contradictingFindingIds.map((id) => (
                      <div
                        key={id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--danger-subtle)',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: 'var(--status-danger)',
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
                  background: 'var(--warning-subtle)',
                  border: '1px solid var(--warning-border)',
                  borderRadius: '6px',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-warning)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  <HelpCircle size={15} /> Unresolved Information Gaps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {informationGaps.map((gap) => (
                    <div
                      key={gap.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--warning-subtle)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--status-warning)' }}>? {gap.testName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--status-warning)', marginTop: '2px' }}>
                        Status: {gap.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Phase 11: Point-of-Care Feature Attribution & Sensitivity Simulation */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
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
                    color: 'var(--accent-primary)',
                  }}
                >
                  <BrainCircuit size={15} />
                  <span>{showExplainability ? 'Hide Feature Attribution & Explainability' : 'Show Feature Attribution & Explainability Weights'}</span>
                  {showExplainability ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Likelihood: {explainability?.qualitativeLikelihood || activeHypothesis.statusDetail || activeHypothesis.status}
                </span>
              </div>

              {showExplainability && explainability && (
                <div style={{ marginTop: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Shapley-Proxy Clinical Feature Attribution
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setShowKnowledgeGraph(true)}
                        className="btn btn-xs btn-outline"
                        style={{ fontSize: '11px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', borderColor: 'var(--border-medium)', background: 'var(--accent-subtle)' }}
                      >
                        <Network size={12} /> Knowledge Graph &rarr;
                      </button>
                      <button
                        onClick={() => setActiveView('ai-governance')}
                        className="btn btn-xs btn-outline"
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        AI Governance Console &rarr;
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                    {explainability.attributions?.slice(0, 4).map((attr) => {
                      const isPos = attr.direction === 'POSITIVE_SUPPORT';
                      return (
                        <div
                          key={attr.findingId}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            padding: '8px 10px',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={attr.findingLabel}>
                              {attr.findingLabel}
                            </span>
                            <span
                              style={{
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: isPos ? 'var(--status-success)' : 'var(--status-danger)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {attr.attributionPercentage}%
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', lineHeight: 1.3 }}>
                            {attr.counterfactualImpact}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {explainability.counterfactuals && explainability.counterfactuals.length > 0 && (
                    <div style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                        Counterfactual Sensitivity Simulation
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-primary)', lineHeight: 1.4 }}>
                        <strong>{explainability.counterfactuals[0].findingModified}: </strong>
                        {explainability.counterfactuals[0].predictedHypothesisRankShift}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: '4px', fontStyle: 'italic' }}>
                        {explainability.counterfactuals[0].clinicalRationale}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Section 21 & Expert Correction #5: Multi-Dimensional Qualitative Uncertainty */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              Qualitative Uncertainty Assessment
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Transparent clinical confidence dimensions (Zero arbitrary percentage meters)
            </div>
          </div>
          <span className="badge badge-review">
            {uncertainty.overallState}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
          {/* Data Completeness */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Data Completeness
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
              {uncertainty.dataCompleteness}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {uncertainty.dataCompletenessReason}
            </div>
          </div>

          {/* Evidence Consistency */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Evidence Consistency
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-warning)', margin: '4px 0' }}>
              {uncertainty.evidenceConsistency}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {uncertainty.evidenceConsistencyReason}
            </div>
          </div>

          {/* Model Applicability */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Model Applicability
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-danger)', margin: '4px 0' }}>
              {uncertainty.modelApplicability}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {uncertainty.modelApplicabilityReason}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: '4px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <strong>Primary clinical rationale: </strong>
          {uncertainty.primaryReason}
        </div>
      </section>

      {/* Section 22: High-Priority Information Gap Action */}
      {informationGaps && informationGaps.length > 0 && informationGaps[0] && (
        <section
          style={{
            background: 'var(--warning-subtle)',
            border: '1px solid var(--warning-border)',
            borderRadius: '6px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--status-warning)', letterSpacing: '0.06em' }}>
                High-Priority Information Gap Detected
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-warning)', marginTop: '2px' }}>
                {informationGaps[0].testName}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--status-warning)', marginTop: '4px', maxWidth: '720px', lineHeight: 1.5 }}>
                {informationGaps[0].whyItMatters}
              </p>
              </div>
          </div>
        </section>
      )}

      {/* Phase 13: Clinical Knowledge Graph Visual Explorer Drawer */}
      <KnowledgeGraphDrawer
        isOpen={showKnowledgeGraph}
        onClose={() => setShowKnowledgeGraph(false)}
      />
    </div>
  );
};
