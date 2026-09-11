// ============================================================
// src/features/patients/api/createPatient.ts
// Phase 6D: Patient Creation with Duplicate Prevention (Section 11)
// Checks for existing matches by (organizationId + externalPatientId)
// or (givenName + familyName + dateOfBirth).
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { Patient } from '../../../domain/patient';
import { SYNTHETIC_DEMO_PATIENTS } from './getPatients';

export interface CreatePatientParams {
  organizationId: string;
  externalPatientId?: string;
  givenName: string;
  familyName: string;
  dateOfBirth?: string;
  sex?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  phone?: string;
}

export interface CreatePatientResult {
  patient: Patient | null;
  possibleDuplicate?: Patient;
  error?: string;
}

export async function createPatient(params: CreatePatientParams): Promise<CreatePatientResult> {
  const cleanGiven = params.givenName.trim();
  const cleanFamily = params.familyName.trim();

  if (!cleanGiven || !cleanFamily) {
    return { patient: null, error: 'Patient given and family names are required.' };
  }

  // 1. In-memory check for demo environment
  if (!isSupabaseConfigured) {
    const existing = SYNTHETIC_DEMO_PATIENTS.find(
      (p) =>
        p.givenName.toLowerCase() === cleanGiven.toLowerCase() &&
        p.familyName.toLowerCase() === cleanFamily.toLowerCase() &&
        (!params.dateOfBirth || p.dateOfBirth === params.dateOfBirth)
    );

    if (existing) {
      return {
        patient: null,
        possibleDuplicate: existing,
        error: `Potential duplicate patient detected: ${existing.givenName} ${existing.familyName} (ID: ${existing.externalPatientId || existing.id}).`,
      };
    }

    const newPatient: Patient = {
      id: crypto.randomUUID(),
      organizationId: params.organizationId,
      externalPatientId: params.externalPatientId || `SYNTH-PT-${Math.floor(10000 + Math.random() * 90000)}`,
      givenName: cleanGiven,
      familyName: cleanFamily,
      dateOfBirth: params.dateOfBirth,
      sex: params.sex || 'UNKNOWN',
      phone: params.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    SYNTHETIC_DEMO_PATIENTS.push(newPatient);
    return { patient: newPatient };
  }

  try {
    // 2. Query duplicate check against Supabase
    const { data: duplicateMatches } = await supabase
      .from('patients')
      .select('id, organization_id, external_patient_id, given_name, family_name, date_of_birth, sex, phone, created_at, updated_at')
      .eq('organization_id', params.organizationId)
      .ilike('given_name', cleanGiven)
      .ilike('family_name', cleanFamily);

    if (duplicateMatches && duplicateMatches.length > 0) {
      const match = duplicateMatches[0];
      return {
        patient: null,
        possibleDuplicate: {
          id: match.id,
          organizationId: match.organization_id,
          externalPatientId: match.external_patient_id,
          givenName: match.given_name,
          familyName: match.family_name,
          dateOfBirth: match.date_of_birth,
          sex: match.sex,
          phone: match.phone,
          createdAt: match.created_at,
          updatedAt: match.updated_at,
        },
        error: `Potential duplicate detected: ${match.given_name} ${match.family_name} (ID: ${match.external_patient_id || match.id}).`,
      };
    }

    // 3. Insert record
    const { data: inserted, error: insertError } = await supabase
      .from('patients')
      .insert({
        organization_id: params.organizationId,
        external_patient_id: params.externalPatientId || `PT-${Math.floor(10000 + Math.random() * 90000)}`,
        given_name: cleanGiven,
        family_name: cleanFamily,
        date_of_birth: params.dateOfBirth || null,
        sex: params.sex || 'UNKNOWN',
        phone: params.phone || null,
      })
      .select()
      .single();

    if (insertError) {
      return { patient: null, error: insertError.message };
    }

    return {
      patient: {
        id: inserted.id,
        organizationId: inserted.organization_id,
        externalPatientId: inserted.external_patient_id,
        givenName: inserted.given_name,
        familyName: inserted.family_name,
        dateOfBirth: inserted.date_of_birth,
        sex: inserted.sex,
        phone: inserted.phone,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      },
    };
  } catch (err: any) {
    return { patient: null, error: err.message || 'Failed to create patient.' };
  }
}
