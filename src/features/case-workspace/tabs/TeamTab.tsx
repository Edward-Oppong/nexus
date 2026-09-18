import React, { useState } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import { usePersona } from '../../../app/providers/PersonaContext';
import { Users2, CheckCircle2, Clock, UserPlus, Shield, X } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  scope: string;
  department: string;
  reviewStatus: string;
  initials: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
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

export const TeamTab: React.FC = () => {
  const { activeCase } = useCase();
  const { currentPersona } = usePersona();
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabRole, setNewCollabRole] = useState('Consultant Specialist');
  const [newCollabDept, setNewCollabDept] = useState('Infectious Disease');
  const [newCollabScope, setNewCollabScope] = useState('Second-opinion review and therapeutic plan validation');

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabName.trim()) return;

    const parts = newCollabName.trim().split(' ');
    const initials = parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : newCollabName.slice(0, 2).toUpperCase();

    const newMember: TeamMember = {
      name: newCollabName.trim(),
      role: newCollabRole,
      department: newCollabDept,
      scope: newCollabScope,
      reviewStatus: 'Assigned (Pending Review)',
      initials,
    };

    setMembers((prev) => [...prev, newMember]);
    setNewCollabName('');
    setIsAddOpen(false);
  };

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
          onClick={() => setIsAddOpen(true)}
          className="btn btn-sm"
        >
          <UserPlus size={13} /> Add Collaborator
        </button>
      </div>

      {/* Team Roster Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
        {members.map((m, idx) => (
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

      {/* Add Collaborator Modal Dialog */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284C7', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <UserPlus size={14} /> Care Team Coordination
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  Add Multidisciplinary Collaborator
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px', lineHeight: 1.4 }}>
              Invite a credentialed clinician or clinical specialist to review and co-manage this case.
            </p>

            <form onSubmit={handleAddCollaborator}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  Clinician / Specialist Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Maya Patel, MD"
                  value={newCollabName}
                  onChange={(e) => setNewCollabName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Role / Scope of Practice
                  </label>
                  <select
                    value={newCollabRole}
                    onChange={(e) => setNewCollabRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Consultant Specialist">Consultant Specialist</option>
                    <option value="Senior Resident">Senior Resident</option>
                    <option value="Clinical Pharmacist">Clinical Pharmacist</option>
                    <option value="Clinical Nurse Specialist">Clinical Nurse Specialist</option>
                    <option value="Medical Laboratory Scientist">Medical Laboratory Scientist</option>
                    <option value="ICU Intensivist">ICU Intensivist</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={newCollabDept}
                    onChange={(e) => setNewCollabDept(e.target.value)}
                    placeholder="e.g. Infectious Disease"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  Clinical Assignment Scope
                </label>
                <textarea
                  rows={2}
                  value={newCollabScope}
                  onChange={(e) => setNewCollabScope(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Assign Collaborator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
