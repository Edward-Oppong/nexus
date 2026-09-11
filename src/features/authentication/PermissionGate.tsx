// ============================================================
// src/features/authentication/PermissionGate.tsx
// Declarative Permission-Aware UI Wrapper (Section 6C.17)
// Hides or shows UI elements based on user permissions.
// UI check improves UX; database RLS provides security.
// ============================================================

import React from 'react';
import { AppPermission } from '../../domain/auth';
import { useAuth } from './AuthProvider';

interface PermissionGateProps {
  permission: AppPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { can } = useAuth();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
