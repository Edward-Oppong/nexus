// ============================================================
// src/lib/interoperability/advanced/smart-launcher.ts
// Phase 10: SMART on FHIR Launch Protocol Engine (v1.0.0 & v2.0.0)
// Supports EHR Context Launch (iss + launch token) and Standalone Launch
// ============================================================

import {
  SmartLaunchContext,
  SmartTokenResponse,
  SmartWellKnownConfig,
} from '../../../domain/interoperability-advanced';

export const DEMO_SMART_CONFIGS: Record<string, {
  name: string;
  vendor: string;
  fhirBaseUrl: string;
  wellKnown: SmartWellKnownConfig;
}> = {
  'epic-sandbox': {
    name: 'Epic Systems Interconnect Sandbox',
    vendor: 'Epic Systems',
    fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    wellKnown: {
      authorization_endpoint: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
      token_endpoint: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
      scopes_supported: [
        'openid',
        'profile',
        'fhirUser',
        'launch',
        'launch/patient',
        'patient/*.read',
        'user/*.read',
      ],
      response_types_supported: ['code'],
      capabilities: [
        'launch-ehr',
        'launch-standalone',
        'client-public',
        'client-confidential-symmetric',
        'context-ehr-patient',
        'context-ehr-encounter',
        'permission-patient',
        'permission-user',
      ],
    },
  },
  'cerner-sandbox': {
    name: 'Oracle Cerner Millennium Sandbox',
    vendor: 'Oracle Health / Cerner',
    fhirBaseUrl: 'https://fhir-ehr-code.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d',
    wellKnown: {
      authorization_endpoint: 'https://authorization.cerner.com/tenants/ec2458f2/protocols/oauth2/profiles/smart-v1/personas/provider/authorize',
      token_endpoint: 'https://authorization.cerner.com/tenants/ec2458f2/protocols/oauth2/profiles/smart-v1/token',
      token_endpoint_auth_methods_supported: ['client_secret_basic'],
      scopes_supported: ['launch', 'patient/*.read', 'user/*.read', 'openid', 'profile'],
      response_types_supported: ['code'],
      capabilities: ['launch-ehr', 'context-ehr-patient', 'permission-patient'],
    },
  },
  'smart-health-it': {
    name: 'SMART Health IT Reference Platform',
    vendor: 'Boston Children’s Hospital / SMART',
    fhirBaseUrl: 'https://launch.smarthealthit.org/v/r4/fhir',
    wellKnown: {
      authorization_endpoint: 'https://launch.smarthealthit.org/v/r4/auth/authorize',
      token_endpoint: 'https://launch.smarthealthit.org/v/r4/auth/token',
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'none'],
      scopes_supported: [
        'openid',
        'profile',
        'fhirUser',
        'launch',
        'launch/patient',
        'launch/encounter',
        'patient/*.read',
        'patient/*.write',
      ],
      response_types_supported: ['code'],
      capabilities: [
        'launch-ehr',
        'launch-standalone',
        'context-ehr-patient',
        'context-ehr-encounter',
        'permission-v2',
      ],
    },
  },
};

/**
 * Parses query parameters from an EHR Launch URL
 * Example: ?iss=https://fhir.epic.com/api/FHIR/R4&launch=xyz789
 */
export function parseSmartLaunchParams(searchParamsString: string): {
  iss?: string;
  launch?: string;
} {
  const params = new URLSearchParams(searchParamsString);
  return {
    iss: params.get('iss') || undefined,
    launch: params.get('launch') || undefined,
  };
}

/**
 * Initializes a SMART Launch Context for an incoming EHR handshake
 */
export function initializeSmartLaunch(
  iss: string,
  launchToken?: string,
  clientId = 'nexus-clinical-workstation'
): SmartLaunchContext {
  // Find matching vendor configuration or default to generic R4
  const vendorConfig = Object.values(DEMO_SMART_CONFIGS).find(
    (c) => c.fhirBaseUrl.toLowerCase() === iss.toLowerCase()
  ) || DEMO_SMART_CONFIGS['smart-health-it'];

  const state = 'state-' + Math.random().toString(36).substring(2, 10);
  const launchId = 'launch-' + Math.random().toString(36).substring(2, 9);

  return {
    launchId,
    iss,
    launchToken,
    clientId,
    scope: 'launch launch/patient launch/encounter patient/*.read user/*.read openid fhirUser',
    redirectUri: window.location.origin + '/smart/callback',
    state,
    fhirVersion: '4.0.1',
    wellKnownConfig: vendorConfig.wellKnown,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Simulates completion of the SMART OAuth2 token exchange
 * Returns clinical context with patient and encounter IDs
 */
export function exchangeSmartToken(
  context: SmartLaunchContext,
  patientId = 'syn-pat-00482',
  encounterId = 'enc-00482'
): {
  context: SmartLaunchContext;
  tokenResponse: SmartTokenResponse;
} {
  const updatedContext: SmartLaunchContext = {
    ...context,
    patientId,
    encounterId,
    userId: 'dr.vance.101',
    userRole: 'Attending Physician',
    status: 'TOKEN_EXCHANGED',
  };

  const tokenResponse: SmartTokenResponse = {
    access_token: 'smart-jwt-' + Math.random().toString(36).substring(2, 15) + '.' + Date.now(),
    token_type: 'Bearer',
    expires_in: 3600,
    scope: context.scope,
    patient: patientId,
    encounter: encounterId,
    need_patient_banner: false,
    id_token: 'id-token-jwt-user-dr-vance',
    fhirUser: `Practitioner/dr-vance-md`,
    issuedAt: new Date().toISOString(),
  };

  return { context: updatedContext, tokenResponse };
}
