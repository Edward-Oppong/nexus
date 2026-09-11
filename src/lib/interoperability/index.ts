// ============================================================
// src/lib/interoperability/index.ts
// Phase 6H: Nexus Interoperability Service Facade
// ============================================================

export * from './fhir/types';
export * from './fhir/version';
export * from './fhir/validators';
export * from './fhir/client';

export * from './mappers';
export * from './normalization';
export * from './connectors';
export * from './sync';

import {
  processInboundFhir,
  type ImportPipelineOptions,
  type ImportPipelineResult,
} from './sync/import';
import {
  buildCaseFhirBundle,
  type CaseExportData,
  type ExportBundleOptions,
} from './sync/export';
import { SyncQueue } from './sync/queue';
import { DegradedModeManager, withRetry } from './sync/retry';
import { EhrConnector, type EhrConnectorConfig } from './connectors/ehr';
import { LaboratoryConnector, type LaboratoryConnectorConfig } from './connectors/laboratory';
import { ImagingConnector, type ImagingConnectorConfig } from './connectors/imaging';
import { DeviceConnector, type DeviceConnectorConfig } from './connectors/device';
import type { FhirBundle, FhirResource } from './fhir/types';

export interface IInteroperabilityService {
  importBundle(payload: FhirResource | FhirBundle, options: ImportPipelineOptions): ImportPipelineResult;
  exportCase(data: CaseExportData, options?: ExportBundleOptions): FhirBundle;
  createEhrConnector(config: EhrConnectorConfig): EhrConnector;
  createLaboratoryConnector(config: LaboratoryConnectorConfig): LaboratoryConnector;
  createImagingConnector(config: ImagingConnectorConfig): ImagingConnector;
  createDeviceConnector(config: DeviceConnectorConfig): DeviceConnector;
  getSyncQueue(): SyncQueue;
  getDegradedManager(): DegradedModeManager;
}

class InteroperabilityServiceImpl implements IInteroperabilityService {
  private syncQueue = new SyncQueue();
  private degradedManager = new DegradedModeManager();

  importBundle(
    payload: FhirResource | FhirBundle,
    options: ImportPipelineOptions
  ): ImportPipelineResult {
    return processInboundFhir(payload, options);
  }

  exportCase(data: CaseExportData, options?: ExportBundleOptions): FhirBundle {
    return buildCaseFhirBundle(data, options);
  }

  createEhrConnector(config: EhrConnectorConfig): EhrConnector {
    return new EhrConnector(config);
  }

  createLaboratoryConnector(config: LaboratoryConnectorConfig): LaboratoryConnector {
    return new LaboratoryConnector(config);
  }

  createImagingConnector(config: ImagingConnectorConfig): ImagingConnector {
    return new ImagingConnector(config);
  }

  createDeviceConnector(config: DeviceConnectorConfig): DeviceConnector {
    return new DeviceConnector(config);
  }

  getSyncQueue(): SyncQueue {
    return this.syncQueue;
  }

  getDegradedManager(): DegradedModeManager {
    return this.degradedManager;
  }
}

export const interoperabilityService: IInteroperabilityService = new InteroperabilityServiceImpl();
