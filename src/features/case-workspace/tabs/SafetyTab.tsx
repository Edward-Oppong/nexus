import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  Shield,
  FileText,
  UserCheck,
} from 'lucide-react';
import { SafetyConcern, SafetyConcernSeverity } from '../../../domain/workflow';
import { SafetyResolveModal } from '../../safety/SafetyResolveModal';

export const SafetyTab: React.FC = () => {
  const { safetyConcerns, activeCase } = useCase();
  const [modalConcernId, setModalConcernId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'ACKNOWLEDGE' | 'RESOLVE'>('ACKNOWLEDGE');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const caseConcerns = safetyConcerns.filter((s) => s.caseId === activeCase.overview.id);

  const filtered = caseConcerns.filter((s) => {
    if (filterSeverity !== 'ALL' && s.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityBadge = (severity: SafetyConcernSeverity) => {
    switch (severity) {
      case 'SAFETY_CRITICAL':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      case 'URGENT_REVIEW':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case 'ATTENTION':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldAlert size={20} color="#DC2626" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              Clinical Safety Concerns & Guardrail Interrupts
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
            Structured, non-transient clinical hazards. SAFETY_CRITICAL concerns halt clinical decision recording until formally adjudicated. Resolved concerns are permanently preserved in the clinical record.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="SAFETY_CRITICAL">Safety Critical (Blocking)</option>
            <option value="URGENT_REVIEW">Urgent Review</option>
            <option value="ATTENTION">Attention</option>
            <option value="INFORMATION">Information</option>
          </select>
        </div>
      </div>

      {/* Concerns List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              fontSize: '13px',
            }}
          >
            No safety concerns found for this filter.
          </div>
        ) : (
          filtered.map((concern) => {
            const badge = getSeverityBadge(concern.severity);
            const isResolved = concern.status === 'RESOLVED';
            const isAcknowledged = concern.status === 'ACKNOWLEDGED';

            return (
              <div
                key={concern.id}
                style={{
                  background: isResolved ? '#FAFAFA' : '#FFFFFF',
                  border: `1px solid ${isResolved ? '#CBD5E1' : badge.border}`,
                  borderLeft: `5px solid ${isResolved ? '#059669' : badge.text}`,
                  borderRadius: '8px',
                  padding: '18px 20px',
                  boxShadow: isResolved ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {concern.severity.replace('_', ' ')}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isResolved ? '#ECFDF5' : isAcknowledged ? '#EFF6FF' : '#FEF2F2',
                        color: isResolved ? '#059669' : isAcknowledged ? '#2563EB' : '#DC2626',
                        border: `1px solid ${isResolved ? '#A7F3D0' : isAcknowledged ? '#BFDBFE' : '#FECACA'}`,
                      }}
                    >
                      Status: {concern.status}
                    </span>

                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Trigger: <strong>{concern.triggerSource}</strong> · Detected: {new Date(concern.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!isResolved && !isAcknowledged && (
                      <button
                        onClick={() => {
                          setModalConcernId(concern.id);
                          setModalMode('ACKNOWLEDGE');
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#334155',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Acknowledge
                      </button>
                    )}

                    {!isResolved && (
                      <button
                        onClick={() => {
                          setModalConcernId(concern.id);
                          setModalMode('RESOLVE');
                        }}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          background: '#059669',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={12} />
                        Resolve Concern
                      </button>
                    )}

                    {isResolved && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#059669',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Check size={14} /> Resolved in record
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                  {concern.category}
                </h3>

                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                  {concern.description}
                </p>

                {concern.recommendedAction && (
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#1E293B',
                      marginBottom: '10px',
                    }}
                  >
                    <strong>Recommended Clinical Protocol: </strong>
                    {concern.recommendedAction}
                  </div>
                )}

                {/* Audit & Clinician Documentation */}
                {(concern.clinicalNote || concern.acknowledgedBy || concern.resolvedBy) && (
                  <div
                    style={{
                      background: isResolved ? '#F0FDF4' : '#F1F5F9',
                      border: `1px solid ${isResolved ? '#BBF7D0' : '#CBD5E1'}`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#334155',
                    }}
                  >
                    {concern.acknowledgedBy && (
                      <div style={{ marginBottom: '2px' }}>
                        <strong>Acknowledged by:</strong> {concern.acknowledgedByName || concern.acknowledgedBy} at{' '}
                        {concern.acknowledgedAt ? new Date(concern.acknowledgedAt).toLocaleTimeString() : 'N/A'}
                      </div>
                    )}
                    {concern.resolvedBy && (
                      <div style={{ marginBottom: '2px' }}>
                        <strong>Resolved by:</strong> {concern.resolvedByName || concern.resolvedBy} at{' '}
                        {concern.resolvedAt ? new Date(concern.resolvedAt).toLocaleTimeString() : 'N/A'}
                      </div>
                    )}
                    {concern.clinicalNote && (
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#0F172A' }}>
                        "{concern.clinicalNote}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {modalConcernId && (
        <SafetyResolveModal
          concernId={modalConcernId}
          mode={modalMode}
          onClose={() => setModalConcernId(null)}
        />
      )}
    </div>
  );
};
