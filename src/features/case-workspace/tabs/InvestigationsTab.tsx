import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { usePersona } from '../../../app/providers/PersonaContext';
import { FlaskConical, Plus, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InvestigationOrder } from '../../../domain/investigation';

export const InvestigationsTab: React.FC = () => {
  const { activeCase, requestInvestigation } = useCase();
  const { currentPersona } = usePersona();
  const [selectedOrder, setSelectedOrder] = useState<InvestigationOrder>(activeCase.investigations[0]);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newPriority, setNewPriority] = useState<'Stat' | 'Urgent' | 'Routine'>('Urgent');
  const [newCategory, setNewCategory] = useState<'Laboratory' | 'Imaging' | 'Cardiovascular' | 'Microbiology'>('Laboratory');
  const [newIndication, setNewIndication] = useState('');

  const completed = activeCase.investigations.filter((i) => i.status === 'Result available');
  const inProgress = activeCase.investigations.filter((i) => i.status !== 'Result available');

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName) return;
    requestInvestigation(newTestName, newCategory, newPriority, newIndication);
    setShowOrderModal(false);
    setNewTestName('');
    setNewIndication('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
            Diagnostic Investigations & Laboratory Results
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            Diagnostic orders with integrated microbiological reporting and explicit reasoning impact tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentPersona.allowedActions.canRequestInvestigations && (
            <button onClick={() => setShowOrderModal(true)} className="btn btn-sm btn-primary">
              <Plus size={13} /> Order Investigation
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Orders List (Left) & Result Detail + Reasoning Impact (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '16px' }}>
        {/* Left Column: Orders by Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* In-Progress Orders */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px' }}>
              Pending & In-Progress ({inProgress.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inProgress.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      padding: '10px 12px',
                      background: isSelected ? '#F1F5F9' : '#F8FAFC',
                      border: `1px solid ${isSelected ? '#0F172A' : '#E2E8F0'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>{order.testName}</strong>
                      <span className="badge badge-review" style={{ fontSize: '10px' }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      Requested by {order.requestedBy} ({order.requestedAt})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Orders */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px' }}>
              Completed Results ({completed.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {completed.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      padding: '10px 12px',
                      background: isSelected ? '#F1F5F9' : '#FFFFFF',
                      border: `1px solid ${isSelected ? '#0F172A' : '#E2E8F0'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>{order.testName}</strong>
                      <span className="badge badge-verified" style={{ fontSize: '10px' }}>
                        Available
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      Verified by {order.result?.laboratoryPersonnel} at {order.result?.completedAt}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Result Inspection & Impact on Reasoning */}
        <div>
          {selectedOrder ? (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#64748B' }}>
                    ORDER ID: {selectedOrder.id} · {selectedOrder.category}
                  </span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    {selectedOrder.testName}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: selectedOrder.status === 'Result available' ? '#ECFDF5' : '#FFFBEB',
                    color: selectedOrder.status === 'Result available' ? '#065F46' : '#92400E',
                  }}
                >
                  {selectedOrder.status}
                </span>
              </div>

              {selectedOrder.result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Raw Lab Parameter Values */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>
                      Result Parameter
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                      {selectedOrder.result.value}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                      <span><strong>Reference Range:</strong> {selectedOrder.result.referenceRange}</span>
                      <span><strong>Status:</strong> {selectedOrder.result.status}</span>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
                      Laboratory Interpretation
                    </div>
                    <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                      {selectedOrder.result.interpretation}
                    </p>
                  </div>

                  {/* Impact on Nexus Reasoning (Section 23 - Crucial) */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderLeft: '4px solid #2563EB',
                      borderRadius: '4px',
                      padding: '14px',
                    }}
                  >
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1E40AF', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>
                      Impact on Nexus Reasoning
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedOrder.result.impactOnReasoning.map((imp, idx) => (
                        <div key={idx} style={{ fontSize: '12px', lineHeight: 1.4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            {imp.impact === 'Strengthened' ? (
                              <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <TrendingUp size={13} /> {imp.hypothesisTitle}: Strengthened
                              </span>
                            ) : imp.impact === 'Weakened' ? (
                              <span style={{ color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <TrendingDown size={13} /> {imp.hypothesisTitle}: Weakened
                              </span>
                            ) : (
                              <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Minus size={13} /> {imp.hypothesisTitle}: Unchanged
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px', paddingLeft: '16px' }}>
                            {imp.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '6px' }}>
                  <Clock size={28} color="#94A3B8" style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Investigation In Progress</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    Results will automatically appear here with automated reasoning impact analysis upon laboratory sign-off.
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* New Order Modal */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
              Request Diagnostic Investigation
            </h3>

            <form onSubmit={handleOrderSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Test / Procedure Name
                </label>
                <input
                  type="text"
                  required
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  placeholder="e.g. Transthoracic Echocardiogram (TTE), Serum Ferritin..."
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  >
                    <option value="Laboratory">Laboratory</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Imaging">Imaging</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                  >
                    <option value="Stat">Stat (Immediate)</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Clinical Indication
                </label>
                <textarea
                  rows={2}
                  required
                  value={newIndication}
                  onChange={(e) => setNewIndication(e.target.value)}
                  placeholder="Clinical reason for request..."
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowOrderModal(false)} className="btn">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
