// ============================================================
// src/features/cases/hooks/useCases.ts
// Phase 6D: Hook for querying, creating, and transitioning cases
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../authentication/AuthProvider';
import { Case, CaseStatus, CasePriority } from '../../../domain/case';
import { getCases } from '../api/getCases';
import { createCase, CreateCaseParams } from '../api/createCase';
import { transitionCase } from '../api/transitionCase';

export function useCases() {
  const { activeOrganization, profile } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = activeOrganization?.id || 'c0000001-0000-0000-0000-000000000001';

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCases(orgId);
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const addCase = useCallback(
    async (params: { patientId: string; encounterId?: string; title: string; priority: CasePriority }) => {
      const result = await createCase({
        ...params,
        organizationId: orgId,
        userId: profile?.id || 'demo-clinician',
      });

      if (result.caseData) {
        setCases((prev) => [result.caseData!, ...prev]);
      }
      return result;
    },
    [orgId, profile?.id]
  );

  const updateCaseStatus = useCallback(
    async (caseId: string, currentStatus: CaseStatus, targetStatus: CaseStatus, rationale?: string) => {
      const result = await transitionCase({
        caseId,
        currentStatus,
        targetStatus,
        rationale,
        userId: profile?.id || 'demo-clinician',
      });

      if (result.success) {
        setCases((prev) =>
          prev.map((c) => (c.id === caseId ? { ...c, status: targetStatus, updatedAt: new Date().toISOString() } : c))
        );
      }
      return result;
    },
    [profile?.id]
  );

  return {
    cases,
    loading,
    error,
    refetchCases: fetchCases,
    addCase,
    updateCaseStatus,
  };
}
