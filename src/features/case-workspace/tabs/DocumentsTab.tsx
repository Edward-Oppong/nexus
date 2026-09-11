// ============================================================
// src/features/case-workspace/tabs/DocumentsTab.tsx
// Phase 6H: Documents & Interoperability Tab
// Clinical Documents, Inbound/Outbound FHIR, and Connected Systems
// ============================================================

import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import {
  FileText,
  UploadCloud,
  Share2,
  CheckCircle2,
  Sparkles,
  Copy,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { buildCaseFhirBundle } from '../../../lib/interoperability/sync/export';
import { toFhirDocumentReference } from '../../../lib/interoperability/mappers/document-reference';
import type { ClinicalDocument, DocumentStatus, DocumentClass } from '../../../domain/document';

export const DocumentsTab: React.FC = () => {
  const { activeCase } = useCase();

  // Mock initial clinical documents
  const [documents, setDocuments] = useState<ClinicalDocument[]>([
    {
      id: 'doc-101',
      caseId: activeCase.overview.id,
      patientId: activeCase.overview.patient.id,
      organizationId: 'org-kbth-001',
      title: 'Initial Emergency Assessment Note',
      documentClass: 'CONSULTATION_NOTE',
      documentStatus: 'REVIEWED',
      mimeType: 'application/pdf',
      fileSizeBytes: 245760,
      storageBucket: 'clinical-documents',
      storagePath: 'clinical-documents/doc-101.pdf',
      uploadedBy: 'dr.mensah',
      receivedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
      id: 'doc-102',
      caseId: activeCase.overview.id,
      patientId: activeCase.overview.patient.id,
      organizationId: 'org-kbth-001',
      title: 'Portable Chest Radiograph Impression',
      documentClass: 'IMAGING_REPORT',
      documentStatus: 'REVIEWED',
      mimeType: 'text/plain',
      fileSizeBytes: 18400,
      storageBucket: 'clinical-documents',
      storagePath: 'clinical-documents/doc-102.txt',
      uploadedBy: 'rad.staff',
      receivedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    {
      id: 'doc-103',
      caseId: activeCase.overview.id,
      patientId: activeCase.overview.patient.id,
      organizationId: 'org-kbth-001',
      title: 'Transfer Referral Summary from District Clinic',
      documentClass: 'REFERRAL_LETTER',
      documentStatus: 'RECEIVED',
      mimeType: 'application/pdf',
      fileSizeBytes: 512000,
      storageBucket: 'clinical-documents',
      storagePath: 'clinical-documents/doc-103.pdf',
      uploadedBy: 'transfers.team',
      receivedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ]);

  const [selectedDoc, setSelectedDoc] = useState<ClinicalDocument | null>(documents[0]);
  const [activeModal, setActiveModal] = useState<'NONE' | 'FHIR_VIEWER' | 'EXPORT_BUNDLE'>('NONE');
  const [fhirJson, setFhirJson] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleProcessDocument = (doc: ClinicalDocument) => {
    setIsProcessing(true);
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                documentStatus: 'REVIEWED',
                extractedFindings: [
                  {
                    id: `ef-${Date.now()}`,
                    text: 'Bilateral basal crepitations on auscultation.',
                    category: 'Sign',
                    code: '284524004',
                    codeSystem: 'http://snomed.info/sct',
                    confidence: 0.94,
                    resolved: false,
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );

      setIsProcessing(false);
      showToast(`Document "${doc.title}" processed. Candidate clinical findings extracted with AI provenance.`);
    }, 1200);
  };

  const handleSimulateUpload = (docClass: DocumentClass, title: string) => {
    const newDoc: ClinicalDocument = {
      id: `doc-${Date.now().toString().slice(-5)}`,
      caseId: activeCase.overview.id,
      patientId: activeCase.overview.patient.id,
      organizationId: 'org-kbth-001',
      title,
      documentClass: docClass,
      documentStatus: 'RECEIVED',
      mimeType: 'application/pdf',
      fileSizeBytes: Math.floor(Math.random() * 400000) + 50000,
      storageBucket: 'clinical-documents',
      storagePath: `clinical-documents/upload-${Date.now()}.pdf`,
      uploadedBy: 'active.clinician',
      receivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    showToast(`Uploaded "${title}". Click "Run NLP Extraction" to process findings.`);
  };

  const handleViewFhirReference = (doc: ClinicalDocument) => {
    const fhirRef = toFhirDocumentReference(doc);
    setFhirJson(JSON.stringify(fhirRef, null, 2));
    setActiveModal('FHIR_VIEWER');
  };

  const handleExportFhirBundle = () => {
    setIsExporting(true);
    setTimeout(() => {
      const patientParts = activeCase.overview.patient.syntheticIdentifier.split(' ');
      const givenName = patientParts[0] || 'Synthetic';
      const familyName = patientParts.slice(1).join(' ') || 'Patient';

      const bundle = buildCaseFhirBundle({
        patient: {
          id: activeCase.overview.patient.id,
          organizationId: 'org-kbth-001',
          externalPatientId: activeCase.overview.patient.encounterNumber,
          givenName,
          familyName,
          dateOfBirth: '1984-05-12',
          sex: activeCase.overview.patient.gender === 'Female' ? 'FEMALE' : 'MALE',
          phone: '+233 24 000 1122',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        caseRecord: {
          id: activeCase.overview.id,
          patientId: activeCase.overview.patient.id,
          organizationId: 'org-kbth-001',
          caseNumber: activeCase.overview.id,
          title: activeCase.chiefComplaint || 'Clinical Case',
          status: 'ACTIVE',
          priority: 'URGENT',
          openedAt: new Date().toISOString(),
          createdBy: 'clinician-001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        findings: activeCase.findings,
        investigations: activeCase.investigations,
        documents,
      });

      setFhirJson(JSON.stringify(bundle, null, 2));
      setIsExporting(false);
      setActiveModal('EXPORT_BUNDLE');
    }, 600);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'ATTESTED':
      case 'REVIEWED':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#DCFCE7',
              color: '#15803D',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle2 size={12} /> {status}
          </span>
        );
      case 'RECEIVED':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#FEF3C7',
              color: '#B45309',
            }}
          >
            RECEIVED
          </span>
        );
      case 'PROCESSING':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#DBEAFE',
              color: '#1D4ED8',
            }}
          >
            EXTRACTING...
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#F1F5F9',
              color: '#475569',
            }}
          >
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast message banner */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: '#0F172A',
            color: '#F8FAFC',
            borderRadius: '6px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Interoperability Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF',
          padding: '18px 20px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Clinical Documents & Interoperability Hub
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            FHIR R4 boundary: Ingest external notes, extract candidate findings with provenance, and transmit case bundles.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportFhirBundle}
            disabled={isExporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            <Share2 size={14} />
            {isExporting ? 'Compiling Bundle...' : 'Export FHIR R4 Bundle'}
          </button>
        </div>
      </div>

      {/* Integration Sources Health Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {[
          { name: 'KBTH Epic EHR', type: 'EHR / HL7 FHIR R4', status: 'ONLINE', latency: '42ms' },
          { name: 'Central LIS Analyzer', type: 'Laboratory (LOINC)', status: 'ONLINE', latency: '88ms' },
          { name: 'Radiology PACS', type: 'Imaging / DICOM', status: 'ONLINE', latency: '124ms' },
          { name: 'Mindray ICU Gateway', type: 'Bedside Telemetry', status: 'LIVE', latency: '12ms' },
        ].map((conn, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{conn.name}</div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>{conn.type}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: '#DCFCE7',
                  color: '#15803D',
                }}
              >
                ● {conn.status}
              </span>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>{conn.latency}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column: Document Registry & Ingestion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Intake Panel */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <UploadCloud size={18} color="#2563EB" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Intake Document / External Record
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px' }}>
              Simulate uploading or receiving an authoritative clinical record to test the extraction pipeline.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() =>
                  handleSimulateUpload('DISCHARGE_SUMMARY', 'Prior Hospital Discharge Summary')
                }
                style={{
                  padding: '6px 12px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                + Discharge Summary
              </button>
              <button
                onClick={() => handleSimulateUpload('LAB_REPORT', 'External Laboratory Slip')}
                style={{
                  padding: '6px 12px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                + Lab Slip
              </button>
              <button
                onClick={() =>
                  handleSimulateUpload('OPERATIVE_NOTE', 'Brief Surgical / Procedure Note')
                }
                style={{
                  padding: '6px 12px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                + Operative Note
              </button>
            </div>
          </div>

          {/* Document List */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                Case Document Repository ({documents.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const sizeKb = doc.fileSizeBytes ? (doc.fileSizeBytes / 1024).toFixed(0) : '0';
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isSelected ? '#1D4ED8' : '#0F172A',
                        }}
                      >
                        {doc.title}
                      </span>
                      {getStatusBadge(doc.documentStatus)}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#64748B',
                      }}
                    >
                      <span>
                        {doc.documentClass} • {sizeKb} KB
                      </span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Document Inspector & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedDoc ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {selectedDoc.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    ID: {selectedDoc.id} • Class: {selectedDoc.documentClass}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleViewFhirReference(selectedDoc)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={12} /> View FHIR
                  </button>

                  {selectedDoc.documentStatus === 'RECEIVED' && (
                    <button
                      onClick={() => handleProcessDocument(selectedDoc)}
                      disabled={isProcessing}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Sparkles size={12} />
                      {isProcessing ? 'Processing...' : 'Run NLP Extraction'}
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata Details */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ color: '#64748B' }}>MIME Type:</span>{' '}
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedDoc.mimeType}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Storage Path:</span>{' '}
                  <span style={{ fontFamily: 'monospace', color: '#0F172A' }}>
                    {selectedDoc.storagePath}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Status:</span> {getStatusBadge(selectedDoc.documentStatus)}
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Recorded:</span>{' '}
                  <span style={{ color: '#0F172A' }}>
                    {new Date(selectedDoc.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Document Preview Snippet */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>
                  Document Text Extract / Narrative
                </h4>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    color: '#334155',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {selectedDoc.title}
                  {'\n'}--- AUTHORITATIVE INTAKE EXTRACT ---{'\n'}
                  Patient presented with acute dyspnea, fatigue, and lower extremity edema.
                  Auscultation noted bilateral basal crackles and a grade III systolic murmur at
                  apex.
                  Baseline lab profile: Hemoglobin 8.4 g/dL, Creatinine 1.4 mg/dL.
                  Recommendation: Urgent echocardiogram, serial blood cultures, and infectious
                  disease review.
                </div>
              </div>

              {/* Provenance and Integrity Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#166534',
                }}
              >
                <CheckCircle2 size={14} color="#16A34A" />
                <span>
                  Authoritative chain of custody verified. SHA-256 integrity hash recorded for regulatory audit.
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px dashed #CBD5E1',
                color: '#64748B',
                fontSize: '13px',
              }}
            >
              Select a document to inspect contents and view FHIR metadata.
            </div>
          )}
        </div>
      </div>

      {/* FHIR JSON Viewer Modal */}
      {activeModal !== 'NONE' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '840px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  {activeModal === 'FHIR_VIEWER'
                    ? 'FHIR R4 DocumentReference Representation'
                    : 'Compiled FHIR R4 Case Bundle'}
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Standard HL7 FHIR R4 JSON format
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(fhirJson);
                    showToast('Copied FHIR JSON to clipboard.');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={12} /> Copy
                </button>
                <button
                  onClick={() => setActiveModal('NONE')}
                  style={{
                    padding: '6px 12px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, background: '#0F172A' }}>
              <pre
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#38BDF8',
                  fontFamily: 'Consolas, monospace',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {fhirJson}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
