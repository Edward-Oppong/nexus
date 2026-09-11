// ============================================================
// supabase/functions/evidence-search/index.ts
// Phase 6F: Traceable Evidence Retrieval Edge Function
// Searches clinical guidelines with authority tier scoring.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface SearchQuery {
  terms: string[];
  authorityTier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { terms = [], authorityTier, limit = 10 }: SearchQuery = await req.json();

    // Mock evidence base (aligned with mockEvidence.ts)
    const mockEvidenceBase = [
      {
        id: 'ev-aha-2025',
        title: '2025 AHA/ACC Clinical Practice Guideline for the Management of Infective Endocarditis',
        organization: 'American Heart Association / American College of Cardiology',
        year: 2025,
        tier: 'TIER_1',
        citation: 'Circulation. 2025;151:e1-e65. DOI: 10.1161/CIR.0000000000001300',
        keywords: ['endocarditis', 'streptococcus', 'viridans', 'duke', 'murmur', 'vegetation', 'bacteremia'],
      },
      {
        id: 'ev-duke-2024',
        title: 'International Consensus Updated Modified Duke Criteria for Diagnosis of Infective Endocarditis',
        organization: 'International Society for Cardiovascular Infectious Diseases',
        year: 2024,
        tier: 'TIER_1',
        citation: 'Clin Infect Dis. 2024;78(2):245-258. DOI: 10.1093/cid/ciae012',
        keywords: ['duke', 'criteria', 'splinter', 'hemorrhage', 'echocardiogram', 'tee', 'fever'],
      },
      {
        id: 'ev-eular-2023',
        title: 'EULAR/ACR Classification Criteria for Systemic Lupus Erythematosus',
        organization: 'European Alliance of Associations for Rheumatology / ACR',
        year: 2023,
        tier: 'TIER_1',
        citation: 'Ann Rheum Dis. 2023;82:1120-1132. DOI: 10.1136/ard-2023-224500',
        keywords: ['sle', 'lupus', 'ana', 'arthralgia', 'autoimmune'],
      },
      {
        id: 'ev-who-dak-2025',
        title: 'WHO SMART Guidelines: Digital Adaptation Kit for Adult Febrile Illness and Sepsis Screening',
        organization: 'World Health Organization',
        year: 2025,
        tier: 'TIER_1',
        citation: 'WHO Guidelines Approved by the Guidelines Review Committee. Geneva: WHO; 2025.',
        keywords: ['who', 'smart', 'sepsis', 'febrile', 'fever', 'tachycardia', 'decision-support'],
      },
    ];

    const lowerTerms = terms.map((t) => t.toLowerCase());
    const results = mockEvidenceBase
      .map((item) => {
        let matches = 0;
        lowerTerms.forEach((term) => {
          if (
            item.title.toLowerCase().includes(term) ||
            item.keywords.some((k) => k.includes(term))
          ) {
            matches++;
          }
        });
        const score = lowerTerms.length > 0 ? matches / lowerTerms.length : 0.5;
        return { item, score };
      })
      .filter(({ item, score }) => {
        if (authorityTier && item.tier !== authorityTier) return false;
        return score > 0;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item, score }) => ({
        ...item,
        relevanceScore: Math.round(score * 100) / 100,
      }));

    return new Response(JSON.stringify({ success: true, count: results.length, results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
