// ============================================================
// src/domain/intelligence.ts
// Phase 6E: Nexus Clinical Intelligence Service Interfaces & Data Structures
// Decouples AI reasoning outputs from diagnostic conclusions.
// ============================================================

export type HypothesisFindingRelationship = 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXTUALIZES';

export interface HypothesisFinding {
  hypothesisId: string;
  findingId: string;
  relationship: HypothesisFindingRelationship;
  rationale?: string;
}

export interface MissingInformation {
  id: string;
  caseId: string;
  description: string;
  importance: 'LOW' | 'MODERATE' | 'HIGH';
  status: 'OPEN' | 'ADDRESSED' | 'DISMISSED';
}

export interface NexusAssessment {
  id: string;
  caseId: string;
  status: 'GENERATED' | 'REVIEW_REQUIRED' | 'REVIEWED' | 'SUPERSEDED';
  summary: string;
  dataCompleteness?: number;       // Completeness of clinical context, NOT diagnostic probability
  evidenceConsistency?: number;   // Agreement between biomarkers/signs
  applicability?: string;
  limitations?: string;
  modelName?: string;
  modelVersion?: string;
  createdAt: string;
}

export interface NexusFinding {
  id: string;
  assessmentId: string;
  findingType: 'SUPPORT' | 'CONTRADICTION' | 'MISSING_INFORMATION' | 'CONTEXT' | 'SAFETY';
  content: string;
  status: 'UNREVIEWED' | 'ACCEPTED' | 'EDITED' | 'REJECTED';
  createdAt: string;
}

export interface NexusRecommendation {
  id: string;
  assessmentId: string;
  category: 'REVIEW' | 'INFORMATION' | 'INVESTIGATION' | 'SAFETY' | 'FOLLOW_UP';
  content: string;
  rationale?: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}
