// ============================================================
// src/features/cases/api/transitionCase.ts
// Phase 6D: Atomic Case State Transition API (Section 5 & 6)
// Validates state transitions and updates via database transition_case() procedure.
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { CaseStatus } from '../../../domain/case';
import { validateCaseTransition } from '../../../lib/case-state-machine';

export interface TransitionCaseParams {
  caseId: string;
  currentStatus: CaseStatus;
  targetStatus: CaseStatus;
  rationale?: string;
  userId: string;
}

export async function transitionCase(
  params: TransitionCaseParams
): Promise<{ success: boolean; newStatus?: CaseStatus; error?: string }> {
  // 1. Client-side rule validation
  const validation = validateCaseTransition(params.currentStatus, params.targetStatus);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  if (!isSupabaseConfigured) {
    // Local simulation fallback
    return { success: true, newStatus: params.targetStatus };
  }

  try {
    // 2. Call PostgreSQL atomic stored procedure
    const { data, error } = await supabase.rpc('transition_case', {
      p_case_id: params.caseId,
      p_target_status: params.targetStatus,
      p_rationale: params.rationale || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, newStatus: data?.status || params.targetStatus };
  } catch (err: any) {
    return { success: false, error: err.message || 'State transition failed' };
  }
}
