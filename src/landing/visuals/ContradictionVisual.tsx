import React, { useState } from 'react';
import {
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  FileWarning,
  CheckCircle,
  Info,
} from 'lucide-react';

export const ContradictionVisual: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contradiction' | 'gap'>('contradiction');

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Switcher Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('contradiction')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            background: activeTab === 'contradiction' ? '#FEF2F2' : '#FFFFFF',
            color: activeTab === 'contradiction' ? '#DC2626' : '#64748B',
            border: `1.5px solid ${activeTab === 'contradiction' ? '#FCA5A5' : '#E2E8F0'}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <AlertTriangle size={15} /> 1. Contradiction Detected
        </button>
        <button
          onClick={() => setActiveTab('gap')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            background: activeTab === 'gap' ? '#FFFBEB' : '#FFFFFF',
            color: activeTab === 'gap' ? '#D97706' : '#64748B',
            border: `1.5px solid ${activeTab === 'gap' ? '#FDE68A' : '#E2E8F0'}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <HelpCircle size={15} /> 2. Missing Information Surfaced
        </button>
      </div>

      {/* Contradiction Visual Card */}
      {activeTab === 'contradiction' ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #FCA5A5',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--nexus-font-mono)',
                fontWeight: 700,
                color: '#DC2626',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              SAFETY INTERRUPT · CONTRADICTION DETECTED
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Two pieces of clinical data conflict directly
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              position: 'relative',
              marginBottom: '20px',
            }}
          >
            {/* Record 1 */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#64748B', fontWeight: 700, marginBottom: '6px' }}>
                RECORD A: EMERGENCY TRIAGE INTAKE
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                "Allergies: None reported by patient."
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Patient asked verbally during acute fever presentation in ED.
              </div>
            </div>

            {/* Record 2 */}
            <div
              style={{
                background: '#FEF2F2',
                border: '1.5px solid #F87171',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#DC2626', fontWeight: 700, marginBottom: '6px' }}>
                RECORD B: HISTORICAL PHARMACY DISPENSE
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B', marginBottom: '6px' }}>
                "Amoxicillin / Penicillin Anaphylactoid Urticaria (2018)"
              </div>
              <div style={{ fontSize: '12px', color: '#7F1D1D' }}>
                Documented ICU admission with bronchospasm following oral amoxicillin.
              </div>
            </div>
          </div>

          {/* Nexus Resolution Banner */}
          <div
            style={{
              background: '#0F172A',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            <ShieldAlert size={20} color="#F87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                Nexus Action: Reconciles Historical Records & Blocks Unsafe Dosing
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: 1.5 }}>
                Instead of defaulting to the recent triage note, Nexus connects the pharmacy archive, flags the beta-lactam allergy contradiction, and warns against high-dose empiric ampicillin for endocarditis before the prescription reaches the bedside.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Missing Information Card */
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #FDE68A',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--nexus-font-mono)',
                fontWeight: 700,
                color: '#D97706',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              EVIDENTIARY AUDIT · MISSING INFORMATION SURFACED
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Identifies evidentiary blind spots before decisions are finalized
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  Microbiology: Minimum Inhibitory Concentration (MIC) for Penicillin
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Organism identified as Streptococcus viridans, but susceptibility profile remains pending.
                </div>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '3px' }}>
                PENDING 18H
              </span>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  Cardiothoracic Surgery Consult Order
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Vegetation size &gt;10mm with severe regurgitation triggers early surgical evaluation guideline.
                </div>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: '3px' }}>
                ACTION REQUIRED
              </span>
            </div>
          </div>

          {/* Educational Note */}
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '14px 18px',
              fontSize: '12px',
              color: '#78350F',
              lineHeight: 1.5,
            }}
          >
            <strong>Nexus Principle: </strong>
            Autonomous chatbots guess when data is missing. Nexus explicitly names what is unmeasured, pending, or unverified so the clinical team knows exactly what questions remain before treatment begins.
          </div>
        </div>
      )}
    </div>
  );
};
