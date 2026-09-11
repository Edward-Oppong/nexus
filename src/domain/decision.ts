export interface ClinicalDecision {
  caseId: string;
  isRecorded: boolean;
  decisionMakerName: string;
  decisionMakerRole: string;
  recordedAt?: string;
  assessment: string;
  primaryDecision: string;
  rationale: string;
  supportingFindings: string[];
  supportingInvestigations: string[];
  supportingEvidence: string[];
  followUpPlan: string;
  legalDisclaimerAcknowledged: boolean;
}
