// ============================================================
// src/features/cases/components/DocumentReconstructionReview.tsx
// Document & Image Visual Reconstruction, Editable Data Table,
// and Clinician Reconfirmation Hub for Nexus Clinical Ingestion.
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  IntakeDocumentInput,
  ExtractedFindingCandidate,
  IntakeObservationInput,
  IntakeMedicationInput,
} from '../types/intake';
import { reExtractFindingsFromText } from '../../../lib/intelligence/services/pdf-extraction-service';
import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Table,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  Layers,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

interface DocumentReconstructionReviewProps {
  document: IntakeDocumentInput;
  onUpdateDocument: (updated: IntakeDocumentInput) => void;
  onApplyToCase: (appliedData: {
    observations: IntakeObservationInput[];
    medications: IntakeMedicationInput[];
    diagnosisNotes?: string;
  }) => void;
  onRemoveDocument: () => void;
}

export const DocumentReconstructionReview: React.FC<DocumentReconstructionReviewProps> = ({
  document: doc,
  onUpdateDocument,
  onApplyToCase,
  onRemoveDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'viewer' | 'table' | 'transcript'>('split');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(doc.pageCount || 1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isPdfRendering, setIsPdfRendering] = useState<boolean>(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);

  // Editable findings state
  const [findings, setFindings] = useState<ExtractedFindingCandidate[]>(doc.extractedFindings || []);
  // Editable transcript state
  const [transcriptText, setTranscriptText] = useState<string>(doc.rawText || '');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);

  // Sync internal findings if parent doc updates externally
  useEffect(() => {
    setFindings(doc.extractedFindings || []);
    setTranscriptText(doc.rawText || '');
  }, [doc.id]);

  // Render PDF page to canvas
  useEffect(() => {
    let isCancelled = false;

    if (doc.fileType === 'pdf' && doc.fileUrl && canvasRef.current) {
      const renderPdf = async () => {
        setIsPdfRendering(true);
        setPdfRenderError(null);

        try {
          const pdfjsLib = await import('pdfjs-dist');
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
          }

          let pdf = pdfDocRef.current;
          if (!pdf) {
            const loadingTask = pdfjsLib.getDocument({ url: doc.fileUrl });
            pdf = await loadingTask.promise;
            if (isCancelled) return;
            pdfDocRef.current = pdf;
            setTotalPages(pdf.numPages);
          }

          const page = await pdf.getPage(currentPage);
          if (isCancelled) return;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext('2d');
          if (!context) return;

          const viewport = page.getViewport({ scale: zoomScale });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
        } catch (err: any) {
          console.warn('[pdf-canvas] Canvas rendering failed:', err);
          if (!isCancelled) {
            setPdfRenderError('Interactive page preview loading or fallback active.');
          }
        } finally {
          if (!isCancelled) setIsPdfRendering(false);
        }
      };

      renderPdf();
    }

    return () => {
      isCancelled = true;
    };
  }, [doc.fileUrl, doc.fileType, currentPage, zoomScale]);

  // Update findings and propagate to parent document
  const handleUpdateFindings = (newFindings: ExtractedFindingCandidate[]) => {
    setFindings(newFindings);
    onUpdateDocument({
      ...doc,
      extractedFindings: newFindings,
    });
  };

  // Inline field editing
  const handleFieldChange = (index: number, key: keyof ExtractedFindingCandidate, val: any) => {
    const updated = [...findings];
    updated[index] = { ...updated[index], [key]: val };
    handleUpdateFindings(updated);
  };

  // Toggle acceptance
  const handleToggleAccept = (index: number) => {
    const updated = [...findings];
    updated[index] = { ...updated[index], isAccepted: !updated[index].isAccepted };
    handleUpdateFindings(updated);
  };

  // Toggle verification status
  const handleToggleVerification = (index: number) => {
    const updated = [...findings];
    const current = updated[index].verificationStatus;
    updated[index] = {
      ...updated[index],
      verificationStatus: current === 'VERIFIED' ? 'REVIEW_REQUIRED' : 'VERIFIED',
      provenanceType: current === 'VERIFIED' ? 'AI_EXTRACTED' : 'CLINICIAN_VERIFIED',
    };
    handleUpdateFindings(updated);
  };

  // Delete finding row
  const handleDeleteRow = (index: number) => {
    const updated = findings.filter((_, i) => i !== index);
    handleUpdateFindings(updated);
  };

  // Add new blank row for clinician input
  const handleAddRow = () => {
    const newFinding: ExtractedFindingCandidate = {
      id: `manual-${Date.now()}`,
      category: 'vital-signs',
      label: 'New Finding',
      value: '',
      unit: '',
      referenceRange: '',
      interpretation: 'NORMAL',
      sourceDocumentTitle: doc.title,
      sourcePage: currentPage,
      sourceSnippet: 'Clinician entered manual input',
      provenanceType: 'CLINICIAN_VERIFIED',
      verificationStatus: 'VERIFIED',
      isAccepted: true,
    };
    handleUpdateFindings([...findings, newFinding]);
  };

  // Re-extract findings from clinician-edited text
  const handleReExtractFromText = () => {
    const reExtracted = reExtractFindingsFromText(transcriptText, doc.title);
    handleUpdateFindings(reExtracted);
    onUpdateDocument({
      ...doc,
      rawText: transcriptText,
      extractedFindings: reExtracted,
    });
    setSyncStatusMessage(`Re-extracted ${reExtracted.length} candidate finding(s) from edited transcript.`);
    setTimeout(() => setSyncStatusMessage(null), 4000);
  };

  // Apply accepted findings into the main patient case
  const handleApplyToPatientCase = () => {
    const acceptedFindings = findings.filter((f) => f.isAccepted !== false);

    const observationsToApply: IntakeObservationInput[] = [];
    const medicationsToApply: IntakeMedicationInput[] = [];
    const diagnosisNotesList: string[] = [];

    acceptedFindings.forEach((finding) => {
      if (finding.category === 'vital-signs' || finding.category === 'laboratory' || finding.category === 'exam' || finding.category === 'imaging') {
        observationsToApply.push({
          id: `obs-doc-${Date.now()}-${observationsToApply.length}`,
          category: finding.category,
          code: finding.label.toLowerCase().replace(/\s+/g, '-'),
          display: finding.label,
          value: finding.value,
          unit: finding.unit,
          referenceRange: finding.referenceRange,
          interpretation: finding.interpretation || 'NORMAL',
          observedAt: new Date().toISOString(),
          source: `${doc.title} (Page ${finding.sourcePage})`,
          provenanceType: finding.verificationStatus === 'VERIFIED' ? 'CLINICIAN_VERIFIED' : 'AI_EXTRACTED',
          actorName: 'Clinician / Nexus NER',
          sourceDocumentId: doc.id,
          sourcePage: finding.sourcePage,
          sourceSnippet: finding.sourceSnippet,
          verificationStatus: finding.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'REVIEW_REQUIRED',
        });
      } else if (finding.category === 'medication') {
        medicationsToApply.push({
          id: `med-doc-${Date.now()}-${medicationsToApply.length}`,
          name: finding.label,
          dosage: finding.value || 'As directed',
          route: 'Oral',
          frequency: 'Daily',
          status: 'ACTIVE',
          source: `${doc.title} (Page ${finding.sourcePage})`,
          provenanceType: finding.verificationStatus === 'VERIFIED' ? 'CLINICIAN_VERIFIED' : 'AI_EXTRACTED',
        });
      } else if (finding.category === 'diagnosis') {
        diagnosisNotesList.push(`${finding.label}: ${finding.value}`);
      }
    });

    onApplyToCase({
      observations: observationsToApply,
      medications: medicationsToApply,
      diagnosisNotes: diagnosisNotesList.join('; '),
    });

    setSyncStatusMessage(
      `Applied ${observationsToApply.length} observation(s) & ${medicationsToApply.length} medication(s) to Case Intake!`
    );
    setTimeout(() => setSyncStatusMessage(null), 5000);
  };

  const verifiedCount = findings.filter((f) => f.verificationStatus === 'VERIFIED').length;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginTop: '16px',
      }}
    >
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: doc.fileType === 'image' ? '#EEF2FF' : '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: doc.fileType === 'image' ? '#4F46E5' : '#0F766E',
            }}
          >
            {doc.fileType === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                {doc.title}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: doc.fileType === 'image' ? '#E0E7FF' : '#CCFBF1',
                  color: doc.fileType === 'image' ? '#3730A3' : '#0F766E',
                  textTransform: 'uppercase',
                }}
              >
                {doc.fileType}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '12px', marginTop: '2px' }}>
              <span>Category: <strong>{doc.category}</strong></span>
              <span>•</span>
              <span>
                Verified: <strong>{verifiedCount}</strong> / {findings.length}
              </span>
              {doc.pageCount && doc.pageCount > 1 && (
                <>
                  <span>•</span>
                  <span>{doc.pageCount} Pages</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#E2E8F0',
              padding: '3px',
              borderRadius: '6px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setActiveTab('split')}
              style={{
                border: 'none',
                background: activeTab === 'split' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'split' ? '#0F172A' : '#64748B',
                fontWeight: activeTab === 'split' ? 600 : 500,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: activeTab === 'split' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Layers size={13} /> Split View
            </button>
            <button
              onClick={() => setActiveTab('viewer')}
              style={{
                border: 'none',
                background: activeTab === 'viewer' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'viewer' ? '#0F172A' : '#64748B',
                fontWeight: activeTab === 'viewer' ? 600 : 500,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: activeTab === 'viewer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Eye size={13} /> File Preview
            </button>
            <button
              onClick={() => setActiveTab('table')}
              style={{
                border: 'none',
                background: activeTab === 'table' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'table' ? '#0F172A' : '#64748B',
                fontWeight: activeTab === 'table' ? 600 : 500,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: activeTab === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Table size={13} /> Findings Table ({findings.length})
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              style={{
                border: 'none',
                background: activeTab === 'transcript' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'transcript' ? '#0F172A' : '#64748B',
                fontWeight: activeTab === 'transcript' ? 600 : 500,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: activeTab === 'transcript' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Edit3 size={13} /> Editable Transcript
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleApplyToPatientCase}
            style={{
              border: 'none',
              backgroundColor: '#0F766E',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(15,118,110,0.2)',
            }}
            title="Transfer verified vitals, labs, and medications directly into Case Intake"
          >
            <Sparkles size={14} /> Apply Confirmed Findings to Case
          </button>

          <button
            onClick={onRemoveDocument}
            style={{
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#94A3B8',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
            }}
            title="Remove document"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Sync Status Feedback Toast */}
      {syncStatusMessage && (
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#ECFDF5',
            borderBottom: '1px solid #A7F3D0',
            color: '#065F46',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={14} color="#059669" />
          {syncStatusMessage}
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            activeTab === 'split' ? '45% 55%' : '1fr',
          minHeight: '480px',
          maxHeight: '750px',
          overflow: 'hidden',
        }}
      >
        {/* ── Pane 1: File & Image Visual Reconstructor ───────────── */}
        {(activeTab === 'split' || activeTab === 'viewer') && (
          <div
            style={{
              borderRight: activeTab === 'split' ? '1px solid #E2E8F0' : 'none',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#F1F5F9',
              overflow: 'hidden',
            }}
          >
            {/* Visual Viewer Toolbar */}
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #CBD5E1',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {doc.fileType === 'image' ? 'Image Reconstructor' : 'PDF Document Viewer'}
                </span>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {doc.fileType === 'pdf' && totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage <= 1 ? 0.5 : 1,
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: '11px', color: '#475569', minWidth: '60px', textAlign: 'center' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage >= totalPages ? 0.5 : 1,
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.2))}
                    style={{
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      cursor: 'pointer',
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span style={{ fontSize: '11px', minWidth: '38px', textAlign: 'center', color: '#475569' }}>
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.2))}
                    style={{
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      cursor: 'pointer',
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                </div>

                {doc.fileType === 'image' && (
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    style={{
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      cursor: 'pointer',
                    }}
                    title="Rotate 90 degrees"
                  >
                    <RotateCw size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Document Render Canvas / Image Display */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: '#475569',
              }}
            >
              {doc.fileType === 'image' ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                    transformOrigin: 'top center',
                  }}
                >
                  <img
                    src={doc.fileUrl}
                    alt={doc.title}
                    style={{
                      maxWidth: '100%',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  {isPdfRendering && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        gap: '8px',
                      }}
                    >
                      <RefreshCw size={24} color="#0F766E" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '12px', color: '#0F766E', fontWeight: 600 }}>
                        Reconstructing PDF Page {currentPage}…
                      </span>
                    </div>
                  )}

                  {/* Primary Canvas Rendering */}
                  <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />

                  {/* Fallback iframe/embed if canvas has an error */}
                  {pdfRenderError && (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <iframe
                        src={doc.fileUrl}
                        title="PDF Viewer Fallback"
                        style={{ width: '100%', height: '500px', border: 'none' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Pane 2: Interactive Editable Findings Table ─────────── */}
        {(activeTab === 'split' || activeTab === 'table') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            {/* Table Header & Controls */}
            <div
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Extracted Clinical Findings & Parameters
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  Edit parameters, values, reference ranges, and verify findings before AI ingestion.
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                  {[
                    { label: 'd4data/biomedical-ner-all', title: 'NER' },
                    { label: 'Falconsai/medical_summarization', title: 'Synthesis' },
                  ].map(({ label, title }) => (
                    <span key={label} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      fontSize: '9px', fontWeight: 600,
                      background: '#EFF6FF', color: '#1D4ED8',
                      padding: '1px 6px', borderRadius: '8px',
                      border: '1px solid #BFDBFE',
                    }}>
                      <Sparkles size={8} /> {title}: {label}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddRow}
                style={{
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#0F766E',
                  fontWeight: 600,
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={13} /> Add Parameter
              </button>
            </div>

            {/* Editable Data Table Grid */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
              {findings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                  <AlertCircle size={28} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>No clinical entities extracted yet</p>
                  <p style={{ margin: '4px 0 12px', fontSize: '11px' }}>
                    Click "+ Add Parameter" above or switch to the Editable Transcript tab to paste clinical notes.
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '6px 4px', width: '32px', textAlign: 'center' }}>Sync</th>
                      <th style={{ padding: '6px 8px', width: '110px' }}>Category</th>
                      <th style={{ padding: '6px 8px' }}>Finding / Parameter</th>
                      <th style={{ padding: '6px 8px', width: '110px' }}>Value</th>
                      <th style={{ padding: '6px 8px', width: '70px' }}>Unit</th>
                      <th style={{ padding: '6px 8px', width: '80px' }}>Status</th>
                      <th style={{ padding: '6px 4px', width: '70px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f, idx) => {
                      const isVerified = f.verificationStatus === 'VERIFIED';
                      return (
                        <tr
                          key={f.id || idx}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            backgroundColor: isVerified ? '#F0FDF4' : f.isAccepted === false ? '#F8FAFC' : '#FFFFFF',
                            opacity: f.isAccepted === false ? 0.6 : 1,
                          }}
                        >
                          {/* Sync Checkbox */}
                          <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={f.isAccepted !== false}
                              onChange={() => handleToggleAccept(idx)}
                              style={{ cursor: 'pointer' }}
                              title="Include in case sync"
                            />
                          </td>

                          {/* Category Selector */}
                          <td style={{ padding: '8px' }}>
                            <select
                              value={f.category}
                              onChange={(e) => handleFieldChange(idx, 'category', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                fontSize: '11px',
                                fontWeight: 600,
                                color:
                                  f.category === 'vital-signs'
                                    ? '#0369A1'
                                    : f.category === 'laboratory'
                                    ? '#7C3AED'
                                    : f.category === 'medication'
                                    ? '#C2410C'
                                    : f.category === 'diagnosis'
                                    ? '#B91C1C'
                                    : '#0F766E',
                                backgroundColor: '#FFFFFF',
                              }}
                            >
                              <option value="vital-signs">Vitals</option>
                              <option value="laboratory">Lab Result</option>
                              <option value="medication">Medication</option>
                              <option value="diagnosis">Diagnosis</option>
                              <option value="exam">Physical Exam</option>
                              <option value="imaging">Imaging</option>
                            </select>
                          </td>

                          {/* Label (Editable) */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={f.label}
                              onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#0F172A',
                              }}
                            />
                            {f.sourceSnippet && (
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: '#64748B',
                                  marginTop: '2px',
                                  fontStyle: 'italic',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '240px',
                                }}
                                title={`Source: "${f.sourceSnippet}"`}
                              >
                                Citation: "{f.sourceSnippet}"
                              </div>
                            )}
                          </td>

                          {/* Value (Editable) */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              value={f.value}
                              onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                fontSize: '12px',
                                color: '#0F172A',
                                fontWeight: 500,
                              }}
                            />
                          </td>

                          {/* Unit (Editable) */}
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              placeholder="unit"
                              value={f.unit || ''}
                              onChange={(e) => handleFieldChange(idx, 'unit', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                fontSize: '11px',
                                color: '#475569',
                              }}
                            />
                          </td>

                          {/* Verification Badge / Status */}
                          <td style={{ padding: '8px' }}>
                            <button
                              onClick={() => handleToggleVerification(idx)}
                              style={{
                                border: 'none',
                                borderRadius: '12px',
                                padding: '3px 8px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                backgroundColor: isVerified ? '#DCFCE7' : '#FEF3C7',
                                color: isVerified ? '#166534' : '#92400E',
                                width: '100%',
                                justifyContent: 'center',
                              }}
                            >
                              {isVerified ? <Check size={11} /> : <AlertCircle size={11} />}
                              {isVerified ? 'VERIFIED' : 'REVIEW'}
                            </button>
                          </td>

                          {/* Delete Action */}
                          <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: '2px',
                              }}
                              title="Delete row"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Pane 3: Editable Transcript & Text Re-extractor ─────── */}
        {activeTab === 'transcript' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              padding: '16px',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Editable Document Transcript & OCR Text
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Modify or paste clinical text directly. Click "Re-extract Findings" to update the table with your edits.
                </p>
              </div>

              <button
                onClick={handleReExtractFromText}
                style={{
                  border: 'none',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={13} /> Re-extract Findings from Edited Text
              </button>
            </div>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              rows={18}
              style={{
                width: '100%',
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              placeholder="Paste or edit document text here..."
            />
          </div>
        )}
      </div>

      {/* ── Bottom Summary & Safe Hand-off Bar ────────────────────── */}
      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={14} color="#0F766E" />
          <span>
            Clinician Adjudication: <strong>{verifiedCount} verified</strong>,{' '}
            <strong>{findings.length - verifiedCount} pending review</strong>.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleApplyToPatientCase}
            style={{
              border: 'none',
              background: 'none',
              color: '#0F766E',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
            }}
          >
            Reconfirm & Transfer to Intake Steps <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
