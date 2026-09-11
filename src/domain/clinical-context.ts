// ============================================================
// src/domain/clinical-context.ts
// Phase 6D: Case Workspace Composite Data Model (Section 15)
// Represents the progressively loaded clinical domain context.
// ============================================================

import { Case } from './case';
import { Patient } from './patient';
import { Encounter } from './encounter';
import { CaseMember } from './case-member';
import { ClinicalFinding } from './finding';
import { CandidateHypothesis } from './hypothesis';
import { InvestigationOrder } from './investigation';
import { EvidenceItem } from './evidence';
import { SafetyIssue } from './safety';
import { TimelineEvent } from './timeline';

export interface CaseWorkspaceData {
  case: Case;
  patient: Patient;
  encounter?: Encounter;
  findings: ClinicalFinding[];
  hypotheses: CandidateHypothesis[];
  investigations: InvestigationOrder[];
  evidence: EvidenceItem[];
  safetyConcerns: SafetyIssue[];
  team: CaseMember[];
  timeline: TimelineEvent[];
}
