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
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      case 'HIGH':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      default:
        return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileCheck2 size={20} color="#0284C7" />
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
              Clinical Review Queue
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: pendingCount > 0 ? '#F59E0B' : '#10B981',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {pendingCount} Items Require Attention
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            Deliberative clinical adjudication workspace. Nexus proposes, clinical team reviews. Explicit Accept, Edit, or Reject required before clinical reliance.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="ROUTINE">Routine</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
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
        {filteredItems.map((item) => {
          const isEditing = editingItemId === item.id;
          const isCompleted = item.status === 'COMPLETED';
          const pStyle = getPriorityStyle(item.priority);

          return (
            <div
              key={item.id}
              style={{
                background: isCompleted ? '#FAFAFA' : '#FFFFFF',
                border: `1px solid ${isCompleted ? '#CBD5E1' : '#E2E8F0'}`,
                borderLeft: `4px solid ${isCompleted ? '#94A3B8' : pStyle.text}`,
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
                      background: '#0F172A',
                      color: '#FFFFFF',
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
                      background: '#F1F5F9',
                      color: '#334155',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {item.itemType.replace('_', ' ')}
                  </span>

                  <span style={{ fontSize: '11px', color: '#64748B' }}>
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
                        border: '1px solid #059669',
                        background: '#10B981',
                        color: '#FFFFFF',
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
                        border: '1px solid #3B82F6',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
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
                        border: '1px solid #EF4444',
                        background: '#FEF2F2',
                        color: '#DC2626',
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
                      color: item.payload?.action === 'REJECT' ? '#DC2626' : '#059669',
                      background: item.payload?.action === 'REJECT' ? '#FEF2F2' : '#ECFDF5',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: `1px solid ${item.payload?.action === 'REJECT' ? '#FECACA' : '#A7F3D0'}`,
                    }}
                  >
                    Reviewed: [{item.payload?.action || 'COMPLETED'}]
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                {item.title}
              </h3>

              {/* Edit Mode: Calm Side-by-side comparison */}
              {isEditing ? (
                <div style={{ marginTop: '12px', background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Original Nexus Output
                      </div>
                      <div
                        style={{
                          background: '#FFFFFF',
                          padding: '10px 12px',
                          borderRadius: '4px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          color: '#475569',
                          lineHeight: 1.5,
                        }}
                      >
                        {item.description}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: '4px' }}>
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
                          border: '1px solid #3B82F6',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
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
                        border: '1px solid #CBD5E1',
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
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
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
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: isCompleted ? '#64748B' : '#334155',
                    lineHeight: 1.5,
                    textDecoration: item.payload?.action === 'REJECT' ? 'line-through' : 'none',
                  }}
                >
                  {item.payload?.revisedContent || item.description}
                </p>
              )}

              {/* Completed payload audit note */}
              {isCompleted && item.payload && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
                  Action recorded at {new Date(item.payload.reviewedAt).toLocaleTimeString()} by Dr. Edward Vance, MD.
                  {item.payload.reason && ` Note: ${item.payload.reason}`}
                </div>
              )}
            </div>
          );
        })}
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
