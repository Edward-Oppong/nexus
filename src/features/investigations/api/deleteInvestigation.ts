// ============================================================
// src/features/investigations/api/deleteInvestigation.ts
// Deletes a diagnostic investigation order from Supabase.
// Also removes any associated investigation_results via cascade.
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';

export interface DeleteInvestigationResult {
  success: boolean;
  error: string | null;
}

export async function deleteInvestigation(
  investigationId: string
): Promise<DeleteInvestigationResult> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(investigationId);
  if (!isUuid) {
    // Synthetic / mock order not in database
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('investigations')
      .delete()
      .eq('id', investigationId);

    if (error) {
      console.warn('[deleteInvestigation] Supabase delete warning:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error during investigation deletion';
    console.error('[deleteInvestigation] Exception:', msg);
    return { success: false, error: msg };
  }
}
