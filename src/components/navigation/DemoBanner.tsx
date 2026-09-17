import React from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { usePersona } from '../../app/providers/PersonaContext';
import { useDrawer } from '../../app/providers/DrawerContext';
import { huggingFaceClient } from '../../lib/intelligence/services/huggingface-api';
import { AlertCircle, Eye, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { activeView, setActiveView } = useCase();
  const { currentPersona } = usePersona();
  const { openHfTesting } = useDrawer();

  const isHfReady = huggingFaceClient.isConfigured();

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
          Signed in: <strong style={{ color: '#F8FAFC' }}>{currentPersona.name} ({currentPersona.roleDisplay})</strong>
        </span>

        {/* Hugging Face Model Test Bench Trigger */}
        <button
          onClick={openHfTesting}
          style={{
            background: isHfReady ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            color: isHfReady ? '#38BDF8' : '#CBD5E1',
            border: isHfReady ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
            padding: '2px 9px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Open Hugging Face Model Test Bench and Token Console"
        >
          <span>🤗</span>
          <span>HF Models {isHfReady ? '✓' : '(Setup)'}</span>
        </button>

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
