import { SyntheticPatient, CaseOverview } from '../../domain/case';
import { ClinicalFinding } from '../../domain/finding';
import { CandidateHypothesis, QualitativeUncertainty, InformationGap } from '../../domain/hypothesis';
import { InvestigationOrder } from '../../domain/investigation';
import { TimelineEvent } from '../../domain/timeline';
import { SafetyIssue } from '../../domain/safety';
import { ClinicalDecision } from '../../domain/decision';
import { NexusAssessment } from '../../domain/nexus-assessment';

export interface FullSyntheticCase {
  overview: CaseOverview;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  vitalSigns: Array<{
    parameter: string;
    value: string;
    unit: string;
    recordedBy: string;
    recordedAt: string;
    sourceDevice: string;
    status: 'Normal' | 'Elevated' | 'Low' | 'Critical';
  }>;
  pastMedicalHistory: string[];
  findings: ClinicalFinding[];
  hypotheses: CandidateHypothesis[];
  uncertainty: QualitativeUncertainty;
  informationGaps: InformationGap[];
  investigations: InvestigationOrder[];
  timeline: TimelineEvent[];
  safetyIssues: SafetyIssue[];
  clinicalDecision: ClinicalDecision;
  // Phase 6F: Pre-populated Nexus assessment (optional — null until first analysis)
  nexusAssessment?: NexusAssessment;
}

// ── All synthetic demo cases have been removed ──────────────────────────────
// The application now starts with an empty case list.
// Cases are created by clinicians via the New Case intake workflow.

export const MOCK_FULL_CASES_REGISTRY: Record<string, FullSyntheticCase> = {};

export const MOCK_CASES_LIST: CaseOverview[] = [];

// ── Empty sentinel used as the default active case before any case is opened ──
export const EMPTY_CASE: FullSyntheticCase = {
  overview: {
    id: '',
    patient: {
      id: '',
      syntheticIdentifier: 'No Active Patient',
      age: 0,
      gender: 'Other',
      encounterNumber: 'N/A',
      encounterType: 'Consultation',
      encounterDate: '',
      allergiesCount: 0,
      activeMedicationsCount: 0,
      allergies: [],
      medications: [],
    },
    state: 'RESOLVED',
    priority: 'normal',
    assignedClinician: 'Unassigned',
    assignedTeam: [],
    lastUpdate: 'None',
    safetyIssueCount: 0,
    gapsCount: 0,
    hypothesesCount: 0,
  },
  chiefComplaint: '',
  historyOfPresentIllness: '',
  vitalSigns: [],
  pastMedicalHistory: [],
  findings: [],
  hypotheses: [],
  uncertainty: {
    dataCompleteness: 'High',
    dataCompletenessReason: 'Initial clean state',
    evidenceConsistency: 'High',
    evidenceConsistencyReason: 'No contradictory signals',
    modelApplicability: 'High',
    modelApplicabilityReason: 'Baseline state',
    overallState: 'STABLE',
    primaryReason: 'No active clinical case loaded',
  },
  informationGaps: [],
  investigations: [],
  timeline: [],
  safetyIssues: [],
  clinicalDecision: {
    caseId: '',
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
  nexusAssessment: undefined,
};

// Backward-compat alias — some API files import this by name
export const SYNTHETIC_CASE_10482 = EMPTY_CASE;
