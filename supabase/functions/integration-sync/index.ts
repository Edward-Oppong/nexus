// ============================================================
// supabase/functions/integration-sync/index.ts
// Phase 6H: Scheduled External System Synchronization Edge Function
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  sourceId: string;
  sourceType: 'EHR' | 'LIS' | 'PACS' | 'DEVICE';
  caseId?: string;
  patientId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: SyncRequest = await req.json();
    const { sourceId, sourceType, caseId, patientId } = body;

    if (!sourceId) {
      return new Response(JSON.stringify({ error: 'sourceId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simulated synchronization cycle
    const syncResult = {
      syncEventId: crypto.randomUUID(),
      sourceId,
      sourceType,
      caseId,
      patientId,
      status: 'COMPLETED',
      fetchedRecords: 12,
      newFindingsDetected: 2,
      completedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ success: true, ...syncResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Integration sync failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
