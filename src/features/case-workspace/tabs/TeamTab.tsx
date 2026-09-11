import React from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { usePersona } from '../../../app/providers/PersonaContext';
import { Users2, CheckCircle2, Clock, UserPlus, Shield } from 'lucide-react';

export const TeamTab: React.FC = () => {
  const { activeCase } = useCase();
  const { currentPersona } = usePersona();

  const teamMembers = [
    {
      name: 'Dr. Edward Vance, MD',
      role: 'Attending Physician',
      scope: 'Lead Clinician & Case Owner',
      department: 'Internal Medicine',
      reviewStatus: 'In Progress (Reviewing Nexus Reasoning)',
      initials: 'EV',
    },
    {
      name: 'Sarah Chen, RN',
      role: 'Staff Clinical Nurse',
      scope: 'Patient intake, vitals acquisition, telemetry monitoring',
      department: 'Ambulatory Care',
      reviewStatus: 'Vitals verified (09:42)',
      initials: 'SC',
    },
    {
      name: 'Marcus Rivera, MLS',
      role: 'Senior Medical Laboratory Scientist',
      scope: 'Blood cultures, gram staining, susceptibility testing',
      department: 'Microbiology & Pathology',
      reviewStatus: 'Culture preliminary reported (09:44)',
      initials: 'MR',
    },
    {
      name: 'Dr. Alistair Thorne, MD, PhD',
      role: 'Consultant Cardiologist',
      scope: 'Echocardiographic review & valvular intervention',
      department: 'Cardiovascular Medicine',
      reviewStatus: 'Urgent Consult Requested (TEE pending)',
      initials: 'AT',
    },
    {
      name: 'Chioma Okafor, PharmD',
      role: 'Clinical Pharmacist',
      scope: 'Antimicrobial stewardship & allergy contraindication check',
      department: 'Infectious Disease Pharmacy',
      reviewStatus: 'Safety alert active (Penicillin allergy contraindication)',
      initials: 'CO',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
            Multidisciplinary Clinical Case Team
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            Collaborative team roles conforming to health workers' respective scopes of practice (WHO guidance).
          </p>
        </div>

        <button
          onClick={() => alert('Invite consultant: In production, dispatches secure hospital paging or internal clinical message.')}
          className="btn btn-sm"
        >
          <UserPlus size={13} /> Add Collaborator
        </button>
      </div>

      {/* Team Roster Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {teamMembers.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {m.initials}
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{m.name}</h3>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {m.role} · {m.department}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#334155', marginBottom: '12px' }}>
                <strong style={{ color: '#475569' }}>Scope:</strong> {m.scope}
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid #F1F5F9',
                paddingTop: '8px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#64748B' }}>Case Review Status:</span>
              <strong style={{ color: '#0F172A' }}>{m.reviewStatus}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
