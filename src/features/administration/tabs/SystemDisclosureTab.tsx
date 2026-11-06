// ============================================================
// src/features/administration/tabs/SystemDisclosureTab.tsx
// Phase 8: Clinical AI Architecture & Live Multi-Model Registry
// Discloses active live models and deterministic clinical safeguards.
// ============================================================

import React, { useState } from 'react';
import { Cpu, ShieldCheck, Zap, Settings, CheckCircle2 } from 'lucide-react';
import { AiEngineConfigModal } from '../../../components/intelligence/AiEngineConfigModal';
import { getActiveAiEngineInfo } from '../../../lib/intelligence/services/ai-engine-config';

interface ComponentInfo {
  id: string;
  name: string;
  subsystemRole: string;
  status: 'Active' | 'Standby' | 'Configured';
  provenanceTag: string;
  notes?: string;
}

const COMPONENTS: ComponentInfo[] = [
  {
    id: 'nexus-gemini-live',
    name: 'Google Gemini 2.5 Flash (Live LLM)',
    subsystemRole: 'Real-time structured differential diagnosis & clinical narrative synthesis',
    status: 'Active',
    provenanceTag: 'AI_GENERATED',
    notes: 'Direct API integration with Google Generative Language API. Enforces EU MDR Annex I & FDA CDS structured output.',
  },
  {
    id: 'nexus-groq-live',
    name: 'Groq Cloud Llama 3.3 70B (Live LLM)',
    subsystemRole: 'Ultra-high-throughput (500+ t/s) differential reasoning & candidate hypothesis generation',
    status: 'Configured',
    provenanceTag: 'AI_GENERATED',
    notes: 'Low-latency serverless reasoning via Groq OpenAI-compatible API endpoint.',
  },
  {
    id: 'nexus-autonomous-v2.5',
    name: 'Nexus Autonomous Clinical Engine v2.5',
    subsystemRole: 'High-acuity ESI 1–5 triage stratification, vital danger zones & deterministic safety',
    status: 'Active',
    provenanceTag: 'CLINICIAN_VERIFIED',
    notes: 'Rule-based clinical boundary engine executing 18 non-negotiable safety rules (renal, anaphylaxis, collapse bypass).',
  },
  {
    id: 'fhir-adapter-v1.0',
    name: 'FHIR R4 Adapter v1.0 (Live Bridge)',
    subsystemRole: 'EHR telemetry and laboratory ingestion bridge conforming to HL7 FHIR US Core',
    status: 'Active',
    provenanceTag: 'IMPORTED',
    notes: 'Full FHIR R4 bundle ingestion via 7-step validation pipeline. Idempotency enforced via sync_events table.',
  },
  {
    id: 'contradiction-v2.0',
    name: 'Contradiction & Contamination Guard v2.0',
    subsystemRole: 'Stage-3B evidence isolation & prompt bleed protection across cases',
    status: 'Active',
    provenanceTag: 'AI_GENERATED',
    notes: 'Prevents context bleed across patient encounters; audits candidate hypotheses against isolated case evidence graph.',
  },
  {
    id: 'evidence-retrieval-v2.0',
    name: 'Evidence Retrieval Engine v2.0 (MedCPT & PubMed)',
    subsystemRole: 'Dense biomedical literature retrieval and evidence ranking',
    status: 'Active',
    provenanceTag: 'AI_EXTRACTED',
    notes: 'Queries live biomedical literature and ranks top guideline sources per candidate hypothesis.',
  },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Active:     { bg: 'var(--success-subtle)', text: 'var(--status-success)', border: 'var(--success-border)' },
  Configured: { bg: 'var(--accent-subtle)', text: 'var(--accent-primary)', border: 'var(--border-medium)' },
  Standby:    { bg: 'var(--bg-subtle)', text: 'var(--text-secondary)', border: 'var(--border-medium)' },
};

const PROVENANCE_STYLES: Record<string, { bg: string; text: string }> = {
  AI_GENERATED:       { bg: '#FFF7ED', text: 'var(--status-warning)' },
  AI_EXTRACTED:       { bg: 'var(--warning-subtle)', text: 'var(--status-warning)' },
  IMPORTED:           { bg: 'var(--accent-subtle)', text: 'var(--accent-primary)' },
  CLINICIAN_VERIFIED: { bg: 'var(--success-subtle)', text: 'var(--status-success)' },
};

export const SystemDisclosureTab: React.FC = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const activeEngine = getActiveAiEngineInfo();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Clinical AI Architecture & Live Model Registry
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Multi-model clinical intelligence architecture with live LLM synthesis and deterministic clinical safety gates.
          </p>
        </div>

        <button
          onClick={() => setIsConfigOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--accent-primary)',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--bg-surface)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Settings size={14} />
          <span>Configure Live AI Engine</span>
        </button>
      </div>

      {/* Active Model Status Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-primary) 100%)',
          color: 'var(--bg-surface)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Active Production AI Engine
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeEngine.displayName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: activeEngine.isLive ? 'var(--status-success)' : 'var(--text-primary)',
              color: activeEngine.isLive ? 'var(--status-success)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: `1px solid ${activeEngine.isLive ? 'var(--status-success)' : 'var(--text-secondary)'}`,
            }}
          >
            <CheckCircle2 size={12} />
            {activeEngine.isLive ? 'LIVE INFERENCE READY' : 'OFFLINE CLINICAL ENGINE'}
          </span>
        </div>
      </div>

      {/* Component Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            fontWeight: 700,
            fontSize: '13px',
            color: 'var(--text-primary)',
            background: 'var(--bg-subtle)',
          }}
        >
          Registered Architectural Subsystems ({COMPONENTS.length})
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Component / Model</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Subsystem Role</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Provenance Tag</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Architecture & Compliance Notes</th>
              </tr>
            </thead>
            <tbody>
              {COMPONENTS.map((c) => {
                const sStyle = STATUS_STYLES[c.status] || STATUS_STYLES.Active;
                const pStyle = PROVENANCE_STYLES[c.provenanceTag] || PROVENANCE_STYLES.AI_GENERATED;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {c.subsystemRole}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: sStyle.bg,
                          color: sStyle.text,
                          border: `1px solid ${sStyle.border}`,
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: pStyle.bg,
                          color: pStyle.text,
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                        }}
                      >
                        {c.provenanceTag}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                      {c.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AiEngineConfigModal */}
      <AiEngineConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </div>
  );
};
