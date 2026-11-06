import React, { useState, useEffect } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Wifi,
  WifiOff,
  Trash2,
  Printer,
  Download,
  Activity,
  Heart,
  Thermometer,
  Wind,
} from 'lucide-react';
import { offlineSyncEngine } from '../../lib/interoperability/advanced/offline-sync-engine';
import { ACTIVE_COLLABORATIVE_REVIEWERS } from '../../lib/persistence/realtime-collaboration';
import { exportCaseToPdf } from '../../features/cases/services/pdf-export-service';
import { exportCaseToFhirR4Bundle, downloadFhirBundle } from '../../lib/interoperability/fhir/fhir-case-exporter';

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

  // Quick vital stats preview
  const vitals = activeCase.vitalSigns || [];
  const hr = vitals.find((v) => /heart rate|pulse|hr/i.test(v.parameter));
  const bp = vitals.find((v) => /blood pressure|bp/i.test(v.parameter));
  const spo2 = vitals.find((v) => /spo2|oxygen/i.test(v.parameter));
  const temp = vitals.find((v) => /temperature|temp/i.test(v.parameter));
  const rr = vitals.find((v) => /respiratory rate|rr/i.test(v.parameter));

  return (
    <header
      aria-label="Clinical case header"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        flexShrink: 0,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Top Bar: Case breadcrumb, priority & action toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveView('cases')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--bg-subtle)';
            }}
          >
            <ArrowLeft size={13} /> Cases
          </button>
          <span style={{ color: 'var(--border-medium)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
            CASE {id}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: priority === 'high' ? 'var(--status-safety-text)' : 'var(--text-secondary)',
              background: priority === 'high' ? 'var(--status-safety-bg)' : 'var(--bg-subtle)',
              border: `1px solid ${priority === 'high' ? 'var(--status-safety-border)' : 'var(--border-subtle)'}`,
              padding: '2px 7px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {priority} priority
          </span>
          {getStatusBadge()}
        </div>

        {/* Action Buttons with Role Permission Checks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Real-time Collaborative Presence Avatars */}
          <div
            title="Active Clinicians in Collaborative Session: 3 reviewers online"
            style={{ display: 'flex', alignItems: 'center', marginRight: '6px' }}
          >
            {ACTIVE_COLLABORATIVE_REVIEWERS.map((rev, idx) => (
              <div
                key={rev.id}
                title={`${rev.name} (${rev.role}) · Active in ${rev.currentTab}`}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: rev.avatarColor,
                  color: 'var(--bg-surface)',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: idx === 0 ? 0 : '-7px',
                  border: '2px solid var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'default',
                }}
              >
                {rev.initials}
              </div>
            ))}
          </div>

          {/* Network Sync Status Badge */}
          <div
            onClick={() => {
              if (networkStatus.pendingMutationCount > 0) {
                offlineSyncEngine.replayQueuedMutations();
              }
            }}
            title={
              networkStatus.isOnline
                ? `Online (${networkStatus.connectionTier.toUpperCase()} · ${networkStatus.rttMs}ms RTT)`
                : 'Offline mode — local mutations stored in Outbox'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '9999px',
              background: networkStatus.isOnline ? 'var(--status-verified-bg)' : 'var(--status-safety-bg)',
              color: networkStatus.isOnline ? 'var(--status-verified-text)' : 'var(--status-safety-text)',
              border: `1px solid ${networkStatus.isOnline ? 'var(--status-verified-border)' : 'var(--status-safety-border)'}`,
              cursor: 'pointer',
            }}
          >
            {networkStatus.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{networkStatus.isOnline ? networkStatus.connectionTier.toUpperCase() : 'Offline'}</span>
            {networkStatus.pendingMutationCount > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  background: 'var(--status-danger)',
                  color: 'var(--bg-surface)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                }}
              >
                {networkStatus.pendingMutationCount} queued
              </span>
            )}
          </div>

          {currentPersona.allowedActions.canReviewNexusFindings && (
            <button
              onClick={() => setActiveCaseSubTab('review')}
              className="btn btn-sm btn-primary"
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
            onClick={() => exportCaseToPdf({ fullCase: activeCase, assessment: activeCase.nexusAssessment })}
            className="btn btn-sm"
            title="Export Case Input Data & Results to PDF Report"
            style={{
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 600,
            }}
          >
            <Printer size={13} /> Export PDF
          </button>

          <button
            onClick={() => {
              const bundle = exportCaseToFhirR4Bundle(activeCase);
              downloadFhirBundle(bundle, activeCase.overview.id);
            }}
            className="btn btn-sm"
            title="Export full clinical record as HL7 FHIR R4 JSON Bundle"
            style={{
              border: '1px solid var(--accent-primary)',
              background: 'var(--accent-subtle)',
              color: 'var(--accent-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 600,
            }}
          >
            <Download size={13} /> FHIR R4 Bundle
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-sm btn-danger"
            title="Delete this clinical case"
          >
            <Trash2 size={13} /> Delete Case
          </button>
        </div>
      </div>

      {/* Patient Identity & Telemetry Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: Demographics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Patient: </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{patient.syntheticIdentifier}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
              · {patient.age} y/o · {patient.gender}
            </span>
          </div>

          <div style={{ height: '14px', borderRight: '1px solid var(--border-medium)' }} />

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Encounter: </span>
            <strong style={{ color: 'var(--text-secondary)' }}>{patient.encounterType}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({patient.encounterDate})</span>
          </div>

          <div style={{ height: '14px', borderRight: '1px solid var(--border-medium)' }} />

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Allergies: </span>
            <strong style={{ color: patient.allergiesCount > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
              {patient.allergiesCount} recorded
            </strong>
          </div>

          <div style={{ height: '14px', borderRight: '1px solid var(--border-medium)' }} />

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Meds: </span>
            <strong style={{ color: 'var(--text-secondary)' }}>{patient.activeMedicationsCount} active</strong>
          </div>
        </div>

        {/* Right: Live Telemetry Vitals Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {hr && (
            <div
              title={`Heart Rate: ${hr.value} ${hr.unit}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                background: hr.status === 'Elevated' || hr.status === 'Critical' ? 'var(--status-safety-bg)' : 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: hr.status === 'Elevated' || hr.status === 'Critical' ? 'var(--status-safety-text)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Heart size={11} color="var(--status-danger)" />
              <span>{hr.value} bpm</span>
            </div>
          )}

          {bp && (
            <div
              title={`Blood Pressure: ${bp.value} ${bp.unit}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Activity size={11} color="var(--accent-primary)" />
              <span>{bp.value}</span>
            </div>
          )}

          {spo2 && (
            <div
              title={`SpO2: ${spo2.value} ${spo2.unit}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                background: parseFloat(spo2.value) < 95 ? 'var(--status-safety-bg)' : 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: parseFloat(spo2.value) < 95 ? 'var(--status-safety-text)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Wind size={11} color="var(--status-success)" />
              <span>{spo2.value}%</span>
            </div>
          )}

          {temp && (
            <div
              title={`Temperature: ${temp.value} ${temp.unit}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 7px',
                borderRadius: 'var(--radius-sm)',
                background: parseFloat(temp.value) >= 38.0 ? 'var(--status-safety-bg)' : 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: parseFloat(temp.value) >= 38.0 ? 'var(--status-safety-text)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Thermometer size={11} color="var(--status-warning)" />
              <span>{temp.value}°C</span>
            </div>
          )}

          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>
            Enc #{patient.encounterNumber}
          </div>
        </div>
      </div>

      {/* Delete Case Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-card"
            style={{ padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--status-safety-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-safety-text)',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Delete Case {id}?
              </h3>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
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
                className="btn btn-sm btn-danger"
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
