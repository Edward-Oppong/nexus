export type UserRole =
  | 'clinician'
  | 'nurse'
  | 'laboratory'
  | 'specialist'
  | 'pharmacist'
  | 'reviewer'
  | 'administrator';

export interface ClinicalPersona {
  id: string;
  name: string;
  title: string;
  role: UserRole;
  roleDisplay: string;
  department: string;
  avatarInitials: string;
  allowedActions: {
    canAddFindings: boolean;
    canRecordVitals: boolean;
    canRequestInvestigations: boolean;
    canEnterLabResults: boolean;
    canReviewNexusFindings: boolean;
    canRecordClinicalDecision: boolean;
    canResolveSafetyAlerts: boolean;
    canEditPatientData: boolean;
  };
}
