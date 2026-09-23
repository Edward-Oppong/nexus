// ============================================================
// src/data/cases/mockWorkflowData.ts
// Phase 6G: Mock Data for Review Queue, Safety Concerns,
// Immutable Decisions, and Clinical Tasks
// ============================================================

import {
  ReviewItem,
  ClinicalReviewRecord,
  SafetyConcern,
  Decision,
  ClinicalTask,
} from '../../domain/workflow';

export const INITIAL_SAFETY_CONCERNS: SafetyConcern[] = [
  {
    id: 'sc-1',
    caseId: '10482',
    severity: 'SAFETY_CRITICAL',
    category: 'Severe Allergy Contraindication & Therapeutic Cross-Reactivity',
    description:
      'Patient has documented history of severe anaphylactoid urticaria and bronchospasm to Penicillins/Amoxicillin. Standard first-line endocarditis regimens (Penicillin G or Ampicillin/Ceftriaxone) are strictly contraindicated.',
    triggerSource: 'SYSTEM',
    recommendedAction:
      'Consult Infectious Disease Pharmacy (Chioma Okafor) and select non-beta-lactam glycopeptide regimen (IV Vancomycin with AUC-targeted trough monitoring) prior to administration.',
    status: 'OPEN',
    createdAt: '2026-09-10T09:46:00Z',
  },
  {
    id: 'sc-2',
    caseId: '10482',
    severity: 'ATTENTION',
    category: 'Measurement Discrepancy & Timing',
    description:
      'Triage heart rate recorded 102 bpm (supine) vs 114 bpm (seated). Mild orthostatic response noted during vital acquisition.',
    triggerSource: 'NEXUS',
    recommendedAction: 'Re-assess orthostatic vitals after 1L isotonic crystalloid resuscitation.',
    status: 'ACKNOWLEDGED',
    createdAt: '2026-09-10T09:44:00Z',
    acknowledgedBy: 'dr-edward-vance',
    acknowledgedByName: 'Dr. Edward Vance, MD',
    acknowledgedAt: '2026-09-10T09:50:00Z',
    clinicalNote: 'Patient received 500 mL warm saline; tachycardia stabilized at 98 bpm.',
  },
];

export const INITIAL_REVIEW_QUEUE: ReviewItem[] = [
  {
    id: 'rev-1',
    caseId: '10482',
    caseTitle: 'Fever and subungual lesions following dental procedure',
    patientIdentifier: 'Synthetic Patient A (#00482)',
    itemType: 'NEXUS_ASSESSMENT',
    priority: 'HIGH',
    title: 'Nexus Clinical Reasoning & Differential Synthesis',
    description:
      'Algorithmic differential highlights 1 Major + 2 Minor Duke criteria for Infective Endocarditis. Requires clinician adjudication of candidate hypotheses.',
    sourceContext: 'Nexus Clinical Reasoning Engine v2.1',
    status: 'PENDING',
    createdAt: '2026-09-10T09:55:00Z',
    targetId: 'na-10482',
  },
  {
    id: 'rev-2',
    caseId: '10482',
    caseTitle: 'Fever and subungual lesions following dental procedure',
    patientIdentifier: 'Synthetic Patient A (#00482)',
    itemType: 'AI_FINDING',
    priority: 'ROUTINE',
    title: 'AI Finding: Exertional fatigue & malaise (3-week duration)',
    description:
      'NLP extraction from patient intake interview narrative. Currently marked Unverified.',
    sourceContext: 'Nexus NLP v1.3 Intake Parser',
    status: 'PENDING',
    createdAt: '2026-09-10T09:35:00Z',
    targetId: 'f-1',
  },
  {
    id: 'rev-3',
    caseId: '10482',
    caseTitle: 'Fever and subungual lesions following dental procedure',
    patientIdentifier: 'Synthetic Patient A (#00482)',
    itemType: 'SAFETY_CONCERN',
    priority: 'URGENT',
    title: 'Safety Alert: Severe Penicillin Anaphylaxis vs First-Line Protocol',
    description:
      'Blocking workflow hazard: Standard antibiotic protocol violates verified penicillin allergy.',
    sourceContext: 'Nexus Deterministic Safety Rule #402',
    status: 'PENDING',
    createdAt: '2026-09-10T09:46:00Z',
    targetId: 'sc-1',
  },
  {
    id: 'rev-4',
    caseId: '10482',
    caseTitle: 'Fever and subungual lesions following dental procedure',
    patientIdentifier: 'Synthetic Patient A (#00482)',
    itemType: 'CONTRADICTION',
    priority: 'HIGH',
    title: 'Contradiction: Diffuse small joint arthralgias vs Embolic splinter lesions',
    description:
      'Tension between systemic rheumatologic picture and localized vascular stigmata.',
    sourceContext: 'Nexus Contradiction Detector',
    status: 'PENDING',
    createdAt: '2026-09-10T09:52:00Z',
    targetId: 'contra-1',
  },
  {
    id: 'rev-5',
    caseId: '10001',
    caseTitle: 'Acute substernal chest discomfort on exertion',
    patientIdentifier: 'Arthur Pendleton (#E-10001)',
    itemType: 'INVESTIGATION_RESULT',
    priority: 'HIGH',
    title: 'Investigation Result: High-Sensitivity Troponin I Elevated (0.42 ng/mL)',
    description:
      'Repeat troponin demonstrates significant kinetic rise above 99th percentile URL. Urgent clinician review required.',
    sourceContext: 'Automated Hospital Laboratory Feed (Abbott Architect)',
    status: 'PENDING',
    createdAt: '2026-09-10T10:10:00Z',
    targetId: 'inv-troponin-1',
  },
];

export const INITIAL_DECISIONS: Decision[] = [
  {
    id: 'dec-10482-1',
    caseId: '10482',
    decisionType: 'CLINICAL_ASSESSMENT',
    summary:
      '42-year-old female with persistent Streptococcus viridans bacteremia, new apical regurgitant murmur, splinter hemorrhages, and recent dental manipulation, highly consistent with Subacute Bacterial Infective Endocarditis.',
    rationale:
      'Fulfills Duke clinical criteria for high-probability endocarditis. Immediate bactericidal therapy is mandatory to prevent embolic phenomena or progressive valvular destruction.',
    recordedBy: 'Dr. Edward Vance, MD',
    recordedByRole: 'Attending Physician · Lead Clinician',
    status: 'ACTIVE',
    recordedAt: '2026-09-10T10:30:00Z',
    relatedAssessmentId: 'na-10482',
    supportingEvidenceIds: ['ev-aha-2025', 'ev-duke-2024'],
    supportingFindingIds: ['f-2', 'f-3', 'f-4', 'f-5'],
    legalDisclaimerAcknowledged: true,
  },
];

export const INITIAL_TASKS: ClinicalTask[] = [
  {
    id: 'task-101',
    caseId: '10482',
    patientIdentifier: 'Synthetic Patient A (#00482)',
    title: 'Review urgent Transesophageal Echocardiogram (TEE) imaging',
    description:
      'Cardiology team performing TEE at bedside to assess mitral vegetation size (>10mm threshold for urgent cardiothoracic surgical consultation).',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    dueAt: 'Today, 14:00',
    assignedTo: 'dr-edward-vance',
    assignedToName: 'Dr. Edward Vance, MD',
    createdBy: 'dr-edward-vance',
    createdByName: 'Dr. Edward Vance, MD',
    createdAt: '2026-09-10T10:05:00Z',
    relatedAssessmentId: 'na-10482',
  },
  {
    id: 'task-102',
    caseId: '10482',
    patientIdentifier: 'Synthetic Patient A (#00482)',
    title: 'Coordinate Vancomycin loading & AUC target protocol with ID Pharmacy',
    description:
      'Review renal function (serum creatinine 0.88 mg/dL) and calculate weight-based loading dose (25-30 mg/kg) given severe penicillin allergy.',
    status: 'OPEN',
    priority: 'HIGH',
    dueAt: 'Today, 12:00',
    assignedTo: 'pharm-chioma-okafor',
    assignedToName: 'Chioma Okafor, PharmD',
    createdBy: 'dr-edward-vance',
    createdByName: 'Dr. Edward Vance, MD',
    createdAt: '2026-09-10T10:10:00Z',
    relatedFindingId: 'f-7',
  },
  {
    id: 'task-103',
    caseId: '10001',
    patientIdentifier: 'Arthur Pendleton (#E-10001)',
    title: 'Immediate 12-Lead ECG correlation for elevated troponin',
    description:
      'Compare new ECG with prior 2024 baseline tracing to rule out dynamic STEMI or acute coronary syndrome.',
    status: 'OPEN',
    priority: 'HIGH',
    dueAt: 'Immediate',
    assignedTo: 'dr-sarah-chen',
    assignedToName: 'Dr. Sarah Chen, MD',
    createdBy: 'system',
    createdByName: 'Nexus Clinical Guardrail',
    createdAt: '2026-09-10T10:12:00Z',
  },
];
