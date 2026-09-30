// ============================================================
// src/features/cases/api/getCases.ts
// Domain-specific query for organizational cases (Section 12)
// Uses explicit columns rather than select('*')
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { Case } from '../../../domain/case';

// No synthetic demo cases — the app starts with an empty case list.
export const SYNTHETIC_DEMO_CASES: Case[] = [];

export async function getCases(organizationId: string): Promise<Case[]> {
  const deletedIds: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('nexus_deleted_cases') || '[]');
    } catch {
      return [];
    }
  })();

  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('cases')
      .select('id, organization_id, patient_id, encounter_id, case_number, title, status, priority, opened_at, closed_at, created_by, created_at, updated_at')
      .eq('organization_id', organizationId)
      .neq('status', 'RESOLVED')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Database fetch failed:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data || [])
      .filter((row: any) => !deletedIds.includes(row.id) && row.status !== 'RESOLVED')
      .map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        patientId: row.patient_id,
        encounterId: row.encounter_id,
        caseNumber: row.case_number,
        title: row.title,
        status: row.status,
        priority: row.priority,
        openedAt: row.opened_at,
        closedAt: row.closed_at,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
  } catch (err) {
    console.error('getCases error:', err);
    return [];
  }
}
