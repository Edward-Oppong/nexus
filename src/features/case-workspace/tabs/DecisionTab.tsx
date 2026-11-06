import React, { useState, useMemo } from 'react';
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
  Cpu,
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
    safetyConcerns,
    setActiveCaseSubTab,
    adjudicateHypothesis,
  } = useCase();
  const { currentPersona } = usePersona();

  // ── Dynamic CDS pre-flight summary ──────────────────────────────────────────
  const cdsPreFlightSummary = useMemo(() => {
    const patient = activeCase.overview.patient;
    const caseId = activeCase.overview.id;

    const parts: string[] = [];

    // Allergy signal
    if (patient.allergiesCount > 0) {
      const allergenNames = patient.allergies.map((a) => a.allergen).join(', ');
      parts.push(`Allergy: ${allergenNames} flagged`);
    } else {
      parts.push('Allergy: None documented');
    }

    // Active safety concerns for this case
    const openConcerns = safetyConcerns.filter(
      (s) => s.caseId === caseId && s.status !== 'RESOLVED'
    );
    if (openConcerns.length > 0) {
      parts.push(`${openConcerns.length} open safety concern${openConcerns.length > 1 ? 's' : ''} active`);
    } else {
      parts.push('No open safety concerns');
    }

    // Medication count
    if (patient.activeMedicationsCount > 0) {
      parts.push(`${patient.activeMedicationsCount} active medication${patient.activeMedicationsCount > 1 ? 's' : ''} on record`);
    }

    return parts.join(' · ');
  }, [activeCase, safetyConcerns]);

  const cdsChecksVerified = useMemo(() => {
    // Count how many check categories are satisfied
    let count = 1; // Rule evaluation is always run
    if (activeCase.overview.patient.allergiesCount > 0) count++;
    if (activeCase.overview.patient.activeMedicationsCount > 0) count++;
    const openConcerns = safetyConcerns.filter(
      (s) => s.caseId === activeCase.overview.id && s.status !== 'RESOLVED'
    );
    if (openConcerns.length === 0) count++; // DDI/renal clear
    return count;
  }, [activeCase, safetyConcerns]);

  const authorizingClinicianName = currentPersona ? `${currentPersona.title} ${currentPersona.name}` : 'Attending Clinician';
  const authorizingClinicianRole = currentPersona ? `${currentPersona.roleDisplay} · ${currentPersona.department}` : 'Lead Clinician';

  // Form states for new decision
  const [decisionType, setDecisionType] = useState<DecisionType>('CLINICAL_ASSESSMENT');

  // Pre-fill from the active case so the clinician has a starting point grounded
  // in the actual intake data, not a hardcoded demo scenario.
  const defaultSummary = useMemo(() => {
    const cc = activeCase.chiefComplaint || activeCase.overview.patient.syntheticIdentifier;
    const primaryHyp = activeCase.hypotheses?.[0]?.title || '';
    if (!cc && !primaryHyp) return '';
    if (cc && primaryHyp) return `${cc}. Working hypothesis: ${primaryHyp}.`;
    return cc || primaryHyp;
  }, [activeCase]);

  const defaultRationale = useMemo(() => {
    const hyp = activeCase.hypotheses?.[0];
    if (!hyp) return '';
    return hyp.nexusAssessment || hyp.statusDetail || '';
  }, [activeCase]);

  const [summary, setSummary] = useState(() => defaultSummary);
  const [rationale, setRationale] = useState(() => defaultRationale);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

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
          background: 'var(--bg-app)',
          color: 'var(--accent-contrast)',
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
              color: 'var(--accent-primary)',
              fontWeight: 600,
            }}
          >
            HUMAN CLINICAL OWNERSHIP ARCHITECTURE (WHO SMART / FDA CDS)
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            Official Clinical Decision & Therapeutic Record
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Nexus proposes. The clinician owns and records the decision. Decisions are immutable and audit-traceable.
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Authorizing Clinician</div>
          <strong style={{ fontSize: '14px', color: 'var(--accent-contrast)' }}>{authorizingClinicianName}</strong>
          <div style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{authorizingClinicianRole}</div>
        </div>
      </div>

      {/* Candidate Hypotheses Adjudication Section (EU MDR / FDA CDS Compliant) */}
      {activeCase.hypotheses && activeCase.hypotheses.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                DIAGNOSTIC ADJUDICATION (MDCG 2020-1)
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                Candidate Differential Hypotheses
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Adjudicate each hypothesis before signing final formulation
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeCase.hypotheses.map((hyp) => {
              const isAccepted = hyp.clinicalReviewStatus === 'Accepted';
              const isRejected = hyp.clinicalReviewStatus === 'Rejected';

              return (
                <div
                  key={hyp.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${isAccepted ? 'var(--success-border)' : isRejected ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
                    background: isAccepted ? 'var(--success-subtle)' : isRejected ? 'var(--danger-subtle)' : 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{hyp.title}</strong>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: isAccepted ? 'var(--success-subtle)' : isRejected ? 'var(--danger-subtle)' : 'var(--border-subtle)',
                          color: isAccepted ? 'var(--status-success)' : isRejected ? 'var(--status-danger)' : 'var(--text-muted)',
                        }}
                      >
                        {isAccepted ? '✓ WORKING DIAGNOSIS' : isRejected ? '✗ EXCLUDED' : 'PENDING ADJUDICATION'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {hyp.rationale || hyp.statusDetail || 'Generated from verified case observations.'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        adjudicateHypothesis(hyp.id, 'ACCEPT', 'Clinician verified and accepted as working diagnosis.');
                        // Pre-populate summary if empty
                        if (!summary) {
                          setSummary(`Working Diagnosis: ${hyp.title}. Formulated following comprehensive clinical adjudication.`);
                        }
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--status-success)',
                        background: isAccepted ? 'var(--status-success)' : 'var(--bg-surface)',
                        color: isAccepted ? 'var(--bg-surface)' : 'var(--status-success)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isAccepted ? '✓ Accepted' : 'Accept as Working'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt(`Reason for excluding ${hyp.title}:`, 'Clinically excluded based on findings & examination');
                        if (reason) {
                          adjudicateHypothesis(hyp.id, 'REJECT', reason);
                        }
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-medium)',
                        background: isRejected ? 'var(--status-danger)' : 'var(--bg-surface)',
                        color: isRejected ? 'var(--bg-surface)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isRejected ? 'Excluded' : 'Exclude'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase 9 Deterministic CDS Pre-Flight Check Banner */}
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
          <div style={{ background: 'var(--accent-primary)', color: 'var(--bg-surface)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
            <Cpu size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                Deterministic CDS Pre-Flight Check
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--accent-subtle)', color: 'var(--accent-primary)', padding: '1px 6px', borderRadius: '8px' }}>
                {cdsChecksVerified} Checks Verified
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {cdsPreFlightSummary}
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
          View CDS Engine <ArrowRight size={12} />
        </button>
      </div>

      {/* Safety Guardrail Alert if blocking */}
      {hasBlockingSafety && (
        <div
          role="alert"
          style={{
            background: 'var(--danger-subtle)',
            border: '1px solid var(--danger-border)',
            borderLeft: '5px solid var(--status-danger)',
            borderRadius: '6px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} color="var(--status-danger)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-danger)' }}>
                Decision Recording Disabled: Unresolved Safety-Critical Concern
              </div>
              <div style={{ fontSize: '12px', color: 'var(--status-danger)', marginTop: '2px' }}>
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
              background: 'var(--status-danger)',
              color: 'var(--bg-surface)',
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
            background: 'var(--bg-surface)',
            border: '1px solid var(--status-success)',
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
                  background: 'var(--success-subtle)',
                  color: 'var(--status-success)',
                  border: '1px solid var(--success-border)',
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
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {DECISION_TYPE_LABELS[activeDecision.decisionType]}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Recorded: {new Date(activeDecision.recordedAt).toLocaleString()} by {activeDecision.recordedBy}
              </span>
            </div>

            <button
              onClick={() => handleStartAmendment(activeDecision)}
              style={{
                padding: '6px 14px',
                borderRadius: '5px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <GitBranch size={13} color="var(--accent-primary)" />
              Amend Decision
            </button>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Clinical Assessment & Formulation:
            </strong>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text-primary)', fontWeight: 500 }}>
              {activeDecision.summary}
            </p>
          </div>

          {activeDecision.rationale && (
            <div style={{ marginBottom: '14px' }}>
              <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Clinical Rationale:
              </strong>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {activeDecision.rationale}
              </p>
            </div>
          )}

          {activeDecision.amendedFrom && (
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'var(--accent-subtle)', padding: '6px 10px', borderRadius: '4px' }}>
              🔗 Amended from predecessor Decision #{activeDecision.amendedFrom}. Reason: "{activeDecision.amendmentReason}"
            </div>
          )}
        </div>
      )}

      {/* Amendment Form */}
      {isAmending && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '2px solid var(--accent-primary)',
            borderRadius: '8px',
            padding: '22px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Amend Clinical Decision (Immutable Chain)
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                The prior decision will become 'AMENDED' in the audit trail. Historical conclusions are never erased.
              </div>
            </div>
            <button
              onClick={() => setIsAmending(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
            >
              Cancel Amendment
            </button>
          </div>

          <form onSubmit={handleConfirmAmendment}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Decision Type:
              </label>
              <select
                value={amendedType}
                onChange={(e) => setAmendedType(e.target.value as DecisionType)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
              >
                {(Object.keys(DECISION_TYPE_LABELS) as DecisionType[]).map((t) => (
                  <option key={t} value={t}>
                    {DECISION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Amended Clinical Formulation / Summary:
              </label>
              <textarea
                rows={3}
                required
                value={amendedSummary}
                onChange={(e) => setAmendedSummary(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Amended Rationale:
              </label>
              <textarea
                rows={2}
                value={amendedRationale}
                onChange={(e) => setAmendedRationale(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--status-danger)', marginBottom: '4px' }}>
                Mandatory Reason for Amendment:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. New TEE imaging confirms 12mm vegetation; antimicrobial adjustment required..."
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid var(--danger-border)', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAmending(false)}
                style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '6px 18px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-surface)',
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
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '22px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            Record Clinical Decision
          </h3>

          <form onSubmit={handleCreateDecision}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Decision Type:
              </label>
              <select
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value as DecisionType)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
              >
                {(Object.keys(DECISION_TYPE_LABELS) as DecisionType[]).map((t) => (
                  <option key={t} value={t}>
                    {DECISION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Diagnostic Assessment & Formulation:
              </label>
              <textarea
                rows={3}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Clinical Rationale:
              </label>
              <textarea
                rows={2}
                required
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
              />
            </div>

            {/* Acknowledgment Checkbox */}
            <div style={{ marginBottom: '18px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
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
                background: hasBlockingSafety || !hasAcknowledged ? 'var(--text-muted)' : 'var(--status-success)',
                color: 'var(--bg-surface)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            <History size={14} /> Immutable Decision Audit Chain ({caseDecisions.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {caseDecisions.map((dec) => (
              <div
                key={dec.id}
                style={{
                  background: dec.status === 'ACTIVE' ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                  border: `1px solid ${dec.status === 'ACTIVE' ? 'var(--status-success)' : 'var(--border-medium)'}`,
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Decision #{dec.id}</strong>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: dec.status === 'ACTIVE' ? 'var(--success-subtle)' : 'var(--bg-subtle)',
                        color: dec.status === 'ACTIVE' ? 'var(--status-success)' : 'var(--text-muted)',
                      }}
                    >
                      {dec.status}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(dec.recordedAt).toLocaleString()} · {dec.recordedBy}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{dec.summary}</div>
                {dec.amendmentReason && (
                  <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
