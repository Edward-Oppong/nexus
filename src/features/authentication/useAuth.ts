// ============================================================
// src/features/authentication/useAuth.ts
// Convenience hooks for Authentication and Permission-Aware UI
// ============================================================

import { useAuth } from './AuthProvider';
import { AppPermission } from '../../domain/auth';

export { useAuth };

/**
 * Single-line permission hook:
 * const canRecordDecision = useCan('decision.create');
 */
export function useCan(permission: AppPermission): boolean {
  const { can } = useAuth();
  return can(permission);
}
