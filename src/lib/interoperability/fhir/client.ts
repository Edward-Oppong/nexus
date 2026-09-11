// ============================================================
// src/lib/interoperability/fhir/client.ts
// Phase 6H: FHIR R4 REST Client
//
// A typed, error-handling FHIR REST client for communicating
// with external FHIR servers. This runs server-side only
// (inside Edge Functions) — never in the browser.
//
// Security: credentials are passed in at call time, not stored
// in this module. The caller (Edge Function) injects auth.
//
// Low-connectivity: all requests have timeout, error capture,
// and return structured results, not raw throws.
// ============================================================

import type {
  FhirBundle,
  FhirResource,
  FhirOperationOutcome,
  FhirBundleType,
} from './types';
import { parseOperationOutcome } from './validators';

// ----------------------------------------------------------
// Client configuration
// ----------------------------------------------------------

export interface FhirClientConfig {
  baseUrl: string;           // FHIR server base URL (no trailing slash)
  authToken?: string;        // Bearer token for the request
  authHeader?: string;       // Direct Authorization header value
  apiKey?: string;           // API key header (if applicable)
  timeoutMs?: number;        // Default: 30000ms
  defaultHeaders?: Record<string, string>;
}

// ----------------------------------------------------------
// Result types
// ----------------------------------------------------------

export type FhirClientResult<T> =
  | { success: true; data: T; statusCode: number }
  | { success: false; error: string; statusCode?: number; operationOutcome?: FhirOperationOutcome };

// ----------------------------------------------------------
// FHIR Client
// ----------------------------------------------------------

export class FhirClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(config: FhirClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this.headers = {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
      ...(config.authHeader
        ? { Authorization: config.authHeader }
        : config.authToken
        ? { Authorization: `Bearer ${config.authToken}` }
        : {}),
      ...(config.apiKey ? { 'X-Api-Key': config.apiKey } : {}),
      ...(config.defaultHeaders ?? {}),
    };
  }

  // ----------------------------------------------------------
  // Read a single resource by type and ID
  // GET {base}/{resourceType}/{id}
  // ----------------------------------------------------------
  async read<T extends FhirResource>(
    resourceType: string,
    id: string
  ): Promise<FhirClientResult<T>> {
    return this.request<T>('GET', `/${resourceType}/${id}`);
  }

  // ----------------------------------------------------------
  // Search for resources
  // GET {base}/{resourceType}?{params}
  // ----------------------------------------------------------
  async search<T extends FhirResource>(
    resourceType: string,
    params: Record<string, string>
  ): Promise<FhirClientResult<FhirBundle>> {
    const qs = new URLSearchParams(params).toString();
    return this.request<FhirBundle>('GET', `/${resourceType}?${qs}`);
  }

  // ----------------------------------------------------------
  // Create a resource (conditional create supported)
  // POST {base}/{resourceType}
  // ----------------------------------------------------------
  async create<T extends FhirResource>(
    resource: T,
    ifNoneExist?: string // FHIR conditional create query string
  ): Promise<FhirClientResult<T>> {
    const extraHeaders: Record<string, string> = {};
    if (ifNoneExist) {
      extraHeaders['If-None-Exist'] = ifNoneExist;
    }
    return this.request<T>('POST', `/${resource.resourceType}`, resource, extraHeaders);
  }

  // ----------------------------------------------------------
  // Update a resource (PUT = full replace)
  // PUT {base}/{resourceType}/{id}
  // ----------------------------------------------------------
  async update<T extends FhirResource>(
    resource: T & { id: string }
  ): Promise<FhirClientResult<T>> {
    return this.request<T>(
      'PUT',
      `/${resource.resourceType}/${resource.id}`,
      resource
    );
  }

  // ----------------------------------------------------------
  // Submit a FHIR Transaction or Batch Bundle
  // POST {base}/
  // ----------------------------------------------------------
  async submitBundle(bundle: FhirBundle): Promise<FhirClientResult<FhirBundle>> {
    return this.request<FhirBundle>('POST', '/', bundle);
  }

  // ----------------------------------------------------------
  // Build and submit a transaction bundle from a resource array
  // ----------------------------------------------------------
  async transact(
    resources: FhirResource[],
    type: FhirBundleType = 'transaction'
  ): Promise<FhirClientResult<FhirBundle>> {
    const bundle: FhirBundle = {
      resourceType: 'Bundle',
      type,
      entry: resources.map((r) => ({
        fullUrl: `urn:uuid:${r.id ?? crypto.randomUUID()}`,
        resource: r,
        request: {
          method: r.id ? 'PUT' : 'POST',
          url: r.id ? `${r.resourceType}/${r.id}` : r.resourceType,
        },
      })),
    };
    return this.submitBundle(bundle);
  }

  // ----------------------------------------------------------
  // Capabilities / metadata
  // GET {base}/metadata
  // ----------------------------------------------------------
  async capabilities(): Promise<FhirClientResult<unknown>> {
    return this.request<unknown>('GET', '/metadata');
  }

  // ----------------------------------------------------------
  // Convenience typed wrappers throwing on failure
  // ----------------------------------------------------------
  async getResource<T extends FhirResource>(resourceType: string, id: string): Promise<T> {
    const res = await this.read<T>(resourceType, id);
    if (!res.success) {
      throw new Error(res.error);
    }
    return res.data;
  }

  async createResource<T extends FhirResource>(_resourceType: string, resource: T): Promise<T> {
    const res = await this.create<T>(resource);
    if (!res.success) {
      throw new Error(res.error);
    }
    return res.data;
  }

  async getPatientEverything(patientId: string): Promise<FhirBundle> {
    const res = await this.request<FhirBundle>('GET', `/Patient/${patientId}/$everything`);
    if (!res.success) {
      throw new Error(res.error);
    }
    return res.data;
  }

  // ----------------------------------------------------------
  // Core HTTP request with timeout and error handling
  // ----------------------------------------------------------
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<FhirClientResult<T>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.headers, ...(extraHeaders ?? {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return {
          success: false,
          error: `Non-JSON response from FHIR server (HTTP ${response.status})`,
          statusCode: response.status,
        };
      }

      if (!response.ok) {
        // Try to parse as OperationOutcome
        const outcome = json as FhirOperationOutcome;
        if (outcome?.resourceType === 'OperationOutcome') {
          const messages = parseOperationOutcome(outcome);
          return {
            success: false,
            error: messages.join('; '),
            statusCode: response.status,
            operationOutcome: outcome,
          };
        }
        return {
          success: false,
          error: `FHIR server returned HTTP ${response.status}`,
          statusCode: response.status,
        };
      }

      return { success: true, data: json as T, statusCode: response.status };
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          error: `FHIR request timed out after ${this.timeoutMs}ms (${url})`,
        };
      }
      const message = err instanceof Error ? err.message : 'Unknown network error';
      return {
        success: false,
        error: `FHIR network error: ${message}`,
      };
    }
  }
}

// ----------------------------------------------------------
// Factory function
// ----------------------------------------------------------

export function createFhirClient(config: FhirClientConfig): FhirClient {
  return new FhirClient(config);
}
