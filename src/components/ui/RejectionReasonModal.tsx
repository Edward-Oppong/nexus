import React, { useState } from 'react';
import { ClinicalFinding } from '../../domain/finding';
import { X, AlertTriangle } from 'lucide-react';

interface RejectionReasonModalProps {
  finding: ClinicalFinding;
  onConfirm: (reason: string, note: string) => void;
  onCancel: () => void;
}

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({ finding, onConfirm, onCancel }) => {
  const [selectedReason, setSelectedReason] = useState('Incorrect extraction');
  const [customNote, setCustomNote] = useState('');

  const reasonOptions = [
    'Incorrect extraction',
    'Clinically irrelevant / Distractor',
    'Contradicted by direct physical exam',
    'Historical symptom resolved prior to encounter',
    'Duplicate clinical concept',
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
              <AlertTriangle size={14} /> Review Audit
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              Reject Finding: {finding.label}
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
          Please specify the clinical rationale for rejecting this AI-extracted finding. This reason will be permanently attached to the case audit timeline.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              Primary Rejection Reason
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {reasonOptions.map((opt) => (
                <label
                  key={opt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: selectedReason === opt ? '#0F172A' : '#E2E8F0',
                    background: selectedReason === opt ? '#F8FAFC' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={opt}
                    checked={selectedReason === opt}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              Optional Clinical Note
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Provide clarifying clinical context or alternative interpretation..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onCancel} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              Reject Finding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
