import React, { useState } from 'react';
import {
  X,
  Server,
  Layers,
  ShieldCheck,
  Share2,
  Lock,
  FileCode,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface TechnicalArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkstation: () => void;
}

export const TechnicalArchitectureModal: React.FC<TechnicalArchitectureModalProps> = ({
  isOpen,
  onClose,
  onOpenWorkstation,
}) => {
  const [activeTab, setActiveTab] = useState<'topology' | 'state' | 'safety' | 'interop'>('topology');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nexus Technical Architecture Specifications"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #CBD5E1',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            background: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E293B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="#5EEAD4" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>
                Nexus System Architecture · Authoritative Technical Reference
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--nexus-font-mono)' }}>
                Version 1.0.0 Production GA · React 18 + TS 5 + Vite 6 + Supabase
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label="Close architecture modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            padding: '0 16px',
            gap: '8px',
          }}
        >
          {[
            { id: 'topology', label: '1. Layer Topology' },
            { id: 'state', label: '2. Case State Machine' },
            { id: 'safety', label: '3. Epistemic Safety' },
            { id: 'interop', label: '4. Interoperability' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 14px',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#0F766E' : '#64748B',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid #0F766E' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
          {activeTab === 'topology' && (
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Clean Layer Boundaries & Pure Domain Isolation
              </h4>
              <p>
                Nexus enforces a unidirectional dependency hierarchy. Domain types in <code>src/domain/</code> have zero knowledge of databases, FHIR serialization, or external APIs:
              </p>
              <pre
                style={{
                  background: '#0F172A',
                  color: '#F8FAFC',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'var(--nexus-font-mono)',
                  overflowX: 'auto',
                }}
              >
{`[ Domain Model (Pure TS) ]      <-- Case, Finding, Hypothesis, SafetyIssue
       ^
[ Application State & Cache ]   <-- CaseContext, PersonaContext, AuthProvider
       ^
[ Persistence & Edge Functions ] <-- Supabase PostgreSQL, RLS, SyncQueue
       ^
[ External Interoperability ]   <-- FHIR R4, MedCPT Search, HL7 v2.5.1 ER7`}
              </pre>
              <p style={{ marginTop: '12px' }}>
                All mutations flow through dedicated action handlers. PostgreSQL serves as the authoritative source of truth with database-level state machine validation via stored procedures.
              </p>
            </div>
          )}

          {activeTab === 'state' && (
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Strict Clinical State Machine & Transition Invariants
              </h4>
              <p>
                Cases cannot skip review stages. Illegal transitions are rejected by <code>validateCaseTransition()</code>:
              </p>
              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li><strong>DRAFT &rarr; ACTIVE:</strong> Patient demographic and minimal triage notes present.</li>
                <li><strong>ACTIVE &rarr; ANALYZING &rarr; PRELIMINARY:</strong> Evidence assembled; AI reasoning evaluated.</li>
                <li><strong>REVIEW_REQUIRED:</strong> Enforced whenever an unverified AI-generated finding or hypothesis exists.</li>
                <li><strong>SAFETY_REVIEW:</strong> Activated automatically if high-severity red flags (e.g. drug allergy cross-reactivity) are unacknowledged.</li>
                <li><strong>DECISION_RECORDED:</strong> Requires explicit named clinician sign-off (e.g., Dr. Sarah Chen, MD).</li>
                <li><strong>RESOLVED:</strong> Case closed only when all safety issues are marked Resolved or Acknowledged.</li>
              </ul>
            </div>
          )}

          {activeTab === 'safety' && (
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Epistemic Uncertainty & Safety Decoupling
              </h4>
              <p>
                In compliance with <strong>EU MDR 2017/745 Annex VIII Rule 11 (Class IIa SaMD)</strong> and <strong>MDCG 2021-6</strong>:
              </p>
              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li><strong>Banned Numerical Probability Scores:</strong> Replaced by qualitative states (<code>SUPPORTED</code>, <code>INSUFFICIENT_DATA</code>, <code>CONTRADICTED</code>, <code>NEEDS_REVIEW</code>).</li>
                <li><strong>Deterministic CDS Decoupling:</strong> High-risk clinical rules (Renal dosing, RxNorm DDI, Duke Criteria) execute via deterministic pure algorithms, completely independent of generative LLMs.</li>
                <li><strong>FDA PCCP Compliance:</strong> Predetermined Change Control Plan tracks model versions, benchmark thresholds, and 510(k) boundary triggers.</li>
              </ul>
            </div>
          )}

          {activeTab === 'interop' && (
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Multi-Standard Enterprise Healthcare Interoperability
              </h4>
              <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                <li><strong>HL7 FHIR R4:</strong> US Core 6.1 profiles, 7-step schema validation, and SMART on FHIR v1/v2 launch context.</li>
                <li><strong>MedCPT & Clinical AI:</strong> Dense 768-d semantic query retrieval, Cross-Encoder deep passage reranking, and token-level NER.</li>
                <li><strong>HL7 v2.5.1 ER7:</strong> Pure segment parsing for ADT^A01 (Admit) and ORU^R01 (Observation Results).</li>
                <li><strong>IHE XDS.b:</strong> ITI-18 registry query and ITI-43 document retrieval for cross-enterprise health information exchanges.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--nexus-font-mono)' }}>
            Document Reference: ARCHITECTURE.md (v1.0.0)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenWorkstation();
              }}
              className="nexus-btn nexus-btn--primary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
              }}
            >
              <span>Open Workstation</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
