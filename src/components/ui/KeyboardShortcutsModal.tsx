import React from 'react';
import { useDrawer } from '../../app/providers/DrawerContext';
import { X, Command } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, closeShortcuts } = useDrawer();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: '/', desc: 'Global case & clinical concept search' },
    { key: 'g then c', desc: 'Jump to Cases workspace' },
    { key: 'g then p', desc: 'Jump to Patients list' },
    { key: 'r', desc: 'Open Nexus Review workflow' },
    { key: 'Esc', desc: 'Close any active slide-over drawer or dialog' },
    { key: '?', desc: 'Open this keyboard reference' },
  ];

  return (
    <div className="modal-overlay" onClick={closeShortcuts}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '24px', maxWidth: '440px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Command size={18} color="#0F172A" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={closeShortcuts}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #F1F5F9',
                fontSize: '13px',
              }}
            >
              <span style={{ color: '#334155' }}>{s.desc}</span>
              <kbd
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0F172A',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={closeShortcuts} className="btn btn-primary">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
