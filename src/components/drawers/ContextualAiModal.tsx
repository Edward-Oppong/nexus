import React from 'react';
import { useDrawer } from '../../app/providers/DrawerContext';
import {
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Tag,
  BookOpen,
} from 'lucide-react';

export const ContextualAiModal: React.FC = () => {
  const { contextualAiPrompt, closeContextualAi } = useDrawer();

  if (!contextualAiPrompt) return null;

  const { scope, safetyBoundary, groundedFindings, groundedEvidence } = contextualAiPrompt;

  return (
    <div className="modal-overlay" onClick={closeContextualAi}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '24px',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '10px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#0F172A',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              ⬡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {contextualAiPrompt.title}
                </h3>
                {safetyBoundary && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: safetyBoundary === 'OK' ? '#ECFDF5' : '#FEF2F2',
                      color: safetyBoundary === 'OK' ? '#059669' : '#DC2626',
                      border: `1px solid ${safetyBoundary === 'OK' ? '#A7F3D0' : '#FECACA'}`,
                    }}
                  >
                    Safety: {safetyBoundary}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                Nexus Contextual Inference (Scoped Clinical Decision Support)
              </div>
            </div>
          </div>
          <button
            onClick={closeContextualAi}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Query Display */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#1E293B',
          }}
        >
          <span style={{ color: '#64748B', fontSize: '11px', display: 'block', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>
            Contextual Inquiry
          </span>
          "{contextualAiPrompt.query}"
        </div>

        {/* Scope Boundary Box */}
        {scope && (
          <div
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                Reasoning Scope: {scope.purpose}
              </span>
              <span style={{ color: '#64748B' }}>Deterministic Guardrail</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#059669' }}>✓ Allowed: </span>
                <span style={{ color: '#475569' }}>{scope.allowedOutputs.join(', ')}</span>
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#DC2626' }}>✗ Prohibited: </span>
                <span style={{ color: '#475569' }}>{scope.prohibitedOutputs.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Response Body */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '16px',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#0F172A',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', marginBottom: '6px' }}>
            Inference Output (TestProvider · Non-Autonomous)
          </div>
          {contextualAiPrompt.response}
        </div>

        {/* Grounding Artifacts */}
        {((groundedFindings && groundedFindings.length > 0) || (groundedEvidence && groundedEvidence.length > 0)) && (
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '11px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Grounded References & Evidence:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {groundedFindings?.map((fId: string) => (
                <span
                  key={fId}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Tag size={10} /> Finding: {fId}
                </span>
              ))}
              {groundedEvidence?.map((eId: string) => (
                <span
                  key={eId}
                  style={{
                    background: '#E0F2FE',
                    border: '1px solid #BAE6FD',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: '#0369A1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <BookOpen size={10} /> {eId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Disclaimer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            background: '#F1F5F9',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#475569',
            marginBottom: '16px',
          }}
        >
          <AlertCircle size={15} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            WHO SMART / FDA CDS Compliance Notice: Nexus reasoning outputs represent deterministic and simulated algorithmic synthesis designed to assist clinical workflows. All recommendations must be independently reviewed and verified by a licensed clinician before any medical action is taken.
          </span>
        </div>

        {/* Dismiss Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={closeContextualAi}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
