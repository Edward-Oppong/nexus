// ============================================================
// src/lib/interoperability/mappers/document-reference.ts
// Phase 6H: ClinicalDocument ↔ FHIR R4 DocumentReference Mapper
//
// Architecture:
//   Supabase Storage (blob) ← storage_path
//   clinical_documents (metadata, lifecycle)
//   ↕
//   FHIR DocumentReference (integration boundary only)
// ============================================================

import type { FhirDocumentReference } from '../fhir/types';
import { LOINC_SYSTEM, NEXUS_DOCUMENT_ID_SYSTEM, LOINC_CODES } from '../fhir/version';
import type { ClinicalDocument, DocumentClass } from '../../../domain/document';

export function toFhirDocumentReference(
  doc: ClinicalDocument,
  storageBaseUrl: string = ''
): FhirDocumentReference {
  const loincType = mapClassToLoinc(doc.documentClass);

  return {
    resourceType: 'DocumentReference',
    id: doc.id,
    meta: { lastUpdated: doc.updatedAt },
    identifier: [
      { use: 'secondary', system: NEXUS_DOCUMENT_ID_SYSTEM, value: doc.id },
      ...(doc.externalDocumentId
        ? [{ use: 'official' as const, value: doc.externalDocumentId }]
        : []),
    ],
    status: mapStatusToFhir(doc.documentStatus),
    docStatus: mapDocStatusToFhir(doc.documentStatus),
    type: loincType
      ? {
          coding: [{ system: LOINC_SYSTEM, ...loincType }],
          text: doc.title,
        }
      : { text: doc.title },
    category: [{ text: doc.documentClass }],
    subject: doc.patientId ? { reference: `Patient/${doc.patientId}` } : undefined,
    date: doc.receivedAt,
    description: doc.description,
    content: [
      {
        attachment: {
          contentType: doc.mimeType ?? 'application/octet-stream',
          url: doc.storagePath ? `${storageBaseUrl}/${doc.storagePath}` : undefined,
          size: doc.fileSizeBytes ?? undefined,
          title: doc.fileName ?? doc.title,
          creation: doc.authoredAt ?? doc.receivedAt,
        },
      },
    ],
    context: {
      encounter: doc.caseId ? [{ reference: `Encounter/${doc.caseId}` }] : undefined,
      facilityType: doc.sourceFacility ? { text: doc.sourceFacility } : undefined,
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${doc.title}</p><p>Type: ${doc.documentClass}</p></div>`,
    },
  };
}

export function fromFhirDocumentReference(
  fhir: FhirDocumentReference,
  organizationId: string,
  uploadedBy: string
): Partial<ClinicalDocument> {
  const content = fhir.content?.[0];
  return {
    id: fhir.id,
    organizationId,
    fhirDocumentReferenceId: fhir.id,
    title: fhir.description ?? fhir.type?.text ?? 'External Document',
    documentClass: mapFhirTypeToClass(fhir.type?.coding?.[0]?.code),
    documentStatus: 'RECEIVED',
    fileName: content?.attachment?.title,
    mimeType: content?.attachment?.contentType,
    fileSizeBytes: content?.attachment?.size,
    storageBucket: 'clinical-documents',
    authoredAt: content?.attachment?.creation,
    receivedAt: fhir.date ?? new Date().toISOString(),
    uploadedBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mapStatusToFhir(status: ClinicalDocument['documentStatus']): FhirDocumentReference['status'] {
  if (status === 'SUPERSEDED') return 'superseded';
  if (status === 'REJECTED') return 'entered-in-error';
  return 'current';
}

function mapDocStatusToFhir(
  status: ClinicalDocument['documentStatus']
): FhirDocumentReference['docStatus'] {
  switch (status) {
    case 'ATTESTED':
      return 'final';
    case 'REVIEWED':
    case 'PROCESSING':
      return 'preliminary';
    case 'REJECTED':
      return 'entered-in-error';
    default:
      return 'preliminary';
  }
}

function mapClassToLoinc(docClass: DocumentClass): { code: string; display: string } | null {
  const map: Partial<Record<DocumentClass, { code: string; display: string }>> = {
    DISCHARGE_SUMMARY: { code: LOINC_CODES.DISCHARGE_SUMMARY, display: 'Discharge Summary' },
    CONSULTATION_NOTE: { code: LOINC_CODES.CONSULTATION_NOTE, display: 'Consultation Note' },
    REFERRAL_LETTER: { code: LOINC_CODES.REFERRAL_NOTE, display: 'Referral Note' },
    LAB_REPORT: { code: LOINC_CODES.LAB_REPORT, display: 'Laboratory Report' },
    IMAGING_REPORT: { code: LOINC_CODES.RADIOLOGY_REPORT, display: 'Radiology Report' },
  };
  return map[docClass] ?? null;
}

function mapFhirTypeToClass(loincCode?: string): DocumentClass {
  if (!loincCode) return 'OTHER';
  const reverse: Record<string, DocumentClass> = {
    [LOINC_CODES.DISCHARGE_SUMMARY]: 'DISCHARGE_SUMMARY',
    [LOINC_CODES.CONSULTATION_NOTE]: 'CONSULTATION_NOTE',
    [LOINC_CODES.REFERRAL_NOTE]: 'REFERRAL_LETTER',
    [LOINC_CODES.LAB_REPORT]: 'LAB_REPORT',
    [LOINC_CODES.RADIOLOGY_REPORT]: 'IMAGING_REPORT',
  };
  return reverse[loincCode] ?? 'EXTERNAL_RECORD';
}
