// ============================================================
// src/lib/interoperability/connectors/device.ts
// Phase 6H: Bedside Device & Telemetry Gateway Connector
// ============================================================

import type { FhirObservation } from '../fhir/types';
import { FhirClient } from '../fhir/client';

export interface DeviceConnectorConfig {
  sourceId: string;
  sourceName: string;
  baseUrl: string;
  deviceId?: string;
  deviceModel?: string;
}

export class DeviceConnector {
  private client: FhirClient;
  public readonly config: DeviceConnectorConfig;

  constructor(config: DeviceConnectorConfig) {
    this.config = config;
    this.client = new FhirClient({
      baseUrl: config.baseUrl,
      timeoutMs: 8000,
    });
  }

  /**
   * Retrieves high-frequency vital signs stream/batch from the monitor gateway.
   */
  async getLatestTelemetry(patientId: string): Promise<FhirObservation[]> {
    const res = await this.client.search<FhirObservation>('Observation', {
      patient: patientId,
      category: 'vital-signs',
      _sort: '-date',
      _count: '20',
    });
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirObservation).filter(Boolean);
  }
}
