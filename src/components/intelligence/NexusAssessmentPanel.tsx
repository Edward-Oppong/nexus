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
} from 'lucide-react';
import { NexusFinding, ReviewAction } from '../../domain/nexus-assessment';

export const NexusAssessmentPanel: React.FC = () => {
  const {
    nexusAssessment,
    isRunningAnalysis,
    runNexusAnalysis,
    reviewNexusFinding,
  } = useCase();

  // State for per-finding inline edit/reject
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editDraftContent, setEditDraftContent] = useState<string>('');
  const [rejectingFindingId, setRejectingFindingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!nexusAssessment) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '10px',
          padding: '24px',
          color: '#F8FAFC',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 auto', minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={18} color="#38BDF8" />
              <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Nexus Clinical Intelligence Engine
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
              Multi-layer deterministic checks, guideline retrieval, and grounded clinical synthesis.
            </p>
          </div>
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
              background: isRunningAnalysis ? '#475569' : '#0284C7',
              color: '#FFFFFF',
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
        background: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        marginBottom: '24px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: '16px 20px',
          color: '#F8FAFC',
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
            <Sparkles size={18} color="#38BDF8" />
          </div>
          <div style={{ minWidth: '0', flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px' }}>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  color: '#FFFFFF',
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
                      ? '#F59E0B'
                      : nexusAssessment.status === 'REVIEWED'
                      ? '#10B981'
                      : '#64748B',
                  color: '#FFFFFF',
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
                  color: nexusAssessment.safetyBoundary === 'OK' ? '#34D399' : '#F87171',
                  border: `1px solid ${
                    nexusAssessment.safetyBoundary === 'OK' ? '#059669' : '#DC2626'
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
                color: '#94A3B8',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '4px 12px',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>Model: {nexusAssessment.modelName}</span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ whiteSpace: 'nowrap' }}>Pipeline: v{nexusAssessment.pipelineVersion}</span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ whiteSpace: 'nowrap' }}>
                Generated: {new Date(nexusAssessment.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
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
              color: '#FFFFFF',
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
              color: '#94A3B8',
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
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
              Synthesis & Clinical Reasoning
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#1E293B' }}>
              {nexusAssessment.summary}
            </p>
            {nexusAssessment.limitations && nexusAssessment.limitations.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Limitations & Missing Data: </span>
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {nexusAssessment.limitations.join('; ')}
                </span>
              </div>
            )}
          </div>

          {/* Contradictions Alert if present */}
          {nexusAssessment.contradictions && nexusAssessment.contradictions.length > 0 && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 600, fontSize: '13px' }}>
                <ShieldAlert size={16} />
                <span>Deterministic Contradiction Alert</span>
              </div>
              {nexusAssessment.contradictions.map((c) => (
                <div key={c.id} style={{ marginTop: '6px', fontSize: '12px', color: '#7F1D1D' }}>
                  <strong>Conflict ({c.findingAId} vs {c.findingBId}):</strong> {c.explanation}
                </div>
              ))}
            </div>
          )}

          {/* Section: Structured Nexus Findings with Adjudication Controls */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Findings & Hypotheses Adjudication (Accept / Edit / Reject)
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                WHO SMART & FDA CDS: AI outputs require explicit human validation
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {nexusAssessment.nexusFindings.map((finding) => {
                const isEditing = editingFindingId === finding.id;
                const isRejecting = rejectingFindingId === finding.id;

                const statusColor =
                  finding.status === 'ACCEPTED'
                    ? '#059669'
                    : finding.status === 'EDITED'
                    ? '#2563EB'
                    : finding.status === 'REJECTED'
                    ? '#DC2626'
                    : '#D97706';

                const badgeBg =
                  finding.status === 'ACCEPTED'
                    ? '#ECFDF5'
                    : finding.status === 'EDITED'
                    ? '#EFF6FF'
                    : finding.status === 'REJECTED'
                    ? '#FEF2F2'
                    : '#FFFBEB';

                return (
                  <div
                    key={finding.id}
                    style={{
                      border: `1px solid ${finding.status === 'UNREVIEWED' ? '#FDE68A' : '#E2E8F0'}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      background: finding.status === 'UNREVIEWED' ? '#FFFDF5' : '#FFFFFF',
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
                            background: '#0F172A',
                            color: '#FFFFFF',
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
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
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
                              border: '1px solid #10B981',
                              background: finding.status === 'ACCEPTED' ? '#10B981' : '#FFFFFF',
                              color: finding.status === 'ACCEPTED' ? '#FFFFFF' : '#059669',
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
                              border: '1px solid #3B82F6',
                              background: finding.status === 'EDITED' ? '#3B82F6' : '#FFFFFF',
                              color: finding.status === 'EDITED' ? '#FFFFFF' : '#1D4ED8',
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
                              border: '1px solid #EF4444',
                              background: finding.status === 'REJECTED' ? '#EF4444' : '#FFFFFF',
                              color: finding.status === 'REJECTED' ? '#FFFFFF' : '#DC2626',
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
                            border: '1px solid #3B82F6',
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
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
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
                              background: '#2563EB',
                              color: '#FFFFFF',
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
                      <div style={{ marginTop: '8px', background: '#FEF2F2', padding: '10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
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
                            border: '1px solid #F87171',
                            fontSize: '12px',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setRejectingFindingId(null)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
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
                              background: rejectReason.trim() ? '#DC2626' : '#94A3B8',
                              color: '#FFFFFF',
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
                          color: finding.status === 'REJECTED' ? '#94A3B8' : '#334155',
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
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '8px' }}>
                Advisory Recommendations (Deterministic Guidelines)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nexusAssessment.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      background: '#F8FAFC',
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
                        background: rec.category === 'SAFETY' ? '#DC2626' : '#0284C7',
                        color: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    >
                      {rec.category}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{rec.content}</div>
                      {rec.rationale && (
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
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
    </div>
  );
};
