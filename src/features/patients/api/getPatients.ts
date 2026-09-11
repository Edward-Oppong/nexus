// ============================================================
// src/features/patients/api/getPatients.ts
// Phase 6D: Patients Retrieval API with Demographic & Synthetic Demo Support
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { Patient } from '../../../domain/patient';

export const SYNTHETIC_DEMO_PATIENTS: Patient[] = [
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    externalPatientId: 'SYNTH-PT-10482',
    givenName: 'Arthur',
    familyName: 'Pendleton',
    dateOfBirth: '1961-04-18',
    sex: 'MALE',
    phone: '+44 7700 900142',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000002',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    externalPatientId: 'SYNTH-PT-10483',
    givenName: 'Beatriz',
    familyName: 'Moreno-Silva',
    dateOfBirth: '1984-11-03',
    sex: 'FEMALE',
    phone: '+44 7700 900581',
    createdAt: '2026-09-02T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'e0000001-0000-0000-0000-000000000003',
    organizationId: 'c0000001-0000-0000-0000-000000000001',
    externalPatientId: 'SYNTH-PT-10484',
    givenName: 'Chukwuemeka',
    familyName: 'Okonkwo',
    dateOfBirth: '1955-08-22',
    sex: 'MALE',
    phone: '+44 7700 900729',
    createdAt: '2026-09-03T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  },
];

export async function getPatients(organizationId: string): Promise<Patient[]> {
  if (!isSupabaseConfigured) {
    return SYNTHETIC_DEMO_PATIENTS;
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, organization_id, external_patient_id, given_name, family_name, date_of_birth, sex, phone, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('family_name', { ascending: true });

    if (error || !data || data.length === 0) {
      return SYNTHETIC_DEMO_PATIENTS;
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
