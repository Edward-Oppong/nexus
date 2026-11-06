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
  Zap,
  Stethoscope,
  Building2,
  Activity,
  ChevronRight,
  Bolt,
  ClipboardList,
  Printer,
} from 'lucide-react';
import {
  extractClinicalDataFromFile,
  heuristicClinicalExtraction,
} from '../../../lib/intelligence/services/pdf-extraction-service';
import { DocumentReconstructionReview } from './DocumentReconstructionReview';
import {
  evaluateClinicalObservation,
  inferCaseTriage,
  getTestUnitOptions,
  getCanonicalTestName,
  calculateAgeInYears,
} from '../services/clinical-knowledge';
import { exportCaseToPdf } from '../services/pdf-export-service';
import { FullSyntheticCase } from '../../../data/cases/mockCasesData';


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

// ── Care Context Types ──────────────────────────────────────
type CareContext = 'TRIAGE' | 'OPD' | 'INPATIENT';

interface ContextConfig {
  id: CareContext;
  label: string;
  shortLabel: string;
  tagline: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  steps: Array<{ num: number; label: string; icon: React.ReactNode }>;
}

const CONTEXT_CONFIGS: Record<CareContext, ContextConfig> = {
  TRIAGE: {
    id: 'TRIAGE',
    label: 'Triage / Emergency',
    shortLabel: 'Triage',
    tagline: 'Fast-track patient registration with immediate vitals capture and one-click escalation.',
    color: 'var(--status-danger)',
    bgColor: 'var(--danger-subtle)',
    borderColor: 'var(--danger-border)',
    dotColor: 'var(--status-danger)',
    steps: [
      { num: 1, label: '01 Patient ID', icon: <User size={14} /> },
      { num: 2, label: '02 Vitals & Presentation', icon: <Activity size={14} /> },
      { num: 3, label: '03 Quick Review', icon: <CheckCircle2 size={14} /> },
    ],
  },
  OPD: {
    id: 'OPD',
    label: 'Routine OPD',
    shortLabel: 'OPD',
    tagline: 'Outpatient consultation with chief complaint, vitals, and targeted diagnostics.',
    color: 'var(--status-warning)',
    bgColor: 'var(--warning-subtle)',
    borderColor: 'var(--warning-border)',
    dotColor: 'var(--status-warning)',
    steps: [
      { num: 1, label: '01 Patient Identity', icon: <User size={14} /> },
      { num: 2, label: '02 Presentation', icon: <FileText size={14} /> },
      { num: 3, label: '03 Vitals & Labs', icon: <FlaskConical size={14} /> },
      { num: 4, label: '04 Meds & Allergies', icon: <Pill size={14} /> },
      { num: 5, label: '05 Review & Activate', icon: <CheckCircle2 size={14} /> },
    ],
  },
  INPATIENT: {
    id: 'INPATIENT',
    label: 'Inpatient Admission',
    shortLabel: 'Inpatient',
    tagline: 'Comprehensive admission charting with document ingestion, full history, and AI extraction.',
    color: 'var(--accent-primary)',
    bgColor: 'var(--accent-subtle)',
    borderColor: 'var(--border-medium)',
    dotColor: 'var(--accent-primary)',
    steps: [
      { num: 1, label: '01 Patient Identity', icon: <User size={14} /> },
      { num: 2, label: '02 Documents & Ingestion', icon: <Paperclip size={14} /> },
      { num: 3, label: '03 Presentation', icon: <FileText size={14} /> },
      { num: 4, label: '04 Observations & Labs', icon: <FlaskConical size={14} /> },
      { num: 5, label: '05 Meds & Allergies', icon: <Pill size={14} /> },
      { num: 6, label: '06 Review & Activate', icon: <CheckCircle2 size={14} /> },
    ],
  },
};

export const CaseIntakeWorkspace: React.FC = () => {
  const { registerCreatedCase, setActiveView } = useCase();
  const { activeOrganization, user } = useAuth();

  // ── Care Context State ────────────────────────────────────
  const [careContext, setCareContext] = useState<CareContext>('OPD');
  const [careContextChosen, setCareContextChosen] = useState(false);

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

  const contextConfig = CONTEXT_CONFIGS[careContext];

  type StepId = 'patient' | 'presentation' | 'triage_vitals' | 'vitals_labs' | 'meds_allergies' | 'documents' | 'review';

  interface WizardStepItem {
    num: number;
    id: StepId;
    label: string;
    icon: React.ReactNode;
  }

  const getWizardSteps = (): WizardStepItem[] => {
    if (careContext === 'TRIAGE') {
      return [
        { num: 1, id: 'patient', label: '01 Patient ID', icon: <User size={14} /> },
        { num: 2, id: 'triage_vitals', label: '02 Vitals & Acuity', icon: <Activity size={14} /> },
        { num: 3, id: 'review', label: '03 Escalate & Review', icon: <CheckCircle2 size={14} /> },
      ];
    }
    if (careContext === 'INPATIENT') {
      return [
        { num: 1, id: 'patient', label: '01 Patient Identity', icon: <User size={14} /> },
        { num: 2, id: 'documents', label: '02 Documents & Ingestion', icon: <Paperclip size={14} /> },
        { num: 3, id: 'presentation', label: '03 Clinical Presentation', icon: <FileText size={14} /> },
        { num: 4, id: 'vitals_labs', label: '04 Observations & Labs', icon: <FlaskConical size={14} /> },
        { num: 5, id: 'meds_allergies', label: '05 Meds & Allergies', icon: <Pill size={14} /> },
        { num: 6, id: 'review', label: '06 Review & Finalize', icon: <CheckCircle2 size={14} /> },
      ];
    }
    // OPD
    return [
      { num: 1, id: 'patient', label: '01 Patient Identity', icon: <User size={14} /> },
      { num: 2, id: 'presentation', label: '02 Presentation', icon: <FileText size={14} /> },
      { num: 3, id: 'vitals_labs', label: '03 Vitals & Labs', icon: <FlaskConical size={14} /> },
      { num: 4, id: 'meds_allergies', label: '04 Meds & Allergies', icon: <Pill size={14} /> },
      { num: 5, id: 'review', label: '05 Review & Activate', icon: <CheckCircle2 size={14} /> },
    ];
  };

  const currentSteps = getWizardSteps();
  const currentStepNum = Math.min(Math.max(draft.currentStep || 1, 1), currentSteps.length);
  const currentStepItem = currentSteps[currentStepNum - 1] || currentSteps[0];
  const activeStepId = currentStepItem.id;

  const handleSelectContext = (ctx: CareContext) => {
    setCareContext(ctx);
    setCareContextChosen(true);
    setDraft((p) => {
      const maxSteps = CONTEXT_CONFIGS[ctx].steps.length;
      return {
        ...p,
        currentStep: Math.min(p.currentStep || 1, maxSteps),
        encounter: {
          ...p.encounter,
          encounterClass: ctx === 'TRIAGE' ? 'EMER' : ctx === 'INPATIENT' ? 'IMP' : 'AMB',
          priority: ctx === 'TRIAGE' ? 'URGENT' : ctx === 'INPATIENT' ? 'HIGH' : 'ROUTINE',
          department:
            ctx === 'TRIAGE'
              ? 'Emergency Medicine'
              : ctx === 'INPATIENT'
              ? 'Acute Internal Medicine'
              : 'Outpatient Clinic',
        },
      };
    });
  };

  // Quick vitals helper for OPD & Triage
  const getVitalValue = (codeOrDisplay: string): string => {
    const obs = draft.observations.find(
      (o) => o.code?.toLowerCase() === codeOrDisplay.toLowerCase() ||
             o.display?.toLowerCase().includes(codeOrDisplay.toLowerCase())
    );
    return obs?.value ? String(obs.value) : '';
  };

  const setVitalValue = (vitalName: string, value: string, unit: string, category: 'vital-signs' | 'laboratory' = 'vital-signs') => {
    setDraft((prev) => {
      const idx = prev.observations.findIndex(
        (o) => o.display?.toLowerCase() === vitalName.toLowerCase() ||
               o.code?.toLowerCase() === vitalName.toLowerCase()
      );
      if (!value.trim()) {
        if (idx >= 0) {
          return {
            ...prev,
            observations: prev.observations.filter((_, i) => i !== idx),
          };
        }
        return prev;
      }

      const evalRes = evaluateClinicalObservation(
        vitalName,
        value,
        undefined,
        undefined,
        unit,
        {
          dateOfBirth: prev.patient.dateOfBirth,
          administrativeSex: prev.patient.administrativeSex,
        }
      );

      const updatedObs: IntakeObservationInput = {
        id: idx >= 0 ? prev.observations[idx].id : `vital-${Date.now()}-${vitalName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        category,
        code: vitalName.toUpperCase().replace(/[^a-zA-Z0-9]/g, '_'),
        display: vitalName,
        value: value.trim(),
        unit: evalRes.unit || unit,
        referenceRange: evalRes.referenceRange || '',
        interpretation: (evalRes.interpretation as any) || 'NORMAL',
        observedAt: new Date().toISOString(),
        source: 'Clinician / Nurse Entered',
        provenanceType: 'HUMAN_ENTERED',
        actorName: 'Attending Clinician',
        verificationStatus: 'VERIFIED',
      };

      if (idx >= 0) {
        return {
          ...prev,
          observations: prev.observations.map((o, i) => (i === idx ? updatedObs : o)),
        };
      } else {
        return {
          ...prev,
          observations: [...prev.observations, updatedObs],
        };
      }
    });
  };


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


  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
    } catch (e) {
      console.warn('Draft auto-save warning:', e);
    }
  }, [draft]);

  // Duplicate patient check on name/DOB change
  useEffect(() => {
    if (draft.patient.isNewPatient && draft.patient.givenName.trim().length >= 2) {
      const timer = setTimeout(async () => {
        const res = await checkDuplicatePatient({
          givenName: draft.patient.givenName,
          familyName: draft.patient.familyName || '',
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

  // Live Deterministic Safety Check Preview (Non-biased, demographic & acuity aware)
  const safetyPreview = runDeterministicSafetyChecks({
    caseId: 'preview',
    medications: draft.medications,
    allergies: draft.allergies,
    observations: draft.observations,
    patientDemographics: {
      dateOfBirth: draft.patient.dateOfBirth,
      administrativeSex: draft.patient.administrativeSex,
    },
    careContext,
  });

  // Automated Case Triage & Department Routing
  useEffect(() => {
    const inferred = inferCaseTriage(draft.presentation, draft.observations);
    if (
      draft.encounter.priority !== inferred.priority ||
      draft.encounter.department !== inferred.department
    ) {
      setDraft((prev) => ({
        ...prev,
        encounter: {
          ...prev.encounter,
          priority: inferred.priority,
          department: inferred.department,
        },
      }));
    }
  }, [
    draft.presentation.title,
    draft.presentation.historyOfPresentIllness,
    draft.observations,
  ]);

  // Step Navigators
  const goToStep = (step: number) => {
    setDraft((prev) => ({ ...prev, currentStep: step }));
  };


  const handleClearDraft = () => {
    if (window.confirm('Clear current intake draft and start with a blank case?')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(INITIAL_DRAFT);
    }
  };

  // Submission handler: Decoupled clinical creation vs. Nexus intelligence
  const handleExecuteCreation = async (runAnalysisImmediately: boolean) => {
    if (!draft.patient.givenName.trim()) {
      setStatusMessage({ type: 'error', text: 'Patient given name or clinical identifier is required.' });
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

  // Triage fast-track escalation handler
  const handleTriageQuickEscalate = async () => {
    if (!draft.patient.givenName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter at least a patient name or identifier (e.g. "Trauma 1") for emergency triage.' });
      goToStep(1);
      return;
    }
    const triageDraft: CaseIntakeDraft = {
      ...draft,
      patient: {
        ...draft.patient,
        familyName: (draft.patient.familyName || '').trim() || 'Emergency Patient',
      },
      presentation: {
        ...draft.presentation,
        title: draft.presentation.title.trim() || 'Acute Emergency Triage - Resus / ED Bed',
      },
      encounter: {
        ...draft.encounter,
        priority: 'URGENT',
        department: 'Emergency Medicine',
      },
    };
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await registerCreatedCase(triageDraft, {
        runAnalysisImmediately: true,
        organizationId: activeOrganization?.id || 'demo-org',
        userId: user?.id || 'demo-user',
        userDisplayName: user?.email ? user.email.split('@')[0] : 'Dr. Edward Vance, MD',
      });
      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to escalate emergency triage case.' });
        setIsSubmitting(false);
        return;
      }
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'An error occurred during triage escalation.' });
      setIsSubmitting(false);
    }
  };

  // ── Care Context Selection Landing Screen ───────────────────
  if (!careContextChosen) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: 'var(--bg-subtle)',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ maxWidth: '960px', width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--success-subtle)',
                border: '1px solid var(--success-border)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              <Sparkles size={14} /> Adaptive Clinical Intake Wizard
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
              Select Clinical Care Context
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0, maxWidth: '620px', marginInline: 'auto', lineHeight: 1.6 }}>
              Tailor the intake pace, field requirements, and step workflow to your clinical setting. Each mode adapts the form so data entry matches the urgency of care.
            </p>
          </div>

          {/* 3 Care Context Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {/* 1. Triage */}
            <div
              onClick={() => handleSelectContext('TRIAGE')}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '2px solid var(--danger-border)',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--status-danger)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--danger-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.08)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--danger-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-danger)' }}>
                    <Zap size={22} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--danger-subtle)', color: 'var(--status-danger)', border: '1px solid var(--danger-border)', textTransform: 'uppercase' }}>
                    Seconds Count
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Triage / Emergency
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Ultra-fast, 3-step rapid registration. Immediate vitals capture, instant acuity rating, and 1-click escalation straight to the trauma/ED board.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--status-danger)" /> 3 collapsed steps (Identity → Vitals → Escalate)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--status-danger)" /> One-click "Quick-Save & Escalate"
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--status-danger)" /> Urgent priority preset
                  </div>
                </div>
              </div>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '6px',
                  backgroundColor: 'var(--danger-subtle)',
                  color: 'var(--status-danger)',
                  border: '1px solid var(--danger-border)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Launch Triage Intake</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 2. OPD */}
            <div
              onClick={() => handleSelectContext('OPD')}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '2px solid var(--warning-border)',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--status-warning)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--warning-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.08)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--warning-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-warning)' }}>
                    <Stethoscope size={22} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--warning-subtle)', color: 'var(--status-warning)', border: '1px solid var(--warning-border)', textTransform: 'uppercase' }}>
                    Balanced Pace
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Routine Outpatient (OPD)
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Standard clinical consultation. Focused on chief complaint, rapid tab-traversable vitals grid (BP, HR, SpO2, Temp, BMI), and active medications.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--status-warning)" /> 5 structured consultative steps
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--status-warning)" /> Tab-traversable OPD vitals check-in grid
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--status-warning)" /> Focused history & medication reconciliation
                  </div>
                </div>
              </div>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '6px',
                  backgroundColor: 'var(--warning-subtle)',
                  color: 'var(--status-warning)',
                  border: '1px solid var(--warning-border)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Launch OPD Intake</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 3. Inpatient */}
            <div
              onClick={() => handleSelectContext('INPATIENT')}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '2px solid var(--border-medium)',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(3, 105, 161, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(3, 105, 161, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(3, 105, 161, 0.08)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <Building2 size={22} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--border-medium)', textTransform: 'uppercase' }}>
                    Deep Charting
                  </span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Inpatient Admission
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Comprehensive admission charting. Document and transfer packet ingestion placed at Step 2 so background AI parsing runs while clinical histories are entered.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--accent-primary)" /> Early Document Ingestion (Step 2)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--accent-primary)" /> Full longitudinal admission history
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="var(--accent-primary)" /> Background OCR / AI clinical extraction
                  </div>
                </div>
              </div>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Launch Inpatient Intake</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setActiveView('cases')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} /> Back to Cases List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: 'var(--bg-subtle)',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Intake Workspace Bar */}
      <header
        style={{
          padding: '16px 32px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveView('cases')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Return to cases list"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              New Clinical Case Intake
            </h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-subtle)', padding: '2px', borderRadius: '6px', gap: '2px' }}>
              {(['TRIAGE', 'OPD', 'INPATIENT'] as CareContext[]).map((mode) => {
                const cfg = CONTEXT_CONFIGS[mode];
                const isActive = careContext === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSelectContext(mode)}
                    title={`Switch to ${cfg.label}`}
                    style={{
                      border: 'none',
                      background: isActive ? 'var(--bg-surface)' : 'transparent',
                      color: isActive ? cfg.color : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cfg.dotColor }} />
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCareContextChosen(false)}
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '2px',
              }}
              title="View full care context guide"
            >
              Modes Guide
            </button>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              Step {currentStepNum} of {currentSteps.length}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            {contextConfig.tagline}
          </p>
        </div>

        {/* Header Actions: Reset Draft */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleClearDraft}
            title="Reset form"
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
            }}
          >
            <RotateCcw size={13} />
            <span>Reset Draft</span>
          </button>
        </div>
      </header>

      {/* Status banner (if error or success) */}
      {statusMessage && (
        <div
          style={{
            padding: '10px 32px',
            backgroundColor: statusMessage.type === 'error' ? 'var(--danger-subtle)' : 'var(--success-subtle)',
            borderBottom: `1px solid ${statusMessage.type === 'error' ? 'var(--danger-border)' : 'var(--success-subtle)'}`,
            color: statusMessage.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)',
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
        {/* LEFT COLUMN: Adaptive Clinical Intake Form */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
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
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-subtle)',
              overflowX: 'auto',
            }}
          >
            {currentSteps.map((s) => (
              <button
                key={s.num}
                onClick={() => goToStep(s.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: currentStepNum === s.num ? `2px solid ${contextConfig.color}` : '2px solid transparent',
                  backgroundColor: currentStepNum === s.num ? 'var(--bg-surface)' : 'transparent',
                  color: currentStepNum === s.num ? contextConfig.color : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: currentStepNum === s.num ? 600 : 500,
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
            {activeStepId === 'patient' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Patient Identity & Encounter Context
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Register a new longitudinal patient record with administrative sex and encounter parameters.
                  </p>
                </div>

                {duplicateWarning && (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--warning-subtle)',
                      border: '1px solid var(--warning-border)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <AlertTriangle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12px', color: 'var(--status-warning)', lineHeight: 1.5 }}>
                      {duplicateWarning}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Given Name *
                    </label>
                    <input
                      type="text"
                      value={draft.patient.givenName}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, givenName: e.target.value } }))}
                      placeholder="e.g. Arthur"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={draft.patient.familyName}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, familyName: e.target.value } }))}
                      placeholder="e.g. Pendelton (optional)"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={draft.patient.dateOfBirth}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, dateOfBirth: e.target.value } }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Administrative Sex
                    </label>
                    <select
                      value={draft.patient.administrativeSex}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, administrativeSex: e.target.value as any } }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', backgroundColor: 'var(--bg-surface)' }}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="UNKNOWN">Unknown / Unspecified</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Hospital MRN
                    </label>
                    <input
                      type="text"
                      value={draft.patient.externalPatientId}
                      onChange={(e) => setDraft((p) => ({ ...p, patient: { ...p.patient, externalPatientId: e.target.value } }))}
                      placeholder="e.g. MRN-849102"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Live Demographic & De-biased Normative Feedback */}
                {draft.patient.dateOfBirth && (() => {
                  const age = calculateAgeInYears(draft.patient.dateOfBirth);
                  if (age === undefined) return null;
                  const isPediatric = age < 12;
                  const isInfant = age < 1;
                  return (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--success-subtle)',
                        border: '1px solid var(--success-border)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <Sparkles size={13} />
                      <span>
                        <strong>Calculated Age: {age} {isInfant ? 'months' : 'years'}</strong> · {
                          isPediatric
                            ? 'Pediatric physiological vitals (HR/RR/BP) dynamically calibrated to avoid adult threshold bias.'
                            : 'Adult normative bands & 2021 CKD-EPI non-race renal elimination calibration active.'
                        } {draft.patient.administrativeSex !== 'UNKNOWN' ? `(Sex-stratified Hb/Cr: ${draft.patient.administrativeSex.toLowerCase()})` : ''}
                      </span>
                    </div>
                  );
                })()}

                {careContext === 'TRIAGE' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '-4px 0 4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const randId = Math.floor(1000 + Math.random() * 9000);
                        setDraft((p) => ({
                          ...p,
                          patient: {
                            ...p.patient,
                            givenName: 'Trauma / Unknown',
                            familyName: `Patient #${randId}`,
                            externalPatientId: `ED-EMER-${randId}`,
                            administrativeSex: 'UNKNOWN',
                          },
                          encounter: {
                            ...p.encounter,
                            priority: 'URGENT',
                            department: 'Emergency Medicine',
                            esiLevel: 1,
                          },
                        }));
                      }}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: 'var(--danger-subtle)',
                        border: '1px dashed var(--status-danger)',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--status-danger)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Zap size={13} />
                      <span>+ Fast-Fill Unidentified Emergency Patient (Trauma Resus)</span>
                    </button>
                  </div>
                )}

                {careContext === 'TRIAGE' && (
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: 'var(--danger-subtle)',
                      border: '1px solid var(--danger-border)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Zap size={20} color="var(--status-danger)" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-danger)' }}>
                          Emergency Triage Fast-Track Mode
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--status-danger)' }}>
                          Seconds count. Enter minimal identity and escalate immediately to trauma bay / ED tracking.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriageQuickEscalate}
                      disabled={isSubmitting}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 18px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--status-danger)',
                        color: 'var(--bg-surface)',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
                      }}
                    >
                      <Zap size={15} fill="var(--bg-surface)" />
                      <span>{isSubmitting ? 'Escalating...' : 'Quick-Save & Escalate (ED / Trauma)'}</span>
                    </button>
                  </div>
                )}

                <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Department routing and triage priority are automatically inferred by the clinical system from presentation acuity and observations.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2 (TRIAGE): Vitals & Presentation (Merged) ── */}
            {activeStepId === 'triage_vitals' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Triage Vitals & Acuity Evaluation
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                        Rapid data entry: Acuity score, chief presenting complaint, and immediate bedside vital signs.
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--danger-subtle)', color: 'var(--status-danger)', border: '1px solid var(--danger-border)' }}>
                      EMERGENCY TRIAGE
                    </span>
                  </div>
                </div>

                {/* Acuity Level / Priority Selector */}
                {/* Emergency Severity Index (ESI) 5-Level Algorithm Selector */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                      Emergency Severity Index (ESI 5-Level Triage) *
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Deterministic 5-tier algorithm (AHRQ / ACEP Guidelines)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {[
                      {
                        level: 1 as const,
                        tier: 'ESI 1',
                        label: 'Resuscitation',
                        desc: 'Requires immediate life-saving intervention / airway compromise',
                        bg: 'var(--danger-subtle)',
                        border: 'var(--danger-border)',
                        activeBorder: 'var(--status-danger)',
                        color: 'var(--status-danger)',
                        badgeBg: 'var(--status-danger)',
                        priority: 'URGENT' as const,
                      },
                      {
                        level: 2 as const,
                        tier: 'ESI 2',
                        label: 'Emergent',
                        desc: 'High risk, acute altered mental state, severe pain/distress (≥7/10)',
                        bg: 'var(--warning-subtle)',
                        border: 'var(--warning-border)',
                        activeBorder: 'var(--status-warning)',
                        color: 'var(--status-warning)',
                        badgeBg: 'var(--status-warning)',
                        priority: 'URGENT' as const,
                      },
                      {
                        level: 3 as const,
                        tier: 'ESI 3',
                        label: 'Urgent',
                        desc: 'Multiple resources anticipated (≥2) + stable baseline vitals',
                        bg: 'var(--warning-subtle)',
                        border: 'var(--warning-subtle)',
                        activeBorder: 'var(--status-warning)',
                        color: 'var(--status-warning)',
                        badgeBg: 'var(--status-warning)',
                        priority: 'HIGH' as const,
                      },
                      {
                        level: 4 as const,
                        tier: 'ESI 4',
                        label: 'Less Urgent',
                        desc: 'Single resource anticipated (e.g. simple X-ray or suture only)',
                        bg: 'var(--success-subtle)',
                        border: 'var(--success-subtle)',
                        activeBorder: 'var(--status-success)',
                        color: 'var(--status-success)',
                        badgeBg: 'var(--status-success)',
                        priority: 'ROUTINE' as const,
                      },
                      {
                        level: 5 as const,
                        tier: 'ESI 5',
                        label: 'Non-Urgent',
                        desc: 'No diagnostic/therapeutic resources anticipated (e.g. prescription refill)',
                        bg: 'var(--bg-subtle)',
                        border: 'var(--border-subtle)',
                        activeBorder: 'var(--text-muted)',
                        color: 'var(--text-secondary)',
                        badgeBg: 'var(--text-muted)',
                        priority: 'ROUTINE' as const,
                      },
                    ].map((esi) => {
                      const isSelected = draft.encounter.esiLevel === esi.level;
                      return (
                        <button
                          key={esi.level}
                          type="button"
                          onClick={() =>
                            setDraft((p) => ({
                              ...p,
                              encounter: {
                                ...p.encounter,
                                esiLevel: esi.level,
                                priority: esi.priority,
                              },
                            }))
                          }
                          style={{
                            padding: '10px 8px',
                            borderRadius: '8px',
                            border: isSelected ? `2px solid ${esi.activeBorder}` : `1px solid ${esi.border}`,
                            backgroundColor: isSelected ? esi.bg : 'var(--bg-surface)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: isSelected ? esi.badgeBg : 'var(--border-subtle)',
                                color: isSelected ? 'var(--bg-surface)' : 'var(--text-secondary)',
                              }}
                            >
                              {esi.tier}
                            </span>
                            {isSelected && (
                              <CheckCircle2 size={12} color={esi.activeBorder} />
                            )}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: esi.color, marginTop: '2px' }}>
                            {esi.label}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.25' }}>
                            {esi.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chief Complaint / Acuity Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Chief Complaint / Presenting Acuity *
                  </label>
                  <input
                    type="text"
                    value={draft.presentation.title}
                    onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, title: e.target.value } }))}
                    placeholder="e.g. Acute severe central chest pain radiating to left arm, diaphoresis"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '14px', fontWeight: 500 }}
                  />
                </div>

                {/* Rapid Triage Vitals Strip */}
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="var(--status-danger)" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Immediate Bedside Vitals (Tab-Traversable)
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Auto-evaluates clinical thresholds in real-time
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Blood Pressure (mmHg)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 90/60"
                        value={getVitalValue('Blood Pressure')}
                        onChange={(e) => setVitalValue('Blood Pressure', e.target.value, 'mmHg', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 124"
                        value={getVitalValue('Heart Rate')}
                        onChange={(e) => setVitalValue('Heart Rate', e.target.value, 'bpm', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        SpO2 (%)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 91"
                        value={getVitalValue('Oxygen Saturation') || getVitalValue('SpO2')}
                        onChange={(e) => setVitalValue('Oxygen Saturation (SpO2)', e.target.value, '%', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Body Temp (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 38.9"
                        value={getVitalValue('Body Temperature') || getVitalValue('Temperature')}
                        onChange={(e) => setVitalValue('Body Temperature', e.target.value, '°C', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Resp Rate (/min)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 26"
                        value={getVitalValue('Respiratory Rate')}
                        onChange={(e) => setVitalValue('Respiratory Rate', e.target.value, '/min', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Brief HPI Narrative */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Rapid HPI / Mechanism of Injury / Acute Symptoms
                  </label>
                  <textarea
                    rows={3}
                    value={draft.presentation.historyOfPresentIllness}
                    onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, historyOfPresentIllness: e.target.value } }))}
                    placeholder="Brief narrative of onset, duration, known triggers, or initial paramedic handover details..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', lineHeight: 1.5 }}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2 / 3: Clinical Presentation & History ────────── */}
            {activeStepId === 'presentation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Clinical Problem & Presentation
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Record the chief complaint, history of present illness (HPI), and physical bedside exam findings.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Chief Complaint / Clinical Problem Title *
                  </label>
                  <input
                    type="text"
                    value={draft.presentation.title}
                    onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, title: e.target.value } }))}
                    placeholder="e.g. 3-week fever of unknown origin, new regurgitant murmur, and fatigue"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    History of Present Illness (HPI)
                  </label>
                  <textarea
                    rows={4}
                    value={draft.presentation.historyOfPresentIllness}
                    onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, historyOfPresentIllness: e.target.value } }))}
                    placeholder="Chronological narrative of onset, duration, fever patterns, dental or procedural history, night sweats, etc."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Past Medical History
                    </label>
                    <textarea
                      rows={3}
                      value={draft.presentation.pastMedicalHistory}
                      onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, pastMedicalHistory: e.target.value } }))}
                      placeholder="List conditions separated by comma, semicolon, or new line. E.g.: Hypertension, Type 2 DM; Prior MI"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', lineHeight: 1.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Bedside Physical Examination
                    </label>
                    <textarea
                      rows={3}
                      value={draft.presentation.physicalExamNotes}
                      onChange={(e) => setDraft((p) => ({ ...p, presentation: { ...p.presentation, physicalExamNotes: e.target.value } }))}
                      placeholder="e.g. Murmur description, Janeway lesions, Osler nodes, splinter hemorrhages..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px', lineHeight: 1.5 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3 / 4: Structured Observations & Labs ────────── */}
            {activeStepId === 'vitals_labs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Structured Observations & Laboratory Feeds
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Enter discrete observations. Reference ranges and clinical status are automatically evaluated by the system.
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
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--bg-surface)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Custom Lab</span>
                  </button>
                </div>

                {/* Pre-populated Standard OPD Vitals Grid (Tab-Traversable) */}
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="var(--accent-primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Rapid OPD Vitals Check-in Grid (Tab-Traversable)
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Press <kbd style={{ padding: '1px 5px', background: 'var(--border-subtle)', borderRadius: '3px', fontFamily: 'monospace' }}>Tab</kbd> to move between fields
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Blood Pressure (mmHg)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 120/80"
                        value={getVitalValue('Blood Pressure')}
                        onChange={(e) => setVitalValue('Blood Pressure', e.target.value, 'mmHg', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 72"
                        value={getVitalValue('Heart Rate')}
                        onChange={(e) => setVitalValue('Heart Rate', e.target.value, 'bpm', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        SpO2 (%)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 98"
                        value={getVitalValue('Oxygen Saturation') || getVitalValue('SpO2')}
                        onChange={(e) => setVitalValue('Oxygen Saturation (SpO2)', e.target.value, '%', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Body Temp (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 36.8"
                        value={getVitalValue('Body Temperature') || getVitalValue('Temperature')}
                        onChange={(e) => setVitalValue('Body Temperature', e.target.value, '°C', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Resp Rate (/min)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 16"
                        value={getVitalValue('Respiratory Rate')}
                        onChange={(e) => setVitalValue('Respiratory Rate', e.target.value, '/min', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        BMI (kg/m²)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 23.4"
                        value={getVitalValue('BMI') || getVitalValue('Body Mass Index')}
                        onChange={(e) => setVitalValue('Body Mass Index (BMI)', e.target.value, 'kg/m²', 'vital-signs')}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                {draft.observations.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', border: '1px dashed var(--border-medium)' }}>
                    <FlaskConical size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      No discrete observations entered yet. Click "Add Observation" above to record vital signs or laboratory results.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.3fr auto', gap: '10px', padding: '0 12px 2px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <div>Observation / Test</div>
                      <div>Measured Value</div>
                      <div>System Evaluation</div>
                      <div></div>
                    </div>
                    {draft.observations.map((obs, idx) => {
                      const demoContext = {
                        dateOfBirth: draft.patient.dateOfBirth,
                        administrativeSex: draft.patient.administrativeSex,
                      };
                      const evalResult = evaluateClinicalObservation(obs.display, obs.value, obs.referenceRange, obs.interpretation, obs.unit || undefined, demoContext);
                      const displayRefRange = obs.referenceRange || evalResult.referenceRange;
                      const displayInterp = obs.interpretation || evalResult.interpretation || 'NORMAL';

                      return (
                        <div
                          key={obs.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.3fr 1.1fr 1.3fr auto',
                            gap: '10px',
                            alignItems: 'center',
                            padding: '12px',
                            backgroundColor: 'var(--bg-subtle)',
                            borderRadius: '4px',
                            border: '1px solid var(--border-medium)',
                          }}
                        >
                          <div>
                            <input
                              type="text"
                              placeholder="Test name (e.g. Potassium, SpO₂, Temp)"
                              value={obs.display}
                              onChange={(e) => {
                                const val = e.target.value;
                                const evaluated = evaluateClinicalObservation(val, obs.value, obs.referenceRange, obs.interpretation, obs.unit || undefined, demoContext);
                                setDraft((p) => ({
                                  ...p,
                                  observations: p.observations.map((o, i) =>
                                    i === idx
                                      ? {
                                          ...o,
                                          display: val,
                                          referenceRange: evaluated.referenceRange || o.referenceRange,
                                          unit: o.unit || evaluated.unit || '',
                                          interpretation: evaluated.interpretation,
                                        }
                                      : o
                                  ),
                                }));
                              }}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="text"
                              placeholder="Value (e.g. 6.2, 140/90, Positive)"
                              value={obs.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                const evaluated = evaluateClinicalObservation(obs.display, val, obs.referenceRange, obs.interpretation, obs.unit || undefined, demoContext);
                                setDraft((p) => ({
                                  ...p,
                                  observations: p.observations.map((o, i) =>
                                    i === idx
                                      ? {
                                          ...o,
                                          value: val,
                                          referenceRange: evaluated.referenceRange || o.referenceRange,
                                          interpretation: evaluated.interpretation,
                                        }
                                      : o
                                  ),
                                }));
                              }}
                              style={{ flex: 1, padding: '7px 10px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                            />
                            {/* Unit selector — only shown when the test has multiple valid units */}
                            {(() => {
                              const unitOpts = getTestUnitOptions(obs.display);
                              if (unitOpts.length <= 1) return null;
                              return (
                                <select
                                  value={obs.unit || unitOpts[0]}
                                  onChange={(e) => {
                                    const newUnit = e.target.value;
                                    const evaluated = evaluateClinicalObservation(obs.display, obs.value, undefined, obs.interpretation, newUnit, demoContext);
                                    setDraft((p) => ({
                                      ...p,
                                      observations: p.observations.map((o, i) =>
                                        i === idx
                                          ? {
                                              ...o,
                                              unit: newUnit,
                                              referenceRange: evaluated.referenceRange,
                                              interpretation: evaluated.interpretation,
                                            }
                                          : o
                                      ),
                                    }));
                                  }}
                                  style={{
                                    padding: '7px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--accent-primary)',
                                    fontSize: '11px',
                                    backgroundColor: 'var(--success-subtle)',
                                    color: 'var(--accent-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    minWidth: '80px',
                                  }}
                                >
                                  {unitOpts.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                              );
                            })()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {displayInterp === 'CRITICAL' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: 'var(--danger-subtle)',
                                    color: 'var(--status-danger)',
                                    border: '1px solid var(--danger-border)',
                                  }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-danger)' }} />
                                  Critical Finding
                                </span>
                              ) : displayInterp === 'HIGH' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: 'var(--warning-subtle)',
                                    color: 'var(--status-warning)',
                                    border: '1px solid var(--warning-border)',
                                  }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-warning)' }} />
                                  High / Elevated
                                </span>
                              ) : displayInterp === 'LOW' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: 'var(--accent-subtle)',
                                    color: 'var(--accent-primary)',
                                    border: '1px solid var(--border-medium)',
                                  }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                                  Low / Reduced
                                </span>
                              ) : displayInterp === 'ABNORMAL' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: 'var(--warning-subtle)',
                                    color: 'var(--status-warning)',
                                    border: '1px solid var(--warning-border)',
                                  }}
                                >
                                  Abnormal
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: 'var(--success-subtle)',
                                    color: 'var(--status-success)',
                                    border: '1px solid var(--success-border)',
                                  }}
                                >
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
                                  Normal
                                </span>
                              )}
                            </div>
                            {displayRefRange ? (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Ref:</span>
                                <span>{displayRefRange} {obs.unit || ''}</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Ref range auto-detected on entry
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setDraft((p) => ({ ...p, observations: p.observations.filter((_, i) => i !== idx) }));
                            }}
                            title="Remove observation"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4 / 5: Medications & Allergies ──────────────── */}
            {activeStepId === 'meds_allergies' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Allergies Block */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Documented Allergy Intolerances
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audited by the deterministic safety engine against all active orders</span>
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
                      style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-medium)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Allergy
                    </button>
                  </div>

                  {draft.allergies.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                      No documented allergies. Click "+ Add Allergy" to record documented sensitivities.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {draft.allergies.map((alg, idx) => (
                        <div key={alg.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr auto', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', borderRadius: '6px' }}>
                          <input
                            type="text"
                            placeholder="Allergen (e.g. Penicillins)"
                            value={alg.substance}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, allergies: p.allergies.map((a, i) => (i === idx ? { ...a, substance: val } : a)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Reaction (e.g. Anaphylaxis, hives)"
                            value={alg.reaction}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, allergies: p.allergies.map((a, i) => (i === idx ? { ...a, reaction: val } : a)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                          />
                          <select
                            value={alg.severity}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setDraft((p) => ({ ...p, allergies: p.allergies.map((a, i) => (i === idx ? { ...a, severity: val } : a)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px', backgroundColor: 'var(--bg-surface)' }}
                          >
                            <option value="MILD">Mild</option>
                            <option value="MODERATE">Moderate</option>
                            <option value="SEVERE">Severe (Anaphylaxis)</option>
                          </select>
                          <button onClick={() => setDraft((p) => ({ ...p, allergies: p.allergies.filter((_, i) => i !== idx) }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Medications Block */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Active / Inpatient Prescriptions
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pharmacotherapy orders evaluated for drug-allergy & dosing contradictions</span>
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
                      style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-medium)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Medication
                    </button>
                  </div>

                  {draft.medications.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }}>
                      No medications entered. Click "+ Add Medication" to record current inpatient pharmacotherapy.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {draft.medications.map((med, idx) => (
                        <div key={med.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                          <input
                            type="text"
                            placeholder="Drug name (e.g. Ceftriaxone IV)"
                            value={med.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, name: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Dose (e.g. 2g)"
                            value={med.dosage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, dosage: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                          />
                          <input
                            type="text"
                            placeholder="Frequency (e.g. q24h)"
                            value={med.frequency}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, frequency: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px' }}
                          />
                          <select
                            value={med.route}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((p) => ({ ...p, medications: p.medications.map((m, i) => (i === idx ? { ...m, route: val } : m)) }));
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border-medium)', fontSize: '12px', backgroundColor: 'var(--bg-surface)' }}
                          >
                            <option value="Oral">Oral (PO)</option>
                            <option value="Intravenous">Intravenous (IV)</option>
                            <option value="Subcutaneous">Subcutaneous (SC)</option>
                            <option value="Inhaled">Inhaled</option>
                          </select>
                          <button onClick={() => setDraft((p) => ({ ...p, medications: p.medications.filter((_, i) => i !== idx) }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2 (INPATIENT) / 5 (OPD): Documents & PDFs Ingestion ────────────── */}
            {activeStepId === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Clinical Documents & Attachment Ingestion
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Attach clinical PDFs, consultant letters, and discharge summaries. Entities extracted are marked <code>AI_EXTRACTED</code> with page provenance until verified by a clinician.
                  </p>
                </div>

                {/* PDF error */}
                {pdfExtractionError && (
                  <div style={{
                    background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', borderRadius: '6px',
                    padding: '10px 14px', fontSize: '12px', color: 'var(--status-danger)',
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

                {/* Upload Trigger Area */}
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      border: `2px dashed ${isExtractingPdf ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                      borderRadius: '8px',
                      padding: '32px 20px',
                      textAlign: 'center',
                      backgroundColor: isExtractingPdf ? 'var(--accent-subtle)' : 'var(--bg-subtle)',
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
                            border: '3px solid var(--border-medium)',
                            borderTopColor: 'var(--accent-primary)',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 8px',
                          }}
                        />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          Reconstructing file & extracting clinical entities…
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Parsing document, running NER model, and building editable data table
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload size={24} color="var(--accent-primary)" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Click to attach Clinical PDF, Scan, or Image
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Supports PDF, PNG, JPG, WEBP, TXT · Reconstructs visual file + editable clinical table
                        </div>
                      </>
                    )}
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

            {/* ── STEP 3 (TRIAGE) / 5 (OPD) / 6 (INPATIENT): Review & Activate ────────────────────── */}
            {activeStepId === 'review' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Intake Validation & Safety Review
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Review deterministic safety alerts before committing the clinical record to the hospital repository.
                  </p>
                </div>

                {/* Deterministic Safety Preview Box */}
                {safetyPreview.concerns.length > 0 ? (
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: 'var(--danger-subtle)',
                      border: '1px solid var(--danger-border)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger)', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                      <ShieldAlert size={18} />
                      <span>{safetyPreview.concerns.length} Reviewable Safety Concern(s) Flagged</span>
                    </div>
                    {safetyPreview.concerns.map((c) => (
                      <div key={c.id} style={{ fontSize: '12px', color: 'var(--status-danger)', marginTop: '4px', lineHeight: 1.5 }}>
                        • <strong>{c.category}</strong>: {c.description}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--success-subtle)',
                      border: '1px solid var(--success-border)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--status-success)',
                      fontWeight: 500,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Deterministic safety evaluation clear: No active drug-allergy or critical threshold conflicts detected.</span>
                  </div>
                )}

                {/* Case Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>PATIENT IDENTITY</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {draft.patient.givenName} {draft.patient.familyName || '(Unnamed)'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      DOB: {draft.patient.dateOfBirth || 'Unspecified'} · Sex: {draft.patient.administrativeSex} · MRN: {draft.patient.externalPatientId || 'Pending'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
                        Clinical Problem & Routing
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-primary)', backgroundColor: 'var(--success-subtle)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--success-border)', fontWeight: 600 }}>
                        <Sparkles size={11} /> Auto-Triaged
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {draft.presentation.title || '(No title entered)'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginTop: '4px', fontSize: '12px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '11px',
                        backgroundColor: draft.encounter.priority === 'URGENT' ? 'var(--danger-subtle)' : draft.encounter.priority === 'HIGH' ? 'var(--warning-subtle)' : 'var(--success-subtle)',
                        color: draft.encounter.priority === 'URGENT' ? 'var(--status-danger)' : draft.encounter.priority === 'HIGH' ? 'var(--status-warning)' : 'var(--status-success)',
                        border: `1px solid ${draft.encounter.priority === 'URGENT' ? 'var(--danger-border)' : draft.encounter.priority === 'HIGH' ? 'var(--warning-border)' : 'var(--success-border)'}`
                      }}>
                        {draft.encounter.priority}
                      </span>
                      <span>·</span>
                      <span>{draft.encounter.department}</span>
                    </div>
                  </div>
                </div>

                {/* Submission Actions */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-subtle)',
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
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
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
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--bg-surface)',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Play size={14} fill="var(--bg-surface)" />
                    <span>{isSubmitting ? 'Persisting & Analyzing...' : 'Create Case & Run Nexus Analysis'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Bottom Controls */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              position: 'sticky',
              bottom: 0,
              zIndex: 20,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              disabled={currentStepNum === 1}
              onClick={() => goToStep(currentStepNum - 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: currentStepNum === 1 ? 'var(--border-medium)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: currentStepNum === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            {currentStepNum < currentSteps.length ? (
              <button
                onClick={() => goToStep(currentStepNum + 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '6px',
                  backgroundColor: contextConfig.color,
                  color: 'var(--bg-surface)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                }}
              >
                <span>Next Step</span>
                <ArrowRight size={14} />
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
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              position: 'sticky',
              top: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--bg-subtle)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                  LIVE PREVIEW
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: contextConfig.bgColor,
                    color: contextConfig.color,
                    border: `1px solid ${contextConfig.borderColor}`,
                  }}
                >
                  {contextConfig.shortLabel}
                </span>
              </div>
              <button
                onClick={() => setCareContextChosen(false)}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
                title="Switch care mode"
              >
                Change Mode
              </button>
            </div>

            {/* Patient Card Preview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>PATIENT</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {draft.patient.givenName || draft.patient.familyName
                  ? `${draft.patient.givenName} ${draft.patient.familyName}`.trim()
                  : 'Patient Name Pending'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {draft.patient.dateOfBirth ? `${draft.patient.dateOfBirth} · ` : ''}
                Sex: {draft.patient.administrativeSex}
                {draft.patient.externalPatientId ? ` · MRN: ${draft.patient.externalPatientId}` : ''}
              </div>
            </div>

            {/* Presentation Preview */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>PRESENTATION</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                {draft.presentation.title || 'Enter chief complaint / problem in Step 2'}
              </div>
            </div>

            {/* Live ESI Triage Stratification */}
            {(() => {
              const triageInfo = inferCaseTriage(draft.presentation, draft.observations, undefined, {
                dateOfBirth: draft.patient.dateOfBirth,
                administrativeSex: draft.patient.administrativeSex,
              });
              const esi = triageInfo.esiEvaluation;
              if (!esi) return null;
              return (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: esi.level === 1 ? 'var(--danger-subtle)' : esi.level === 2 ? 'var(--warning-subtle)' : 'var(--bg-subtle)',
                    border: `1px solid ${esi.badgeColor}50`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      ESI Triage Level
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: esi.badgeColor,
                        color: 'var(--bg-surface)',
                      }}
                    >
                      {esi.levelName}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {esi.rationale}
                  </p>
                  {esi.isLifeSavingRequired && (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <AlertTriangle size={12} /> IMMEDIATE RESUSCITATION INTERVENTION
                    </div>
                  )}
                  {esi.dangerZoneTriggered && (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <AlertTriangle size={12} /> DANGER ZONE VITALS BREACH (UPGRADED TO ESI 2)
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Data Stream Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {draft.observations.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Observations / Labs</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {draft.medications.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Medications</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: draft.allergies.length > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                  {draft.allergies.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Documented Allergies</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {draft.documents.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attached PDFs/Docs</div>
              </div>
            </div>

            {/* Live Safety Status Pill */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: safetyPreview.concerns.length > 0 ? 'var(--danger-subtle)' : 'var(--success-subtle)',
                border: `1px solid ${safetyPreview.concerns.length > 0 ? 'var(--danger-border)' : 'var(--success-border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: safetyPreview.concerns.length > 0 ? 'var(--status-danger)' : 'var(--status-success)',
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

            {/* Quick PDF Export of Current Intake & Live Preview */}
            <button
              type="button"
              onClick={() => {
                const proxyCase: FullSyntheticCase = {
                  overview: {
                    id: draft.patient.externalPatientId || 'INTAKE-PREVIEW',
                    patient: {
                      id: 'preview-pat',
                      syntheticIdentifier: `${draft.patient.givenName || 'Unnamed'} ${draft.patient.familyName || 'Patient'}`.trim(),
                      age: draft.patient.dateOfBirth ? Math.max(1, new Date().getFullYear() - new Date(draft.patient.dateOfBirth).getFullYear()) : 45,
                      gender: draft.patient.administrativeSex === 'MALE' ? 'Male' : draft.patient.administrativeSex === 'FEMALE' ? 'Female' : 'Other',
                      encounterNumber: '#INTAKE',
                      encounterType: draft.encounter.encounterClass === 'EMER' ? 'Emergency evaluation' : 'Inpatient admission',
                      encounterDate: 'Today',
                      allergiesCount: draft.allergies.length,
                      activeMedicationsCount: draft.medications.length,
                      allergies: draft.allergies.map((a) => ({ allergen: a.substance, severity: a.severity === 'SEVERE' ? 'Severe' : a.severity === 'MODERATE' ? 'Moderate' : 'Mild', reaction: a.reaction })),
                      medications: draft.medications.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, route: m.route })),
                    },
                    state: 'REVIEW_REQUIRED',
                    priority: draft.encounter.priority === 'URGENT' ? 'urgent' : 'normal',
                    assignedClinician: 'Triage Clinician',
                    assignedTeam: ['Intake Team'],
                    lastUpdate: 'Just now',
                    safetyIssueCount: safetyPreview.concerns.length,
                    gapsCount: 0,
                    hypothesesCount: 0,
                  },
                  chiefComplaint: draft.presentation.title,
                  historyOfPresentIllness: draft.presentation.historyOfPresentIllness,
                  pastMedicalHistory: draft.presentation.pastMedicalHistory ? [draft.presentation.pastMedicalHistory] : [],
                  vitalSigns: [],
                  findings: draft.observations.map((o, idx) => ({
                    id: `fnd-prev-${idx}`,
                    caseId: 'preview',
                    label: o.display,
                    description: `${o.value} ${o.unit || ''}`.trim(),
                    category: o.category === 'vital-signs' ? 'vital' : 'observation',
                    sourceDisplay: 'Intake Bedside',
                    statusDisplay: o.interpretation || 'Recorded',
                    status: 'VERIFIED',
                    createdAt: new Date().toISOString(),
                    provenance: {
                      sourceText: o.value,
                      sourceContext: 'Bedside intake',
                      recordedBy: o.actorName || 'Clinician',
                      recordedAt: new Date().toISOString(),
                      provenanceType: 'HUMAN_ENTERED',
                      verificationStatus: 'Verified',
                    },
                  })),
                  hypotheses: [],
                  uncertainty: {
                    overallState: 'REQUIRES REVIEW',
                    dataCompleteness: 'Moderate',
                    dataCompletenessReason: 'Intake draft',
                    evidenceConsistency: 'High',
                    evidenceConsistencyReason: 'Bedside observations',
                    modelApplicability: 'High',
                    modelApplicabilityReason: 'Direct intake',
                    primaryReason: 'Intake preview',
                  },
                  informationGaps: [],
                  investigations: [],
                  timeline: [],
                  safetyIssues: safetyPreview.concerns.map((c) => ({
                    id: c.id,
                    title: c.category,
                    severity: c.severity === 'SAFETY_CRITICAL' ? 'High' : 'Moderate',
                    affectedHypotheses: [],
                    reason: c.category,
                    details: c.description,
                    recommendedStep: c.recommendedAction || 'Review',
                    status: 'Active - Review Required',
                    detectedAt: 'Just now',
                  })),
                  clinicalDecision: {
                    caseId: 'preview',
                    isRecorded: false,
                    decisionMakerName: '',
                    decisionMakerRole: '',
                    recordedAt: '',
                    assessment: '',
                    primaryDecision: '',
                    rationale: '',
                    supportingFindings: [],
                    supportingInvestigations: [],
                    supportingEvidence: [],
                    followUpPlan: '',
                    legalDisclaimerAcknowledged: false,
                  },
                };
                exportCaseToPdf({ fullCase: proxyCase });
              }}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              title="Export intake data, vitals, and live ESI triage evaluation to PDF report"
            >
              <Printer size={14} />
              <span>Export Intake Dossier (PDF)</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
