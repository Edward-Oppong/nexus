// ============================================================
// src/features/authentication/LogoutButton.tsx
// Sign out and session termination button
// ============================================================

import React from 'react';
import { useAuth } from './AuthProvider';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  compact?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ compact = false }) => {
  const { signOut } = useAuth();

  return (
    <button
      type="button"
      onClick={signOut}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '6px' : '6px 12px',
        borderRadius: '6px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        color: '#f87171',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      title="Sign out of Nexus Workstation"
    >
      <LogOut size={14} />
      {!compact && <span>Sign Out</span>}
    </button>
  );
};
