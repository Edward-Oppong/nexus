// ============================================================
// supabase/functions/extract-findings/index.ts
// Phase 6F: AI Finding Extraction with Provenance Guardrails
// Extracts candidate clinical findings with explicit 'Unverified' status.
// Enforces WHO SMART / FDA CDS provenance tagging before human verification.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ExtractRequest {
  caseId: string;
  sourceText: string;
  sourceContext: string;
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
    const { caseId, sourceText, sourceContext }: ExtractRequest = await req.json();

    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'sourceText is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Simulated extraction logic - guarantees strict provenance flags
    const extractedFindings = [
      {
        id: crypto.randomUUID(),
        caseId,
        label: 'Extracted Clinical Finding (Simulated)',
        category: 'symptom',
        status: 'Reported',
        provenance: {
          provenanceType: 'AI-extracted',
          verificationStatus: 'Unverified', // Crucial guardrail: NEVER marked Verified automatically
          sourceText,
          sourceContext: sourceContext || 'Clinical intake text',
          extractedAt: new Date().toISOString(),
          extractionModel: 'Nexus NLP v1.3 (Simulated)',
        },
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        count: extractedFindings.length,
        extractedFindings,
        warning: 'AI-extracted findings require explicit clinician adjudication before clinical reliance.',
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
