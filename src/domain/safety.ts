export type SafetySeverity = 'High' | 'Moderate' | 'Low';
export type SafetyStatus = 'Active - Review Required' | 'Acknowledged' | 'Resolved';

export interface SafetyIssue {
  id: string;
  title: string;
  category?: string;
  description?: string;
  severity: SafetySeverity;
  affectedHypotheses: string[];
  reason: string;
  details: string;
  recommendedStep: string;
  status: SafetyStatus;
  detectedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  clinicalNote?: string;
}
