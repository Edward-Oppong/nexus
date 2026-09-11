// ============================================================
// src/lib/interoperability/connectors/laboratory.ts
// Phase 6H: Laboratory Information System (LIS) Connector
// ============================================================

import type {
  FhirBundle,
  FhirDiagnosticReport,
  FhirObservation,
  FhirServiceRequest,
} from '../fhir/types';
import { FhirClient } from '../fhir/client';

export interface LaboratoryConnectorConfig {
  sourceId: string;
  sourceName: string;
  baseUrl: string;
  authHeader?: string;
}

export class LaboratoryConnector {
  private client: FhirClient;
  public readonly config: LaboratoryConnectorConfig;

  constructor(config: LaboratoryConnectorConfig) {
    this.config = config;
    this.client = new FhirClient({
      baseUrl: config.baseUrl,
      authHeader: config.authHeader,
      timeoutMs: 12000,
    });
  }

  /**
   * Retrieves diagnostic reports for a given patient.
   */
  async getDiagnosticReports(patientId: string): Promise<FhirDiagnosticReport[]> {
    const res = await this.client.search<FhirDiagnosticReport>('DiagnosticReport', {
      patient: patientId,
      _sort: '-date',
      _count: '25',
    });
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirDiagnosticReport).filter(Boolean);
  }

  /**
   * Retrieves specific lab panel observations (e.g., CBC, Chem-7, Trop-I).
   */
  async getLabResults(patientId: string): Promise<FhirObservation[]> {
    const res = await this.client.search<FhirObservation>('Observation', {
      patient: patientId,
      category: 'laboratory',
      _sort: '-date',
      _count: '100',
    });
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirObservation).filter(Boolean);
  }

  /**
   * Submits a lab test order (ServiceRequest) to the LIS.
   */
  async orderInvestigation(serviceRequest: FhirServiceRequest): Promise<FhirServiceRequest> {
    return this.client.createResource<FhirServiceRequest>('ServiceRequest', serviceRequest);
  }
}
