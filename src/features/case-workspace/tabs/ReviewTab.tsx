import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { usePersona } from '../../../app/providers/PersonaContext';
import { CheckCircle2, XCircle, Edit3, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ClinicalFinding } from '../../../domain/finding';
import { CandidateHypothesis } from '../../../domain/hypothesis';
import { RejectionReasonModal } from '../../../components/ui/RejectionReasonModal';
import { HypothesisRejectionModal } from '../../../components/ui/HypothesisRejectionModal';

export const ReviewTab: React.FC = () => {
  const { activeCase, updateFindingStatus, adjudicateHypothesis, setActiveCaseSubTab } = useCase();
  const { currentPersona } = usePersona();
  const [rejectingFinding, setRejectingFinding] = useState<ClinicalFinding | null>(null);
  const [rejectingHypothesis, setRejectingHypothesis] = useState<CandidateHypothesis | null>(null);

  const { findings, hypotheses, informationGaps } = activeCase;

  const handleConfirmRejection = (reason: string, note: string) => {
    if (rejectingFinding) {
      updateFindingStatus(rejectingFinding.id, 'Rejected', reason, note);
      setRejectingFinding(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="badge badge-review">
              Human-In-The-Loop Governance
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
            Nexus Clinical Review & Adjudication
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            Explicit clinician review required before any machine inference is accepted into the active record.
          </p>
        </div>

        {currentPersona.allowedActions.canRecordClinicalDecision && (
          <button
            onClick={() => setActiveCaseSubTab('decision')}
            className="btn btn-primary"
          >
            Proceed to Final Decision <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Review Section 1: Findings Adjudication */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              1. Adjudicate Clinical Findings ({findings.length})
            </h3>
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Confirm, modify, or reject AI-extracted and triage-recorded findings
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {findings.map((f) => {
            const isVerified = f.provenance.verificationStatus === 'Verified';
            const isRejected = f.provenance.verificationStatus === 'Rejected';

            return (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: isVerified ? '#F0FDF4' : isRejected ? '#FEF2F2' : '#F8FAFC',
                  border: `1px solid ${isVerified ? '#BBF7D0' : isRejected ? '#FECACA' : '#E2E8F0'}`,
                  borderRadius: '6px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13px', color: isRejected ? '#991B1B' : '#0F172A' }}>
                      {f.label}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                      [{f.provenance.provenanceType}]
                    </span>
                    {f.provenance.extractionModel && (
                      <span className="badge badge-nexus" style={{ fontSize: '9px', padding: '1px 4px' }}>
                        AI-Extracted
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    Source: {f.sourceDisplay} · Status: <strong>{f.provenance.verificationStatus}</strong>
                    {f.provenance.rejectionReason && (
                      <span style={{ color: '#DC2626', marginLeft: '6px' }}>
                        (Rejected: {f.provenance.rejectionReason})
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isVerified ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Accepted
                    </span>
                  ) : isRejected ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>
                      <XCircle size={14} /> Rejected
                    </span>
                  ) : null}

                  {currentPersona.allowedActions.canReviewNexusFindings && (
                    <>
                      <button
                        onClick={() => updateFindingStatus(f.id, 'Verified')}
                        disabled={isVerified}
                        className="btn btn-sm btn-success"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        <CheckCircle2 size={12} /> Accept
                      </button>

                      <button
                        onClick={() => setRejectingFinding(f)}
                        disabled={isRejected}
                        className="btn btn-sm btn-danger"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Review Section 2: Candidate Hypotheses Review */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
          2. Candidate Hypotheses Adjudication
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hypotheses.map((h, idx) => {
            const isAccepted = h.clinicalReviewStatus === 'Accepted';
            const isRejected = h.clinicalReviewStatus === 'Rejected';

            return (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: isAccepted ? '#F0FDF4' : isRejected ? '#FEF2F2' : '#F8FAFC',
                  border: `1px solid ${isAccepted ? '#BBF7D0' : isRejected ? '#FECACA' : '#E2E8F0'}`,
                  borderRadius: '6px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13px', color: isRejected ? '#991B1B' : '#0F172A' }}>
                      0{idx + 1}. {h.title}
                    </strong>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: h.status === 'Supported' ? '#047857' : h.status === 'Uncertain' ? '#B45309' : '#B91C1C',
                        background: h.status === 'Supported' ? '#ECFDF5' : h.status === 'Uncertain' ? '#FEF3C7' : '#FEF2F2',
                        padding: '2px 5px',
                        borderRadius: '3px',
                      }}
                    >
                      ● {h.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                    Review Status: <strong style={{ color: isAccepted ? '#059669' : isRejected ? '#DC2626' : '#64748B' }}>{h.clinicalReviewStatus}</strong>
                    {h.reviewNote && (
                      <span style={{ color: '#475569', marginLeft: '6px' }}>
                        ({h.reviewNote})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isAccepted ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Accepted
                    </span>
                  ) : isRejected ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>
                      <XCircle size={14} /> Rejected
                    </span>
                  ) : null}

                  {currentPersona.allowedActions.canReviewNexusFindings && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => adjudicateHypothesis(h.id, 'ACCEPT')}
                        disabled={isAccepted}
                        className="btn btn-sm btn-success"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        <CheckCircle2 size={12} /> Accept
                      </button>
                      <button
                        onClick={() => setRejectingHypothesis(h)}
                        disabled={isRejected}
                        className="btn btn-sm btn-danger"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Finding Rejection Modal Dialog */}
      {rejectingFinding && (
        <RejectionReasonModal
          finding={rejectingFinding}
          onConfirm={handleConfirmRejection}
          onCancel={() => setRejectingFinding(null)}
        />
      )}

      {/* Hypothesis Rejection Modal Dialog */}
      {rejectingHypothesis && (
        <HypothesisRejectionModal
          hypothesis={rejectingHypothesis}
          onConfirm={(reason, note) => {
            const combinedReason = note.trim() ? `${reason}: ${note.trim()}` : reason;
            adjudicateHypothesis(rejectingHypothesis.id, 'REJECT', combinedReason);
            setRejectingHypothesis(null);
          }}
          onCancel={() => setRejectingHypothesis(null)}
        />
      )}
    </div>
  );
};
