// ============================================================
// supabase/functions/integration-export/index.ts
// Phase 6H: Outbound FHIR R4 Export Edge Function
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  caseId: string;
  patientId: string;
  bundleType?: 'document' | 'collection' | 'transaction';
  targetEndpoint?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: ExportRequest = await req.json();
    const { caseId, patientId, bundleType = 'collection' } = body;

    if (!caseId || !patientId) {
      return new Response(JSON.stringify({ error: 'caseId and patientId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build standard FHIR R4 Bundle envelope
    const exportBundle = {
      resourceType: 'Bundle',
      id: `export-${caseId}-${Date.now()}`,
      type: bundleType,
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `urn:uuid:${patientId}`,
          resource: {
            resourceType: 'Patient',
            id: patientId,
            active: true,
          },
        },
        {
          fullUrl: `urn:uuid:${caseId}`,
          resource: {
            resourceType: 'Encounter',
            id: caseId,
            status: 'in-progress',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'IMP',
              display: 'inpatient encounter',
            },
            subject: {
              reference: `Patient/${patientId}`,
            },
          },
        },
      ],
    };

    return new Response(
      JSON.stringify({
        success: true,
        exportId: exportBundle.id,
        bundle: exportBundle,
        exportedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'FHIR Export failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
