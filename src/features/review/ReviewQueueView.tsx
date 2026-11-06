import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import {
  CheckCircle2,
  FileEdit,
  XCircle,
  Clock,
  Filter,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  GitBranch,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import {
  ReviewItem,
  ReviewItemType,
  ReviewPriority,
  RejectReasonCategory,
} from '../../domain/workflow';
import { ReviewRejectModal } from './ReviewRejectModal';

export const ReviewQueueView: React.FC = () => {
  const { reviewQueue, adjudicateReviewItem, openCaseById } = useCase();
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editRevisionText, setEditRevisionText] = useState('');
  const [editReason, setEditReason] = useState('');

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<ReviewItem | null>(null);

  const filteredItems = reviewQueue.filter((item) => {
    if (selectedType !== 'ALL' && item.itemType !== selectedType) return false;
    if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) return false;
    return true;
  });

  const pendingCount = reviewQueue.filter((r) => r.status === 'PENDING').length;

  const handleStartEdit = (item: ReviewItem) => {
    setEditingItemId(item.id);
    setEditRevisionText(item.description);
    setEditReason('');
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editRevisionText.trim()) return;
    adjudicateReviewItem(itemId, 'EDIT', editRevisionText.trim(), undefined, editReason.trim() || 'Clarified clinical precision');
    setEditingItemId(null);
  };

  const handleConfirmReject = (category: RejectReasonCategory, explanation: string) => {
    if (!rejectingItem) return;
    adjudicateReviewItem(rejectingItem.id, 'REJECT', undefined, category, explanation);
    setRejectingItem(null);
  };

  const getPriorityStyle = (priority: ReviewPriority) => {
    switch (priority) {
      case 'URGENT':
        return { bg: 'var(--danger-subtle)', text: 'var(--status-danger)', border: 'var(--danger-border)' };
      case 'HIGH':
        return { bg: 'var(--warning-subtle)', text: 'var(--status-warning)', border: 'var(--warning-border)' };
      default:
        return { bg: 'var(--accent-subtle)', text: 'var(--accent-primary)', border: 'var(--border-medium)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileCheck2 size={20} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Clinical Review Queue
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: pendingCount > 0 ? 'var(--status-warning)' : 'var(--status-success)',
                color: 'var(--bg-surface)',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {pendingCount} Items Require Attention
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Deliberative clinical adjudication workspace. Nexus proposes, clinical team reviews. Explicit Accept, Edit, or Reject required before clinical reliance.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface)',
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="ROUTINE">Routine</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface)',
              }}
            >
              <option value="ALL">All Review Types</option>
              <option value="NEXUS_ASSESSMENT">Nexus Assessment</option>
              <option value="AI_FINDING">AI Finding</option>
              <option value="INVESTIGATION_RESULT">Investigation Result</option>
              <option value="CONTRADICTION">Contradiction</option>
              <option value="SAFETY_CONCERN">Safety Concern</option>
              <option value="DECISION_AMENDMENT">Decision Amendment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review Queue Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredItems.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={40} color="var(--status-success)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Review Queue is Clear
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              All algorithmic findings, contradictions, and alerts have been reviewed by the clinical team.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEditing = editingItemId === item.id;
            const isCompleted = item.status === 'COMPLETED';
            const pStyle = getPriorityStyle(item.priority);

            return (
              <div
                key={item.id}
                style={{
                  background: isCompleted ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  border: `1px solid ${isCompleted ? 'var(--border-medium)' : 'var(--border-subtle)'}`,
                  borderLeft: `4px solid ${isCompleted ? 'var(--text-muted)' : pStyle.text}`,
                  borderRadius: '8px',
                  padding: '16px 20px',
                  boxShadow: isCompleted ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.03)',
                }}
              >
              {/* Item Top Metadata */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openCaseById(item.caseId)}
                    style={{
                      background: 'var(--bg-app)',
                      color: 'var(--bg-surface)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    CASE-{item.caseId} <ArrowRight size={11} />
                  </button>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: pStyle.bg,
                      color: pStyle.text,
                      border: `1px solid ${pStyle.border}`,
                    }}
                  >
                    {item.priority}
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {item.itemType.replace('_', ' ')}
                  </span>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Patient: <strong>{item.patientIdentifier}</strong> · Source: {item.sourceContext}
                  </span>
                </div>

                {/* Status or Actions */}
                {!isCompleted && !isEditing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => adjudicateReviewItem(item.id, 'ACCEPT')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--status-success)',
                        background: 'var(--status-success)',
                        color: 'var(--bg-surface)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleStartEdit(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--accent-primary)',
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <FileEdit size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => setRejectingItem(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--status-danger)',
                        background: 'var(--danger-subtle)',
                        color: 'var(--status-danger)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                  </div>
                )}

                {isCompleted && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: item.payload?.action === 'REJECT' ? 'var(--status-danger)' : 'var(--status-success)',
                      background: item.payload?.action === 'REJECT' ? 'var(--danger-subtle)' : 'var(--success-subtle)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${item.payload?.action === 'REJECT' ? 'var(--danger-border)' : 'var(--success-border)'}`,
                    }}
                  >
                    Reviewed: [{item.payload?.action || 'COMPLETED'}]
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {item.title}
              </h3>

              {/* Edit Mode: Calm Side-by-side comparison */}
              {isEditing ? (
                <div style={{ marginTop: '12px', background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Original Nexus Output
                      </div>
                      <div
                        style={{
                          background: 'var(--bg-surface)',
                          padding: '10px 12px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.description}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Clinician Revision (Preserves Original)
                      </div>
                      <textarea
                        rows={4}
                        value={editRevisionText}
                        onChange={(e) => setEditRevisionText(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px',
                          borderRadius: '4px',
                          border: '1px solid var(--accent-primary)',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Reason for Edit:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Clarified uncertainty; aligned with patient narrative..."
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => setEditingItemId(null)}
                      style={{
                        padding: '5px 12px',
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
                      onClick={() => handleSaveEdit(item.id)}
                      style={{
                        padding: '5px 14px',
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
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: isCompleted ? 'var(--text-muted)' : 'var(--text-secondary)',
                    lineHeight: 1.5,
                    textDecoration: item.payload?.action === 'REJECT' ? 'line-through' : 'none',
                  }}
                >
                  {item.payload?.revisedContent || item.description}
                </p>
              )}

              {/* Completed payload audit note */}
              {isCompleted && item.payload && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Action recorded at {new Date(item.payload.reviewedAt).toLocaleTimeString()} by Dr. Edward Vance, MD.
                  {item.payload.reason && ` Note: ${item.payload.reason}`}
                </div>
              )}
            </div>
          );
        })
      )}
      </div>

      {rejectingItem && (
        <ReviewRejectModal
          itemTitle={rejectingItem.title}
          onConfirm={handleConfirmReject}
          onClose={() => setRejectingItem(null)}
        />
      )}
    </div>
  );
};
