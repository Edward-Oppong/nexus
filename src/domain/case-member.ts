// ============================================================
// src/domain/case-member.ts
// Phase 6D: Case Member Responsibility Model
// Separates professional identity (e.g. Clinician) from case responsibility (e.g. Lead, Reviewer)
// ============================================================

export type CaseRole =
  | 'LEAD'
  | 'CONTRIBUTOR'
  | 'REVIEWER'
  | 'OBSERVER';

export interface CaseMember {
  id: string;
  caseId: string;
  userId: string;
  caseRole: CaseRole;
  fullName?: string;
  email?: string;
  profession?: string;
  joinedAt: string;
}
