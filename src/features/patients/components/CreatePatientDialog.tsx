// ============================================================
// src/features/patients/components/CreatePatientDialog.tsx
// Phase 6D: Patient Intake Modal with Deduplication Guard (Section 11 & 23)
// Alerts clinician if a patient with identical name and DOB already exists.
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../../authentication/AuthProvider';
import { createPatient, CreatePatientResult } from '../api/createPatient';
import { X, UserPlus, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

interface CreatePatientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePatientDialog: React.FC<CreatePatientDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeOrganization } = useAuth();
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN'>('UNKNOWN');
  const [externalId, setExternalId] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDuplicateWarning(null);

    if (!givenName.trim() || !familyName.trim()) {
      setErrorMessage('Patient given name and family name are required.');
      return;
    }

    setSubmitting(true);
    const result: CreatePatientResult = await createPatient({
      organizationId: activeOrganization?.id || 'c0000001-0000-0000-0000-000000000001',
      givenName,
      familyName,
      dateOfBirth: dateOfBirth || undefined,
      sex,
      externalPatientId: externalId.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setSubmitting(false);

    if (result.possibleDuplicate) {
      setDuplicateWarning(result.error || 'A potential duplicate record was detected for this patient.');
    } else if (result.error) {
      setErrorMessage(result.error);
    } else {
      onSuccess();
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
        maxWidth: '520px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={16} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                Register New Patient Record
              </h2>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Longitudinal patient identity scoped to {activeOrganization?.name || 'organization'}.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
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
              fontSize: '12px',
              marginBottom: '16px',
            }}>
              {errorMessage}
            </div>
          )}

          {duplicateWarning && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '6px',
              color: '#92400E',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <AlertTriangle size={15} style={{ color: '#D97706' }} />
                Deduplication Warning (Section 11)
              </div>
              <div>{duplicateWarning}</div>
              <span style={{ fontSize: '11px', color: '#B45309' }}>
                Nexus requires reviewing existing records rather than silently producing duplicate patient identities.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                Given Name *
              </label>
              <input
                type="text"
                required
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                Family Name *
              </label>
              <input
                type="text"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                Biological Sex
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box', background: '#FFF' }}
              >
                <option value="UNKNOWN">Unknown / Unspecified</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                External MRN / ID
              </label>
              <input
                type="text"
                placeholder="e.g. GH-1042"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                Phone Contact
              </label>
              <input
                type="tel"
                placeholder="+44 7700..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#0284C7', color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
