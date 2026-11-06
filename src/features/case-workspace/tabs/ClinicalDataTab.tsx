import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { Activity, ShieldAlert, Pill, FileText, Heart, Thermometer, Gauge, Wind } from 'lucide-react';

export const ClinicalDataTab: React.FC = () => {
  const { activeCase } = useCase();
  const { chiefComplaint, historyOfPresentIllness, vitalSigns, pastMedicalHistory, overview } = activeCase;
  const { allergies, medications } = overview.patient;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Chief Complaint & HPI */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
          Chief Complaint
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          "{chiefComplaint}"
        </h2>

        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '6px' }}>
          History of Present Illness (HPI)
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {historyOfPresentIllness}
        </p>
      </section>

      {/* Vital Signs Grid with Hardware/Nurse Provenance */}
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              Vital Signs & Telemetry
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Serial triage acquisitions with hardware device provenance</div>
          </div>
          <span className="badge badge-verified">
            Telemetry Synced
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {vitalSigns.map((v, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{v.parameter}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: v.status === 'Elevated' ? 'var(--status-warning)' : 'var(--text-primary)',
                    }}
                  >
                    {v.value}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.unit}</span>
                </div>
              </div>

              {/* Provenance Micro-Label */}
              <div
                style={{
                  borderTop: '1px solid var(--bg-subtle)',
                  paddingTop: '6px',
                  marginTop: '6px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.3,
                }}
              >
                <div><strong>Recorded by:</strong> {v.recordedBy}</div>
                <div>{v.recordedAt} · {v.sourceDevice}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Medical History & Medications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Past Medical History */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '12px' }}>
            Past Medical & Surgical History
          </h3>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {pastMedicalHistory.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Active Medications & Allergies */}
        <section
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '20px',
          }}
        >
          {/* Allergies with Warning */}
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--status-danger)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={14} /> Recorded Allergies ({allergies.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allergies.map((a, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--danger-subtle)',
                    border: '1px solid var(--danger-border)',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <strong style={{ color: 'var(--status-danger)' }}>{a.allergen}</strong>
                  <span style={{ color: 'var(--status-danger)', marginLeft: '6px' }}>
                    ({a.severity}: {a.reaction})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Medications */}
          <div>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
              Active Medications ({medications.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {medications.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>{m.name}</strong> · {m.dosage} ({m.frequency})
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
