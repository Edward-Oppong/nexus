// ============================================================
// src/lib/interoperability/advanced/ihe-xds.ts
// Phase 10: IHE XDS.b / MHD Document Registry & Repository Engine
// Cross-Enterprise Document Sharing (ITI-18 Stored Query & ITI-43 Retrieval)
// ============================================================

import {
  IheXdsDocumentEntry,
  IheXdsQuery,
  IheXdsQueryResult,
} from '../../../domain/interoperability-advanced';

export const SAMPLE_IHE_XDS_REGISTRY: IheXdsDocumentEntry[] = [
  {
    entryUuid: 'urn:uuid:7d1b33e4-8521-4f47-8a19-4f36402d8471',
    uniqueId: '2.16.840.1.113883.19.5.99999.1.2026.0941',
    patientId: 'syn-pat-00482^^^&2.16.840.1.113883.19.5&ISO',
    title: 'Referral & Continuity of Care Document (C-CDA)',
    mimeType: 'text/xml',
    formatCode: {
      code: 'urn:hl7-org:sdwg:ccda-structuredBody:2.1',
      codingScheme: '1.3.6.1.4.1.19376.1.2.3',
      displayName: 'HL7 C-CDA Structured Body R2.1',
    },
    typeCode: {
      code: '34133-9',
      codingScheme: '2.16.840.1.113883.6.1',
      displayName: 'Summarization of Episode Note',
    },
    classCode: {
      code: 'DOC',
      codingScheme: '1.3.6.1.4.1.19376.1.2.7',
      displayName: 'Clinical Document',
    },
    confidentialityCode: 'N',
    creationTime: '20260910143000',
    repositoryUniqueId: '1.3.6.1.4.1.21367.2011.2.3.101',
    sizeBytes: 42104,
    hashSha1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    availabilityStatus: 'Approved',
    authorPerson: 'Dr. Kwame Asante, MD',
    authorInstitution: 'Korle Bu Teaching Hospital',
    sourcePatientId: 'syn-pat-00482',
  },
  {
    entryUuid: 'urn:uuid:9b2c88f1-3312-4e89-9a22-1b2c3d4e5f60',
    uniqueId: '2.16.840.1.113883.19.5.99999.1.2026.0942',
    patientId: 'syn-pat-00482^^^&2.16.840.1.113883.19.5&ISO',
    title: 'Transesophageal Echocardiogram (TEE) Official Report',
    mimeType: 'application/pdf',
    formatCode: {
      code: 'urn:ihe:iti:xds:2017:mimeTypeSufficient',
      codingScheme: '1.3.6.1.4.1.19376.1.2.3',
      displayName: 'PDF Document',
    },
    typeCode: {
      code: '11524-6',
      codingScheme: '2.16.840.1.113883.6.1',
      displayName: 'Echocardiogram study report',
    },
    classCode: {
      code: 'RAD',
      codingScheme: '1.3.6.1.4.1.19376.1.2.7',
      displayName: 'Radiology / Ultrasound',
    },
    confidentialityCode: 'R',
    creationTime: '20260911090000',
    repositoryUniqueId: '1.3.6.1.4.1.21367.2011.2.3.102',
    sizeBytes: 154200,
    hashSha1: '7c4a8d09ca3762af61e59520943dc26494f8941b',
    availabilityStatus: 'Approved',
    authorPerson: 'Dr. Sarah Lawson, MD (Cardiology)',
    authorInstitution: 'National Cardiothoracic Centre',
    sourcePatientId: 'syn-pat-00482',
  },
  {
    entryUuid: 'urn:uuid:4e5f6071-1122-3344-5566-778899aabbcc',
    uniqueId: '2.16.840.1.113883.19.5.99999.1.2026.0943',
    patientId: 'syn-pat-00482^^^&2.16.840.1.113883.19.5&ISO',
    title: 'Automated Blood Culture & Antibiotic Susceptibility Panel',
    mimeType: 'text/plain',
    formatCode: {
      code: 'urn:ihe:iti:xds:2017:mimeTypeSufficient',
      codingScheme: '1.3.6.1.4.1.19376.1.2.3',
      displayName: 'Plain Text Lab Report',
    },
    typeCode: {
      code: '11502-2',
      codingScheme: '2.16.840.1.113883.6.1',
      displayName: 'Laboratory report',
    },
    classCode: {
      code: 'LAB',
      codingScheme: '1.3.6.1.4.1.19376.1.2.7',
      displayName: 'Laboratory Results',
    },
    confidentialityCode: 'N',
    creationTime: '20260911111500',
    repositoryUniqueId: '1.3.6.1.4.1.21367.2011.2.3.103',
    sizeBytes: 8920,
    hashSha1: 'f1d2d2f924e986ac86fdf7b36c94bcdf32beec15',
    availabilityStatus: 'Approved',
    authorPerson: 'Central Microbiology Laboratory',
    authorInstitution: 'Ridge Regional Referral Hospital',
    sourcePatientId: 'syn-pat-00482',
  },
];

/**
 * Simulates IHE ITI-18: Registry Stored Query (FindDocuments)
 */
export function queryIheXdsRegistry(query: IheXdsQuery): IheXdsQueryResult {
  const queryId = 'query-' + Math.random().toString(36).substring(2, 9);

  const matched = SAMPLE_IHE_XDS_REGISTRY.filter((doc) => {
    if (query.status.length > 0 && !query.status.includes(doc.availabilityStatus)) {
      return false;
    }
    return true;
  });

  return {
    queryId,
    executedAt: new Date().toISOString(),
    matchedDocuments: matched,
    totalCount: matched.length,
    registryStatus: 'SUCCESS',
  };
}

/**
 * Simulates IHE ITI-43: Retrieve Document Set
 */
export function retrieveIheDocument(documentUniqueId: string): {
  success: boolean;
  mimeType: string;
  documentPayload: string;
  sizeBytes: number;
} {
  const entry = SAMPLE_IHE_XDS_REGISTRY.find((d) => d.uniqueId === documentUniqueId);
  if (!entry) {
    return {
      success: false,
      mimeType: 'text/plain',
      documentPayload: 'Error: Document not found in IHE XDS.b repository.',
      sizeBytes: 0,
    };
  }

  let payload = '';
  if (entry.mimeType === 'text/xml') {
    payload = `<?xml version="1.0" encoding="UTF-8"?>\n<ClinicalDocument xmlns="urn:hl7-org:v3">\n  <title>${entry.title}</title>\n  <id root="2.16.840.1.113883.19.5" extension="${entry.uniqueId}"/>\n  <author><name>${entry.authorPerson}</name></author>\n</ClinicalDocument>`;
  } else if (entry.mimeType === 'application/pdf') {
    payload = `[PDF Document Binary: ${entry.title} - Size: ${Math.round(entry.sizeBytes / 1024)} KB]`;
  } else {
    payload = `MICROBIOLOGY REPORT: Positive for Streptococcus viridans in 3 of 3 culture bottles. Susceptible to Penicillin MIC 0.06, Vancomycin MIC 0.5, Ceftriaxone MIC 0.25.`;
  }

  return {
    success: true,
    mimeType: entry.mimeType,
    documentPayload: payload,
    sizeBytes: entry.sizeBytes,
  };
}
