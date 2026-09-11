// ============================================================
// src/features/authentication/ProtectedRoute.tsx
// Section 6C.16: Protected Route Guard with Permission Enforcement
// Checks authentication session and optional required AppPermission.
// ============================================================

import React from 'react';
import { useAuth } from './AuthProvider';
import { AppPermission } from '../../domain/auth';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: AppPermission;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallback,
}) => {
  const { user, isDemoMode, can } = useAuth();

  // If unauthenticated in production mode (demo mode is always authenticated with demo profile)
  const isAuthenticated = Boolean(user || isDemoMode);

  if (!isAuthenticated) {
    return (
      fallback || (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#94a3b8',
          backgroundColor: '#0a0f18',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ShieldAlert size={36} style={{ color: '#ef4444', marginBottom: '12px' }} />
          <h2 style={{ color: '#f8fafc', margin: '0 0 8px 0' }}>Authentication Required</h2>
          <p style={{ margin: 0, fontSize: '14px' }}>Please sign in with your professional credentials to access this clinical resource.</p>
        </div>
      )
    );
  }

  // Permission check
  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: '#94a3b8',
        backgroundColor: '#111927',
        borderRadius: '8px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        margin: '24px',
      }}>
        <ShieldAlert size={32} style={{ color: '#f87171', marginBottom: '12px' }} />
        <h3 style={{ color: '#f8fafc', margin: '0 0 6px 0' }}>Access Denied: Missing Permission</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
          Your current role does not possess the required clinical authorization: <code style={{ color: '#38bdf8' }}>{requiredPermission}</code>
        </p>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          PostgreSQL Row Level Security (RLS) would independently block database queries for this resource.
        </span>
      </div>
    );
  }

  return <>{children}</>;
};
