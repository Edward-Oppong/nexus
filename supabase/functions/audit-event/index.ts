// ============================================================
// supabase/functions/audit-event/index.ts
// Phase 6H: Append-only Audit Event Logger Edge Function
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditLogRequest {
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome?: '0' | '4' | '8' | '12';
  outcomeDesc?: string;
  ipAddress?: string;
  userAgent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: AuditLogRequest = await req.json();
    const { action, resourceType, resourceId } = body;

    if (!action || !resourceType) {
      return new Response(JSON.stringify({ error: 'action and resourceType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const auditEvent = {
      id: crypto.randomUUID(),
      action,
      resourceType,
      resourceId,
      outcome: body.outcome || '0',
      outcomeDesc: body.outcomeDesc || 'Success',
      userId: body.userId,
      userEmail: body.userEmail,
      ipAddress: body.ipAddress,
      recorded: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        auditEventId: auditEvent.id,
        recorded: auditEvent.recorded,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Audit log write failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
