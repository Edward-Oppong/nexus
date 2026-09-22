import React from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import { AlertTriangle, Clock, FlaskConical, ShieldAlert, ArrowRight, CheckCircle2, FileCheck2 } from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { casesList, openCaseById, setActiveView, pendingReviewCount, reviewQueue } = useCase();
  const { currentPersona } = usePersona();

  return (
    <main
      aria-label="Clinical Overview Workspace"
      style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto',
        background: '#F8FAFC',
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Editorial Greeting Header */}
        <div style={{ marginBottom: '28px' }}>
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
            Tuesday, 09 September 2026 · Clinical Roster
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Good morning, {currentPersona.name.split(',')[0]}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            What requires your clinical attention right now?
          </p>
        </div>

        {/* Needs Attention Section (Section 5) */}
        <section aria-labelledby="needs-attention-heading" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 id="needs-attention-heading" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', color: '#475569' }}>
              Needs Attention
            </h2>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Prioritized by severity</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {/* Card 1: Review Queue */}
            <div
              onClick={() => setActiveView('review-queue')}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #D97706',
                borderRadius: '6px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#92400E' }}>
                  {pendingReviewCount}
                </span>
                <FileCheck2 size={16} color="#D97706" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Items requiring review</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Click to open Review Queue</div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => {
                openCaseById('10482');
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #2563EB',
                borderRadius: '6px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#1E40AF' }}>
                  2
                </span>
                <FlaskConical size={16} color="#2563EB" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Investigation results</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Blood cultures positive (S. viridans)</div>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => {
                openCaseById('10482');
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #DC2626',
                borderRadius: '6px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#991B1B' }}>
                  1
                </span>
                <ShieldAlert size={16} color="#DC2626" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Safety concern</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Severe penicillin allergy conflict</div>
            </div>

            {/* Card 4 */}
            <div
              onClick={() => setActiveView('tasks')}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #64748B',
                borderRadius: '6px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: '#334155' }}>
                  3
                </span>
                <Clock size={16} color="#64748B" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Follow-ups due</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Outpatient telemetry evaluations</div>
            </div>
          </div>
        </section>

        {/* Phase 6G: Review Queue Section (Section 2) */}
        <section aria-labelledby="review-queue-heading" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 id="review-queue-heading" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', color: '#475569', margin: 0 }}>
                Review Queue
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#FEF3C7',
                  color: '#92400E',
                  padding: '1px 8px',
                  borderRadius: '10px',
                }}
              >
                {pendingReviewCount} items require human attention
              </span>
            </div>

            <button
              onClick={() => setActiveView('review-queue')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: '#2563EB',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Open Full Review Queue <ArrowRight size={12} />
            </button>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <table className="clinical-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Case</th>
                  <th>Review Item</th>
                  <th style={{ width: '140px' }}>Type</th>
                  <th style={{ width: '100px' }}>Priority</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewQueue.slice(0, 4).map((item) => (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setActiveView('review-queue')}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>
                      CASE-{item.caseId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{item.description.slice(0, 80)}...</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        {item.itemType.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background:
                            item.priority === 'URGENT'
                              ? '#FEE2E2'
                              : item.priority === 'HIGH'
                              ? '#FEF3C7'
                              : '#EFF6FF',
                          color:
                            item.priority === 'URGENT'
                              ? '#991B1B'
                              : item.priority === 'HIGH'
                              ? '#92400E'
                              : '#1E40AF',
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
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Active Cases Table */}
        <section aria-labelledby="active-cases-heading" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 id="active-cases-heading" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', color: '#475569' }}>
              My Active Cases
            </h2>
            <button
              onClick={() => setActiveView('cases')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: '#2563EB',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View all cases <ArrowRight size={12} />
            </button>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Synthetic Patient</th>
                  <th>Priority</th>
                  <th>State</th>
                  <th>Assigned Team</th>
                  <th>Last Update</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {casesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0F172A' }}>
                      #{c.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.patient.syntheticIdentifier}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {c.patient.age} y/o · {c.patient.gender} · {c.patient.encounterType}
                      </div>
                    </td>
                    <td>
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
                    <td style={{ color: '#475569', fontSize: '12px' }}>
                      {c.assignedClinician}
                    </td>
                    <td style={{ color: '#64748B', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
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
                )))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Boring Clinical Activity Stream */}
        <section aria-labelledby="activity-stream-heading">
          <h2 id="activity-stream-heading" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em', color: '#475569', marginBottom: '12px' }}>
            Recent Activity
          </h2>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <strong style={{ color: '#0F172A' }}>Case #10482:</strong> Blood cultures reported positive for S. viridans by Marcus Rivera, MLS.
                </div>
                <span style={{ color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>09:44</span>
              </div>
              <div style={{ borderTop: '1px solid #F1F5F9' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <strong style={{ color: '#0F172A' }}>Case #10482:</strong> Vital signs acquisition verified by Sarah Chen, RN.
                </div>
                <span style={{ color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>09:42</span>
              </div>
              <div style={{ borderTop: '1px solid #F1F5F9' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <strong style={{ color: '#0F172A' }}>Case #10481:</strong> Renal panel requested by Dr. Edward Vance, MD.
                </div>
                <span style={{ color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>09:20</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
