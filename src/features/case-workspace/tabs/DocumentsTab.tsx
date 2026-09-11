// ============================================================
// src/features/case-workspace/tabs/DocumentsTab.tsx
// Phase 10: Advanced Interoperability & Clinical Documents Hub
// 5 Consoles: Documents & FHIR Export, SMART on FHIR Launch,
// CDA/C-CDA XML Importer, IHE XDS.b Document Registry, and WHO SMART Validator
// ============================================================

import React, { useState, useMemo } from 'react';
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
  Cpu,
  Layers,
  Search,
  Check,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Database,
  Globe,
  Lock,
  Download,
  Terminal,
} from 'lucide-react';
import { buildCaseFhirBundle } from '../../../lib/interoperability/sync/export';
import { toFhirDocumentReference } from '../../../lib/interoperability/mappers/document-reference';
import type { ClinicalDocument, DocumentStatus, DocumentClass } from '../../../domain/document';
import {
  DEMO_SMART_CONFIGS,
  initializeSmartLaunch,
  exchangeSmartToken,
} from '../../../lib/interoperability/advanced/smart-launcher';
import {
  SAMPLE_CCDA_XML,
  parseCdaXml,
  extractCdaFindings,
} from '../../../lib/interoperability/advanced/cda-parser';
import {
  SAMPLE_IHE_XDS_REGISTRY,
  queryIheXdsRegistry,
  retrieveIheDocument,
} from '../../../lib/interoperability/advanced/ihe-xds';
import {
  validateCaseAgainstWhoSmart,
} from '../../../lib/interoperability/advanced/who-smart-validator';
import {
  SmartLaunchContext,
  SmartTokenResponse,
  IheXdsDocumentEntry,
  WhoSmartComplianceReport,
} from '../../../domain/interoperability-advanced';

type InteropSubTab = 'DOCUMENTS' | 'SMART' | 'CDA' | 'IHE_XDS' | 'WHO_SMART';

export const DocumentsTab: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const [activeConsole, setActiveConsole] = useState<InteropSubTab>('DOCUMENTS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ------------------------------------------------------------
  // CONSOLE 1: CLINICAL DOCUMENTS & FHIR EXPORT
  // ------------------------------------------------------------
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  const handleExportFhirBundle = () => {
    setIsExporting(true);
    setTimeout(() => {
      const patientObj: any = {
        id: activeCase.overview.patient.id,
        syntheticIdentifier: activeCase.overview.patient.syntheticIdentifier,
        age: activeCase.overview.patient.age,
        gender: activeCase.overview.patient.gender,
        encounterNumber: activeCase.overview.patient.encounterNumber,
        encounterType: activeCase.overview.patient.encounterType,
      };

      const caseRecordObj: any = {
        id: activeCase.overview.id,
        title: `Clinical Case ${activeCase.overview.id}`,
        patientId: activeCase.overview.patient.id,
        status: activeCase.overview.state,
        priority: activeCase.overview.priority,
        assignedTo: activeCase.overview.assignedClinician,
        createdAt: activeCase.overview.lastUpdate,
        updatedAt: new Date().toISOString(),
      };

      const bundle = buildCaseFhirBundle({
        patient: patientObj,
        caseRecord: caseRecordObj,
        findings: activeCase.findings,
        investigations: activeCase.investigations,
      });
      setExportedJson(JSON.stringify(bundle, null, 2));
      setIsExporting(false);
      showToast('FHIR R4 Bundle synthesized successfully!');
    }, 600);
  };

  // ------------------------------------------------------------
  // CONSOLE 2: SMART ON FHIR LAUNCH CONSOLE
  // ------------------------------------------------------------
  const [selectedSmartVendorKey, setSelectedSmartVendorKey] = useState<string>('epic-sandbox');
  const selectedVendor = DEMO_SMART_CONFIGS[selectedSmartVendorKey] || DEMO_SMART_CONFIGS['epic-sandbox'];

  const [simulatedLaunchToken, setSimulatedLaunchToken] = useState<string>('xyz-ehr-launch-tok-9482');
  const [smartContext, setSmartContext] = useState<SmartLaunchContext>(() =>
    initializeSmartLaunch(selectedVendor.fhirBaseUrl, simulatedLaunchToken)
  );
  const [tokenResponse, setTokenResponse] = useState<SmartTokenResponse | null>(null);
  const [isHandshaking, setIsHandshaking] = useState(false);

  const handleInitSmartHandshake = () => {
    setIsHandshaking(true);
    const ctx = initializeSmartLaunch(selectedVendor.fhirBaseUrl, simulatedLaunchToken);
    setSmartContext(ctx);

    setTimeout(() => {
      const result = exchangeSmartToken(ctx, activeCase.overview.patient.id, 'enc-00482');
      setSmartContext(result.context);
      setTokenResponse(result.tokenResponse);
      setIsHandshaking(false);
      showToast(`SMART on FHIR token exchanged for ${selectedVendor.vendor}!`);
    }, 800);
  };

  // ------------------------------------------------------------
  // CONSOLE 3: CDA / C-CDA XML IMPORTER
  // ------------------------------------------------------------
  const [cdaXmlInput, setCdaXmlInput] = useState<string>(SAMPLE_CCDA_XML);
  const parsedCda = useMemo(() => parseCdaXml(cdaXmlInput), [cdaXmlInput]);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);

  const handleRunCdaExtraction = () => {
    const res = extractCdaFindings(parsedCda);
    setExtractedResult(res);
    showToast(`Successfully extracted ${res.extractedFindingsCount} clinical findings from C-CDA!`);
  };

  // ------------------------------------------------------------
  // CONSOLE 4: IHE XDS.b DOCUMENT REGISTRY
  // ------------------------------------------------------------
  const [xdsQueryStatus, setXdsQueryStatus] = useState<Array<'Approved' | 'Deprecated'>>(['Approved']);
  const xdsQueryResult = useMemo(
    () => queryIheXdsRegistry({ patientId: activeCase.overview.patient.id, status: xdsQueryStatus }),
    [activeCase.overview.patient.id, xdsQueryStatus]
  );
  const [selectedXdsDoc, setSelectedXdsDoc] = useState<IheXdsDocumentEntry | null>(SAMPLE_IHE_XDS_REGISTRY[0]);
  const [retrievedPayload, setRetrievedPayload] = useState<any | null>(null);

  const handleRetrieveIheDoc = (doc: IheXdsDocumentEntry) => {
    setSelectedXdsDoc(doc);
    const res = retrieveIheDocument(doc.uniqueId);
    setRetrievedPayload(res);
    showToast(`Retrieved ${doc.title} via ITI-43 Document Set`);
  };

  // ------------------------------------------------------------
  // CONSOLE 5: WHO SMART GUIDELINES BASE VALIDATOR
  // ------------------------------------------------------------
  const [whoReport, setWhoReport] = useState<WhoSmartComplianceReport>(() =>
    validateCaseAgainstWhoSmart(activeCase.overview.id, [
      { resourceType: 'Patient', id: activeCase.overview.patient.id, identifier: [{ value: 'P-10482' }] },
      { resourceType: 'Condition', id: 'c-1', code: { coding: [{ system: 'http://id.who.int/icd/release/11/mms', code: '1B40', display: 'Infective endocarditis' }] } },
      { resourceType: 'Observation', id: 'o-1', status: 'final', performer: [{ reference: 'Practitioner/dr-vance' }] },
      { resourceType: 'Encounter', id: 'e-1', class: { code: 'IMP', system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode' } },
    ])
  );
  const [isValidatingWho, setIsValidatingWho] = useState(false);

  const handleRunWhoAudit = () => {
    setIsValidatingWho(true);
    setTimeout(() => {
      const rep = validateCaseAgainstWhoSmart(activeCase.overview.id, [
        { resourceType: 'Patient', id: activeCase.overview.patient.id, identifier: [{ value: 'P-10482' }] },
        { resourceType: 'Condition', id: 'c-1', code: { coding: [{ system: 'http://id.who.int/icd/release/11/mms', code: '1B40', display: 'Infective endocarditis' }] } },
        { resourceType: 'Observation', id: 'o-1', status: 'final', performer: [{ reference: 'Practitioner/dr-vance' }] },
        { resourceType: 'Encounter', id: 'e-1', class: { code: 'IMP', system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode' } },
      ]);
      setWhoReport(rep);
      setIsValidatingWho(false);
      showToast('WHO SMART Guidelines audit completed: 92% Compliant!');
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast banner */}
      {toastMessage && (
        <div
          style={{
            padding: '10px 16px',
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

      {/* Main Interoperability Navigation Header */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  background: '#F0FDF4',
                  color: '#16A34A',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                }}
              >
                <Globe size={18} />
              </div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                Advanced Health Interoperability & Documents Hub
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0369A1',
                  background: '#F0F9FF',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #BAE6FD',
                }}
              >
                Phase 10 Enterprise
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', maxWidth: '780px' }}>
              Unified gateway connecting SMART on FHIR launch, legacy hospital C-CDA XML ingestion,
              cross-enterprise IHE XDS.b document registries, and WHO SMART Guidelines Base profile validation.
            </p>
          </div>

          <button
            onClick={handleExportFhirBundle}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} />
            {isExporting ? 'Generating Bundle...' : 'Export FHIR R4 Bundle'}
          </button>
        </div>

        {/* 5-Console Sub-Navigation Toolbar */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'DOCUMENTS' as const, label: '1. Documents & FHIR Export', icon: FileText, badge: `${documents.length} Docs` },
            { id: 'SMART' as const, label: '2. SMART on FHIR Launch', icon: ExternalLink, badge: smartContext.status === 'TOKEN_EXCHANGED' ? 'Connected' : 'Ready' },
            { id: 'CDA' as const, label: '3. CDA / C-CDA XML Importer', icon: Terminal, badge: 'CCD R2.1' },
            { id: 'IHE_XDS' as const, label: '4. IHE XDS.b Registry', icon: Database, badge: 'ITI-18 / 43' },
            { id: 'WHO_SMART' as const, label: '5. WHO SMART Validator', icon: ShieldCheck, badge: `${whoReport.compliancePercentage}% Pass` },
          ].map((tab) => {
            const isActive = activeConsole === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveConsole(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0284C7' : '#475569',
                  background: isActive ? '#F0F9FF' : '#FFFFFF',
                  border: isActive ? '1px solid #BAE6FD' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isActive ? '#BAE6FD' : '#F1F5F9',
                    color: isActive ? '#0369A1' : '#64748B',
                  }}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* CONSOLE 1: CLINICAL DOCUMENTS & FHIR EXPORT                   */}
      {/* ------------------------------------------------------------ */}
      {activeConsole === 'DOCUMENTS' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Documents Table */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Case Document Repository
              </h3>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Boundary-mapped to FHIR DocumentReference
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #0284C7' : '1px solid #E2E8F0',
                      background: isSelected ? '#F8FAFC' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={18} color={isSelected ? '#0284C7' : '#64748B'} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {doc.documentClass} · {Math.round((doc.fileSizeBytes || 0) / 1024)} KB · Uploaded by {doc.uploadedBy}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: doc.documentStatus === 'REVIEWED' ? '#DCFCE7' : '#FEF3C7',
                        color: doc.documentStatus === 'REVIEWED' ? '#15803D' : '#B45309',
                      }}
                    >
                      {doc.documentStatus}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Exported FHIR Bundle Viewer (if generated) */}
            {exportedJson && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                    FHIR R4 Export Bundle Payload (JSON)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportedJson);
                      showToast('FHIR Bundle copied to clipboard!');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={11} /> Copy JSON
                  </button>
                </div>
                <pre
                  style={{
                    background: '#0F172A',
                    color: '#38BDF8',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {exportedJson}
                </pre>
              </div>
            )}
          </div>

          {/* Document Preview Details Drawer */}
          {selectedDoc && (
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Document Metadata & Preview
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <div>
                  <strong>Document ID:</strong> {selectedDoc.id}
                </div>
                <div>
                  <strong>MIME Type:</strong> {selectedDoc.mimeType}
                </div>
                <div>
                  <strong>Storage Path:</strong> {selectedDoc.storagePath}
                </div>
                <div>
                  <strong>Organization:</strong> {selectedDoc.organizationId}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedDoc.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Simulated Content Preview
                </span>
                <div
                  style={{
                    marginTop: '6px',
                    background: '#F8FAFC',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    color: '#0F172A',
                    lineHeight: 1.4,
                  }}
                >
                  Patient Evelyn Mensah (42F) presenting with persistent bacteremia, low-grade pyrexia, and splinter hemorrhages following recent bicuspid dental procedure. Blood culture isolates Viridans group streptococci.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* CONSOLE 2: SMART ON FHIR LAUNCH CONSOLE                       */}
      {/* ------------------------------------------------------------ */}
      {activeConsole === 'SMART' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* EHR Vendor & Launch Parameters */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              EHR Launch Simulator
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748B' }}>
              Simulates incoming SMART on FHIR handshake triggered from an external EHR (Epic, Cerner, SMART sandbox).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Target EHR Platform
                </label>
                <select
                  value={selectedSmartVendorKey}
                  onChange={(e) => {
                    setSelectedSmartVendorKey(e.target.value);
                    const vendor = DEMO_SMART_CONFIGS[e.target.value];
                    setSmartContext(initializeSmartLaunch(vendor.fhirBaseUrl, simulatedLaunchToken));
                    setTokenResponse(null);
                  }}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', background: '#FFFFFF' }}
                >
                  <option value="epic-sandbox">Epic Interconnect EHR Sandbox</option>
                  <option value="cerner-sandbox">Oracle Cerner Millennium Sandbox</option>
                  <option value="smart-health-it">SMART Health IT Reference Host</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Simulated EHR Launch Token
                </label>
                <input
                  type="text"
                  value={simulatedLaunchToken}
                  onChange={(e) => setSimulatedLaunchToken(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <button
                onClick={handleInitSmartHandshake}
                disabled={isHandshaking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                <RefreshCw size={14} className={isHandshaking ? 'animate-spin' : ''} />
                {isHandshaking ? 'Handshaking...' : 'Trigger SMART EHR Launch'}
              </button>
            </div>
          </div>

          {/* Handshake & Token Context Results */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  SMART OAuth2 Session Context
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: smartContext.status === 'TOKEN_EXCHANGED' ? '#DCFCE7' : '#FEF3C7',
                    color: smartContext.status === 'TOKEN_EXCHANGED' ? '#15803D' : '#B45309',
                  }}
                >
                  {smartContext.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>FHIR BASE (iss)</div>
                <div style={{ fontSize: '11px', color: '#0F172A', fontFamily: 'var(--font-mono)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {smartContext.iss}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>PATIENT CONTEXT</div>
                <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: 700, marginTop: '2px' }}>
                  {smartContext.patientId || 'Unresolved'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>ENCOUNTER CONTEXT</div>
                <div style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700, marginTop: '2px' }}>
                  {smartContext.encounterId || 'Unresolved'}
                </div>
              </div>
            </div>

            {tokenResponse && (
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Decoded Access Token & Identity Payload
                </span>
                <pre
                  style={{
                    background: '#0F172A',
                    color: '#A7F3D0',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '6px',
                  }}
                >
                  {JSON.stringify(tokenResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* CONSOLE 3: CDA / C-CDA XML IMPORTER                           */}
      {/* ------------------------------------------------------------ */}
      {activeConsole === 'CDA' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* C-CDA Raw XML Editor/Viewer */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  HL7 C-CDA XML Source
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Referral document from Korle Bu Teaching Hospital
                </span>
              </div>
              <button
                onClick={() => setCdaXmlInput(SAMPLE_CCDA_XML)}
                style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer' }}
              >
                Reset XML
              </button>
            </div>

            <textarea
              value={cdaXmlInput}
              onChange={(e) => setCdaXmlInput(e.target.value)}
              rows={16}
              style={{
                width: '100%',
                flex: 1,
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                background: '#0F172A',
                color: '#E2E8F0',
                resize: 'none',
              }}
            />
          </div>

          {/* Parsed Structure & Extract Action */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Parsed Clinical Sections
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  {parsedCda.header.title}
                </span>
              </div>
              <button
                onClick={handleRunCdaExtraction}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Download size={13} /> Extract to Case
              </button>
            </div>

            {/* Sections Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parsedCda.sections.allergies && (
                <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '6px', border: '1px solid #FCA5A5' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>Allergies Section</span>
                  <div style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '2px' }}>
                    {parsedCda.sections.allergies.narrativeHtml}
                  </div>
                </div>
              )}

              {parsedCda.sections.problemList && (
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Active Problem List</span>
                  <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>
                    {parsedCda.sections.problemList.narrativeHtml}
                  </div>
                </div>
              )}

              {parsedCda.sections.vitalSigns && (
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Vitals at Referral</span>
                  <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>
                    {parsedCda.sections.vitalSigns.narrativeHtml}
                  </div>
                </div>
              )}

              {parsedCda.sections.medications && (
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Medications</span>
                  <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>
                    {parsedCda.sections.medications.narrativeHtml}
                  </div>
                </div>
              )}
            </div>

            {extractedResult && (
              <div style={{ background: '#F0FDF4', padding: '12px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                  Extraction Summary: {extractedResult.extractedFindingsCount} Findings Ingested
                </span>
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                  Problems mapped to case hypotheses; vitals recorded into clinical record.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* CONSOLE 4: IHE XDS.b DOCUMENT REGISTRY                        */}
      {/* ------------------------------------------------------------ */}
      {activeConsole === 'IHE_XDS' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Registry Document Entries */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  IHE XDS.b Registry Stored Query (ITI-18)
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Querying affinity domain for patient: {activeCase.overview.patient.id}
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#DCFCE7', color: '#15803D' }}>
                STATUS: {xdsQueryResult.registryStatus}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {xdsQueryResult.matchedDocuments.map((xdoc) => {
                const isSelected = selectedXdsDoc?.uniqueId === xdoc.uniqueId;
                return (
                  <div
                    key={xdoc.uniqueId}
                    onClick={() => handleRetrieveIheDoc(xdoc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #0284C7' : '1px solid #E2E8F0',
                      background: isSelected ? '#F0F9FF' : '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {xdoc.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {xdoc.authorPerson} · {xdoc.authorInstitution}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        UUID: {xdoc.entryUuid}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetrieveIheDoc(xdoc);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Retrieve (ITI-43)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Payload Viewer */}
          {selectedXdsDoc && (
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                Retrieved Document Payload
              </h3>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px' }}>
                MIME: <strong>{selectedXdsDoc.mimeType}</strong> · Size: {Math.round(selectedXdsDoc.sizeBytes / 1024)} KB
              </div>

              {retrievedPayload && (
                <pre
                  style={{
                    background: '#0F172A',
                    color: '#E2E8F0',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {retrievedPayload.documentPayload}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* CONSOLE 5: WHO SMART GUIDELINES BASE VALIDATOR                */}
      {/* ------------------------------------------------------------ */}
      {activeConsole === 'WHO_SMART' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Validation Header Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  WHO SMART Guidelines Base Profile Compliance Audit
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Audits case FHIR resources against World Health Organization SMART Guidelines Digital Adaptation Kit (DAK) R4 Implementation Guide.
                </p>
              </div>

              <button
                onClick={handleRunWhoAudit}
                disabled={isValidatingWho}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} className={isValidatingWho ? 'animate-spin' : ''} />
                {isValidatingWho ? 'Auditing...' : 'Re-run WHO Audit'}
              </button>
            </div>

            {/* Score Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                background: '#F8FAFC',
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Overall Compliance
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                  {whoReport.compliancePercentage}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Audit Status
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                  {whoReport.overallStatus}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Passed Checks
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {whoReport.passedChecks} / {whoReport.totalChecks}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  IG Version
                </div>
                <div style={{ fontSize: '11px', color: '#0284C7', fontWeight: 600, marginTop: '4px' }}>
                  {whoReport.whoSmartGuidelineVersion}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Issues & Findings */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              Conformance Findings & Checklist
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {whoReport.issues.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '6px',
                    background: issue.severity === 'INFO' ? '#F0FDF4' : '#FFFBEB',
                    border: issue.severity === 'INFO' ? '1px solid #BBF7D0' : '1px solid #FCD34D',
                  }}
                >
                  <CheckCircle2 size={16} color={issue.severity === 'INFO' ? '#16A34A' : '#D97706'} style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                        {issue.ruleCode}: {issue.resourceType}
                      </span>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#E2E8F0', color: '#475569' }}>
                        {issue.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                      {issue.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      <strong>Guidance:</strong> {issue.recommendedFix}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
