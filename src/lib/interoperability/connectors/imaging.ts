// ============================================================
// src/lib/interoperability/connectors/imaging.ts
// Phase 6H: Radiology / Imaging (PACS / RIS) Connector
// ============================================================

import type { FhirDiagnosticReport, FhirDocumentReference } from '../fhir/types';
import { FhirClient } from '../fhir/client';

export interface ImagingConnectorConfig {
  sourceId: string;
  sourceName: string;
  baseUrl: string;
  authHeader?: string;
  pacsViewerBaseUrl?: string;
}

export class ImagingConnector {
  private client: FhirClient;
  public readonly config: ImagingConnectorConfig;

  constructor(config: ImagingConnectorConfig) {
    this.config = config;
    this.client = new FhirClient({
      baseUrl: config.baseUrl,
      authHeader: config.authHeader,
      timeoutMs: 15000,
    });
  }

  /**
   * Retrieves radiology and imaging reports (CXR, CT, MRI, Ultrasound).
   */
  async getImagingReports(patientId: string): Promise<FhirDiagnosticReport[]> {
    const res = await this.client.search<FhirDiagnosticReport>('DiagnosticReport', {
      patient: patientId,
      category: 'RAD',
      _sort: '-date',
      _count: '20',
    });
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirDiagnosticReport).filter(Boolean);
  }

  /**
   * Retrieves document references pointing to DICOM key images or PDF radiology impressions.
   */
  async getImagingDocuments(patientId: string): Promise<FhirDocumentReference[]> {
    const res = await this.client.search<FhirDocumentReference>('DocumentReference', {
      patient: patientId,
      type: 'imaging-report',
      _sort: '-date',
      _count: '20',
    });
    if (!res.success) return [];
    return (res.data.entry || []).map((e) => e.resource as FhirDocumentReference).filter(Boolean);
  }

  /**
   * Builds a web viewer launch URL for a study if PACS viewer URL is configured.
   */
  buildStudyViewerUrl(studyInstanceUid: string): string | undefined {
    if (!this.config.pacsViewerBaseUrl) return undefined;
    const base = this.config.pacsViewerBaseUrl.replace(/\/$/, '');
    return `${base}/viewer?studyUID=${encodeURIComponent(studyInstanceUid)}`;
  }
}
