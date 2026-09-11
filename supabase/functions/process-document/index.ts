// ============================================================
// supabase/functions/process-document/index.ts
// Phase 6H: Document Processing & Finding Extraction Edge Function
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDocumentRequest {
  documentId: string;
  caseId: string;
  patientId: string;
  organizationId: string;
  title: string;
  documentClass?: string;
  textPayload?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: ProcessDocumentRequest = await req.json();
    const { documentId, caseId, patientId, organizationId, title, textPayload } = body;

    if (!documentId || !caseId) {
      return new Response(JSON.stringify({ error: 'documentId and caseId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sampleText = textPayload || `Clinical report for ${title}. Patient presented with respiratory symptoms and localized chest pain. Vital signs stable, heart rate 84 bpm, SpO2 96% on room air.`;

    // Simulated medical extraction pipeline
    // All extracted findings MUST be marked UNVERIFIED with AI_EXTRACTED provenance
    const extractedFindings = [
      {
        id: crypto.randomUUID(),
        caseId,
        patientId,
        label: `Clinical Finding extracted from ${title}`,
        category: 'finding',
        status: 'UNVERIFIED',
        provenance: {
          provenanceType: 'AI_EXTRACTED',
          sourceSystem: 'Nexus Document Intelligence',
          sourceReference: `ClinicalDocument/${documentId}`,
          modelName: 'Nexus Clinical NLP Parser',
          modelVersion: '2.4.0',
          capturedAt: new Date().toISOString(),
        },
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        status: 'PROCESSED',
        extractedFindingsCount: extractedFindings.length,
        extractedFindings,
        processedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Document processing failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
