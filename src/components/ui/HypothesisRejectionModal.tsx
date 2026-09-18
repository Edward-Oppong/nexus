import React, { useState } from 'react';
import { CandidateHypothesis } from '../../domain/hypothesis';
import { X, AlertTriangle } from 'lucide-react';

interface HypothesisRejectionModalProps {
  hypothesis: CandidateHypothesis;
  onConfirm: (reason: string, note: string) => void;
  onCancel: () => void;
}

export const HypothesisRejectionModal: React.FC<HypothesisRejectionModalProps> = ({
  hypothesis,
  onConfirm,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState('Contradicted by diagnostic evidence');
  const [customNote, setCustomNote] = useState('');

  const reasonOptions = [
    'Contradicted by diagnostic evidence',
    'Clinically improbable given presentation timeline',
    'Alternative working diagnosis established',
    'Key mandatory diagnostic criteria not fulfilled',
    'Exempted by specialist consultation',
    'Other clinical rationale',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedReason, customNote);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <AlertTriangle size={14} /> Diagnostic Differential Adjudication
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              Reject Hypothesis: {hypothesis.title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px', lineHeight: 1.4 }}>
          Please specify the clinical rationale for rejecting this candidate diagnostic hypothesis. This reason will be permanently recorded in the case timeline and reasoning audit trail.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              Clinical Rejection Rationale
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {reasonOptions.map((opt) => (
                <label
                  key={opt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#334155',
                    padding: '8px 10px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedReason === opt ? '#FEF2F2' : '#FFFFFF',
                    borderColor: selectedReason === opt ? '#FECACA' : '#E2E8F0',
                  }}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={opt}
                    checked={selectedReason === opt}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              Specific Clinical Note (Optional)
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g., Blood cultures grew Gram-positive cocci in chains, ruled out GNB urosepsis..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger btn-sm"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
