// ============================================================
// src/features/cases/api/getCases.ts
// Domain-specific query for organizational cases (Section 12)
// Uses explicit columns rather than select('*')
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { Case } from '../../../domain/case';

// Synthetic fallback cases matching Section 21
export const SYNTHETIC_DEMO_CASES: Case[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    patientId: 'e0000001-0000-0000-0000-000000000001',
    encounterId: 'f0000001-0000-0000-0000-000000000001',
    caseNumber: 'CASE-10482',
    title: 'Acute respiratory deterioration in immunocompromised host with persistent fever',
    status: 'REVIEW_REQUIRED',
    priority: 'HIGH',
    openedAt: '2026-09-10T05:30:00Z',
    createdBy: 'd0000001-0000-0000-0000-000000000001',
    createdAt: '2026-09-10T05:30:00Z',
    updatedAt: '2026-09-10T09:15:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000010001',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    patientId: 'e0000001-0000-0000-0000-000000000001',
    encounterId: 'f0000001-0000-0000-0000-000000000001',
    caseNumber: 'CASE-10001',
    title: 'Fever and respiratory symptoms',
    status: 'ANALYZING',
    priority: 'HIGH',
    openedAt: '2026-09-10T07:15:00Z',
    createdBy: 'd0000001-0000-0000-0000-000000000001',
    createdAt: '2026-09-10T07:15:00Z',
    updatedAt: '2026-09-10T09:45:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000010002',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    patientId: 'e0000001-0000-0000-0000-000000000002',
    encounterId: 'f0000001-0000-0000-0000-000000000002',
    caseNumber: 'CASE-10002',
    title: 'Conflicting clinical findings with discordant biomarker kinetics',
    status: 'CONTRADICTORY',
    priority: 'HIGH',
    openedAt: '2026-09-09T22:00:00Z',
    createdBy: 'd0000001-0000-0000-0000-000000000001',
    createdAt: '2026-09-09T22:00:00Z',
    updatedAt: '2026-09-10T08:30:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000010003',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    patientId: 'e0000001-0000-0000-0000-000000000003',
    encounterId: 'f0000001-0000-0000-0000-000000000003',
    caseNumber: 'CASE-10003',
    title: 'Incomplete clinical presentation requiring baseline panels',
    status: 'INSUFFICIENT_DATA',
    priority: 'ROUTINE',
    openedAt: '2026-09-09T18:00:00Z',
    createdBy: 'd0000001-0000-0000-0000-000000000001',
    createdAt: '2026-09-09T18:00:00Z',
    updatedAt: '2026-09-10T06:00:00Z',
  },
];

export async function getCases(organizationId: string): Promise<Case[]> {
  if (!isSupabaseConfigured) {
    return SYNTHETIC_DEMO_CASES.filter((c) => c.organizationId === organizationId || true);
  }

  try {
    const { data, error } = await supabase
      .from('cases')
      .select('id, organization_id, patient_id, encounter_id, case_number, title, status, priority, opened_at, closed_at, created_by, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Database fetch failed, utilizing synthetic fallback:', error.message);
      return SYNTHETIC_DEMO_CASES;
    }

    if (!data || data.length === 0) {
      return SYNTHETIC_DEMO_CASES;
    }

    return data.map((row: any) => ({
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
    return SYNTHETIC_DEMO_CASES;
  }
}
