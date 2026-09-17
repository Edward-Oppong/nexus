import React, { useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const UncertaintyMatrix: React.FC = () => {
  const [selectedState, setSelectedState] = useState<number>(0);

  const epistemicStates = [
    {
      status: 'SUPPORTED',
      badgeClass: 'nexus-badge--supported',
      title: 'Subacute Infective Endocarditis',
      color: '#059669',
      bg: '#ECFDF5',
      borderColor: '#A7F3D0',
      icon: <CheckCircle2 size={18} color="#059669" />,
      evidence: [
        'Persistent bacteremia: 3/3 blood culture sets positive for S. viridans',
        'Direct valvular involvement: TEE demonstrates 11mm oscillating mitral vegetation',
        'Predisposing risk: Congenital bicuspid valve architecture + documented fever ≥38.8°C',
      ],
      commentary:
        'Meets 2 Major Duke Criteria + 2 Minor Criteria. Nexus marks this as qualitatively supported by objective microbiological and echocardiographic evidence.',
    },
    {
      status: 'INSUFFICIENT DATA',
      badgeClass: 'nexus-badge--uncertain',
      title: 'Systemic Lupus Erythematosus (Libman-Sacks)',
      color: '#D97706',
      bg: '#FFFBEB',
      borderColor: '#FDE68A',
      icon: <HelpCircle size={18} color="#D97706" />,
      evidence: [
        'Presenting finding: Bilateral symmetrical MCP joint stiffness noted in history',
        'Critical diagnostic gap: Antinuclear antibody (ANA) titer not yet ordered',
        'Critical diagnostic gap: Serum complement (C3, C4) levels pending evaluation',
      ],
      commentary:
        'Non-bacterial thrombotic endocarditis remains plausible but unverified. Nexus flags missing rheumatologic serologies rather than assigning a speculative probability.',
    },
    {
      status: 'CONTRADICTED',
      badgeClass: 'nexus-badge--contradicted',
      title: 'Community-Acquired Pneumonia',
      color: '#DC2626',
      bg: '#FEF2F2',
      borderColor: '#FECACA',
      icon: <XCircle size={18} color="#DC2626" />,
      evidence: [
        'Imaging contradiction: Chest radiograph shows clear lung fields without infiltrate',
        'Physiological contradiction: Respiratory rate 16/min, oxygen saturation 98% on room air',
        'Absence of focal exam signs: Clear vesicular breath sounds bilaterally, no rales',
      ],
      commentary:
        'While fever and elevated inflammatory markers are present, direct chest radiography and clinical examination contradict pulmonary infection.',
    },
    {
      status: 'NEEDS REVIEW',
      badgeClass: 'nexus-badge--review',
      title: 'Acute Rheumatic Fever',
      color: '#2563EB',
      bg: '#EFF6FF',
      borderColor: '#BFDBFE',
      icon: <AlertCircle size={18} color="#2563EB" />,
      evidence: [
        'Partial alignment: Migratory polyarthralgia and carditis signs detected',
        'Critical diagnostic gap: Antistreptolysin O (ASO) titer result unverified',
        'Human adjudicator required: Attending physician must examine cutaneous findings',
      ],
      commentary:
        'Jones criteria evaluation requires named human verification. Nexus places this in the clinician review queue for direct bedside adjudication.',
    },
  ];

  const active = epistemicStates[selectedState];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* State Switcher Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {epistemicStates.map((item, idx) => {
          const isSelected = idx === selectedState;
          return (
            <button
              key={item.status}
              onClick={() => setSelectedState(idx)}
              style={{
                background: isSelected ? '#FFFFFF' : '#F8FAFC',
                border: `1.5px solid ${isSelected ? item.borderColor : '#E2E8F0'}`,
                borderTop: isSelected ? `4px solid ${item.color}` : '1.5px solid #E2E8F0',
                borderRadius: '8px',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                {item.icon}
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--nexus-font-mono)',
                    fontWeight: 700,
                    color: item.color,
                  }}
                >
                  {item.status}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                {item.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected State Detailed Analysis Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: `1.5px solid ${active.borderColor}`,
          borderRadius: '10px',
          padding: '24px 28px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--nexus-font-mono)',
                  fontWeight: 700,
                  color: active.color,
                  background: active.bg,
                  border: `1px solid ${active.borderColor}`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                EPISTEMIC EVALUATION · {active.status}
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'var(--nexus-font-mono)' }}>
                No Black-Box Probability Score
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
              {active.title}
            </h3>
          </div>
        </div>

        {/* Evidence Breakdown */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontFamily: 'var(--nexus-font-mono)', textTransform: 'uppercase', color: '#64748B' }}>
            Anchored Case Evidence & Gaps
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {active.evidence.map((line, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  color: '#1E293B',
                }}
              >
                <span style={{ marginTop: '2px', color: active.color }}>•</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Rationale */}
        <div
          style={{
            background: active.bg,
            border: `1px solid ${active.borderColor}`,
            borderRadius: '8px',
            padding: '14px 18px',
            fontSize: '13px',
            color: '#1E293B',
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: active.color }}>Reasoning Synthesis: </strong>
          {active.commentary}
        </div>
      </div>
    </div>
  );
};
