import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
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
  const { tasks, completeTask, cancelTask, createTask, openCaseById } = useCase();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [isCreating, setIsCreating] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('ROUTINE');
  const [assignedToName, setAssignedToName] = useState('Dr. Edward Vance, MD');
  const [dueAt, setDueAt] = useState('Today, 17:00');

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      caseId: '10482',
      patientIdentifier: 'Synthetic Patient A (#00482)',
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueAt,
      assignedTo: 'dr-edward-vance',
      assignedToName,
      createdBy: 'dr-edward-vance',
      createdByName: 'Dr. Edward Vance, MD',
    });

    setTitle('');
    setDescription('');
    setIsCreating(false);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      case 'HIGH':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      default:
        return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' };
    }
  };

  return (
    <main
      aria-label="Clinical Tasks Workspace"
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: '#F8FAFC',
      }}
    >
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.06em' }}>
              Workflow Management
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginTop: '2px' }}>
              My Clinical Tasks & Follow-ups
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              Human-directed and Nexus-suggested clinical duties. Separated from passive alerts to prevent notification fatigue.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#0284C7',
              color: '#FFFFFF',
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
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Create Clinical Duty / Task
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                  Task Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedite TEE cardiology consult; Recheck Vancomycin peak/trough..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Priority:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  >
                    <option value="ROUTINE">Routine</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Assigned Clinician:
                  </label>
                  <input
                    type="text"
                    value={assignedToName}
                    onChange={(e) => setAssignedToName(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Due By:
                  </label>
                  <input
                    type="text"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Context & Clinical Description (Optional):
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', background: '#0284C7', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Priority:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="ROUTINE">Routine</option>
              </select>
            </div>
          </div>

          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.map((t) => {
            const pBadge = getPriorityBadge(t.priority);
            const isDone = t.status === 'COMPLETED';

            return (
              <div
                key={t.id}
                style={{
                  background: isDone ? '#FAFAFA' : '#FFFFFF',
                  border: `1px solid ${isDone ? '#CBD5E1' : '#E2E8F0'}`,
                  borderLeft: `4px solid ${isDone ? '#94A3B8' : pBadge.text}`,
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
                    <strong style={{ fontSize: '14px', color: isDone ? '#64748B' : '#0F172A', textDecoration: isDone ? 'line-through' : 'none' }}>
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
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#0F172A',
                          cursor: 'pointer',
                        }}
                      >
                        CASE-{t.caseId}
                      </button>
                    )}

                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Due: <strong>{t.dueAt || 'N/A'}</strong> · Assigned: {t.assignedToName || 'Unassigned'}
                    </span>
                  </div>

                  {t.description && (
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                      {t.description}
                    </div>
                  )}

                  {isDone && t.completedAt && (
                    <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
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
                        border: '1px solid #10B981',
                        background: '#10B981',
                        color: '#FFFFFF',
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
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#334155',
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
          })}
        </div>
      </div>
    </main>
  );
};
