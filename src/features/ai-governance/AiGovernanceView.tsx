// ============================================================
// src/features/ai-governance/AiGovernanceView.tsx
// Phase 11: AI Governance & Model Management Workstation
// 4 Consoles: Model Version Registry, A/B Comparison, Human Feedback Curation,
// and Explainability & Feature Attribution
// ============================================================

import React, { useState, useMemo } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import {
  BrainCircuit,
  Sliders,
  Sparkles,
  Award,
  BarChart3,
  GitCompare,
  MessageSquareCheck,
  Download,
  Copy,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  CLINICAL_MODEL_REGISTRY,
} from '../../lib/intelligence/governance/model-registry';
import {
  createAbComparisonSession,
} from '../../lib/intelligence/governance/ab-comparison-engine';
import {
  feedbackCurator,
} from '../../lib/intelligence/governance/feedback-curator';
import {
  computeHypothesisExplainability,
} from '../../lib/intelligence/governance/explainability-engine';
import {
  ClinicianPreferenceBallot,
  ClinicianCorrectionType,
  FeedbackSeverity,
} from '../../domain/ai-governance';

type GovernanceConsole = 'REGISTRY' | 'AB_TEST' | 'FEEDBACK' | 'EXPLAINABILITY';

export const AiGovernanceView: React.FC = () => {
  const { activeCase, setActiveView } = useCase();
  const [activeConsole, setActiveConsole] = useState<GovernanceConsole>('REGISTRY');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ------------------------------------------------------------
  // CONSOLE 1: MODEL REGISTRY STATE
  // ------------------------------------------------------------
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-1.5-pro-clinical');
  const selectedModel = useMemo(
    () => CLINICAL_MODEL_REGISTRY.find((m) => m.id === selectedModelId) || CLINICAL_MODEL_REGISTRY[0],
    [selectedModelId]
  );

  // ------------------------------------------------------------
  // CONSOLE 2: A/B COMPARISON STATE
  // ------------------------------------------------------------
  const [modelAId, setModelAId] = useState<string>('gemini-1.5-pro-clinical');
  const [modelBId, setModelBId] = useState<string>('claude-3.5-sonnet-clinical');
  const [abSession, setAbSession] = useState(() =>
    createAbComparisonSession(activeCase, modelAId, modelBId)
  );
  const [ballot, setBallot] = useState<ClinicianPreferenceBallot | null>(null);
  const [ballotNotes, setBallotNotes] = useState<string>('');

  const handleVoteBallot = (vote: ClinicianPreferenceBallot) => {
    setBallot(vote);
    setAbSession({
      ...abSession,
      clinicianPreference: vote,
      clinicianFeedbackNotes: ballotNotes,
      adjudicatedBy: 'Dr. Edward Vance, MD',
      adjudicatedAt: new Date().toISOString(),
    });
    showToast(`Adjudication recorded: ${vote.replace(/_/g, ' ')}`);
  };

  // ------------------------------------------------------------
  // CONSOLE 3: HUMAN FEEDBACK & DPO CURATION STATE
  // ------------------------------------------------------------
  const [feedbackList, setFeedbackList] = useState(() => feedbackCurator.getFeedbackRecords());
  const [newCorrectionType, setNewCorrectionType] = useState<ClinicianCorrectionType>('OVERCONFIDENCE');
  const [newOriginalAi, setNewOriginalAi] = useState('');
  const [newClinicianFix, setNewClinicianFix] = useState('');
  const [newRationale, setNewRationale] = useState('');
  const [newSeverity, setNewSeverity] = useState<FeedbackSeverity>('MODERATE');
  const [exportedJsonl, setExportedJsonl] = useState<string | null>(null);

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriginalAi.trim() || !newClinicianFix.trim()) {
      alert('Please provide original AI content and clinician correction.');
      return;
    }

    const rec = feedbackCurator.recordFeedback({
      caseId: activeCase.overview.id,
      assessmentId: activeCase.nexusAssessment?.id || 'assess-demo-10482',
      modelId: selectedModelId,
      modelVersion: selectedModel.version,
      correctionType: newCorrectionType,
      originalAiContent: newOriginalAi.trim(),
      clinicianCorrection: newClinicianFix.trim(),
      clinicalRationale: newRationale.trim() || 'Clinician oversight correction',
      severity: newSeverity,
      curatedForFineTuning: true,
      submittedBy: 'Dr. Edward Vance, MD',
    });

    setFeedbackList([rec, ...feedbackList]);
    setNewOriginalAi('');
    setNewClinicianFix('');
    setNewRationale('');
    showToast('Clinician feedback recorded and queued for DPO fine-tuning!');
  };

  const handleExportDpo = () => {
    const jsonl = feedbackCurator.exportJsonl();
    setExportedJsonl(jsonl);
    showToast('DPO JSONL training dataset generated!');
  };

  // ------------------------------------------------------------
  // CONSOLE 4: EXPLAINABILITY STATE
  // ------------------------------------------------------------
  const primaryHypothesisId = activeCase.hypotheses[0]?.id || 'h-ie';
  const explainability = useMemo(
    () => computeHypothesisExplainability(activeCase, primaryHypothesisId),
    [activeCase, primaryHypothesisId]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#F8FAFC', padding: '24px 32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toast */}
        {toastMessage && (
          <div
            style={{
              padding: '12px 18px',
              background: '#0F172A',
              color: '#F8FAFC',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            }}
          >
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                  <BrainCircuit size={18} />
                </div>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                  AI Governance & Model Management Console
                </h1>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: '12px', border: '1px solid #C7D2FE' }}>
                  Phase 11 Enterprise
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', maxWidth: '820px' }}>
                Regulated clinical AI lifecycle management: Central model version registry, side-by-side A/B assessment concordance evaluation, human feedback DPO dataset curation, and deep feature attribution explainability.
              </p>
            </div>

            <button
              onClick={() => setActiveView('case-workspace')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Open Active Case <ChevronRight size={14} />
            </button>
          </div>

          {/* 4-Console Sub-Navigation Toolbar */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px', flexWrap: 'wrap' }}>
            {[
              { id: 'REGISTRY' as const, label: '1. Model Version Registry', icon: Award, count: CLINICAL_MODEL_REGISTRY.length },
              { id: 'AB_TEST' as const, label: '2. A/B Model Comparison', icon: GitCompare, count: 2 },
              { id: 'FEEDBACK' as const, label: '3. Human Feedback & DPO Curation', icon: MessageSquareCheck, count: feedbackList.length },
              { id: 'EXPLAINABILITY' as const, label: '4. Feature Attribution & Explainability', icon: BarChart3, count: explainability.attributions.length },
            ].map((tab) => {
              const isActive = activeConsole === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveConsole(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#4F46E5' : '#475569',
                    background: isActive ? '#EEF2FF' : '#FFFFFF',
                    border: isActive ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isActive ? '#C7D2FE' : '#F1F5F9',
                      color: isActive ? '#3730A3' : '#64748B',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* CONSOLE 1: MODEL VERSION REGISTRY                             */}
        {/* ------------------------------------------------------------ */}
        {activeConsole === 'REGISTRY' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Model List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                Registered Foundation Models ({CLINICAL_MODEL_REGISTRY.length})
              </div>
              {CLINICAL_MODEL_REGISTRY.map((model) => {
                const isSelected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                      background: isSelected ? '#EEF2FF' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {model.name}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: model.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                          color: model.status === 'ACTIVE' ? '#15803D' : '#B45309',
                        }}
                      >
                        {model.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {model.provider} · v{model.version}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Model Detail Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
                    {selectedModel.name}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                    {selectedModel.description}
                  </p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569' }}>
                  Calibrated: {selectedModel.calibrationDate}
                </span>
              </div>

              {/* Benchmark Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>MEDQA USMLE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
                    {selectedModel.benchmarks.medQaUsmlPercent}%
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>PUBMEDQA</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {selectedModel.benchmarks.pubmedQaPercent}%
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>MMLU CLINICAL</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {selectedModel.benchmarks.mmluClinicalPercent}%
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>HALLUCINATION RATE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                    {selectedModel.benchmarks.hallucinationRatePercent}%
                  </div>
                </div>
              </div>

              {/* Technical Specifications Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px', color: '#334155' }}>
                <div><strong>Context Window:</strong> {selectedModel.contextWindowTokens.toLocaleString()} tokens</div>
                <div><strong>Temperature Setting:</strong> {selectedModel.temperature}</div>
                <div><strong>Safety Guardrail Tier:</strong> {selectedModel.safetyTier}</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px', color: '#0F172A' }}>
                <strong>Intended Clinical Scope:</strong> {selectedModel.intendedClinicalScope}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* CONSOLE 2: A/B MODEL COMPARISON                               */}
        {/* ------------------------------------------------------------ */}
        {activeConsole === 'AB_TEST' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header & Concordance Strip */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                    Head-to-Head Model Reasoning Comparison
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Evaluating Case {activeCase.overview.id} against identical patient findings and clinical constraints.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '4px 10px', borderRadius: '12px', border: '1px solid #C7D2FE' }}>
                    Concordance: {abSession.concordance.overallConcordancePercent}% (High Agreement)
                  </div>
                  <button
                    onClick={() => setAbSession(createAbComparisonSession(activeCase, modelAId, modelBId))}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                  >
                    <RotateCcw size={12} /> Re-run A/B
                  </button>
                </div>
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Model A Column */}
                <div style={{ background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                      Model A: {abSession.modelA.modelName}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {abSession.modelA.generationLatencyMs} ms · {abSession.modelA.totalTokensUsed} tokens
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4, background: '#FFFFFF', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    {abSession.modelA.assessment.summary}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>Findings Generated ({abSession.modelA.assessment.nexusFindings.length}):</div>
                  {abSession.modelA.assessment.nexusFindings.map((f) => (
                    <div key={f.id} style={{ fontSize: '11px', color: '#475569', background: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                      • {f.content}
                    </div>
                  ))}
                </div>

                {/* Model B Column */}
                <div style={{ background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                      Model B: {abSession.modelB.modelName}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {abSession.modelB.generationLatencyMs} ms · {abSession.modelB.totalTokensUsed} tokens
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4, background: '#FFFFFF', padding: '10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    {abSession.modelB.assessment.summary}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>Findings Generated ({abSession.modelB.assessment.nexusFindings.length}):</div>
                  {abSession.modelB.assessment.nexusFindings.map((f) => (
                    <div key={f.id} style={{ fontSize: '11px', color: '#475569', background: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                      • {f.content}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinician Adjudication Ballot Strip */}
              <div style={{ marginTop: '18px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  Clinician Adjudication Ballot (Direct Human Preference Feedback)
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {[
                    { id: 'MODEL_A_SUPERIOR' as const, label: 'Model A Superior' },
                    { id: 'MODEL_B_SUPERIOR' as const, label: 'Model B Superior' },
                    { id: 'EQUIVALENT_CONCORDANCE' as const, label: 'Both Equivalent' },
                    { id: 'BOTH_INADEQUATE' as const, label: 'Both Inadequate' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleVoteBallot(opt.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: ballot === opt.id ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                        background: ballot === opt.id ? '#4F46E5' : '#FFFFFF',
                        color: ballot === opt.id ? '#FFFFFF' : '#0F172A',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {ballot && (
                    <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, marginLeft: '8px' }}>
                      ✓ Preference logged for model fine-tuning
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* CONSOLE 3: HUMAN FEEDBACK & DPO CURATION                      */}
        {/* ------------------------------------------------------------ */}
        {activeConsole === 'FEEDBACK' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
            {/* Curated Feedback Ledger */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                    Clinician Correction Ledger (DPO Training Pipeline)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Human-in-the-loop corrections feeding institutionally fine-tuned alignment datasets.
                  </p>
                </div>
                <button
                  onClick={handleExportDpo}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} /> Export DPO JSONL
                </button>
              </div>

              {/* Records List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {feedbackList.map((fb) => (
                  <div
                    key={fb.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '14px',
                      background: '#F8FAFC',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#FEE2E2', color: '#991B1B' }}>
                        {fb.correctionType.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        By {fb.submittedBy} · {new Date(fb.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#991B1B', background: '#FEF2F2', padding: '8px 10px', borderRadius: '4px' }}>
                      <strong>Original AI Output:</strong> {fb.originalAiContent}
                    </div>

                    <div style={{ fontSize: '12px', color: '#166534', background: '#F0FDF4', padding: '8px 10px', borderRadius: '4px' }}>
                      <strong>Clinician Correction:</strong> {fb.clinicianCorrection}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      <strong>Clinical Rationale:</strong> {fb.clinicalRationale}
                    </div>
                  </div>
                ))}
              </div>

              {/* Exported JSONL Preview */}
              {exportedJsonl && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                    Exported DPO Dataset (JSONL Format)
                  </span>
                  <pre
                    style={{
                      background: '#0F172A',
                      color: '#38BDF8',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      fontFamily: 'var(--font-mono)',
                      marginTop: '4px',
                    }}
                  >
                    {exportedJsonl}
                  </pre>
                </div>
              )}
            </div>

            {/* Submit New Correction Form */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Record Clinician Correction
              </h4>
              <form onSubmit={handleAddFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Error Classification
                  </label>
                  <select
                    value={newCorrectionType}
                    onChange={(e) => setNewCorrectionType(e.target.value as any)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFFFFF' }}
                  >
                    <option value="OVERCONFIDENCE">Overconfidence in Diagnosis</option>
                    <option value="HALLUCINATED_FINDING">Hallucinated Clinical Finding</option>
                    <option value="UNSUPPORTED_LEAP">Unsupported Diagnostic Leap</option>
                    <option value="INAPPROPRIATE_RECOMMENDATION">Inappropriate Recommendation</option>
                    <option value="OUTDATED_GUIDELINE">Outdated Clinical Guideline</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Flawed AI Generation
                  </label>
                  <textarea
                    rows={3}
                    value={newOriginalAi}
                    onChange={(e) => setNewOriginalAi(e.target.value)}
                    placeholder="Paste the flawed AI finding or statement..."
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Clinician Correction (Target Truth)
                  </label>
                  <textarea
                    rows={3}
                    value={newClinicianFix}
                    onChange={(e) => setNewClinicianFix(e.target.value)}
                    placeholder="Enter the medically sound, corrected phrasing..."
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Submit for DPO Curation
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* CONSOLE 4: EXPLAINABILITY & FEATURE ATTRIBUTION              */}
        {/* ------------------------------------------------------------ */}
        {activeConsole === 'EXPLAINABILITY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Attribution Waterfall Header */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                    Feature Attribution & Explainability for: {explainability.hypothesisLabel}
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Shapley proxy weights and contribution percentages driving primary candidate hypothesis ranking.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: '#DCFCE7', color: '#15803D' }}>
                  {explainability.qualitativeLikelihood}
                </span>
              </div>

              {/* Attribution Waterfall Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {explainability.attributions.map((attr) => (
                  <div key={attr.findingId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>
                        {attr.findingLabel} ({attr.category})
                      </span>
                      <span style={{ fontWeight: 700, color: '#4F46E5' }}>
                        +{attr.attributionPercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div style={{ height: '8px', width: '100%', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${attr.attributionPercentage}%`,
                          background: '#4F46E5',
                          borderRadius: '4px',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      <strong>Counterfactual Impact:</strong> {attr.counterfactualImpact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Counterfactual Simulation Scenarios */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Counterfactual Sensitivity Simulations
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {explainability.counterfactuals.map((cf, i) => (
                  <div key={i} style={{ background: '#F8FAFC', padding: '14px', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                      Scenario: {cf.findingModified}
                    </span>
                    <div style={{ fontSize: '11px', color: '#991B1B' }}>
                      <strong>Rank Shift:</strong> {cf.predictedHypothesisRankShift}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>
                      <strong>Clinical Rationale:</strong> {cf.clinicalRationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
