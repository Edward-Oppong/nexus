import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { useAuth } from '../authentication/AuthProvider';
import { Search, ShieldAlert, ArrowRight, Plus, Trash2, AlertTriangle, X } from 'lucide-react';

// ── Inline Delete Confirmation Modal ─────────────────────────
interface DeleteConfirmModalProps {
  caseId: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ caseId, onConfirm, onCancel, isDeleting }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onClick={onCancel}
  >
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '10px',
        padding: '28px 32px',
        width: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        position: 'relative',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close */}
      <button
        onClick={onCancel}
        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
      >
        <X size={18} />
      </button>

      {/* Icon + heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px',
          background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AlertTriangle size={20} color="#DC2626" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>
            Delete Case CASE-{caseId}?
          </div>
          <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
            This case will be removed from the active index. The clinical record and audit trail are preserved in the database and can be recovered by an administrator.
          </div>
        </div>
      </div>

      {/* Warning tag */}
      <div style={{
        background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px',
        padding: '10px 14px', fontSize: '12px', color: '#92400E', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <ShieldAlert size={14} />
        Clinical audit trail and all associated data are retained.
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={onCancel}
          disabled={isDeleting}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: '1px solid #E2E8F0',
            background: '#FFFFFF', color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          id={`confirm-delete-case-${caseId}`}
          onClick={onConfirm}
          disabled={isDeleting}
          style={{
            padding: '8px 18px', borderRadius: '6px', border: 'none',
            background: isDeleting ? '#FCA5A5' : '#DC2626',
            color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.15s',
          }}
        >
          <Trash2 size={14} />
          {isDeleting ? 'Deleting…' : 'Delete Case'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Case List View ───────────────────────────────────────
export const CaseListView: React.FC = () => {
  const { casesList, openCaseById, setActiveView, deleteCase } = useCase();
  const { can } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'review' | 'contradictory' | 'insufficient' | 'safety'>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredCases = casesList.filter((c) => {
    // Suppress soft-deleted or resolved cases
    if ((c.state as string) === 'RESOLVED') return false;

    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('nexus_deleted_cases') || '[]');
      if (deletedIds.includes(c.id)) return false;
    } catch {
      // ignore
    }

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

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteCase(pendingDeleteId);
    setIsDeleting(false);
    if (result.success) {
      setPendingDeleteId(null);
    } else {
      setDeleteError(result.error || 'Delete failed. Please try again.');
    }
  };

  return (
    <main
      aria-label="Clinical Cases Master List"
      style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: '#F8FAFC' }}
    >
      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <DeleteConfirmModal
          caseId={pendingDeleteId}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setPendingDeleteId(null); setDeleteError(null); }}
          isDeleting={isDeleting}
        />
      )}

      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{
              fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
              letterSpacing: '0.06em', color: '#64748B', marginBottom: '4px',
            }}>
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
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', backgroundColor: '#0284C7', color: '#FFFFFF',
                  borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Plus size={16} />
                <span>New Case</span>
              </button>
            )}
          </div>
        </div>

        {/* Delete error banner */}
        {deleteError && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
            padding: '10px 16px', marginBottom: '14px', fontSize: '13px',
            color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertTriangle size={14} />
            {deleteError}
            <button onClick={() => setDeleteError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px',
          padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              aria-label="Search patient, case or identifier"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, case # or clinical identifier... (Press /)"
              style={{
                width: '100%', padding: '7px 10px 7px 32px', borderRadius: '4px',
                border: '1px solid #CBD5E1', fontSize: '12px', outline: 'none',
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
                    padding: '6px 12px', borderRadius: '4px',
                    fontSize: '12px', fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.1s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinical Data Table */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
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
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>No active cases found</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {searchQuery ? 'No cases match your search criteria.' : 'All clinical cases have been resolved or closed.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openCaseById(c.id)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
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
                    <span style={{
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                      color: c.priority === 'urgent' || c.priority === 'high' ? '#B91C1C' : '#334155',
                      background: c.priority === 'urgent' || c.priority === 'high' ? '#FEF2F2' : '#F1F5F9',
                      padding: '2px 6px', borderRadius: '3px',
                    }}>
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
                  <td style={{ fontSize: '12px', color: '#475569', padding: '12px 16px' }}>
                    {c.assignedClinician}
                  </td>
                  <td style={{ fontSize: '12px', color: '#94A3B8', padding: '12px 16px' }}>
                    {c.lastUpdate}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        id={`open-case-${c.id}`}
                        onClick={(e) => { e.stopPropagation(); openCaseById(c.id); }}
                        className="btn btn-sm btn-primary"
                      >
                        Open <ArrowRight size={11} />
                      </button>
                      {can('case.create') && (
                        <button
                          id={`delete-case-${c.id}`}
                          title="Delete case"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(c.id);
                            setDeleteError(null);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '30px', height: '30px', borderRadius: '6px',
                            border: '1px solid #FCA5A5', background: '#FEF2F2',
                            color: '#DC2626', cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#DC2626';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FEF2F2';
                            e.currentTarget.style.color = '#DC2626';
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};
