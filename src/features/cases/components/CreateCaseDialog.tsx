// ============================================================
// src/features/cases/components/CreateCaseDialog.tsx
// Phase 6D: Clean Case Creation Modal (Section 22)
// Focused clinical entry: Patient search, encounter association,
// clinical problem title, and priority selection. No giant wizard.
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../../authentication/AuthProvider';
import { Patient } from '../../../domain/patient';
import { CasePriority } from '../../../domain/case';
import { SYNTHETIC_DEMO_PATIENTS } from '../../patients/api/getPatients';
import { X, Search, Plus, UserCheck, AlertCircle } from 'lucide-react';

interface CreateCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (params: { patientId: string; title: string; priority: CasePriority }) => Promise<{ error: string | null }>;
}

export const CreateCaseDialog: React.FC<CreateCaseDialogProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
}) => {
  const { can } = useAuth();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(SYNTHETIC_DEMO_PATIENTS[0]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<CasePriority>('HIGH');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredPatients = SYNTHETIC_DEMO_PATIENTS.filter(
    (p) =>
      p.givenName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.familyName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.externalPatientId?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setErrorMessage('Please select an existing patient or create a new record.');
      return;
    }
    if (!title.trim() || title.trim().length < 4) {
      setErrorMessage('Please describe the clinical presentation or problem.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const res = await onCaseCreated({
      patientId: selectedPatient.id,
      title: title.trim(),
      priority,
    });

    setSubmitting(false);
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
              Open New Clinical Case
            </h2>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Establish clinical problem statement and assign initial triage priority.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              color: '#B91C1C',
              fontSize: '13px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Patient Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', marginBottom: '8px' }}>
              Patient Record
            </label>

            {selectedPatient ? (
              <div style={{
                padding: '12px 14px',
                border: '1px solid #0284C7',
                backgroundColor: '#F0F9FF',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0284C7', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                    {selectedPatient.givenName[0]}{selectedPatient.familyName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                      {selectedPatient.givenName} {selectedPatient.familyName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      DOB: {selectedPatient.dateOfBirth || 'Unknown'} · MRN: {selectedPatient.externalPatientId}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284C7',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search patient by name or synthetic MRN..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{p.givenName} {p.familyName}</span>
                      <span style={{ color: '#64748B' }}>{p.externalPatientId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Case Title (Problem Description, not premature diagnosis) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', marginBottom: '6px' }}>
              Clinical Problem Description
            </label>
            <input
              type="text"
              placeholder="e.g. Acute chest pain with discordant biomarkers (avoid premature diagnosis)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              Describe the clinical syndrome. Nexus assists in evaluating competing hypotheses.
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', marginBottom: '8px' }}>
              Triage Priority
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['ROUTINE', 'HIGH', 'URGENT'] as CasePriority[]).map((p) => (
                <label
                  key={p}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '9px',
                    borderRadius: '6px',
                    border: priority === p ? '2px solid #0284C7' : '1px solid #CBD5E1',
                    backgroundColor: priority === p ? '#F0F9FF' : '#FFFFFF',
                    color: priority === p ? '#0284C7' : '#475569',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    style={{ display: 'none' }}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating Case...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
