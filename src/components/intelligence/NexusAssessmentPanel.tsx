import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Settings,
} from 'lucide-react';
import { NexusFinding, ReviewAction } from '../../domain/nexus-assessment';
import { AiEngineConfigModal } from './AiEngineConfigModal';
import { getActiveAiEngineInfo } from '../../lib/intelligence/services/ai-engine-config';

export const NexusAssessmentPanel: React.FC = () => {
  const {
    nexusAssessment,
    isRunningAnalysis,
    analysisStage,
    runNexusAnalysis,
    reviewNexusFinding,
  } = useCase();

  // State for per-finding inline edit/reject
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editDraftContent, setEditDraftContent] = useState<string>('');
  const [rejectingFindingId, setRejectingFindingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  const activeEngine = getActiveAiEngineInfo();

  if (!nexusAssessment) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-primary) 100%)',
          borderRadius: '10px',
          padding: '24px',
          color: 'var(--text-primary)',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 auto', minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Nexus Clinical Intelligence Engine
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Multi-layer deterministic checks, guideline retrieval, and grounded clinical synthesis.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsConfigOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.1)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Configure real-time LLM providers (Gemini, Groq, OpenAI, Anthropic)"
            >
              <Zap size={14} />
              <span>{activeEngine.displayName}</span>
              <Settings size={13} style={{ opacity: 0.8 }} />
            </button>

            <button
              onClick={() => runNexusAnalysis()}
              disabled={isRunningAnalysis}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '6px',
                border: 'none',
                background: isRunningAnalysis ? 'var(--text-secondary)' : 'var(--accent-primary)',
                color: 'var(--bg-surface)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isRunningAnalysis ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={14} className={isRunningAnalysis ? 'animate-spin' : ''} />
              {isRunningAnalysis ? 'Synthesizing...' : 'Run Nexus Analysis'}
            </button>
          </div>
        </div>
        <AiEngineConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      </div>
    );
  }

  // ── Live Pipeline Progress Stepper ─────────────────────────
  if (isRunningAnalysis) {
    const stages = [
      { index: 1, label: 'Data Quality & Bounds Check', shortLabel: 'Data QA' },
      { index: 2, label: 'PubMed & Guideline Retrieval', shortLabel: 'Evidence' },
      { index: 3, label: `${activeEngine.displayName} Synthesis`, shortLabel: 'Synthesis' },
      { index: 4, label: '18-Rule Grounding Validation', shortLabel: 'Grounding' },
    ];
    const currentStageIdx = analysisStage?.stageIndex ?? 1;
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-primary) 100%)',
          borderRadius: '10px',
          padding: '24px 28px',
          color: 'var(--text-primary)',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: '1px solid rgba(56,189,248,0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'rgba(56,189,248,0.15)',
            border: '1px solid rgba(56,189,248,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1.6s ease-in-out infinite',
          }}>
            <Sparkles size={16} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Nexus Clinical Intelligence Engine
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>Pipeline running&hellip;</div>
          </div>
        </div>

        {/* Stage Progress Track */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: '20px', position: 'relative' }}>
          {/* Connector bar behind steps */}
          <div style={{
            position: 'absolute', top: '14px', left: '14px',
            right: '14px', height: '2px',
            background: 'rgba(255,255,255,0.08)',
            zIndex: 0,
          }} />
          {stages.map((stage, i) => {
            const done = currentStageIdx > stage.index;
            const active = currentStageIdx === stage.index;
            return (
              <div key={stage.index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
                {/* Circle */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                  background: done ? 'var(--status-success)' : active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                  border: done ? '2px solid var(--status-success)' : active ? '2px solid var(--accent-primary)' : '2px solid rgba(255,255,255,0.12)',
                  color: done ? '#fff' : active ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.3s ease',
                  boxShadow: active ? '0 0 12px rgba(56,189,248,0.5)' : 'none',
                  animation: active ? 'pulse 1.2s ease-in-out infinite' : 'none',
                }}>
                  {done ? <CheckCircle2 size={13} /> : stage.index}
                </div>
                {/* Label */}
                <div style={{
                  fontSize: '10px', fontWeight: active ? 700 : 500,
                  color: done ? 'var(--status-success)' : active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  textAlign: 'center', lineHeight: '1.25',
                  maxWidth: '72px',
                  transition: 'color 0.3s ease',
                }}>
                  {stage.shortLabel}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current stage detail */}
        {analysisStage && (
          <div style={{
            background: 'rgba(56,189,248,0.06)',
            border: '1px solid rgba(56,189,248,0.15)',
            borderRadius: '6px',
            padding: '10px 14px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '3px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Stage {analysisStage.stageIndex} / {analysisStage.totalStages} &mdash; {analysisStage.stageName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {analysisStage.detail}
            </div>
          </div>
        )}

        {/* Indeterminate progress bar */}
        <div style={{ marginTop: '16px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: '40%',
            background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
            borderRadius: '2px',
            animation: 'shimmer 1.4s ease-in-out infinite',
          }} />
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.65; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-200%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }

  const unreviewedCount = nexusAssessment.nexusFindings.filter(
    (f) => f.status === 'UNREVIEWED'
  ).length;

  const handleStartEdit = (finding: NexusFinding) => {
    setEditingFindingId(finding.id);
    setEditDraftContent(finding.content);
    setRejectingFindingId(null);
  };

  const handleSaveEdit = (findingId: string) => {
    if (!editDraftContent.trim()) return;
    reviewNexusFinding(findingId, 'EDIT', editDraftContent.trim());
    setEditingFindingId(null);
    setEditDraftContent('');
  };

  const handleStartReject = (findingId: string) => {
    setRejectingFindingId(findingId);
    setRejectReason('');
    setEditingFindingId(null);
  };

  const handleConfirmReject = (findingId: string) => {
    if (!rejectReason.trim()) return;
    reviewNexusFinding(findingId, 'REJECT', undefined, rejectReason.trim());
    setRejectingFindingId(null);
    setRejectReason('');
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-primary) 100%)',
          padding: '16px 20px',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 auto', minWidth: '0' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ minWidth: '0', flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  color: 'var(--bg-surface)',
                }}
              >
                Nexus Clinical Assessment
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background:
                    nexusAssessment.status === 'REVIEW_REQUIRED'
                      ? 'var(--status-warning)'
                      : nexusAssessment.status === 'REVIEWED'
                      ? 'var(--status-success)'
                      : 'var(--text-muted)',
                  color: 'var(--bg-surface)',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {nexusAssessment.status === 'REVIEW_REQUIRED' ? (
                  <>
                    <AlertTriangle size={12} />
                    {`REVIEW REQUIRED (${unreviewedCount} UNRESOLVED)`}
                  </>
                ) : (
                  nexusAssessment.status
                )}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: '12px',
                  background:
                    nexusAssessment.safetyBoundary === 'OK'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  color: nexusAssessment.safetyBoundary === 'OK' ? 'var(--status-success)' : 'var(--danger-border)',
                  border: `1px solid ${
                    nexusAssessment.safetyBoundary === 'OK' ? 'var(--status-success)' : 'var(--status-danger)'
                  }`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {nexusAssessment.safetyBoundary === 'OK' ? (
                  <ShieldCheck size={12} />
                ) : (
                  <ShieldAlert size={12} />
                )}
                Safety: {nexusAssessment.safetyBoundary}
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '4px 12px',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>Model: {nexusAssessment.modelName}</span>
              <span style={{ color: 'var(--text-secondary)' }}>•</span>
              <span style={{ whiteSpace: 'nowrap' }}>Pipeline: v{nexusAssessment.pipelineVersion}</span>
              <span style={{ color: 'var(--text-secondary)' }}>•</span>
              <span style={{ whiteSpace: 'nowrap' }}>
                Generated: {new Date(nexusAssessment.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
          <button
            onClick={() => setIsConfigOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Configure real-time LLM providers (Gemini, Groq, OpenAI, Anthropic)"
          >
            <Zap size={13} />
            <span>AI Engine</span>
            <Settings size={12} style={{ opacity: 0.8 }} />
          </button>

          <button
            onClick={() => runNexusAnalysis()}
            disabled={isRunningAnalysis}
            title="Re-run assessment pipeline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--bg-surface)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: isRunningAnalysis ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={13} className={isRunningAnalysis ? 'animate-spin' : ''} />
            {isRunningAnalysis ? 'Updating...' : 'Re-analyze'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse assessment details' : 'Expand assessment details'}
            aria-label={isExpanded ? 'Collapse assessment details' : 'Expand assessment details'}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '20px' }}>
          {/* Summary Box */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Synthesis & Clinical Reasoning
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {nexusAssessment.summary}
            </p>
            {nexusAssessment.limitations && nexusAssessment.limitations.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Limitations & Missing Data: </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {nexusAssessment.limitations.join('; ')}
                </span>
              </div>
            )}
          </div>

          {/* Contradictions Alert if present */}
          {nexusAssessment.contradictions && nexusAssessment.contradictions.length > 0 && (
            <div
              style={{
                background: 'var(--danger-subtle)',
                border: '1px solid var(--danger-border)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger)', fontWeight: 600, fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>Deterministic Contradiction Alert</span>
              </div>
              {nexusAssessment.contradictions.map((c) => (
                <div key={c.id} style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-danger)' }}>
                  <strong>Conflict ({c.findingAId} vs {c.findingBId}):</strong> {c.explanation}
                </div>
              ))}
            </div>
          )}

          {/* Section: Structured Nexus Findings with Adjudication Controls */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Findings & Hypotheses Adjudication (Accept / Edit / Reject)
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                WHO SMART & FDA CDS: AI outputs require explicit human validation
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {nexusAssessment.nexusFindings.map((finding) => {
                const isEditing = editingFindingId === finding.id;
                const isRejecting = rejectingFindingId === finding.id;

                const statusColor =
                  finding.status === 'ACCEPTED'
                    ? 'var(--status-success)'
                    : finding.status === 'EDITED'
                    ? 'var(--accent-primary)'
                    : finding.status === 'REJECTED'
                    ? 'var(--status-danger)'
                    : 'var(--status-warning)';

                const badgeBg =
                  finding.status === 'ACCEPTED'
                    ? 'var(--success-subtle)'
                    : finding.status === 'EDITED'
                    ? 'var(--accent-subtle)'
                    : finding.status === 'REJECTED'
                    ? 'var(--danger-subtle)'
                    : 'var(--warning-subtle)';

                return (
                  <div
                    key={finding.id}
                    style={{
                      border: `1px solid ${finding.status === 'UNREVIEWED' ? 'var(--warning-border)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      background: finding.status === 'UNREVIEWED' ? '#FFFDF5' : 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--bg-app)',
                            color: 'var(--bg-surface)',
                          }}
                        >
                          {finding.findingType}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: badgeBg,
                            color: statusColor,
                            border: `1px solid ${statusColor}33`,
                          }}
                        >
                          {finding.status}
                        </span>
                        {finding.findingIds && finding.findingIds.length > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Linked: {finding.findingIds.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {!isEditing && !isRejecting && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => reviewNexusFinding(finding.id, 'ACCEPT')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--status-success)',
                              background: finding.status === 'ACCEPTED' ? 'var(--status-success)' : 'var(--bg-surface)',
                              color: finding.status === 'ACCEPTED' ? 'var(--bg-surface)' : 'var(--status-success)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            Accept
                          </button>
                          <button
                            onClick={() => handleStartEdit(finding)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--accent-primary)',
                              background: finding.status === 'EDITED' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                              color: finding.status === 'EDITED' ? 'var(--bg-surface)' : 'var(--accent-primary)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <FileEdit size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleStartReject(finding.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--status-danger)',
                              background: finding.status === 'REJECTED' ? 'var(--status-danger)' : 'var(--bg-surface)',
                              color: finding.status === 'REJECTED' ? 'var(--bg-surface)' : 'var(--status-danger)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content display or editing form */}
                    {isEditing ? (
                      <div style={{ marginTop: '8px' }}>
                        <textarea
                          value={editDraftContent}
                          onChange={(e) => setEditDraftContent(e.target.value)}
                          rows={3}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--accent-primary)',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingFindingId(null)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-medium)',
                              background: 'var(--bg-surface)',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(finding.id)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              background: 'var(--accent-primary)',
                              color: 'var(--bg-surface)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Save Clinical Revision
                          </button>
                        </div>
                      </div>
                    ) : isRejecting ? (
                      <div style={{ marginTop: '8px', background: 'var(--danger-subtle)', padding: '10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-danger)', marginBottom: '4px' }}>
                          Mandatory Reason for Rejection:
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Clinical assessment contradicts recent blood gas; non-pertinent to acute care..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--danger-border)',
                            fontSize: '12px',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setRejectingFindingId(null)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-medium)',
                              background: 'var(--bg-surface)',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmReject(finding.id)}
                            disabled={!rejectReason.trim()}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              background: rejectReason.trim() ? 'var(--status-danger)' : 'var(--text-muted)',
                              color: 'var(--bg-surface)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          lineHeight: 1.5,
                          color: finding.status === 'REJECTED' ? 'var(--text-muted)' : 'var(--text-secondary)',
                          textDecoration: finding.status === 'REJECTED' ? 'line-through' : 'none',
                        }}
                      >
                        {finding.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Recommendations */}
          {nexusAssessment.recommendations && nexusAssessment.recommendations.length > 0 && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Advisory Recommendations (Deterministic Guidelines)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nexusAssessment.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      background: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: rec.category === 'SAFETY' ? 'var(--status-danger)' : 'var(--accent-primary)',
                        color: 'var(--bg-surface)',
                        flexShrink: 0,
                      }}
                    >
                      {rec.category}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{rec.content}</div>
                      {rec.rationale && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Rationale: {rec.rationale}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time LLM Engine Configuration Modal */}
      <AiEngineConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
};
