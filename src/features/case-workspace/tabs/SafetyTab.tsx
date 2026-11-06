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
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { SafetyConcern, SafetyConcernSeverity } from '../../../domain/workflow';
import { SafetyResolveModal } from '../../safety/SafetyResolveModal';

export const SafetyTab: React.FC = () => {
  const { safetyConcerns, activeCase, setActiveCaseSubTab } = useCase();
  const [modalConcernId, setModalConcernId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'ACKNOWLEDGE' | 'RESOLVE'>('ACKNOWLEDGE');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const caseConcerns = safetyConcerns.filter((s) => s.caseId === activeCase.overview.id);

  const filtered = caseConcerns.filter((s) => {
    if (filterSeverity !== 'ALL' && s.severity !== filterSeverity) return false;
    return true;
  });

  const hasRealCase = Boolean(
    activeCase &&
    activeCase.overview &&
    activeCase.overview.id &&
    activeCase.overview.id !== 'EMPTY' &&
    activeCase.overview.patient?.syntheticIdentifier &&
    activeCase.overview.patient?.syntheticIdentifier !== 'No Active Patient'
  );

  const patientAllergies = activeCase?.overview?.patient?.allergies || [];
  const patientMeds = activeCase?.overview?.patient?.medications || [];
  const penicillinAlert = patientAllergies.some((a) =>
    a.allergen.toLowerCase().includes('penicillin') || a.allergen.toLowerCase().includes('amoxicillin')
  );
  const medNames = patientMeds.map((m) => m.name.toLowerCase());
  const vancGentAlert = medNames.some((m) => m.includes('vancomycin')) && medNames.some((m) => m.includes('gentamicin'));
  const criticalSafetyCount = caseConcerns.filter((c) => c.severity === 'SAFETY_CRITICAL' && c.status !== 'RESOLVED').length;
  const hasCdsAlerts = hasRealCase && (penicillinAlert || vancGentAlert || criticalSafetyCount > 0);

  const alertTexts: string[] = [];
  if (penicillinAlert) alertTexts.push('Penicillin cross-reactivity alert active (anaphylaxis history).');
  if (vancGentAlert) alertTexts.push('Drug interaction active between Vancomycin and Gentamicin (synergistic renal monitoring required).');
  if (criticalSafetyCount > 0) alertTexts.push(`${criticalSafetyCount} blocking safety critical concern(s) require clinician review.`);

  const getSeverityBadge = (severity: SafetyConcernSeverity) => {
    switch (severity) {
      case 'SAFETY_CRITICAL':
        return { bg: 'var(--danger-subtle)', text: 'var(--status-danger)', border: 'var(--danger-border)' };
      case 'URGENT_REVIEW':
        return { bg: 'var(--warning-subtle)', text: 'var(--status-warning)', border: 'var(--warning-border)' };
      case 'ATTENTION':
        return { bg: 'var(--accent-subtle)', text: 'var(--accent-primary)', border: 'var(--border-medium)' };
      default:
        return { bg: 'var(--bg-subtle)', text: 'var(--text-secondary)', border: 'var(--border-medium)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldAlert size={20} color="var(--status-danger)" />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Clinical Safety Concerns & Guardrail Interrupts
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            Structured, non-transient clinical hazards. SAFETY_CRITICAL concerns halt clinical decision recording until formally adjudicated. Resolved concerns are permanently preserved in the clinical record.
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
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

      {/* Deterministic CDS Safety Guardrails Banner — only shown when a real case has active alerts */}
      {hasRealCase && hasCdsAlerts && (
        <div
          style={{
            background: 'var(--accent-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--accent-primary)', color: 'var(--accent-contrast)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
              <Cpu size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  Deterministic CDS Rule Engine Alerts Active
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--warning-subtle)', color: 'var(--status-warning)', padding: '1px 6px', borderRadius: '8px', border: '1px solid var(--warning-border)' }}>
                  {penicillinAlert && vancGentAlert ? 'Allergy & DDI Active' : penicillinAlert ? 'Allergy Alert' : vancGentAlert ? 'DDI Alert' : 'Safety Concern'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {alertTexts.join(' ')}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveCaseSubTab('rules')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--bg-surface)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Open CDS Engine <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Concerns List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
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
                  background: isResolved ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  border: `1px solid ${isResolved ? 'var(--border-medium)' : badge.border}`,
                  borderLeft: `5px solid ${isResolved ? 'var(--status-success)' : badge.text}`,
                  borderRadius: '8px',
                  padding: '18px 20px',
                  boxShadow: isResolved ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.04)',
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
                        background: isResolved ? 'var(--success-subtle)' : isAcknowledged ? 'var(--accent-subtle)' : 'var(--danger-subtle)',
                        color: isResolved ? 'var(--status-success)' : isAcknowledged ? 'var(--accent-primary)' : 'var(--status-danger)',
                        border: `1px solid ${isResolved ? 'var(--success-border)' : isAcknowledged ? 'var(--border-medium)' : 'var(--danger-border)'}`,
                      }}
                    >
                      Status: {concern.status}
                    </span>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                          border: '1px solid var(--border-medium)',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
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
                          background: 'var(--status-success)',
                          color: 'var(--bg-surface)',
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
                          color: 'var(--status-success)',
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

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  {concern.category}
                </h3>

                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {concern.description}
                </p>

                {concern.recommendedAction && (
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
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
                      background: isResolved ? 'var(--success-subtle)' : 'var(--bg-subtle)',
                      border: `1px solid ${isResolved ? 'var(--success-border)' : 'var(--border-medium)'}`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
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
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-primary)' }}>
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
