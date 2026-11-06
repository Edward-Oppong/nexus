import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { useAuth } from '../../features/authentication/AuthProvider';
import {
  CheckSquare,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
  XCircle,
  Filter,
} from 'lucide-react';
import { ClinicalTask, TaskPriority, TaskStatus } from '../../domain/workflow';

export const TasksView: React.FC = () => {
  const { tasks, completeTask, cancelTask, createTask, openCaseById, activeCase } = useCase();
  const { user, profile } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [isCreating, setIsCreating] = useState(false);

  // Active user display name — prefer profile over metadata
  const activeUserDisplayName =
    profile?.fullName ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : 'Attending Clinician');

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('ROUTINE');
  const [assignedToName, setAssignedToName] = useState(activeUserDisplayName);
  const [dueAt, setDueAt] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Use the live active case ID; fall back to first case in list if no workspace case is open
    const targetCaseId = activeCase?.overview?.id || (tasks.length > 0 ? tasks[0].caseId : 'global');
    const patientLabel = activeCase?.overview?.patient?.syntheticIdentifier
      ? `${activeCase.overview.patient.syntheticIdentifier} (${activeCase.overview.patient.encounterNumber})`
      : 'Clinical Patient';

    createTask({
      caseId: targetCaseId,
      patientIdentifier: patientLabel,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueAt: dueAt || undefined,
      assignedTo: user?.id || 'current-user',
      assignedToName: assignedToName || activeUserDisplayName,
      createdBy: user?.id || 'current-user',
      createdByName: activeUserDisplayName,
    });

    setTitle('');
    setDescription('');
    setIsCreating(false);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return { bg: 'var(--danger-subtle)', text: 'var(--status-danger)', border: 'var(--danger-border)' };
      case 'HIGH':
        return { bg: 'var(--warning-subtle)', text: 'var(--status-warning)', border: 'var(--warning-border)' };
      default:
        return { bg: 'var(--accent-subtle)', text: 'var(--accent-primary)', border: 'var(--border-medium)' };
    }
  };

  return (
    <main
      aria-label="Clinical Tasks Workspace"
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: 'var(--bg-subtle)',
      }}
    >
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              Workflow Management
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '2px' }}>
              My Clinical Tasks & Follow-ups
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Human-directed and Nexus-suggested clinical duties. Separated from passive alerts to prevent notification fatigue.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'var(--bg-surface)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> New Task
          </button>
        </div>

        {/* Creation Form Dialog */}
        {isCreating && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Create Clinical Duty / Task
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Task Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedite TEE cardiology consult; Recheck Vancomycin peak/trough..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Priority:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Assigned Clinician:
                  </label>
                  <input
                    type="text"
                    value={assignedToName}
                    onChange={(e) => setAssignedToName(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Due By:
                  </label>
                  <input
                    type="text"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Context & Clinical Description (Optional):
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', background: 'var(--accent-primary)', color: 'var(--bg-surface)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="ROUTINE">Routine</option>
              </select>
            </div>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.length === 0 ? (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <CheckSquare size={40} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                No Clinical Tasks
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                No outstanding clinical tasks or follow-ups matching this filter.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'var(--bg-surface)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={13} /> Create Task
              </button>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const pBadge = getPriorityBadge(t.priority);
              const isDone = t.status === 'COMPLETED';

              return (
                <div
                  key={t.id}
                  style={{
                    background: isDone ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${isDone ? 'var(--border-medium)' : 'var(--border-subtle)'}`,
                    borderLeft: `4px solid ${isDone ? 'var(--text-muted)' : pBadge.text}`,
                    borderRadius: '6px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {t.title}
                    </strong>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: pBadge.bg,
                        color: pBadge.text,
                        border: `1px solid ${pBadge.border}`,
                      }}
                    >
                      {t.priority}
                    </span>

                    {t.caseId && (
                      <button
                        onClick={() => openCaseById(t.caseId!)}
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        CASE-{t.caseId}
                      </button>
                    )}

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Due: <strong>{t.dueAt || 'N/A'}</strong> · Assigned: {t.assignedToName || 'Unassigned'}
                    </span>
                  </div>

                  {t.description && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {t.description}
                    </div>
                  )}

                  {isDone && t.completedAt && (
                    <div style={{ fontSize: '11px', color: 'var(--status-success)', marginTop: '4px' }}>
                      ✓ Completed at {new Date(t.completedAt).toLocaleTimeString()} by {t.completedBy || 'Clinician'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {!isDone && (
                    <button
                      onClick={() => completeTask(t.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--status-success)',
                        background: 'var(--status-success)',
                        color: 'var(--bg-surface)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={12} /> Complete
                    </button>
                  )}

                  {t.caseId && (
                    <button
                      onClick={() => openCaseById(t.caseId!)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Open Case
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </main>
  );
};
