// ============================================================
// src/lib/intelligence/evidence-service.ts
// Phase 6F: Layer 2 — Evidence Retrieval Service
// Retrieves relevant evidence for a clinical question.
// Architecture is provider-replaceable (PubMed adapter later).
// Do not let an LLM invent citations — retrieve first, then reason.
// ============================================================

import { EvidenceQuery, EvidenceResult, EvidenceItem } from '../../domain/evidence';
import { MOCK_EVIDENCE_ITEMS } from '../../data/evidence/mockEvidence';

// ----------------------------------------------------------
// Convert legacy EvidenceItem to EvidenceResult for the pipeline
// ----------------------------------------------------------
function evidenceItemToResult(item: EvidenceItem, matchedConcepts: string[], score: number): EvidenceResult {
  return {
    source: {
      id: item.id,
      title: item.title,
      sourceType: item.sourceType ?? (
        item.documentType === 'Clinical Practice Guideline' ? 'GUIDELINE' :
        item.documentType === 'Systematic Review' ? 'SYSTEMATIC_REVIEW' :
        item.documentType === 'Diagnostic Criteria Protocol' ? 'GUIDELINE' :
        item.documentType === 'Consensus Statement' ? 'SYSTEMATIC_REVIEW' : 'REFERENCE'
      ),
      authorityTier: item.authorityTier ?? (item.authority === 'High' ? 1 : item.authority === 'Moderate' ? 2 : 4),
      authority: item.sourceOrganization,
      citation: item.citation,
      retrievalDate: item.retrievalDate,
      publicationDate: item.publicationYear,
      applicability: item.applicabilityReason,
      abstract: item.abstract,
      relevantPassage: item.relevantPassage,
      hypothesisIds: item.hypothesisIds ?? [item.relevantHypothesisId],
      createdAt: new Date().toISOString(),
    },
    relevanceScore: score,
    matchedConcepts,
    excerpt: item.relevantPassage,
    relationship: item.relationship === 'Supports' ? 'SUPPORTS' :
                  item.relationship === 'Contradicts' ? 'CONTRADICTS' : 'CONTEXTUALIZES',
    applicabilityReason: item.applicabilityReason,
  };
}

// ----------------------------------------------------------
// Keyword concept extraction from a query
// ----------------------------------------------------------
function extractConcepts(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/);
  const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'what', 'why', 'how', 'for', 'in', 'on', 'at', 'to', 'of', 'and', 'or']);
  return terms.filter((t) => t.length > 3 && !stopWords.has(t));
}

// ----------------------------------------------------------
// Score an evidence item against a query
// ----------------------------------------------------------
function scoreEvidence(item: EvidenceItem, concepts: string[], hypothesisId?: string): { score: number; matched: string[] } {
  const searchText = `${item.title} ${item.relevanceExplanation} ${item.relevantPassage} ${item.applicabilityReason}`.toLowerCase();
  const matched: string[] = [];
  let score = 0;

  // Hypothesis match — strong signal
  if (hypothesisId && (item.relevantHypothesisId === hypothesisId || item.hypothesisIds?.includes(hypothesisId ?? ''))) {
    score += 40;
    matched.push('hypothesis-match');
  }

  // Keyword overlap
  concepts.forEach((concept) => {
    if (searchText.includes(concept)) {
      score += 10;
      matched.push(concept);
    }
  });

  // Authority bonus
  if (item.authority === 'High') score += 5;

  return { score, matched: [...new Set(matched)] };
}

// ----------------------------------------------------------
// Main search function — searches mock evidence library
// Returns results ranked by relevance. Deduplicates by ID.
// ----------------------------------------------------------
export function searchEvidence(query: EvidenceQuery): EvidenceResult[] {
  const concepts = extractConcepts(query.question + ' ' + (query.hypothesis ?? ''));
  const seen = new Set<string>();
  const results: Array<{ result: EvidenceResult; score: number }> = [];

  for (const item of MOCK_EVIDENCE_ITEMS) {
    if (seen.has(item.id)) continue;

    // Source type filter
    if (query.sourceTypes && query.sourceTypes.length > 0) {
      const itemSourceType = item.sourceType ?? 'GUIDELINE';
      if (!query.sourceTypes.includes(itemSourceType as any)) continue;
    }

    const { score, matched } = scoreEvidence(item, concepts, query.hypothesisId);
    if (score > 0) {
      seen.add(item.id);
      results.push({ result: evidenceItemToResult(item, matched, score), score });
    }
  }

  // Sort by score descending, limit
  const limit = query.limit ?? 10;
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.result);
}

// ----------------------------------------------------------
// Retrieve evidence for all hypotheses in a case
// Returns a map: hypothesisId → EvidenceResult[]
// ----------------------------------------------------------
export function retrieveEvidenceForCase(
  caseId: string,
  hypotheses: Array<{ id: string; title: string; statusDetail?: string }>
): Map<string, EvidenceResult[]> {
  const resultMap = new Map<string, EvidenceResult[]>();

  for (const hyp of hypotheses) {
    const results = searchEvidence({
      question: hyp.title,
      caseId,
      hypothesisId: hyp.id,
      hypothesis: hyp.title,
      limit: 3,
    });
    resultMap.set(hyp.id, results);
  }

  return resultMap;
}
