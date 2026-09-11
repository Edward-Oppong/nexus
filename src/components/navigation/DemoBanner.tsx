import React from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import { AlertCircle, Eye, ArrowRight, UserCheck } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { activeView, setActiveView } = useCase();
  const { currentPersona } = usePersona();

  return (
    <aside
      aria-label="Demo environment notice"
      style={{
        background: '#0F172A',
        color: '#F8FAFC',
        padding: '6px 16px',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        letterSpacing: '0.02em',
        borderBottom: '1px solid #1E293B',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            background: '#D97706',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '2px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          DEMO ENVIRONMENT
        </span>
        <span style={{ color: '#94A3B8' }}>
          Synthetic clinical data · AI reasoning outputs simulated for demonstration purposes only.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={12} color="#38BDF8" />
          Active Persona: <strong style={{ color: '#F8FAFC' }}>{currentPersona.roleDisplay}</strong>
        </span>

        {activeView === 'landing' ? (
          <button
            onClick={() => setActiveView('case-workspace')}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Open Clinical Workstation <ArrowRight size={11} />
          </button>
        ) : (
          <button
            onClick={() => setActiveView('landing')}
            style={{
              background: 'transparent',
              color: '#94A3B8',
              border: '1px solid #334155',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="View public editorial overview"
          >
            <Eye size={11} /> View Public Editorial
          </button>
        )}
      </div>
    </aside>
  );
};
