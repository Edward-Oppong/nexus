// ============================================================
// src/domain/diagnostic-report.ts
// Phase 6E: Diagnostic Report Domain Model (Section 11)
// Represents specialist narrative reports (Radiology, Pathology).
// FHIR R4 Alignment: DiagnosticReport Resource
// ============================================================

export interface DiagnosticReport {
  id: string;
  caseId: string;
  investigationId?: string;
  reportType: 'RADIOLOGY' | 'PATHOLOGY' | 'CARDIOLOGY' | 'MICROBIOLOGY' | 'OTHER';
  title: string;
  conclusion?: string;
  status: 'PRELIMINARY' | 'FINAL' | 'AMENDED';
  authoredBy?: string;
  authoredAt?: string;
  createdAt: string;
}
