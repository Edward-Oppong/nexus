// ============================================================
// src/features/administration/tabs/SystemDisclosureTab.tsx
// Phase 8: Simulated AI Component Registry
// Moved from AdministrationView placeholder (Phase 5).
// Discloses all simulated architectural models in the system.
// ============================================================

import React from 'react';
import { Cpu, AlertTriangle } from 'lucide-react';

interface SimulatedComponent {
  id: string;
  name: string;
  subsystemRole: string;
  status: 'Active' | 'Standby' | 'Deprecated';
  provenanceTag: string;
  notes?: string;
}

const COMPONENTS: SimulatedComponent[] = [
  {
    id: 'nexus-nlp-v1.3',
    name: 'Nexus NLP v1.3 (Simulated)',
    subsystemRole: 'Clinical narrative concept extraction & entity recognition',
    status: 'Active',
    provenanceTag: 'AI_EXTRACTED',
    notes: 'Simulates BERT-based clinical NER for symptom, sign, and medication entity extraction from clinical text.',
  },
  {
    id: 'nexus-reasoning-v2.1',
    name: 'Nexus Reasoning v2.1 (Simulated)',
    subsystemRole: 'Modified Duke & EULAR differential rule evaluation',
    status: 'Active',
    provenanceTag: 'AI_GENERATED',
    notes: 'Orchestrates candidate hypothesis generation. All output is provenance-tagged AI_GENERATED and UNVERIFIED until clinician-reviewed.',
  },
  {
    id: 'fhir-adapter-v0.9',
    name: 'FHIR R4 Adapter v0.9 (Simulated)',
    subsystemRole: 'Synthetic EHR telemetry and laboratory ingestion bridge',
    status: 'Standby',
    provenanceTag: 'IMPORTED',
    notes: 'Simulates FHIR R4 bundle ingestion via 7-step validation pipeline. Idempotency enforced via sync_events table.',
  },
  {
    id: 'contradiction-v1.0',
    name: 'Contradiction Detector v1.0 (Simulated)',
    subsystemRole: 'Semantic + rule-based contradiction detection across findings',
    status: 'Active',
    provenanceTag: 'AI_GENERATED',
    notes: 'Triggers auto-escalation to CONTRADICTORY state when two+ contradictory findings on the same body system are detected.',
  },
  {
    id: 'evidence-retrieval-v1.2',
    name: 'Evidence Retrieval v1.2 (Simulated)',
    subsystemRole: 'PubMed / local knowledge base retrieval for hypothesis support',
    status: 'Active',
    provenanceTag: 'AI_EXTRACTED',
    notes: 'Returns top 20 ranked evidence items per hypothesis. Simulates PubMed API connectivity.',
  },
  {
    id: 'terminology-service-v0.8',
    name: 'Terminology Service v0.8 (Simulated)',
    subsystemRole: 'SNOMED CT / LOINC / ICD-10 / RXNORM candidate code matching',
    status: 'Standby',
    provenanceTag: 'IMPORTED',
    notes: 'Returns candidate matches with confidence signal (HIGH / MODERATE / LOW / AMBIGUOUS). Never silently auto-converts free text to codes.',
  },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Active:     { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  Standby:    { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' },
  Deprecated: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

const PROVENANCE_STYLES: Record<string, { bg: string; text: string }> = {
  AI_GENERATED:       { bg: '#FFF7ED', text: '#C2410C' },
  AI_EXTRACTED:       { bg: '#FFFBEB', text: '#B45309' },
  IMPORTED:           { bg: '#EFF6FF', text: '#1D4ED8' },
  CLINICIAN_VERIFIED: { bg: '#D1FAE5', text: '#065F46' },
};

export const SystemDisclosureTab: React.FC = () => {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Cpu size={18} style={{ color: '#0284C7' }} />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            Simulated AI Component Registry
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
          Transparent disclosure of all simulated architectural models in this prototype deployment.
          These are not validated diagnostic medical devices.
        </p>
      </div>

      {/* Regulatory Disclosure Banner */}
      <div
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}
      >
        <AlertTriangle size={18} style={{ color: '#FCD34D', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>
            Simulated Architectural Models Disclosure
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: 1.6 }}>
            All AI components listed below (e.g. <code style={{ color: '#38BDF8' }}>Nexus NLP v1.3</code>,{' '}
            <code style={{ color: '#38BDF8' }}>Nexus Reasoning v2.1</code>) represent <strong style={{ color: '#E2E8F0' }}>simulated architectural
            components</strong> configured to test workflow usability, provenance tracking, and clinical safety handoffs.
            They do not represent validated diagnostic medical devices. All AI outputs require human review.
            No clinical decision should be made on AI output alone.
          </p>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B' }}>
            Regulatory alignment: MDCG 2021-6 · FDA PCCP (Phase 12) · GDPR / POPIA data residency (Phase 12)
          </div>
        </div>
      </div>

      {/* Component Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E2E8F0',
            fontWeight: 700,
            fontSize: '13px',
            color: '#0F172A',
            background: '#F8FAFC',
          }}
        >
          Registered Simulated Components ({COMPONENTS.length})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Component Identifier', 'Subsystem Role', 'Status', 'Provenance Tag'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748B',
                    borderBottom: '1px solid #E2E8F0',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPONENTS.map((c) => {
              const ss = STATUS_STYLES[c.status];
              const ps = PROVENANCE_STYLES[c.provenanceTag] || { bg: '#F1F5F9', text: '#334155' };
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                      {c.name}
                    </div>
                    {c.notes && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', lineHeight: 1.5 }}>
                        {c.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#334155' }}>
                    {c.subsystemRole}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: ss.bg,
                        color: ss.text,
                        border: `1px solid ${ss.border}`,
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <code
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: ps.bg,
                        color: ps.text,
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {c.provenanceTag}
                    </code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Provenance Type Reference */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', fontWeight: 700, fontSize: '13px', color: '#0F172A', background: '#F8FAFC' }}>
          Provenance Type Reference
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { type: 'HUMAN_ENTERED', desc: 'Typed directly by a clinician in the Nexus UI. Trusted baseline — no badge shown.' },
              { type: 'DEVICE_MEASURED', desc: 'Received from a bedside monitor or medical device. Shown with a device icon.' },
              { type: 'IMPORTED', desc: 'Imported from an external system (EHR, LIS, PACS). Shown with an import icon.' },
              { type: 'AI_EXTRACTED', desc: 'Extracted from a clinical document by an AI model. Yellow badge — UNVERIFIED. Cannot progress case.' },
              { type: 'AI_GENERATED', desc: 'Synthesised by a reasoning model. Orange badge — UNVERIFIED. Cannot progress case.' },
              { type: 'CLINICIAN_VERIFIED', desc: 'AI output reviewed and accepted by a named clinician. Green checkmark — can progress case.' },
            ].map(({ type, desc }) => {
              const ps = PROVENANCE_STYLES[type] || { bg: '#F1F5F9', text: '#334155' };
              return (
                <div key={type} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <code style={{ padding: '2px 8px', borderRadius: '4px', background: ps.bg, color: ps.text, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {type}
                  </code>
                  <span style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>{desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
