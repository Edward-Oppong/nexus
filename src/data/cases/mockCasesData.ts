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
  nexusAssessment?: NexusAssessment;
}

export const EMPTY_CASE: FullSyntheticCase = {
  overview: {
    id: '',
    patient: {
      id: '',
      syntheticIdentifier: 'No active patient',
      age: 0,
      gender: 'Other',
      encounterNumber: '',
      encounterType: 'Outpatient encounter',
      encounterDate: '',
      allergiesCount: 0,
      activeMedicationsCount: 0,
      allergies: [],
      medications: [],
    },
    state: 'DRAFT',
    priority: 'normal',
    assignedClinician: '',
    assignedTeam: [],
    lastUpdate: 'None',
    safetyIssueCount: 0,
    gapsCount: 0,
    hypothesesCount: 0,
  },
  chiefComplaint: 'No active case selected',
  historyOfPresentIllness: 'Select a case from the Case Directory or register a new case to begin clinical reasoning.',
  vitalSigns: [],
  pastMedicalHistory: [],
  findings: [],
  hypotheses: [],
  uncertainty: {
    dataCompleteness: 'Low',
    dataCompletenessReason: 'No case loaded.',
    evidenceConsistency: 'High',
    evidenceConsistencyReason: 'No case loaded.',
    modelApplicability: 'High',
    modelApplicabilityReason: 'No case loaded.',
    overallState: 'INSUFFICIENT DATA',
    primaryReason: 'No case loaded.',
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

export const SYNTHETIC_CASE_10482: FullSyntheticCase = EMPTY_CASE;
export const MOCK_FULL_CASES_REGISTRY: Record<string, FullSyntheticCase> = {};
export const MOCK_CASES_LIST: CaseOverview[] = [];
