import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { useAuth } from '../authentication/AuthProvider';
import { Search, Filter, AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, Plus } from 'lucide-react';

export const CaseListView: React.FC = () => {
  const { casesList, openCaseById, setActiveView } = useCase();
  const { can } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'review' | 'contradictory' | 'insufficient' | 'safety'>('all');

  const filteredCases = casesList.filter((c) => {
    const matchesSearch =
      c.id.includes(searchQuery) ||
      c.patient.syntheticIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedClinician.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'review') return c.state === 'REVIEW_REQUIRED';
    if (activeFilter === 'contradictory') return c.state === 'CONTRADICTORY';
    if (activeFilter === 'insufficient') return c.state === 'INSUFFICIENT_DATA';
    if (activeFilter === 'safety') return c.state === 'SAFETY_REVIEW' || c.safetyIssueCount > 0;
    return true;
  });

  return (
    <main
      aria-label="Clinical Cases Master List"
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: '#F8FAFC',
      }}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#64748B',
                marginBottom: '4px',
              }}
            >
              Clinical Master Index · Phase 6D Domain Core
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Cases
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Showing <strong>{filteredCases.length}</strong> active clinical cases
            </div>

            {can('case.create') && (
              <button
                type="button"
                onClick={() => setActiveView('case-intake')}
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
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Plus size={16} />
                <span>New Case</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <Search
              size={15}
              color="#94A3B8"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              aria-label="Search patient, case or identifier"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, case # or clinical identifier... (Press /)"
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '4px',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {(
              [
                { id: 'all', label: 'All Cases' },
                { id: 'review', label: 'Review Required' },
                { id: 'contradictory', label: 'Contradictory' },
                { id: 'insufficient', label: 'Insufficient Data' },
                { id: 'safety', label: 'Safety Alerts' },
              ] as const
            ).map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    border: 'none',
                    background: isActive ? '#0F172A' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#475569',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinical Data Table */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <table className="clinical-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Case #</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patient</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Priority</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reasoning</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Signals & Alerts</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Clinician</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Updated</th>
                <th style={{ padding: '12px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openCaseById(c.id)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>
                    CASE-{c.id}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.patient.syntheticIdentifier}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {c.patient.age}y · {c.patient.gender} · {c.patient.encounterType}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: c.priority === 'urgent' || c.priority === 'high' ? '#B91C1C' : '#334155',
                        background: c.priority === 'urgent' || c.priority === 'high' ? '#FEF2F2' : '#F1F5F9',
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.state === 'REVIEW_REQUIRED' ? (
                      <span className="badge badge-review">Review Required</span>
                    ) : c.state === 'DECISION_RECORDED' ? (
                      <span className="badge badge-verified">Decision Recorded</span>
                    ) : c.state === 'SAFETY_REVIEW' ? (
                      <span className="badge badge-safety">Safety Review</span>
                    ) : c.state === 'CONTRADICTORY' ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px' }}>
                        Contradictory
                      </span>
                    ) : c.state === 'INSUFFICIENT_DATA' ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                        Insufficient Data
                      </span>
                    ) : c.state === 'ANALYZING' ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '4px' }}>
                        Analyzing
                      </span>
                    ) : (
                      <span className="badge badge-neutral">{c.state}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {c.hypothesesCount} candidates
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.gapsCount > 0 && (
                        <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 600 }}>
                          {c.gapsCount} gap{c.gapsCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {c.safetyIssueCount > 0 && (
                        <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <ShieldAlert size={12} /> {c.safetyIssueCount} safety
                        </span>
                      )}
                      {c.gapsCount === 0 && c.safetyIssueCount === 0 && (
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Clear</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: '#475569' }}>
                    {c.assignedClinician}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCaseById(c.id);
                      }}
                      className="btn btn-sm btn-primary"
                    >
                      Open <ArrowRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};
