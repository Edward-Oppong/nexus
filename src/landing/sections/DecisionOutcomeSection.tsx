import React from 'react';
import { CheckCircle2, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

interface DecisionOutcomeSectionProps {
  onExperienceCase: () => void;
}

export const DecisionOutcomeSection: React.FC<DecisionOutcomeSectionProps> = ({
  onExperienceCase,
}) => {
  return (
    <section className="nexus-narrative-section" id="section-decision-outcome">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label">
          <CheckCircle2 size={13} />
          <span>SECTION 14 · THE CLINICAL RESOLUTION</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          The case comes to a verified human decision.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          The clinical case moves from fragmented information to organized context, evidence, uncertainty, review, and ultimately a legally accountable human decision.
        </p>
      </div>

      {/* Synthetic Case Completed Decision Card */}
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          background: '#FFFFFF',
          border: '1.5px solid #059669',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 12px 32px rgba(5, 150, 105, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>
                STATUS: DECISION_RECORDED · RESOLVED
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'var(--nexus-font-mono)' }}>
                Case #10482
              </span>
            </div>
            <h3 style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              Primary Diagnosis: Subacute Bacterial Endocarditis (Aortic / Mitral)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="#0F766E" />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                Dr. Sarah Chen, MD
              </div>
              <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--nexus-font-mono)' }}>
                Attending Cardiologist · Signed 14:32 UTC
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Orders Formulated by Physician */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
            Executed Clinical Orders & Safety Overrides:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#1E293B', lineHeight: 1.6 }}>
            <li>
              <strong>Antimicrobial Therapy:</strong> Intravenous Vancomycin + Gentamicin initiated (penicillin avoided due to documented anaphylactoid history).
            </li>
            <li>
              <strong>Cardiothoracic Surgery Consult:</strong> Urgent inpatient evaluation for mitral valve repair within 48 hours due to 11mm mobile mass.
            </li>
            <li>
              <strong>Monitoring:</strong> Serial blood cultures at 48 hours to document bacterial clearance; continuous telemetry for PR prolongation.
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#64748B', fontFamily: 'var(--nexus-font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Case state machine validated · Invariants satisfied · Immutable audit log</span>
          </div>

          <button
            onClick={onExperienceCase}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Open This Case In Workstation</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
};
