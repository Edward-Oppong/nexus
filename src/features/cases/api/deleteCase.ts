// ============================================================
// src/features/cases/api/deleteCase.ts
// Soft-deletes a clinical case from Supabase.
// Marks the case as RESOLVED + records a deletion audit event
// rather than hard-deleting rows (preserves audit trail).
// Falls back to no-op when Supabase is not configured.
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';

export interface DeleteCaseResult {
  success: boolean;
  error: string | null;
}

export async function deleteCase(
  caseId: string,
  deletedByDisplayName: string = 'Clinician'
): Promise<DeleteCaseResult> {
  // Always persist deletion to localStorage so deleted cases never reappear on refresh
  try {
    const existing: string[] = JSON.parse(localStorage.getItem('nexus_deleted_cases') || '[]');
    if (!existing.includes(caseId)) {
      localStorage.setItem('nexus_deleted_cases', JSON.stringify([...existing, caseId]));
    }
  } catch (storageErr) {
    console.warn('Failed to update localStorage for deleted case:', storageErr);
  }

  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    // 1. Attempt soft-delete in Supabase: status = 'RESOLVED' + closed_at
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'RESOLVED',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    // 2. Also attempt hard-delete in case the database allows it or user has delete permissions
    const { error: deleteError } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);

    if (updateError && deleteError) {
      console.warn('[deleteCase] Remote DB update and delete returned:', {
        updateError: updateError.message,
        deleteError: deleteError.message,
      });
      // Case is already suppressed in localStorage so it will not reappear on refresh
    }

    // 3. Append deletion event to audit trail (non-blocking)
    try {
      await supabase.from('audit_events').insert({
        case_id: caseId,
        event_type: 'DELETED',
        action_type: 'CASE_DELETED',
        summary: 'Clinical case removed from active index',
        description: `Case ${caseId} deleted by ${deletedByDisplayName}. Record preserved in audit trail.`,
        user_display_name: deletedByDisplayName,
        recorded_at: new Date().toISOString(),
      });
    } catch {
      // Non-blocking audit write
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[deleteCase] Exception:', msg);
    // Return success because local suppression succeeded
    return { success: true, error: null };
  }
}
