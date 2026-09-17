import React, { useState } from 'react';
import {
  BrainCircuit,
  UserCheck,
  Edit3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Lock,
} from 'lucide-react';

export const TraceabilityVisual: React.FC = () => {
  const [reviewState, setReviewState] = useState<'pending' | 'accepted' | 'edited'>('pending');

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* 4-Stage Provenance Chain */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '12px',
          position: 'relative',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <BrainCircuit size={16} color="#0F766E" />
            <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#0F766E' }}>
              01 · AI GENERATED
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
            Synthetic Reasoning Output
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
            Flagged with provenance: UNVERIFIED. Cannot write diagnosis directly.
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #2563EB',
            borderRadius: '8px',
            padding: '14px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <UserCheck size={16} color="#2563EB" />
            <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#2563EB' }}>
              02 · CLINICIAN REVIEW
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
            Dr. Sarah Chen, MD
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
            Attending physician inspects Duke Criteria, TEE echo, and drug allergies.
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Edit3 size={16} color="#D97706" />
            <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#D97706' }}>
              03 · CLINICAL EDIT
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
            Preserving Original AI
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
            Original AI reasoning preserved in audit trail alongside human revision.
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #059669',
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <CheckCircle2 size={16} color="#059669" />
            <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#059669' }}>
              04 · FINAL DECISION
            </span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
            DECISION_RECORDED
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748B' }}>
            Legally owned by named clinician. Signed with immutable timestamp.
          </p>
        </div>
      </div>

      {/* Interactive Clinician Adjudication Demonstration */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '12px',
          padding: '24px 28px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--nexus-font-mono)',
                fontWeight: 700,
                color: '#0F766E',
                background: '#F0FDFA',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              SIMULATED CLINICIAN REVIEW PANEL
            </span>
            <h4 style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              Review Candidate Hypothesis: Subacute Infective Endocarditis
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Status:</span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--nexus-font-mono)',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                background: reviewState === 'pending' ? '#EFF6FF' : '#ECFDF5',
                color: reviewState === 'pending' ? '#2563EB' : '#059669',
              }}
            >
              {reviewState === 'pending' ? 'REQUIRES REVIEW' : 'ACCEPTED & SIGNED'}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          {reviewState === 'edited'
            ? 'Dr. Sarah Chen accepted the diagnosis of Subacute Endocarditis, but adjusted treatment protocol to Vancomycin + Gentamicin due to documented beta-lactam anaphylactoid history.'
            : 'Nexus presents S. viridans bacteremia and TEE mitral vegetation as supporting evidence. The clinician must explicitly accept, edit, or reject this before treatment orders are activated.'}
        </p>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setReviewState('accepted')}
            style={{
              background: reviewState === 'accepted' ? '#059669' : '#FFFFFF',
              color: reviewState === 'accepted' ? '#FFFFFF' : '#059669',
              border: '1.5px solid #059669',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={14} /> Accept As Formulated
          </button>

          <button
            onClick={() => setReviewState('edited')}
            style={{
              background: reviewState === 'edited' ? '#D97706' : '#FFFFFF',
              color: reviewState === 'edited' ? '#FFFFFF' : '#D97706',
              border: '1.5px solid #D97706',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Edit3 size={14} /> Edit & Refine Scope
          </button>

          <button
            onClick={() => setReviewState('pending')}
            style={{
              background: '#FFFFFF',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reset Simulation
          </button>
        </div>

        {/* Audit Disclosure */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#64748B',
            fontFamily: 'var(--nexus-font-mono)',
          }}
        >
          <Lock size={12} color="#94A3B8" />
          <span>FHIR R4 AuditEvent generated · SHA-256 integrity sealed · Clinician ID: dr_sarah_chen</span>
        </div>
      </div>
    </div>
  );
};
