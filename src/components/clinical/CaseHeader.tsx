import React, { useState, useEffect } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import { ArrowLeft, AlertTriangle, Plus, FileText, CheckCircle2, ShieldAlert, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { offlineSyncEngine } from '../../lib/interoperability/advanced/offline-sync-engine';
import { ACTIVE_COLLABORATIVE_REVIEWERS } from '../../lib/persistence/realtime-collaboration';

export const CaseHeader: React.FC = () => {
  const { activeCase, setActiveView, setActiveCaseSubTab, deleteCase } = useCase();
  const { currentPersona } = usePersona();
  const { patient, state, priority, id } = activeCase.overview;

  const [networkStatus, setNetworkStatus] = useState(() => offlineSyncEngine.getStatus());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    return offlineSyncEngine.subscribeNetworkStatus(setNetworkStatus);
  }, []);

  const getStatusBadge = () => {
    switch (state) {
      case 'REVIEW_REQUIRED':
        return (
          <span className="badge badge-review" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Review Required
          </span>
        );
      case 'DECISION_RECORDED':
        return (
          <span className="badge badge-verified" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Decision Recorded
          </span>
        );
      case 'SAFETY_REVIEW':
        return (
          <span className="badge badge-safety" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={12} /> Safety Review
          </span>
        );
      default:
        return <span className="badge badge-neutral">{state}</span>;
    }
  };

  return (
    <header
      aria-label="Clinical case header"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 24px',
        flexShrink: 0,
      }}
    >
      {/* Top Bar: Case breadcrumb & status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setActiveView('cases')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              background: 'transparent',
              fontSize: '12px',
              color: '#64748B',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <ArrowLeft size={14} /> Cases
          </button>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
            CASE {id}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: priority === 'high' ? '#B91C1C' : '#334155',
              background: priority === 'high' ? '#FEF2F2' : '#F1F5F9',
              padding: '1px 6px',
              borderRadius: '3px',
            }}
          >
            {priority} priority
          </span>
          {getStatusBadge()}
        </div>

        {/* Action Buttons with Role Permission Checks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Phase 13 Collaborative Presence Avatars */}
          <div
            title="Active Clinicians in Collaborative Session: 3 reviewers online"
            style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}
          >
            {ACTIVE_COLLABORATIVE_REVIEWERS.map((rev, idx) => (
              <div
                key={rev.id}
                title={`${rev.name} (${rev.role}) · Active in ${rev.currentTab}`}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: rev.avatarColor,
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: idx === 0 ? 0 : '-6px',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  cursor: 'default',
                }}
              >
                {rev.initials}
              </div>
            ))}
          </div>

          {/* Phase 10 Offline-First Network Status Badge */}
          <div
            onClick={() => {
              if (networkStatus.pendingMutationCount > 0) {
                offlineSyncEngine.replayQueuedMutations();
              }
            }}
            title={
              networkStatus.isOnline
                ? `Online (${networkStatus.connectionTier.toUpperCase()} · ${networkStatus.rttMs}ms RTT · ${networkStatus.downlinkMbps} Mbps)`
                : 'Offline mode — local mutations stored in Outbox'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '12px',
              background: networkStatus.isOnline ? '#F0FDF4' : '#FEF2F2',
              color: networkStatus.isOnline ? '#166534' : '#991B1B',
              border: `1px solid ${networkStatus.isOnline ? '#BBF7D0' : '#FCA5A5'}`,
              cursor: 'pointer',
            }}
          >
            {networkStatus.isOnline ? <Wifi size={12} color="#16A34A" /> : <WifiOff size={12} color="#DC2626" />}
            <span>{networkStatus.isOnline ? `${networkStatus.connectionTier.toUpperCase()}` : 'Offline'}</span>
            {networkStatus.pendingMutationCount > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  padding: '1px 5px',
                  borderRadius: '10px',
                }}
              >
                {networkStatus.pendingMutationCount} queued
              </span>
            )}
          </div>
          {currentPersona.allowedActions.canRequestInvestigations && (
            <button
              onClick={() => setActiveCaseSubTab('investigations')}
              className="btn btn-sm"
              title={currentPersona.roleDisplay}
            >
              <Plus size={13} /> Request Investigation
            </button>
          )}

          {currentPersona.allowedActions.canReviewNexusFindings && (
            <button
              onClick={() => setActiveCaseSubTab('review')}
              className="btn btn-sm btn-primary"
              style={{ background: '#0F172A' }}
            >
              <CheckCircle2 size={13} /> Review Nexus
            </button>
          )}

          {currentPersona.allowedActions.canRecordClinicalDecision && (
            <button
              onClick={() => setActiveCaseSubTab('decision')}
              className="btn btn-sm btn-success"
            >
              <FileText size={13} /> Record Decision
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-sm"
            title="Delete this clinical case"
            style={{
              border: '1px solid #FCA5A5',
              background: '#FEF2F2',
              color: '#DC2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#DC2626';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FEF2F2';
              e.currentTarget.style.color = '#DC2626';
            }}
          >
            <Trash2 size={13} /> Delete Case
          </button>
        </div>
      </div>

      {/* Patient Identity Strip: Persistent WHO / WHAT / WHERE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '8px 14px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ color: '#64748B' }}>Patient: </span>
            <strong style={{ color: '#0F172A', fontSize: '13px' }}>{patient.syntheticIdentifier}</strong>
            <span style={{ color: '#64748B', marginLeft: '6px' }}>
              · {patient.age} y/o · {patient.gender}
            </span>
          </div>

          <div style={{ height: '14px', borderRight: '1px solid #CBD5E1' }} />

          <div>
            <span style={{ color: '#64748B' }}>Encounter: </span>
            <strong style={{ color: '#334155' }}>{patient.encounterType}</strong>
            <span style={{ color: '#64748B', marginLeft: '6px' }}>({patient.encounterDate})</span>
          </div>

          <div style={{ height: '14px', borderRight: '1px solid #CBD5E1' }} />

          <div>
            <span style={{ color: '#64748B' }}>Allergies: </span>
            <strong style={{ color: '#B91C1C' }}>{patient.allergiesCount} recorded</strong>
          </div>

          <div style={{ height: '14px', borderRight: '1px solid #CBD5E1' }} />

          <div>
            <span style={{ color: '#64748B' }}>Active Meds: </span>
            <strong style={{ color: '#334155' }}>{patient.activeMedicationsCount}</strong>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
          Encounter {patient.encounterNumber}
        </div>
      </div>

      {/* Delete Case Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#DC2626' }}>
              <AlertTriangle size={20} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Delete Case {id}?
              </h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
              Are you sure you want to delete this case? All associated clinical tasks, findings, and diagnostic orders will be permanently removed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-sm"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsDeleting(true);
                  await deleteCase(id);
                  setIsDeleting(false);
                  setShowDeleteConfirm(false);
                }}
                className="btn btn-sm"
                style={{ background: '#DC2626', color: '#FFFFFF', border: 'none' }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Case & Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
