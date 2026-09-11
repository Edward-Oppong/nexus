import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SafetyResolveModalProps {
  concernId: string;
  mode: 'ACKNOWLEDGE' | 'RESOLVE';
  onClose: () => void;
}

export const SafetyResolveModal: React.FC<SafetyResolveModalProps> = ({
  concernId,
  mode,
  onClose,
}) => {
  const { safetyConcerns, acknowledgeSafetyConcern, resolveSafetyConcern } = useCase();
  const concern = safetyConcerns.find((c) => c.id === concernId);
  const [note, setNote] = useState('');

  if (!concern) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'RESOLVE' && !note.trim()) {
      alert('A clinical note is mandatory when resolving a safety concern.');
      return;
    }

    if (mode === 'RESOLVE') {
      resolveSafetyConcern(concernId, note.trim());
    } else {
      acknowledgeSafetyConcern(concernId, note.trim() || undefined);
    }
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
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                {mode === 'RESOLVE' ? 'Resolve Clinical Safety Concern' : 'Acknowledge Clinical Safety Concern'}
              </h3>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Severity: {concern.severity} · Category: {concern.category}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Concern Details */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#1E293B',
            lineHeight: 1.5,
          }}
        >
          {concern.description}
          {concern.recommendedAction && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '12px', color: '#475569' }}>
              <strong>Recommended Action:</strong> {concern.recommendedAction}
            </div>
          )}
        </div>

        {/* Note Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0F172A',
                marginBottom: '6px',
              }}
            >
              {mode === 'RESOLVE'
                ? 'Clinical Resolution Documentation (Mandatory):'
                : 'Clinician Acknowledgment Note (Optional):'}
            </label>
            <textarea
              required={mode === 'RESOLVE'}
              rows={3}
              placeholder={
                mode === 'RESOLVE'
                  ? 'e.g. ID Pharmacy consulted; patient loaded with IV Vancomycin 1.5g with renal monitoring. Non-beta-lactam regimen active.'
                  : 'e.g. Acknowledged by attending; pending pharmacy confirmation...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
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
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
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
                background: mode === 'RESOLVE' ? '#059669' : '#0F172A',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              {mode === 'RESOLVE' ? 'Confirm Resolution' : 'Confirm Acknowledgment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
