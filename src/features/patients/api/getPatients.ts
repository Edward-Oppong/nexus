// ============================================================
// src/features/patients/api/getPatients.ts
// Phase 6D: Patients Retrieval API with Demographic & Synthetic Demo Support
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { Patient } from '../../../domain/patient';

export const SYNTHETIC_DEMO_PATIENTS: Patient[] = [];

export async function getPatients(organizationId: string): Promise<Patient[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, organization_id, external_patient_id, given_name, family_name, date_of_birth, sex, phone, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('family_name', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      externalPatientId: row.external_patient_id,
      givenName: row.given_name,
      familyName: row.family_name,
      dateOfBirth: row.date_of_birth,
      sex: row.sex,
      phone: row.phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error('getPatients error:', err);
    return SYNTHETIC_DEMO_PATIENTS;
  }
}
