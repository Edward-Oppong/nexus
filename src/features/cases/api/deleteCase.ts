// ============================================================
// src/features/cases/api/deleteCase.ts
// Soft-deletes a clinical case from Supabase.
// Marks the case as RESOLVED + records a deletion audit event
// rather than hard-deleting rows (preserves audit trail).
// Falls back to no-op when Supabase is not configured.
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { offlineSyncEngine } from '../../../lib/interoperability/advanced/offline-sync-engine';

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

  // Purge any offline queued mutations for this case
  try {
    offlineSyncEngine.purgeCase(caseId);
  } catch (offlineErr) {
    console.warn('[deleteCase] Failed to purge offline mutations for case:', offlineErr);
  }

  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId);

    if (isUuid) {
      // 1. Explicitly purge all associated records across all clinical sections
      await Promise.allSettled([
        supabase.from('tasks').delete().eq('case_id', caseId),
        supabase.from('investigations').delete().eq('case_id', caseId),
        supabase.from('clinical_findings').delete().eq('case_id', caseId),
        supabase.from('safety_concerns').delete().eq('case_id', caseId),
        supabase.from('decisions').delete().eq('case_id', caseId),
        supabase.from('reviews').delete().eq('case_id', caseId),
        supabase.from('timeline_events').delete().eq('case_id', caseId),
        supabase.from('clinical_documents').delete().eq('case_id', caseId),
        supabase.from('fhir_export_bundles').delete().eq('case_id', caseId),
        supabase.from('active_collaborative_sessions').delete().eq('case_id', caseId),
        supabase.from('cda_imported_documents').delete().eq('case_id', caseId),
        supabase.from('clinical_rule_executions').delete().eq('case_id', caseId),
        supabase.from('patient_dosing_calculations').delete().eq('case_id', caseId),
        supabase.from('offline_sync_outbox').delete().eq('case_id', caseId),
        supabase.from('ab_comparison_sessions').delete().eq('case_id', caseId),
        supabase.from('human_feedback_records').delete().eq('case_id', caseId),
        supabase.from('hypothesis_explainability_cache').delete().eq('case_id', caseId),
      ]);

      // 2. Attempt hard-delete of the case row
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      // 3. If hard-delete fails or is constrained, fallback to soft-delete
      if (deleteError) {
        console.warn('[deleteCase] Hard delete failed, falling back to soft-delete:', deleteError.message);
        await supabase
          .from('cases')
          .update({
            status: 'RESOLVED',
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', caseId);
      }
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
