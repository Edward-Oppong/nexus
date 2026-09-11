import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { usePersona } from '../../../app/providers/PersonaContext';
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  GitBranch,
  History,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { DecisionType, DECISION_TYPE_LABELS, Decision } from '../../../domain/workflow';

export const DecisionTab: React.FC = () => {
  const {
    activeCase,
    nexusAssessment,
    decisions,
    activeDecision,
    canRecordDecision,
    recordDecision,
    amendActiveDecision,
    hasBlockingSafety,
    setActiveCaseSubTab,
  } = useCase();
  const { currentPersona } = usePersona();

  // Form states for new decision
  const [decisionType, setDecisionType] = useState<DecisionType>('CLINICAL_ASSESSMENT');
  const [summary, setSummary] = useState(
    '42-year-old female with persistent Streptococcus viridans bacteremia, new apical regurgitant murmur, splinter hemorrhages, and recent dental manipulation, highly consistent with Subacute Bacterial Infective Endocarditis.'
  );
  const [rationale, setRationale] = useState(
    'Fulfills modified Duke clinical criteria for high-probability endocarditis. Immediate bactericidal therapy is mandatory to prevent embolic phenomena or progressive valvular destruction.'
  );
  const [hasAcknowledged, setHasAcknowledged] = useState(true);

  // Amendment state
  const [isAmending, setIsAmending] = useState(false);
  const [amendedSummary, setAmendedSummary] = useState('');
  const [amendedRationale, setAmendedRationale] = useState('');
  const [amendedType, setAmendedType] = useState<DecisionType>('CLINICAL_ASSESSMENT');
  const [amendmentReason, setAmendmentReason] = useState('');

  const caseDecisions = decisions.filter((d) => d.caseId === activeCase.overview.id);

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAcknowledged) {
      alert('Please acknowledge clinical ownership of this decision.');
      return;
    }
    if (hasBlockingSafety) {
      alert('Workflow Interrupted: Unresolved safety-critical concerns prevent recording a decision.');
      return;
    }

    recordDecision({
      caseId: activeCase.overview.id,
      decisionType,
      summary,
      rationale,
      relatedAssessmentId: nexusAssessment?.id,
      supportingEvidenceIds: ['ev-aha-2025', 'ev-duke-2024'],
      supportingFindingIds: ['f-2', 'f-3', 'f-4', 'f-5'],
      legalDisclaimerAcknowledged: true,
    });
  };

  const handleStartAmendment = (decision: Decision) => {
    setIsAmending(true);
    setAmendedSummary(decision.summary);
    setAmendedRationale(decision.rationale || '');
    setAmendedType(decision.decisionType);
    setAmendmentReason('');
  };

  const handleConfirmAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim()) {
      alert('A clinical reason for amendment is mandatory.');
      return;
    }

    amendActiveDecision({
      summary: amendedSummary,
      rationale: amendedRationale,
      decisionType: amendedType,
      amendmentReason: amendmentReason.trim(),
    });
    setIsAmending(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Prominent Human Clinical Ownership Banner */}
      <div
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '8px',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#38BDF8',
              fontWeight: 600,
            }}
          >
            HUMAN CLINICAL OWNERSHIP ARCHITECTURE (WHO SMART / FDA CDS)
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: '#F8FAFC' }}>
            Official Clinical Decision & Therapeutic Record
          </h2>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Nexus proposes. The clinician owns and records the decision. Decisions are immutable and audit-traceable.
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Authorizing Clinician</div>
          <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>Dr. Edward Vance, MD</strong>
          <div style={{ fontSize: '11px', color: '#38BDF8' }}>Attending Physician · Lead Clinician</div>
        </div>
      </div>

      {/* Safety Guardrail Alert if blocking */}
      {hasBlockingSafety && (
        <div
          role="alert"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderLeft: '5px solid #DC2626',
            borderRadius: '6px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="#DC2626" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>
                Decision Recording Disabled: Unresolved Safety-Critical Concern
              </div>
              <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '2px' }}>
                {canRecordDecision.reason || 'This case has an active SAFETY_CRITICAL issue requiring clinician review.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveCaseSubTab('safety')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Go to Safety Tab <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Active Decision Card */}
      {activeDecision && !isAmending && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #10B981',
            borderRadius: '8px',
            padding: '22px',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                  padding: '3px 8px',
                  borderRadius: '12px',
                }}
              >
                ● ACTIVE DECISION (#{activeDecision.id})
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#F1F5F9',
                  color: '#0F172A',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {DECISION_TYPE_LABELS[activeDecision.decisionType]}
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Recorded: {new Date(activeDecision.recordedAt).toLocaleString()} by {activeDecision.recordedBy}
              </span>
            </div>

            <button
              onClick={() => handleStartAmendment(activeDecision)}
              style={{
                padding: '6px 14px',
                borderRadius: '5px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <GitBranch size={13} color="#2563EB" />
              Amend Decision
            </button>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong style={{ display: 'block', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
              Clinical Assessment & Formulation:
            </strong>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#0F172A', fontWeight: 500 }}>
              {activeDecision.summary}
            </p>
          </div>

          {activeDecision.rationale && (
            <div style={{ marginBottom: '14px' }}>
              <strong style={{ display: 'block', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                Clinical Rationale:
              </strong>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#334155' }}>
                {activeDecision.rationale}
              </p>
            </div>
          )}

          {activeDecision.amendedFrom && (
            <div style={{ fontSize: '11px', color: '#2563EB', background: '#EFF6FF', padding: '6px 10px', borderRadius: '4px' }}>
              🔗 Amended from predecessor Decision #{activeDecision.amendedFrom}. Reason: "{activeDecision.amendmentReason}"
            </div>
          )}
        </div>
      )}

      {/* Amendment Form */}
      {isAmending && (
        <div
          style={{
            background: '#FFFFFF',
            border: '2px solid #3B82F6',
            borderRadius: '8px',
            padding: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Amend Clinical Decision (Immutable Chain)
              </h3>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                The prior decision will become 'AMENDED' in the audit trail. Historical conclusions are never erased.
              </div>
            </div>
            <button
              onClick={() => setIsAmending(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '12px' }}
            >
              Cancel Amendment
            </button>
          </div>

          <form onSubmit={handleConfirmAmendment}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                Decision Type:
              </label>
              <select
                value={amendedType}
                onChange={(e) => setAmendedType(e.target.value as DecisionType)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              >
                {(Object.keys(DECISION_TYPE_LABELS) as DecisionType[]).map((t) => (
                  <option key={t} value={t}>
                    {DECISION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                Amended Clinical Formulation / Summary:
              </label>
              <textarea
                rows={3}
                required
                value={amendedSummary}
                onChange={(e) => setAmendedSummary(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                Amended Rationale:
              </label>
              <textarea
                rows={2}
                value={amendedRationale}
                onChange={(e) => setAmendedRationale(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B91C1C', marginBottom: '4px' }}>
                Mandatory Reason for Amendment:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. New TEE imaging confirms 12mm vegetation; antimicrobial adjustment required..."
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #F87171', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAmending(false)}
                style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '6px 18px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Decision Amendment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Decision Form (if no active decision exists) */}
      {!activeDecision && !isAmending && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '22px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A' }}>
            Record Clinical Decision
          </h3>

          <form onSubmit={handleCreateDecision}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                Decision Type:
              </label>
              <select
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value as DecisionType)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              >
                {(Object.keys(DECISION_TYPE_LABELS) as DecisionType[]).map((t) => (
                  <option key={t} value={t}>
                    {DECISION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                Diagnostic Assessment & Formulation:
              </label>
              <textarea
                rows={3}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                Clinical Rationale:
              </label>
              <textarea
                rows={2}
                required
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            {/* Acknowledgment Checkbox */}
            <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  style={{ marginTop: '2px' }}
                />
                <span>
                  <strong>Clinician Ownership Declaration:</strong> I confirm that this clinical decision is formulated and recorded under my professional clinical authority. Algorithmic outputs from Nexus were advisory and have been independently validated.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={hasBlockingSafety || !hasAcknowledged}
              style={{
                padding: '8px 22px',
                borderRadius: '6px',
                border: 'none',
                background: hasBlockingSafety || !hasAcknowledged ? '#94A3B8' : '#059669',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: hasBlockingSafety || !hasAcknowledged ? 'not-allowed' : 'pointer',
              }}
            >
              Sign & Record Official Decision
            </button>
          </form>
        </div>
      )}

      {/* Decision History Chain */}
      {caseDecisions.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            <History size={14} /> Immutable Decision Audit Chain ({caseDecisions.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {caseDecisions.map((dec) => (
              <div
                key={dec.id}
                style={{
                  background: dec.status === 'ACTIVE' ? '#FFFFFF' : '#F8FAFC',
                  border: `1px solid ${dec.status === 'ACTIVE' ? '#10B981' : '#CBD5E1'}`,
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#0F172A' }}>Decision #{dec.id}</strong>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: dec.status === 'ACTIVE' ? '#ECFDF5' : '#F1F5F9',
                        color: dec.status === 'ACTIVE' ? '#065F46' : '#64748B',
                      }}
                    >
                      {dec.status}
                    </span>
                  </div>
                  <span style={{ color: '#64748B' }}>
                    {new Date(dec.recordedAt).toLocaleString()} · {dec.recordedBy}
                  </span>
                </div>
                <div style={{ color: '#334155' }}>{dec.summary}</div>
                {dec.amendmentReason && (
                  <div style={{ marginTop: '4px', color: '#64748B', fontStyle: 'italic' }}>
                    Amendment Reason: "{dec.amendmentReason}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
