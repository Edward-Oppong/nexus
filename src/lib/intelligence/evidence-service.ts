// ============================================================
// src/lib/intelligence/evidence-service.ts
// Phase 6F: Layer 2 — Evidence Retrieval Service
// All evidence is retrieved live: local scoring from items
// passed explicitly by the caller, then augmented with live
// PubMed / Europe PMC results.
// No static mock data is stored or used here.
// ============================================================

import { EvidenceQuery, EvidenceResult, EvidenceItem } from '../../domain/evidence';

// ----------------------------------------------------------
// Convert EvidenceItem to EvidenceResult for the pipeline
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

  if (hypothesisId && (item.relevantHypothesisId === hypothesisId || item.hypothesisIds?.includes(hypothesisId ?? ''))) {
    score += 40;
    matched.push('hypothesis-match');
  }

  concepts.forEach((concept) => {
    if (searchText.includes(concept)) {
      score += 10;
      matched.push(concept);
    }
  });

  if (item.authority === 'High') score += 5;

  return { score, matched: [...new Set(matched)] };
}

// ----------------------------------------------------------
// Local search — scores items passed in by the caller.
// Callers must provide their own item list; this function
// does NOT use any static or mock data.
// ----------------------------------------------------------
export function searchEvidence(query: EvidenceQuery, items: EvidenceItem[] = []): EvidenceResult[] {
  const concepts = extractConcepts(query.question + ' ' + (query.hypothesis ?? ''));
  const seen = new Set<string>();
  const results: Array<{ result: EvidenceResult; score: number }> = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;

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

  const limit = query.limit ?? 10;
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.result);
}

// ----------------------------------------------------------
// Live PubMed / Europe PMC evidence search
// Goes directly to live retrieval — no static fallback.
// ----------------------------------------------------------
import { fetchLivePubMedEvidence } from './services/pubmed-service';

export async function searchEvidenceAsync(
  query: EvidenceQuery,
  items: EvidenceItem[] = []
): Promise<EvidenceResult[]> {
  const localResults = searchEvidence(query, items);
  const seenIds = new Set(localResults.map((r) => r.source.id));

  const limit = query.limit ?? 4;
  const topic = query.hypothesis || query.question;

  // Always try live PubMed — fill up to limit or top up local results
  if (topic) {
    try {
      const pubmedResults = await fetchLivePubMedEvidence(topic, {
        limit: limit - localResults.length > 0 ? limit - localResults.length : limit,
        preferGuidelines: true,
      });

      for (const res of pubmedResults) {
        if (!seenIds.has(res.source.id)) {
          seenIds.add(res.source.id);
          localResults.push(res);
        }
      }
    } catch (err) {
      console.warn('[searchEvidenceAsync] Live PubMed retrieval note:', err);
    }
  }

  return localResults.slice(0, limit);
}

// ----------------------------------------------------------
// Retrieve evidence for all hypotheses in a case
// Returns a map: hypothesisId → EvidenceResult[]
// ----------------------------------------------------------
export async function retrieveEvidenceForCase(
  caseId: string,
  hypotheses: Array<{ id: string; title: string; statusDetail?: string }>
): Promise<Map<string, EvidenceResult[]>> {
  const resultMap = new Map<string, EvidenceResult[]>();

  for (const hyp of hypotheses) {
    const results = await searchEvidenceAsync({
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
