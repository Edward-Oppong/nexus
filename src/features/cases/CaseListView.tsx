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
    className="modal-overlay"
    onClick={onCancel}
  >
    <div
      className="modal-card"
      style={{
        padding: '28px 32px',
        maxWidth: '440px',
        position: 'relative',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={onCancel}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <X size={18} />
      </button>

      {/* Icon + heading */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
          background: 'var(--status-safety-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          color: 'var(--status-safety-text)',
        }}>
          <AlertTriangle size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Delete Case CASE-{caseId}?
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            This case will be removed from the active index. The clinical record and audit trail are preserved in the database and can be recovered by an administrator.
          </div>
        </div>
      </div>

      {/* Warning tag */}
      <div style={{
        background: 'var(--status-review-bg)',
        border: '1px solid var(--status-review-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px', fontSize: '12px', color: 'var(--status-review-text)', marginBottom: '20px',
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
          className="btn btn-sm"
        >
          Cancel
        </button>
        <button
          id={`confirm-delete-case-${caseId}`}
          onClick={onConfirm}
          disabled={isDeleting}
          className="btn btn-sm btn-danger"
          style={{
            background: isDeleting ? 'var(--status-safety-bg)' : 'var(--status-danger)',
            color: 'var(--bg-surface)',
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
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: 'var(--bg-app)',
        transition: 'background-color 0.2s ease',
      }}
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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{
              fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
              Clinical Master Index · Phase 6D Domain Core
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Cases
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredCases.length}</strong> active clinical cases
            </div>

            {can('case.create') && (
              <button
                type="button"
                onClick={() => setActiveView('case-intake')}
                className="btn btn-sm btn-primary"
                style={{ padding: '8px 16px' }}
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
            background: 'var(--status-safety-bg)',
            border: '1px solid var(--status-safety-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px', marginBottom: '16px', fontSize: '13px',
            color: 'var(--status-safety-text)', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertTriangle size={15} />
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-safety-text)' }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              aria-label="Search patient, case or identifier"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, case # or clinical identifier... (Press /)"
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
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
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: isActive ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                    color: isActive ? 'var(--bg-surface)' : 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
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
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Case #</th>
                <th>Patient Identity</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reasoning</th>
                <th>Signals & Alerts</th>
                <th>Assigned Attending</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No active cases found</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
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
                    style={{ cursor: 'pointer' }}
                  >
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    CASE-{c.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.patient.syntheticIdentifier}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {c.patient.age}y · {c.patient.gender} · {c.patient.encounterType}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                      color: c.priority === 'urgent' || c.priority === 'high' ? 'var(--status-safety-text)' : 'var(--text-secondary)',
                      background: c.priority === 'urgent' || c.priority === 'high' ? 'var(--status-safety-bg)' : 'var(--bg-subtle)',
                      border: `1px solid ${c.priority === 'urgent' || c.priority === 'high' ? 'var(--status-safety-border)' : 'var(--border-subtle)'}`,
                      padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                    }}>
                      {c.priority}
                    </span>
                  </td>
                  <td>
                    {c.state === 'REVIEW_REQUIRED' ? (
                      <span className="badge badge-review">Review Required</span>
                    ) : c.state === 'DECISION_RECORDED' ? (
                      <span className="badge badge-verified">Decision Recorded</span>
                    ) : c.state === 'SAFETY_REVIEW' ? (
                      <span className="badge badge-safety">Safety Review</span>
                    ) : c.state === 'CONTRADICTORY' ? (
                      <span className="badge badge-review">Contradictory</span>
                    ) : c.state === 'INSUFFICIENT_DATA' ? (
                      <span className="badge badge-neutral">Insufficient Data</span>
                    ) : c.state === 'ANALYZING' ? (
                      <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid var(--accent-subtle)' }}>Analyzing</span>
                    ) : (
                      <span className="badge badge-neutral">{c.state}</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {c.hypothesesCount} candidates
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.gapsCount > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--status-warning)', fontWeight: 600 }}>
                          {c.gapsCount} gap{c.gapsCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {c.safetyIssueCount > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--status-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <ShieldAlert size={12} /> {c.safetyIssueCount} safety
                        </span>
                      )}
                      {c.gapsCount === 0 && c.safetyIssueCount === 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Clear</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {c.assignedClinician}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {c.lastUpdate}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        id={`open-case-${c.id}`}
                        onClick={(e) => { e.stopPropagation(); openCaseById(c.id); }}
                        className="btn btn-sm btn-primary"
                      >
                        Open <ArrowRight size={11} />
                      </button>
                      {(can('case.create') || can('case.close') || can('case.edit')) && (
                        <button
                          id={`delete-case-${c.id}`}
                          title="Delete case"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteId(c.id);
                            setDeleteError(null);
                          }}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '4px 6px' }}
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
