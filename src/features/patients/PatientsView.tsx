// ============================================================
// src/features/patients/PatientsView.tsx
// Phase 6D: Longitudinal Patients Registry (Section 10, 11, 23)
// Access-controlled master patient directory with active encounter and case mapping.
// ============================================================

import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { useAuth } from '../authentication/AuthProvider';
import { SYNTHETIC_DEMO_PATIENTS } from './api/getPatients';
import { CreatePatientDialog } from './components/CreatePatientDialog';
import { Users, Search, Plus, ArrowRight, ShieldCheck, FileText, Calendar } from 'lucide-react';

export const PatientsView: React.FC = () => {
  const { openCaseById } = useCase();
  const { can } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredPatients = SYNTHETIC_DEMO_PATIENTS.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.givenName.toLowerCase().includes(query) ||
      p.familyName.toLowerCase().includes(query) ||
      p.externalPatientId?.toLowerCase().includes(query)
    );
  });

  return (
    <main
      aria-label="Patients Registry"
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: '#F8FAFC',
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.06em' }}>
              Clinical Registry · Phase 6D Longitudinal Identities
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginTop: '2px', margin: 0 }}>
              Patients
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 }}>
              Longitudinal patient directory with encounter links and active problem mapping.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Showing <strong>{filteredPatients.length}</strong> longitudinal patients
            </div>

            {can('case.create') && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                <span>Register Patient</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar (Section 23) */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              aria-label="Search patients"
              placeholder="Search by patient name, MRN, or identifier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Patients Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <table className="clinical-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patient ID</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date of Birth</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Biological Sex</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Clinical Case</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p, idx) => {
                const linkedCaseId = idx === 0 ? '10482' : idx === 1 ? '10002' : '10003';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0284C7' }}>
                      {p.externalPatientId || p.id.substring(0, 8)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.givenName} {p.familyName}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Longitudinal Person Record</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                      {p.dateOfBirth || 'Not recorded'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                        {p.sex}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                      {p.phone || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openCaseById(linkedCaseId)}
                        className="btn btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0F172A',
                          cursor: 'pointer',
                        }}
                      >
                        Open Case #{linkedCaseId}
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <CreatePatientDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {}}
        />
      </div>
    </main>
  );
};
