import React, { useMemo } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Plus,
  Flame,
  Activity,
  FolderKanban,
  CheckSquare,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const {
    casesList,
    openCaseById,
    setActiveView,
    pendingReviewCount,
    reviewQueue,
    safetyConcerns,
    tasks,
    activeCase,
  } = useCase();
  const { currentPersona } = usePersona();

  const openSafetyConcerns = safetyConcerns.filter((s) => s.status !== 'RESOLVED');
  const openTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const highPriorityCases = casesList.filter((c) => c.priority === 'urgent' || c.priority === 'high');

  // Derive recent activities from existing cases and activeCase timeline
  const recentActivities = useMemo(() => {
    if (casesList.length === 0) return [];

    const events: Array<{ id: string; caseId: string; description: string; time: string }> = [];

    // Include timeline events from the active case if it's currently in casesList
    const isActiveInList = casesList.some((c) => c.id === activeCase?.overview?.id);
    if (isActiveInList && activeCase?.timeline) {
      activeCase.timeline.slice(0, 4).forEach((evt) => {
        events.push({
          id: evt.id,
          caseId: activeCase.overview.id,
          description: `${evt.title}${evt.actorName ? ` by ${evt.actorName}` : ''}.`,
          time: evt.time || 'Recent',
        });
      });
    }

    // Augment with case updates from casesList if timeline events are few
    if (events.length < 3) {
      casesList.forEach((c) => {
        if (!events.some((e) => e.caseId === c.id)) {
          events.push({
            id: `case-act-${c.id}`,
            caseId: c.id,
            description: `${c.patient.syntheticIdentifier} (${c.patient.encounterType}) under care of ${c.assignedClinician}.`,
            time: c.lastUpdate || 'Active',
          });
        }
      });
    }

    return events.slice(0, 5);
  }, [casesList, activeCase]);

  // Live date and contextual greeting
  const { liveDateLabel, greeting } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const label = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const greet =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return { liveDateLabel: label, greeting: greet };
  }, []);

  return (
    <main
      aria-label="Clinical Overview Workspace"
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: 'var(--bg-app)',
        transition: 'background-color 0.2s ease',
      }}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        {/* Editorial Greeting Header & Quick Action Hub */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  display: 'inline-block',
                }}
              />
              {liveDateLabel} · Clinical Operations
            </div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {greeting}, {currentPersona.name.split(',')[0]}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Real-time clinical roster, high-acuity triage board, and decision support alerts.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveView('cases')}
              className="btn btn-sm"
              style={{ padding: '8px 14px' }}
            >
              <FolderKanban size={14} /> Case Registry ({casesList.length})
            </button>
            <button
              onClick={() => setActiveView('case-intake')}
              className="btn btn-sm btn-primary"
              style={{ padding: '8px 16px' }}
            >
              <Plus size={14} /> New Case Intake
            </button>
          </div>
        </div>

        {/* Needs Attention Dashboard Grid */}
        <section aria-labelledby="needs-attention-heading" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2
              id="needs-attention-heading"
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Clinical Shift Triage
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prioritized by clinical acuity</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {/* Card 1: Review Queue */}
            <div
              onClick={() => setActiveView('review-queue')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--status-warning)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--status-warning)' }}>
                  {pendingReviewCount}
                </span>
                <FileCheck2 size={18} color="var(--status-warning)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Pending Reviews</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Unconfirmed AI findings</div>
            </div>

            {/* Card 2: High Acuity / Emergency */}
            <div
              onClick={() => setActiveView('cases')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--status-danger)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--status-danger)' }}>
                  {highPriorityCases.length}
                </span>
                <Flame size={18} color="var(--status-danger)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>High / Urgent Acuity</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Requires immediate review</div>
            </div>

            {/* Card 3: Safety concerns */}
            <div
              onClick={() => {
                if (casesList.length > 0) {
                  openCaseById(activeCase?.overview?.id || casesList[0].id, 'safety');
                } else {
                  setActiveView('cases');
                }
              }}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--status-danger)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--status-danger)' }}>
                  {openSafetyConcerns.length}
                </span>
                <ShieldAlert size={18} color="var(--status-danger)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Active Red Flags</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {openSafetyConcerns.length > 0 ? `${openSafetyConcerns.length} safety alerts active` : 'Zero active alerts'}
              </div>
            </div>

            {/* Card 4: Follow-ups due */}
            <div
              onClick={() => setActiveView('tasks')}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid var(--accent-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {openTasks.length}
                </span>
                <CheckSquare size={18} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Clinical Tasks</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {openTasks.length > 0 ? `${openTasks.length} pending orders` : 'All tasks cleared'}
              </div>
            </div>
          </div>
        </section>

        {/* Review Queue Preview */}
        <section aria-labelledby="review-queue-heading" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                id="review-queue-heading"
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  margin: 0,
                }}
              >
                Human-in-the-Loop Review Queue
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'var(--status-review-bg)',
                  color: 'var(--status-review-text)',
                  border: '1px solid var(--status-review-border)',
                  padding: '1px 8px',
                  borderRadius: '9999px',
                }}
              >
                {pendingReviewCount} items require verification
              </span>
            </div>

            <button
              onClick={() => setActiveView('review-queue')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Open Full Review Queue <ArrowRight size={13} />
            </button>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <table className="clinical-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Case</th>
                  <th>Review Proposal</th>
                  <th style={{ width: '150px' }}>Domain</th>
                  <th style={{ width: '110px' }}>Acuity</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <CheckCircle2 size={16} color="var(--status-success)" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      All algorithmic proposals and findings have been reviewed. The review queue is clear.
                    </td>
                  </tr>
                ) : (
                  reviewQueue.slice(0, 4).map((item) => (
                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setActiveView('review-queue')}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        CASE-{item.caseId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.description.slice(0, 85)}...</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {item.itemType.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                            background:
                              item.priority === 'URGENT'
                                ? 'var(--status-safety-bg)'
                                : item.priority === 'HIGH'
                                ? 'var(--status-review-bg)'
                                : 'var(--status-info-bg)',
                            color:
                              item.priority === 'URGENT'
                                ? 'var(--status-safety-text)'
                                : item.priority === 'HIGH'
                                ? 'var(--status-review-text)'
                                : 'var(--status-info-text)',
                            border: `1px solid ${
                              item.priority === 'URGENT'
                                ? 'var(--status-safety-border)'
                                : item.priority === 'HIGH'
                                ? 'var(--status-review-border)'
                                : 'var(--status-info-border)'
                            }`,
                          }}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveView('review-queue');
                          }}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          Review Now <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Active Cases Roster */}
        <section aria-labelledby="active-cases-heading" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2
              id="active-cases-heading"
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              My Clinical Case Roster
            </h2>
            <button
              onClick={() => setActiveView('cases')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View all cases <ArrowRight size={13} />
            </button>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Patient Identity</th>
                  <th>Priority</th>
                  <th>Clinical State</th>
                  <th>Assigned Attending</th>
                  <th>Last Update</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {casesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                      No active cases found. All cases have been resolved or closed.
                    </td>
                  </tr>
                ) : (
                  casesList.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openCaseById(c.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        #{c.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.patient.syntheticIdentifier}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {c.patient.age} y/o · {c.patient.gender} · {c.patient.encounterType}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: c.priority === 'urgent' || c.priority === 'high' ? 'var(--status-safety-text)' : 'var(--text-secondary)',
                            background: c.priority === 'urgent' || c.priority === 'high' ? 'var(--status-safety-bg)' : 'var(--bg-subtle)',
                            border: `1px solid ${c.priority === 'urgent' || c.priority === 'high' ? 'var(--status-safety-border)' : 'var(--border-subtle)'}`,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
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
                        ) : (
                          <span className="badge badge-neutral">{c.state}</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {c.assignedClinician}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {c.lastUpdate}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCaseById(c.id);
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          Open Workspace
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Clinical Activity Stream */}
        <section aria-labelledby="activity-stream-heading">
          <h2
            id="activity-stream-heading"
            style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '14px',
            }}
          >
            Recent Clinical Events
          </h2>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recent activity. Clinical events and updates will appear here when cases are active.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentActivities.map((act, index) => (
                  <React.Fragment key={act.id}>
                    {index > 0 && <div style={{ borderTop: '1px solid var(--border-subtle)' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Case #{act.caseId}:</strong>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{act.description}</span>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: '12px', fontSize: '11px' }}>
                        {act.time}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};
