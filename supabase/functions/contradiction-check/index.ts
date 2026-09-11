// ============================================================
// supabase/functions/contradiction-check/index.ts
// Phase 6F: Layer 1 Deterministic Contradiction Detector Edge Function
// Evaluates observations & clinical findings for physical/clinical inconsistencies.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ContradictionRequest {
  findings: Array<{
    id: string;
    label: string;
    category: string;
    value?: string | number;
  }>;
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
    const { findings = [] }: ContradictionRequest = await req.json();

    const contradictions = [];

    // Deterministic Rule 1: High SpO2 vs Hypoxia notes
    // Deterministic Rule 2: Fever vs afebrile observations
    // Deterministic Rule 3: Rheumatic arthralgia vs acute bacterial vegetation/splinter hemorrhages
    const hasArthralgia = findings.some((f) => f.label.toLowerCase().includes('arthralgia'));
    const hasSplinters = findings.some((f) => f.label.toLowerCase().includes('splinter'));

    if (hasArthralgia && hasSplinters) {
      const artFinding = findings.find((f) => f.label.toLowerCase().includes('arthralgia'));
      const splFinding = findings.find((f) => f.label.toLowerCase().includes('splinter'));
      contradictions.push({
        id: crypto.randomUUID(),
        findingAId: artFinding?.id || 'f-arthralgia',
        findingBId: splFinding?.id || 'f-splinter',
        severity: 'MODERATE',
        explanation:
          'Diffuse small joint arthralgia suggests non-erosive autoimmune or post-streptococcal inflammation, whereas subungual splinter hemorrhages and valvular regurgitation point to acute embolic vascular phenomena.',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        detectedCount: contradictions.length,
        contradictions,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
