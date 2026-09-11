// ============================================================
// src/lib/interoperability/connectors/ehr.ts
// Phase 6H: EHR Integration Connector (Simulated / Live FHIR R4)
// ============================================================

import type { FhirBundle, FhirPatient, FhirObservation, FhirCondition, FhirEncounter } from '../fhir/types';
import { FhirClient } from '../fhir/client';

export interface EhrConnectorConfig {
  sourceId: string;
  sourceName: string;
  baseUrl: string;
  authHeader?: string;
}

export class EhrConnector {
  private client: FhirClient;
  public readonly config: EhrConnectorConfig;

  constructor(config: EhrConnectorConfig) {
    this.config = config;
    this.client = new FhirClient({
      baseUrl: config.baseUrl,
      authHeader: config.authHeader,
      timeoutMs: 10000,
    });
  }

  /**
   * Fetches patient demographic resource.
   */
  async getPatient(fhirPatientId: string): Promise<FhirPatient> {
    return this.client.getResource<FhirPatient>('Patient', fhirPatientId);
  }

  /**
   * Searches for active patient conditions / diagnoses.
   */
  async getActiveConditions(fhirPatientId: string): Promise<FhirCondition[]> {
    const res = await this.client.search<FhirCondition>('Condition', {
      patient: fhirPatientId,
      'clinical-status': 'active',
    });
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirCondition).filter(Boolean);
  }

  /**
   * Searches for vital signs and general observations.
   */
  async getObservations(fhirPatientId: string, category?: string): Promise<FhirObservation[]> {
    const searchParams: Record<string, string> = {
      patient: fhirPatientId,
      _sort: '-date',
      _count: '50',
    };
    if (category) {
      searchParams.category = category;
    }

    const res = await this.client.search<FhirObservation>('Observation', searchParams);
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirObservation).filter(Boolean);
  }

  /**
   * Searches for encounters / admissions.
   */
  async getEncounters(fhirPatientId: string): Promise<FhirEncounter[]> {
    const res = await this.client.search<FhirEncounter>('Encounter', {
      patient: fhirPatientId,
      _sort: '-date',
    });
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirEncounter).filter(Boolean);
  }

  /**
   * Fetches the complete patient clinical summary bundle.
   */
  async getPatientSummaryBundle(fhirPatientId: string): Promise<FhirBundle> {
    return this.client.getPatientEverything(fhirPatientId);
  }
}
