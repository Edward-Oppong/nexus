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
  deletedByDisplayName: string
): Promise<DeleteCaseResult> {
  if (!isSupabaseConfigured) {
    // No-op in demo mode — caller handles removing from local state
    return { success: true, error: null };
  }

  try {
    // Soft-delete: mark status as RESOLVED + set closed_at.
    // 'DELETED' is not a valid case_status enum value in the DB schema.
    // RESOLVED is the terminal state — preserves the full audit trail.
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'RESOLVED',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    if (updateError) {
      console.error('[deleteCase] Failed to soft-delete case:', updateError.message);
      return { success: false, error: updateError.message };
    }

    // Append deletion event to audit trail
    await supabase.from('audit_events').insert({
      case_id: caseId,
      event_type: 'DELETED',
      action_type: 'CASE_DELETED',
      summary: 'Clinical case removed from active index',
      description: `Case ${caseId} deleted by ${deletedByDisplayName}. Record preserved in audit trail.`,
      user_display_name: deletedByDisplayName,
      recorded_at: new Date().toISOString(),
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[deleteCase] Exception:', msg);
    return { success: false, error: msg };
  }
}
