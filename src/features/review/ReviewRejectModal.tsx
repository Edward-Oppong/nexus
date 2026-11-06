import React, { useState } from 'react';
import { X, AlertCircle, XCircle } from 'lucide-react';
import { RejectReasonCategory, REJECT_REASON_LABELS } from '../../domain/workflow';

interface ReviewRejectModalProps {
  itemTitle: string;
  onConfirm: (category: RejectReasonCategory, explanation: string) => void;
  onClose: () => void;
}

export const ReviewRejectModal: React.FC<ReviewRejectModalProps> = ({
  itemTitle,
  onConfirm,
  onClose,
}) => {
  const [category, setCategory] = useState<RejectReasonCategory>('INCORRECT');
  const [explanation, setExplanation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) {
      alert('A clinical explanation is mandatory when rejecting machine-generated findings.');
      return;
    }
    onConfirm(category, explanation.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          padding: '24px',
          borderRadius: '10px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--danger-subtle)',
                color: 'var(--status-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Reject Machine-Generated Output
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Item: {itemTitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Regulatory explanation notice */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          <strong>Quality & Regulatory Notice:</strong> Rejected Nexus inferences are permanently archived as part of the clinical quality dataset to identify algorithmic drift, false positives, and evidence misalignments.
        </div>

        <form onSubmit={handleSubmit}>
          {/* Reason Category */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Select Rejection Category:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(Object.keys(REJECT_REASON_LABELS) as RejectReasonCategory[]).map((cat) => (
                <label
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: category === cat ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${category === cat ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="rejectCategory"
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                  />
                  <span>{REJECT_REASON_LABELS[cat]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Explanation Text */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Detailed Clinical Explanation (Mandatory):
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide clinical reasoning for rejection (e.g. Findings discordant with patient physical exam; evidence guideline superseded or non-applicable...)"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '5px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-surface)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '6px 16px',
                borderRadius: '5px',
                border: 'none',
                background: 'var(--status-danger)',
                color: 'var(--bg-surface)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
