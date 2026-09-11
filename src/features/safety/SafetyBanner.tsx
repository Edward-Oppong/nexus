import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { SafetyResolveModal } from './SafetyResolveModal';

export const SafetyBanner: React.FC = () => {
  const { safetyConcerns, activeCase, setActiveCaseSubTab, hasBlockingSafety } = useCase();
  const [modalConcernId, setModalConcernId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'ACKNOWLEDGE' | 'RESOLVE'>('ACKNOWLEDGE');

  const openConcerns = safetyConcerns.filter(
    (s) => s.caseId === activeCase.overview.id && s.status !== 'RESOLVED'
  );

  const criticalConcern = openConcerns.find((s) => s.severity === 'SAFETY_CRITICAL');
  const displayConcern = criticalConcern || openConcerns[0];

  if (!displayConcern) return null;

  const isCritical = displayConcern.severity === 'SAFETY_CRITICAL';

  return (
    <>
      <div
        role="alert"
        aria-live="assertive"
        style={{
          background: isCritical ? '#FEF2F2' : '#FFFBEB',
          border: `1px solid ${isCritical ? '#FCA5A5' : '#FCD34D'}`,
          borderLeft: `5px solid ${isCritical ? '#DC2626' : '#D97706'}`,
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Row 1: Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: isCritical ? '#FEE2E2' : '#FEF3C7',
                color: isCritical ? '#DC2626' : '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={17} />
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: isCritical ? '#991B1B' : '#92400E',
                whiteSpace: 'nowrap',
              }}
            >
              {isCritical ? 'SAFETY REVIEW REQUIRED — WORKFLOW INTERRUPT' : 'CLINICAL SAFETY ATTENTION'}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                background: isCritical ? '#DC2626' : '#D97706',
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {displayConcern.severity}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748B' }}>
            <span style={{ whiteSpace: 'nowrap' }}>
              Status: <strong style={{ color: isCritical ? '#991B1B' : '#0F172A' }}>{displayConcern.status}</strong>
            </span>
            <button
              onClick={() => setActiveCaseSubTab('safety')}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '0',
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              All Safety ({openConcerns.length}) →
            </button>
          </div>
        </div>

        {/* Row 2: Full-Width Clinical Description & Warning */}
        <div style={{ paddingLeft: '38px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 500,
              color: '#1E293B',
              lineHeight: 1.55,
            }}
          >
            {displayConcern.description}
          </p>

          {isCritical && (
            <div
              style={{
                fontSize: '12px',
                color: '#B91C1C',
                marginTop: '6px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>⚠️</span>
              <span>Clinical Decision Recording is blocked until this concern is acknowledged or resolved.</span>
            </div>
          )}
        </div>

        {/* Row 3: Action Buttons Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '10px',
            borderTop: `1px solid ${isCritical ? 'rgba(220, 38, 38, 0.15)' : 'rgba(217, 119, 6, 0.15)'}`,
            paddingLeft: '38px',
          }}
        >
          {displayConcern.status === 'OPEN' && (
            <button
              onClick={() => {
                setModalConcernId(displayConcern.id);
                setModalMode('ACKNOWLEDGE');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '5px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.12s ease',
              }}
            >
              Acknowledge
            </button>
          )}

          <button
            onClick={() => {
              setModalConcernId(displayConcern.id);
              setModalMode('RESOLVE');
            }}
            style={{
              padding: '7px 16px',
              borderRadius: '5px',
              border: 'none',
              background: isCritical ? '#DC2626' : '#0F172A',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: isCritical ? '0 1px 3px rgba(220, 38, 38, 0.3)' : 'none',
              transition: 'background 0.12s ease',
            }}
          >
            <CheckCircle2 size={14} />
            Resolve Concern
          </button>
        </div>
      </div>

      {modalConcernId && (
        <SafetyResolveModal
          concernId={modalConcernId}
          mode={modalMode}
          onClose={() => setModalConcernId(null)}
        />
      )}
    </>
  );
};
