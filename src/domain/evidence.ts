// ============================================================
// src/domain/evidence.ts
// Phase 6F: Canonical Evidence Domain Model
// Evidence is not just a URL — it carries source type, authority
// tier, retrieval provenance, and typed relationships to hypotheses.
// FHIR R4: DocumentReference, Citation (R5 preview)
// ============================================================

// ----------------------------------------------------------
// Evidence source type hierarchy (authority tiers 1–5)
// ----------------------------------------------------------
export type EvidenceSourceType =
  | 'GUIDELINE'           // Tier 1 — authoritative clinical recommendations
  | 'SYSTEMATIC_REVIEW'  // Tier 2 — systematic evidence synthesis
  | 'META_ANALYSIS'      // Tier 2 — pooled quantitative synthesis
  | 'CLINICAL_STUDY'     // Tier 3 — peer-reviewed primary research
  | 'TEXTBOOK'           // Tier 4 — reference material
  | 'REFERENCE'          // Tier 4 — reference material (other)
  | 'OTHER';             // Tier 5 — contextual / secondary

export type AuthorityTier = 1 | 2 | 3 | 4 | 5;

export const AUTHORITY_TIER_LABELS: Record<AuthorityTier, string> = {
  1: 'Clinical Guideline',
  2: 'Systematic Review / Meta-Analysis',
  3: 'Peer-Reviewed Study',
  4: 'Reference Material',
  5: 'Contextual Source',
};

export function getAuthorityTier(sourceType: EvidenceSourceType): AuthorityTier {
  switch (sourceType) {
    case 'GUIDELINE':         return 1;
    case 'SYSTEMATIC_REVIEW':
    case 'META_ANALYSIS':     return 2;
    case 'CLINICAL_STUDY':    return 3;
    case 'TEXTBOOK':
    case 'REFERENCE':         return 4;
    default:                  return 5;
  }
}

// ----------------------------------------------------------
// Evidence relationship types
// ----------------------------------------------------------
export type EvidenceRelationshipType =
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'CONTEXTUALIZES'
  | 'REQUIRES_REVIEW';

// ----------------------------------------------------------
// Canonical evidence source (shared library — not case-scoped)
// ----------------------------------------------------------
export interface EvidenceSource {
  id: string;
  title: string;
  sourceType: EvidenceSourceType;
  authorityTier: AuthorityTier;
  authority?: string;           // Issuing body: 'WHO', 'AHA/ACC', 'NICE'
  citation?: string;
  url?: string;
  publicationDate?: string;
  retrievalDate: string;
  applicability?: string;
  abstract?: string;
  relevantPassage?: string;
  createdAt: string;
  // Links to which hypotheses in mock data this evidence relates to
  hypothesisIds?: string[];
}

// ----------------------------------------------------------
// Evidence link (case-scoped relationship)
// ----------------------------------------------------------
export interface EvidenceLink {
  id: string;
  caseId: string;
  hypothesisId?: string;
  evidenceSourceId: string;
  relationship: EvidenceRelationshipType;
  rationale?: string;
  createdAt: string;
}

// ----------------------------------------------------------
// Evidence service interfaces (pure interfaces — no implementation)
// ----------------------------------------------------------
export interface EvidenceQuery {
  question: string;
  caseId?: string;
  hypothesisId?: string;
  hypothesis?: string;
  clinicalContext?: string[];
  sourceTypes?: EvidenceSourceType[];
  publishedAfter?: string;
  limit?: number;
}

export interface EvidenceResult {
  source: EvidenceSource;
  relevanceScore?: number;      // Retrieval relevance only — NOT clinical certainty
  matchedConcepts: string[];
  excerpt?: string;
  relationship?: EvidenceRelationshipType;
  applicabilityReason?: string;
}

// ----------------------------------------------------------
// Backward-compatible EvidenceItem type
// Used by existing EvidenceDrawer and mockEvidence data.
// Maps to EvidenceSource but keeps legacy fields.
// ----------------------------------------------------------
export type AuthorityLevel = 'High' | 'Moderate' | 'Standard';
export type EvidenceApplicability = 'High' | 'Moderate' | 'Limited';
export type EvidenceRelationship = 'Supports' | 'Contradicts' | 'Inconclusive';

export interface EvidenceItem {
  id: string;
  title: string;
  sourceOrganization: string;
  documentType: 'Clinical Practice Guideline' | 'Diagnostic Criteria Protocol' | 'Consensus Statement' | 'Systematic Review';
  publicationYear: string;
  retrievalDate: string;
  authority: AuthorityLevel;
  applicability: EvidenceApplicability;
  applicabilityReason: string;
  relationship: EvidenceRelationship;
  relevantHypothesisId: string;
  relevantPassage: string;
  citation: string;
  relevanceExplanation: string;
  // Phase 6F additions (optional for backward compat)
  sourceType?: EvidenceSourceType;
  authorityTier?: AuthorityTier;
  abstract?: string;
  hypothesisIds?: string[];
}
