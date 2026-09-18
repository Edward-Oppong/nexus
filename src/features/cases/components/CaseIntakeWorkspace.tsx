// ============================================================
// src/features/cases/components/CaseIntakeWorkspace.tsx
// Dedicated Clinical Case Intake Workspace (Phase 14 Production)
// 6-step clinical intake with split-view live case preview,
// duplicate detection, structured clinical inputs, document ingestion,
// and decoupled clinical creation vs. Nexus intelligence orchestration.
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { useAuth } from '../../authentication/AuthProvider';
import {
  CaseIntakeDraft,
  IntakePatientInput,
  IntakeEncounterInput,
  IntakePresentationInput,
  IntakeObservationInput,
  IntakeMedicationInput,
  IntakeAllergyInput,
  IntakeDocumentInput,
} from '../types/intake';
import { checkDuplicatePatient } from '../services/create-patient-case';
import { runDeterministicSafetyChecks } from '../services/deterministic-safety';
import {
  User,
  FileText,
  FlaskConical,
  Pill,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Save,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  extractClinicalDataFromFile,
  heuristicClinicalExtraction,
} from '../../../lib/intelligence/services/pdf-extraction-service';
import { DocumentReconstructionReview } from './DocumentReconstructionReview';


const DRAFT_STORAGE_KEY = 'nexus_case_intake_draft_v3';


const INITIAL_DRAFT: CaseIntakeDraft = {
  version: '3.0',
  updatedAt: new Date().toISOString(),
  currentStep: 1,
  patient: {
    isNewPatient: true,
    givenName: '',
    familyName: '',
    dateOfBirth: '',
    administrativeSex: 'UNKNOWN',
    externalPatientId: '',
    phone: '',
  },
  encounter: {
    encounterClass: 'IMP',
    department: 'Internal Medicine / Cardiology Consult',
    priority: 'HIGH',
  },
  presentation: {
    title: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    physicalExamNotes: '',
  },
  observations: [],
  medications: [],
  allergies: [],
  documents: [],
};

// ── Synthetic Demo Case Templates ────────────────────────────
const DEMO_TEMPLATES = [
  {
    id: 'endocarditis',
    name: 'Subacute Infective Endocarditis',
    badge: 'Synthetic Cardiology Encounter',
    data: {
      patient: {
        isNewPatient: true,
        givenName: 'Arthur',
        familyName: 'Pendelton',
        dateOfBirth: '1982-04-12',
        administrativeSex: 'MALE' as const,
        externalPatientId: 'MRN-849102',
        phone: '+1 (555) 349-1029',
      },
      encounter: {
        encounterClass: 'IMP' as const,
        department: 'Cardiology / Infectious Disease Inpatient Consult',
        priority: 'HIGH' as const,
      },
      presentation: {
        title: '3-week persistent pyrexia of unknown origin, new regurgitant murmur, and fatigue',
        historyOfPresentIllness: '42-year-old male with a 3-week history of daily fevers (up to 38.9°C), night sweats, 4kg unintentional weight loss, and progressive exertional dyspnea. Underwent routine dental extraction 4 weeks prior without antibiotic prophylaxis.',
        pastMedicalHistory: 'Congenital bicuspid aortic valve (mild regurgitation noted on 2022 echo)\nNo prior intravenous drug use\nHypertension (controlled)',
        physicalExamNotes: 'T 38.8°C, HR 104 regular, BP 118/68, SpO2 97% room air.\nCVS: Grade III/VI holosystolic regurgitant murmur audible at apex radiating to axilla.\nSkin: Erythematous, non-tender macules on left thenar eminence (Janeway lesions). Subungual splinter hemorrhages on 2nd and 3rd right digits.',
      },
      observations: [
        {
          id: 'obs-demo-1',
          category: 'vital-signs' as const,
          code: 'TEMP',
          display: 'Body Temperature',
          value: '38.8',
          unit: '°C',
          referenceRange: '36.5 - 37.5',
          interpretation: 'HIGH' as const,
          observedAt: new Date().toISOString(),
          source: 'Bedside Triage Monitor',
          provenanceType: 'DEVICE_MEASURED' as const,
          actorName: 'Emergency Triage Nurse',
          verificationStatus: 'VERIFIED' as const,
        },
        {
          id: 'obs-demo-2',
          category: 'laboratory' as const,
          code: 'BLD-CULT',
          display: 'Blood Cultures (x3 sets)',
          value: '3/3 bottles positive for Streptococcus viridans',
          unit: '',
          referenceRange: 'Negative',
          interpretation: 'CRITICAL' as const,
          observedAt: new Date().toISOString(),
          source: 'Central Microbiology LIS #904812',
          provenanceType: 'IMPORTED' as const,
          actorName: 'Microbiology Specialist',
          verificationStatus: 'VERIFIED' as const,
        },
        {
          id: 'obs-demo-3',
          category: 'laboratory' as const,
          code: 'CRP',
          display: 'C-Reactive Protein',
          value: '112',
          unit: 'mg/L',
          referenceRange: '< 5.0',
          interpretation: 'HIGH' as const,
          observedAt: new Date().toISOString(),
          source: 'Automated Chemistry LIS',
          provenanceType: 'IMPORTED' as const,
          actorName: 'Core Lab',
          verificationStatus: 'VERIFIED' as const,
        },
        {
          id: 'obs-demo-4',
          category: 'imaging' as const,
          code: 'TEE-ECHO',
          display: 'Transesophageal Echocardiogram (TEE)',
          value: '11mm mobile oscillating vegetation on anterior mitral valve leaflet with mild mitral regurgitation',
          unit: '',
          referenceRange: 'Normal valve morphology',
          interpretation: 'CRITICAL' as const,
          observedAt: new Date().toISOString(),
          source: 'Radiology PACS Study #18420-TEE',
          provenanceType: 'CLINICIAN_VERIFIED' as const,
          actorName: 'Dr. Elena Rostova, Attending Cardiologist',
          verificationStatus: 'VERIFIED' as const,
        },
      ],
      medications: [
        {
          id: 'med-demo-1',
          name: 'Ceftriaxone IV',
          dosage: '2g',
          route: 'Intravenous',
          frequency: 'q24h',
          status: 'ORDERED' as const,
          source: 'Emergency Inpatient CPOE',
          provenanceType: 'HUMAN_ENTERED' as const,
        },
      ],
      allergies: [
        {
          id: 'alg-demo-1',
          substance: 'Penicillin class antibiotics',
          reaction: 'Severe urticaria, angioedema, and bronchospasm (anaphylaxis)',
          severity: 'SEVERE' as const,
          verificationStatus: 'CONFIRMED' as const,
          source: 'Outpatient Allergy Documentation (2019)',
          provenanceType: 'HUMAN_ENTERED' as const,
        },
      ],
      documents: [
        {
          id: 'doc-demo-1',
          title: 'Consultation Note — Adult Cardiology Inpatient Consult',
          category: 'Consult Note' as const,
          mimeType: 'application/pdf',
          fileSize: 428000,
          uploadedAt: new Date().toISOString(),
          rawText: 'Patient Arthur Pendelton (MRN-849102) admitted with fever of unknown origin and Grade III/VI murmur. Past history of bicuspid aortic valve and dental work. Blood cultures grow S. viridans. Urgent TEE echo demonstrates 11mm mitral vegetation.',
          extractedFindings: [
            {
              id: 'ext-fnd-1',
              category: 'exam' as const,
              label: 'Grade III/VI holosystolic regurgitant murmur',
              value: 'Audible at apex radiating to axilla',
              sourceDocumentTitle: 'Consultation Note — Adult Cardiology Inpatient Consult',
              sourcePage: 1,
              sourceSnippet: 'Grade III/VI holosystolic regurgitant murmur audible at apex',
              provenanceType: 'AI_EXTRACTED' as const,
              verificationStatus: 'REVIEW_REQUIRED' as const,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'pe',
    name: 'Suspected Pulmonary Embolism',
    badge: 'Synthetic Emergency / Internal Med',
    data: {
      patient: {
        isNewPatient: true,
        givenName: 'Clara',
        familyName: 'Oswald',
        dateOfBirth: '1989-11-23',
        administrativeSex: 'FEMALE' as const,
        externalPatientId: 'MRN-419082',
        phone: '+1 (555) 782-9011',
      },
      encounter: {
        encounterClass: 'EMER' as const,
        department: 'Emergency Department / Acute Internal Medicine',
        priority: 'STAT' as const,
      },
      presentation: {
        title: 'Acute onset pleuritic chest pain, tachypnea, and unilateral calf swelling following long flight',
        historyOfPresentIllness: '34-year-old female presents with sudden sharp right-sided pleuritic chest pain and shortness of breath that began 6 hours ago. Returned from a 14-hour international flight 3 days ago. Mild hemoptysis noted this morning.',
        pastMedicalHistory: 'Oral contraceptive pill use for 4 years\nNo prior thrombosis history\nNo active malignancy',
        physicalExamNotes: 'T 37.4°C, HR 118 sinus tachycardia, BP 124/76, RR 24, SpO2 93% room air.\nChest: Lungs clear to auscultation bilaterally.\nExtremities: Right calf circumference 3.2cm greater than left calf, erythema and tenderness on palpation.',
      },
      observations: [
        {
          id: 'obs-pe-1',
          category: 'vital-signs' as const,
          code: 'HR',
          display: 'Heart Rate',
          value: '118',
          unit: 'bpm',
          referenceRange: '60 - 100',
          interpretation: 'HIGH' as const,
          observedAt: new Date().toISOString(),
          source: 'ED Triage Vitals',
          provenanceType: 'DEVICE_MEASURED' as const,
          actorName: 'Triage RN',
          verificationStatus: 'VERIFIED' as const,
        },
        {
          id: 'obs-pe-2',
          category: 'laboratory' as const,
          code: 'D-DIMER',
          display: 'D-Dimer (Quantitative FEU)',
          value: '1840',
          unit: 'ng/mL',
          referenceRange: '< 500',
          interpretation: 'CRITICAL' as const,
          observedAt: new Date().toISOString(),
          source: 'Emergency Stat Lab',
          provenanceType: 'IMPORTED' as const,
          actorName: 'Stat LIS',
          verificationStatus: 'VERIFIED' as const,
        },
      ],
      medications: [
        {
          id: 'med-pe-1',
          name: 'Ethinyl estradiol / Levonorgestrel',
          dosage: '0.03/0.15 mg',
          route: 'Oral',
          frequency: 'Daily',
          status: 'ACTIVE' as const,
          source: 'Outpatient Pharmacy Barcode',
          provenanceType: 'HUMAN_ENTERED' as const,
        },
      ],
      allergies: [],
      documents: [],
    },
  },
];

export const CaseIntakeWorkspace: React.FC = () => {
  const { registerCreatedCase, setActiveView } = useCase();
  const { activeOrganization, user } = useAuth();

  const [draft, setDraft] = useState<CaseIntakeDraft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
    return INITIAL_DRAFT;
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfExtractionError, setPdfExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsExtractingPdf(true);
    setPdfExtractionError(null);

    try {
      const result = await extractClinicalDataFromFile(file);
      const isImg = result.fileType === 'image';
      const newDoc: IntakeDocumentInput = {
        id: `doc-${Date.now()}`,
        title: result.title || file.name,
        category: file.name.toLowerCase().includes('lab')
          ? 'Laboratory Report'
          : isImg
          ? 'Imaging Report'
          : 'Consult Note',
        mimeType: file.type || (result.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        rawText: result.rawText,
        fileUrl: result.fileUrl,
        fileType: result.fileType,
        pageCount: result.pageCount,
        extractedFindings: result.findings,
      };
      setDraft((p) => ({ ...p, documents: [...p.documents, newDoc] }));
      if (result.source === 'EMPTY') {
        setPdfExtractionError('No readable text found in this file. You can transcribe notes in the Editable Transcript tab.');
      }
    } catch (err) {
      console.error('[intake] File extraction error:', err);
      setPdfExtractionError('Failed to read file. Please try a different file.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleUpdateDocument = (updatedDoc: IntakeDocumentInput) => {
    setDraft((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)),
    }));
  };

  const handleApplyDocumentData = (appliedData: {
    observations: IntakeObservationInput[];
    medications: IntakeMedicationInput[];
    diagnosisNotes?: string;
  }) => {
    setDraft((prev) => {
      const existingObsCodes = new Set(prev.observations.map((o) => o.display.toLowerCase()));
      const newObs = appliedData.observations.filter((o) => !existingObsCodes.has(o.display.toLowerCase()));

      const existingMedNames = new Set(prev.medications.map((m) => m.name.toLowerCase()));
      const newMeds = appliedData.medications.filter((m) => !existingMedNames.has(m.name.toLowerCase()));

      let updatedPresentation = { ...prev.presentation };
      if (appliedData.diagnosisNotes) {
        updatedPresentation.historyOfPresentIllness = updatedPresentation.historyOfPresentIllness
          ? `${updatedPresentation.historyOfPresentIllness}\n\n[Extracted Diagnoses]: ${appliedData.diagnosisNotes}`
          : `[Extracted Diagnoses]: ${appliedData.diagnosisNotes}`;
      }

      return {
        ...prev,
        observations: [...prev.observations, ...newObs],
        medications: [...prev.medications, ...newMeds],
        presentation: updatedPresentation,
      };
    });

    setStatusMessage({
      type: 'success',
      text: `Successfully synced ${appliedData.observations.length} observation(s) and ${appliedData.medications.length} medication(s) to Case Intake!`,
    });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleLoadSampleDocument = () => {
    const sampleRawText = `PATIENT DISCHARGE & CLINICAL CONSULTATION SUMMARY
Hospital ID: #NY-99412
Date: 2026-09-17
Encounter: Acute Cardiac & Renal Assessment

ADMISSION DIAGNOSIS:
Diagnosis: Non-ST-Elevation Myocardial Infarction with Acute Kidney Injury

VITAL SIGNS:
BP: 148/92 mmHg
HR: 104 bpm
SpO2: 93%
RR: 22 breaths/min
Temperature: 37.8 C

LABORATORY INVESTIGATIONS:
Hb: 10.8 g/dL
WBC: 13.8 x10^9/L
Platelets: 210 x10^9/L
Serum Creatinine: 2.1 mg/dL
Potassium: 5.4 mmol/L
Troponin I: 1.85 ng/mL
Blood Glucose: 165 mg/dL

CURRENT MEDICATIONS:
Aspirin 81 mg daily
Atorvastatin 80 mg daily
Lisinopril 10 mg daily (withhold due to AKI)
Metoprolol 25 mg bid

IMPRESSION:
Impression: High-risk coronary syndrome with mild pulmonary congestion and early cardiorenal syndrome.`;

    const canvas = window.document.createElement('canvas');
    canvas.width = 620;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 620, 760);
      ctx.fillStyle = '#0F766E';
      ctx.fillRect(0, 0, 620, 60);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('NEXUS HEALTH SYSTEM - CLINICAL CONSULT & LAB REPORT', 20, 36);
      ctx.fillStyle = '#0F172A';
      ctx.font = '11px monospace';
      const lines = sampleRawText.split('\n');
      lines.slice(0, 32).forEach((l, i) => {
        ctx.fillText(l, 20, 90 + i * 20);
      });
    }
    const sampleImgUrl = canvas.toDataURL('image/png');

    const sampleFindings = heuristicClinicalExtraction(sampleRawText, 'Discharge Summary & Lab Report');

    const sampleDoc: IntakeDocumentInput = {
      id: `sample-doc-${Date.now()}`,
      title: 'Sample Discharge Summary & Lab Report',
      category: 'Discharge Summary',
      mimeType: 'image/png',
      fileSize: 48200,
      uploadedAt: new Date().toISOString(),
      rawText: sampleRawText,
      fileUrl: sampleImgUrl,
      fileType: 'image',
      pageCount: 1,
      extractedFindings: sampleFindings,
    };

    setDraft((p) => ({ ...p, documents: [...p.documents, sampleDoc] }));
    setStatusMessage({ type: 'success', text: 'Loaded sample clinical document with extracted findings!' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
    } catch (e) {
      console.warn('Draft auto-save warning:', e);
    }
  }, [draft]);

  // Duplicate patient check on name/DOB change
  useEffect(() => {
    if (draft.patient.isNewPatient && draft.patient.givenName.trim().length >= 2 && draft.patient.familyName.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const res = await checkDuplicatePatient({
          givenName: draft.patient.givenName,
          familyName: draft.patient.familyName,
          dateOfBirth: draft.patient.dateOfBirth,
          organizationId: activeOrganization?.id || 'demo-org',
        });
        if (res.duplicateFound) {
          setDuplicateWarning(`Potential duplicate patient record detected: "${res.matchedPatientName}". You may continue creating a new patient or link to the existing profile.`);
        } else {
          setDuplicateWarning(null);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDuplicateWarning(null);
    }
  }, [draft.patient.givenName, draft.patient.familyName, draft.patient.dateOfBirth, activeOrganization?.id]);

  // Live Deterministic Safety Check Preview
  const safetyPreview = runDeterministicSafetyChecks({
    caseId: 'preview',
    medications: draft.medications,
    allergies: draft.allergies,
    observations: draft.observations,
  });

  // Step Navigators
  const goToStep = (step: number) => {
    setDraft((prev) => ({ ...prev, currentStep: step }));
  };

  const loadTemplate = (templateData: any) => {
    setDraft((prev) => ({
      ...prev,
      patient: { ...prev.patient, ...templateData.patient },
      encounter: { ...prev.encounter, ...templateData.encounter },
      presentation: { ...prev.presentation, ...templateData.presentation },
      observations: templateData.observations || [],
      medications: templateData.medications || [],
      allergies: templateData.allergies || [],
      documents: templateData.documents || [],
      currentStep: 2,
    }));
    setStatusMessage({ type: 'success', text: `Loaded template: ${templateData.presentation.title}` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClearDraft = () => {
    if (window.confirm('Clear current intake draft and start with a blank case?')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(INITIAL_DRAFT);
    }
  };

  // Submission handler: Decoupled clinical creation vs. Nexus intelligence
  const handleExecuteCreation = async (runAnalysisImmediately: boolean) => {
    if (!draft.patient.givenName.trim() || !draft.patient.familyName.trim()) {
      setStatusMessage({ type: 'error', text: 'Patient given name and family name are required.' });
      goToStep(1);
      return;
    }
    if (!draft.presentation.title.trim() || draft.presentation.title.trim().length < 5) {
      setStatusMessage({ type: 'error', text: 'Chief complaint / clinical problem title is required (minimum 5 characters).' });
      goToStep(2);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await registerCreatedCase(draft, {
        runAnalysisImmediately,
        organizationId: activeOrganization?.id || 'demo-org',
        userId: user?.id || 'demo-user',
        userDisplayName: user?.email ? user.email.split('@')[0] : 'Dr. Edward Vance, MD',
      });

      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to create case.' });
        setIsSubmitting(false);
        return;
      }

      // Success: clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      // CaseContext automatically routes to case-workspace
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'An unexpected error occurred during case creation.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#F8FAFC',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Intake Workspace Bar */}
      <header
        style={{
          padding: '16px 32px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setActiveView('cases')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Return to cases list"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              New Clinical Case Intake
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                backgroundColor: '#E0F2FE',
                color: '#0369A1',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              Step {draft.currentStep} of 6
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
            Enter longitudinal patient identity, structured clinical findings, and documents for contextual synthesis.
          </p>
        </div>

        {/* Header Actions: Templates & Draft controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Demo Template Quick Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Load Demo Template:</span>
            {DEMO_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => loadTemplate(tmpl.data)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  color: '#0F766E',
                  border: '1px solid #99F6E4',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} />
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleClearDraft}
            title="Reset form"
            style={{
              background: 'none',
              border: '1px solid #E2E8F0',
              padding: '5px 8px',
              borderRadius: '6px',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
            }}
          >
            <RotateCcw size={13} />
            <span>Clear</span>
          </button>
        </div>
      </header>

      {/* Status banner (if error or success) */}
      {statusMessage && (
        <div
          style={{
            padding: '10px 32px',
            backgroundColor: statusMessage.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            borderBottom: `1px solid ${statusMessage.type === 'error' ? '#FECACA' : '#DCFCE7'}`,
            color: statusMessage.type === 'error' ? '#991B1B' : '#166534',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {statusMessage.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Split-View Workspace */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
          gap: '24px',
          padding: '24px 32px',
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* LEFT COLUMN: 6-Step Clinical Intake Form */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Step Indicator Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              overflowX: 'auto',
            }}
          >
            {[
              { num: 1, label: '01 Patient Identity', icon: <User size={14} /> },
              { num: 2, label: '02 Presentation', icon: <FileText size={14} /> },
              { num: 3, label: '03 Observations & Labs', icon: <FlaskConical size={14} /> },
              { num: 4, label: '04 Meds & Allergies', icon: <Pill size={14} /> },
              { num: 5, label: '05 Documents & PDFs', icon: <Paperclip size={14} /> },
              { num: 6, label: '06 Review & Activate', icon: <CheckCircle2 size={14} /> },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => goToStep(s.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: draft.currentStep === s.num ? '2px solid #0F766E' : '2px solid transparent',
                  backgroundColor: draft.currentStep === s.num ? '#FFFFFF' : 'transparent',
                  color: draft.currentStep === s.num ? '#0F766E' : '#64748B',
                  fontSize: '12px',
                  fontWeight: draft.currentStep === s.num ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.icon}
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Step Form Body */}
          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            {/* ── STEP 1: Patient Identity & Encounter Context ──────── */}
            {draft.currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Patient Identity & Encounter Context
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Register a new longitudinal patient record with administrative sex and encounter parameters.
                  </p>
                </div>

                {duplicateWarning && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <AlertTriangle size={18} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.5 }}>
                      {duplicateWarning}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Given Name *
                    </label>
                    <input
                      type="text"
                      value={draft.patient.givenName}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, givenName: e.target.value } }))}
                      placeholder="e.g. Arthur"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Family Name *
                    </label>
                    <input
                      type="text"
                      value={draft.patient.familyName}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, familyName: e.target.value } }))}
                      placeholder="e.g. Pendelton"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={draft.patient.dateOfBirth}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, dateOfBirth: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Administrative Sex
                    </label>
                    <select
                      value={draft.patient.administrativeSex}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, administrativeSex: e.target.value as any } }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="UNKNOWN">Unknown / Unspecified</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Hospital MRN
                    </label>
                    <input
                      type="text"
                      value={draft.patient.externalPatientId}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, externalPatientId: e.target.value } }))}
                      placeholder="e.g. MRN-849102"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Department / Service
                    </label>
                    <input
                      type="text"
                      value={draft.encounter.department}
                      onChange={(e) => setDraft((p) => ({ ...p, encounter: { ...p.encounter, department: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Triage Priority
                    </label>
                    <select
                      value={draft.encounter.priority}
                      onChange={(e) => setDraft((p) => ({ ...p, encounter: { ...p.encounter, priority: e.target.value as any } }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="ROUTINE">Routine Consult</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Stat / Emergent</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Clinical Presentation & History ────────── */}
            {draft.currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Clinical Problem & Presentation
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Record the chief complaint, history of present illness (HPI), and physical bedside exam findings.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Chief Complaint / Clinical Problem Title *
                  </label>
                  <input
                    type="text"
                    value={draft.presentation.title}
                    onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, title: e.target.value } }))}
                    placeholder="e.g. 3-week fever of unknown origin, new regurgitant murmur, and fatigue"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    History of Present Illness (HPI)
                  </label>
                  <textarea
                    rows={4}
                    value={draft.presentation.historyOfPresentIllness}
                    onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, historyOfPresentIllness: e.target.value } }))}
                    placeholder="Chronological narrative of onset, duration, fever patterns, dental or procedural history, night sweats, etc."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Past Medical History
                    </label>
                    <textarea
                      rows={3}
                      value={draft.presentation.pastMedicalHistory}
                      onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, pastMedicalHistory: e.target.value } }))}
                      placeholder="e.g. Congenital bicuspid valve, prior endocarditis, valvular prostheses..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: 1.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Bedside Physical Examination
                    </label>
                    <textarea
                      rows={3}
                      value={draft.presentation.physicalExamNotes}
                      onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, physicalExamNotes: e.target.value } }))}
                      placeholder="e.g. Murmur description, Janeway lesions, Osler nodes, splinter hemorrhages..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: 1.5 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Structured Observations & Labs ────────── */}
            {draft.currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Structured Observations & Laboratory Feeds
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                      Enter discrete observations with units, reference ranges, and interpretation flags.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newObs: IntakeObservationInput = {
                        id: `obs-custom-${Date.now()}`,
                        category: 'laboratory',
                        code: 'LAB',
                        display: '',
                        value: '',
                        unit: '',
                        referenceRange: '',
                        interpretation: 'NORMAL',
                        observedAt: new Date().toISOString(),
                        source: 'Clinician Entered',
                        provenanceType: 'HUMAN_ENTERED',
                        actorName: 'Attending Clinician',
                        verificationStatus: 'VERIFIED',
                      };
                      setDraft((p) => ({ ...p, observations: [...p.observations, newObs] }));
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Observation</span>
                  </button>
                </div>

                {draft.observations.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                    <FlaskConical size={28} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                      No discrete observations entered yet. Click "Add Observation" above or load a demo template.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {draft.observations.map((obs, idx) => (
                      <div
                        key={obs.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto',
                          gap: '10px',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                        }}
                      >
                        <div>
                          <input
                            type="text"
                            placeholder="Test name (e.g. Blood cultures)"
                            value={obs.display}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({
                                ...p,
                                observations: p.observations.map((o, i) => (i === idx ? { ...o, display: val } : o)),
                              }));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Value (e.g. 3/3 pos S. viridans)"
                            value={obs.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({
                                ...p,
                                observations: p.observations.map((o, i) => (i === idx ? { ...o, value: val } : o)),
                              }));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Reference range"
                            value={obs.referenceRange || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({
                                ...p,
                                observations: p.observations.map((o, i) => (i === idx ? { ...o, referenceRange: val } : o)),
                              }));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                        </div>
                        <div>
                          <select
                            value={obs.interpretation || 'NORMAL'}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setDraft((p) => ({
                                ...p,
                                observations: p.observations.map((o, i) => (i === idx ? { ...o, interpretation: val } : o)),
                              }));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
                          >
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High / Elevated</option>
                            <option value="CRITICAL">Critical Finding</option>
                            <option value="ABNORMAL">Abnormal</option>
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            setDraft((p) => ({ ...p, observations: p.observations.filter((_, i) => i !== idx) }));
                          }}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Medications & Allergies ──────────────── */}
            {draft.currentStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Allergies Block */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        Documented Allergy Intolerances
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Audited by the deterministic safety engine against all active orders</span>
                    </div>
                    <button
                      onClick={() => {
                        const newAlg: IntakeAllergyInput = {
                          id: `alg-${Date.now()}`,
                          substance: '',
                          reaction: '',
                          severity: 'MODERATE',
                          verificationStatus: 'CONFIRMED',
                          source: 'Chart History',
                          provenanceType: 'HUMAN_ENTERED',
                        };
                        setDraft((p) => ({ ...p, allergies: [...p.allergies, newAlg] }));
                      }}
                      style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Allergy
                    </button>
                  </div>

                  {draft.allergies.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '12px', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                      No documented allergies. Click "+ Add Allergy" to record documented sensitivities.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {draft.allergies.map((alg, idx) => (
                        <div key={alg.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr auto', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px' }}>
                          <input
                            type="text"
                            placeholder="Allergen (e.g. Penicillins)"
                            value={alg.substance}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, allergies: p.allergies.map((a, i) => (i === idx ? { ...a, substance: val } : a)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Reaction (e.g. Anaphylaxis, hives)"
                            value={alg.reaction}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, allergies: p.allergies.map((a, i) => (i === idx ? { ...a, reaction: val } : a)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                          <select
                            value={alg.severity}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setDraft((p) => ({ ...p, allergies: p.allergies.map((a, i) => (i === idx ? { ...a, severity: val } : a)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
                          >
                            <option value="MILD">Mild</option>
                            <option value="MODERATE">Moderate</option>
                            <option value="SEVERE">Severe (Anaphylaxis)</option>
                          </select>
                          <button onClick={() => setDraft((p) => ({ ...p, allergies: p.allergies.filter((_, i) => i !== idx) }))} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Medications Block */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        Active / Inpatient Prescriptions
                      </h3>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Pharmacotherapy orders evaluated for drug-allergy & dosing contradictions</span>
                    </div>
                    <button
                      onClick={() => {
                        const newMed: IntakeMedicationInput = {
                          id: `med-${Date.now()}`,
                          name: '',
                          dosage: '',
                          route: 'Oral',
                          frequency: 'Daily',
                          status: 'ACTIVE',
                          source: 'Prescribed',
                          provenanceType: 'HUMAN_ENTERED',
                        };
                        setDraft((p) => ({ ...p, medications: [...p.medications, newMed] }));
                      }}
                      style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Medication
                    </button>
                  </div>

                  {draft.medications.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '12px', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                      No medications entered. Click "+ Add Medication" to record current inpatient pharmacotherapy.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {draft.medications.map((med, idx) => (
                        <div key={med.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                          <input
                            type="text"
                            placeholder="Drug name (e.g. Ceftriaxone IV)"
                            value={med.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, name: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Dose (e.g. 2g)"
                            value={med.dosage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, dosage: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Frequency (e.g. q24h)"
                            value={med.frequency}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, frequency: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                          />
                          <select
                            value={med.route}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, route: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: '#FFFFFF' }}
                          >
                            <option value="Oral">Oral (PO)</option>
                            <option value="Intravenous">Intravenous (IV)</option>
                            <option value="Subcutaneous">Subcutaneous (SC)</option>
                            <option value="Inhaled">Inhaled</option>
                          </select>
                          <button onClick={() => setDraft((p) => ({ ...p, medications: p.medications.filter((_, i) => i !== idx) }))} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 5: Documents & PDFs Ingestion ────────────── */}
            {draft.currentStep === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Clinical Documents & Attachment Ingestion
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Attach clinical PDFs, consultant letters, and discharge summaries. Entities extracted are marked <code>AI_EXTRACTED</code> with page provenance until verified by a clinician.
                  </p>
                </div>

                {/* PDF error */}
                {pdfExtractionError && (
                  <div style={{
                    background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
                    padding: '10px 14px', fontSize: '12px', color: '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
                  }}>
                    <AlertTriangle size={14} />
                    {pdfExtractionError}
                  </div>
                )}

                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf,image/*,.png,.jpg,.jpeg,.webp,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFileSelected}
                />

                {/* Upload Trigger Area & Quick Test Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'stretch' }}>
                  <div
                    style={{
                      border: `2px dashed ${isExtractingPdf ? '#0284C7' : '#CBD5E1'}`,
                      borderRadius: '8px',
                      padding: '24px 20px',
                      textAlign: 'center',
                      backgroundColor: isExtractingPdf ? '#EFF6FF' : '#F8FAFC',
                      cursor: isExtractingPdf ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => !isExtractingPdf && fileInputRef.current?.click()}
                  >
                    {isExtractingPdf ? (
                      <>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            border: '3px solid #BFDBFE',
                            borderTopColor: '#0284C7',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 8px',
                          }}
                        />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0284C7' }}>
                          Reconstructing file & extracting clinical entities…
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                          Parsing document, running NER model, and building editable data table
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload size={22} color="#0F766E" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                          Click to attach Clinical PDF, Scan, or Image
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Supports PDF, PNG, JPG, WEBP, TXT · Reconstructs visual file + editable clinical table
                        </div>
                      </>
                    )}
                  </div>

                  {/* Instant Sample Button */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#F0FDFA',
                      border: '1px solid #CCFBF1',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      maxWidth: '240px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} /> Quick Demo Test
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', margin: '4px 0 10px' }}>
                      Test the visual reconstruction, editable table & sync with a realistic discharge summary.
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleDocument}
                      style={{
                        border: 'none',
                        backgroundColor: '#0F766E',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '11px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      Load Sample Report
                    </button>
                  </div>
                </div>

                {/* Reconstructed Document & Editable Findings Workspaces */}
                {draft.documents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {draft.documents.map((doc, idx) => (
                      <DocumentReconstructionReview
                        key={doc.id}
                        document={doc}
                        onUpdateDocument={handleUpdateDocument}
                        onApplyToCase={handleApplyDocumentData}
                        onRemoveDocument={() =>
                          setDraft((p) => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 6: Review & Activate ────────────────────── */}
            {draft.currentStep === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Intake Validation & Safety Review
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                    Review deterministic safety alerts before committing the clinical record to the hospital repository.
                  </p>
                </div>

                {/* Deterministic Safety Preview Box */}
                {safetyPreview.concerns.length > 0 ? (
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                      <ShieldAlert size={18} />
                      <span>{safetyPreview.concerns.length} Reviewable Safety Concern(s) Flagged</span>
                    </div>
                    {safetyPreview.concerns.map((c) => (
                      <div key={c.id} style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '4px', lineHeight: 1.5 }}>
                        • <strong>{c.category}</strong>: {c.description}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#166534',
                      fontWeight: 500,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Deterministic safety evaluation clear: No active drug-allergy or critical threshold conflicts detected.</span>
                  </div>
                )}

                {/* Case Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', marginBottom: '4px', fontWeight: 600 }}>PATIENT IDENTITY</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {draft.patient.givenName} {draft.patient.familyName || '(Unnamed)'}
                    </div>
                    <div style={{ color: '#475569', marginTop: '2px' }}>
                      DOB: {draft.patient.dateOfBirth || 'Unspecified'} · Sex: {draft.patient.administrativeSex} · MRN: {draft.patient.externalPatientId || 'Pending'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', marginBottom: '4px', fontWeight: 600 }}>CLINICAL PROBLEM</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                      {draft.presentation.title || '(No title entered)'}
                    </div>
                    <div style={{ color: '#475569', marginTop: '2px' }}>
                      Priority: {draft.encounter.priority} · {draft.encounter.department}
                    </div>
                  </div>
                </div>

                {/* Submission Actions */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleExecuteCreation(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 18px',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Save size={14} />
                    <span>Create Case (Data Record Only)</span>
                  </button>

                  <button
                    disabled={isSubmitting}
                    onClick={() => handleExecuteCreation(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 22px',
                      borderRadius: '6px',
                      backgroundColor: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Play size={14} fill="#FFFFFF" />
                    <span>{isSubmitting ? 'Persisting & Analyzing...' : 'Create Case & Run Nexus Analysis'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Bottom Controls */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              disabled={draft.currentStep === 1}
              onClick={() => goToStep(draft.currentStep - 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: draft.currentStep === 1 ? '#CBD5E1' : '#475569',
                fontSize: '12px',
                fontWeight: 500,
                cursor: draft.currentStep === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            {draft.currentStep < 6 ? (
              <button
                onClick={() => goToStep(draft.currentStep + 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>Next Step</span>
                <ArrowRight size={13} />
              </button>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Case Preview (Updates in real time) */}
        <aside
          aria-label="Live Case Preview"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              position: 'sticky',
              top: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>
                LIVE CASE PREVIEW
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                Auto-saving draft
              </span>
            </div>

            {/* Patient Card Preview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>PATIENT</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                {draft.patient.givenName || draft.patient.familyName
                  ? `${draft.patient.givenName} ${draft.patient.familyName}`.trim()
                  : 'Patient Name Pending'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                {draft.patient.dateOfBirth ? `${draft.patient.dateOfBirth} · ` : ''}
                Sex: {draft.patient.administrativeSex}
                {draft.patient.externalPatientId ? ` · MRN: ${draft.patient.externalPatientId}` : ''}
              </div>
            </div>

            {/* Presentation Preview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>PRESENTATION</div>
              <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500, lineHeight: 1.4 }}>
                {draft.presentation.title || 'Enter chief complaint / problem in Step 2'}
              </div>
            </div>

            {/* Data Stream Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F766E' }}>
                  {draft.observations.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Observations / Labs</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F766E' }}>
                  {draft.medications.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Active Medications</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: draft.allergies.length > 0 ? '#B91C1C' : '#64748B' }}>
                  {draft.allergies.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Documented Allergies</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F766E' }}>
                  {draft.documents.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Attached PDFs/Docs</div>
              </div>
            </div>

            {/* Live Safety Status Pill */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: safetyPreview.concerns.length > 0 ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${safetyPreview.concerns.length > 0 ? '#FECACA' : '#BBF7D0'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: safetyPreview.concerns.length > 0 ? '#991B1B' : '#166534',
                fontWeight: 600,
              }}
            >
              {safetyPreview.concerns.length > 0 ? (
                <>
                  <ShieldAlert size={16} />
                  <span>{safetyPreview.concerns.length} safety alert(s) pending review</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>No safety contradictions detected</span>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
