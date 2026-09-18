// ============================================================
// src/features/administration/tabs/TeamMembersTab.tsx
// Phase 8: Organisation Team Member Roster
// Lists active/inactive members with role management and invite workflow.
// Requires user.manage permission for mutations.
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../../authentication/AuthProvider';
import { AppRole } from '../../../domain/auth';
import {
  DemoTeamMember,
  ROLE_DISPLAY,
} from '../../../data/administration/mockAdminData';
import {
  UserPlus,
  ChevronDown,
  Search,
  Users,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Mail,
  Clock,
  X,
} from 'lucide-react';

const ROLES_FOR_INVITE: { value: AppRole; label: string }[] = [
  { value: 'clinician', label: 'Clinician (Attending Physician)' },
  { value: 'nurse', label: 'Nurse (Clinical Support)' },
  { value: 'laboratory', label: 'Laboratory (Lab Specialist)' },
  { value: 'reviewer', label: 'Reviewer (Clinical Reviewer)' },
  { value: 'organization_admin', label: 'Organisation Admin' },
];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface InviteState {
  email: string;
  role: AppRole;
}

export const TeamMembersTab: React.FC = () => {
  const { activeOrganization, can } = useAuth();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [invite, setInvite] = useState<InviteState>({ email: '', role: 'clinician' });
  const [inviteSent, setInviteSent] = useState(false);
  const [members, setMembers] = useState<DemoTeamMember[]>([]);
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
  const [savedRole, setSavedRole] = useState<string | null>(null);

  const canManage = can('user.manage');

  // Filter members for the active org
  const orgMembers = members.filter(
    (m) => m.membership.organizationId === activeOrganization?.id
  );

  const filtered = orgMembers.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.profession.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showInactive ? true : m.isActive;
    return matchesSearch && matchesActive;
  });

  const activeCount = orgMembers.filter((m) => m.isActive).length;
  const inactiveCount = orgMembers.filter((m) => !m.isActive).length;

  const handleToggleActive = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.membership.id === memberId ? { ...m, isActive: !m.isActive, membership: { ...m.membership, isActive: !m.isActive } } : m
      )
    );
  };

  const handleRoleChange = (memberId: string, newRole: AppRole) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.membership.id === memberId
          ? { ...m, membership: { ...m.membership, role: newRole } }
          : m
      )
    );
    setRoleMenuOpen(null);
    setSavedRole(memberId);
    setTimeout(() => setSavedRole(null), 2500);
  };

  const handleInvite = () => {
    if (!invite.email) return;
    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setShowInviteDialog(false);
      setInvite({ email: '', role: 'clinician' });
    }, 2500);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Users size={18} style={{ color: '#0284C7' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Team Members</h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            {activeCount} active member{activeCount !== 1 ? 's' : ''}
            {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
            {activeOrganization ? ` in ${activeOrganization.name}` : ''}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <UserPlus size={14} />
            Invite Member
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#0F172A',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Show inactive
        </label>
      </div>

      {/* Members Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Member', 'Role', 'Last Active', 'Status', canManage ? 'Actions' : ''].filter(Boolean).map((h) => (
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  No members match your search.
                </td>
              </tr>
            )}
            {filtered.map((member) => {
              const role = member.membership.role;
              const rd = ROLE_DISPLAY[role];
              const isRoleOpen = roleMenuOpen === member.membership.id;
              const wasSaved = savedRole === member.membership.id;

              return (
                <tr
                  key={member.membership.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    opacity: member.isActive ? 1 : 0.55,
                  }}
                >
                  {/* Member */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: member.avatarColor,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {member.avatarInitials}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{member.fullName}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{member.profession}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Mail size={10} />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      {canManage && member.isActive ? (
                        <>
                          <button
                            onClick={() => setRoleMenuOpen(isRoleOpen ? null : member.membership.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: rd.bg,
                              color: rd.text,
                              border: `1px solid ${rd.border}`,
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {rd.label}
                            <ChevronDown size={11} />
                          </button>
                          {isRoleOpen && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 'calc(100% + 4px)',
                                left: 0,
                                zIndex: 100,
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
                                minWidth: '200px',
                                overflow: 'hidden',
                                padding: '4px',
                              }}
                            >
                              {ROLES_FOR_INVITE.map((r) => (
                                <button
                                  key={r.value}
                                  onClick={() => handleRoleChange(member.membership.id, r.value)}
                                  style={{
                                    width: '100%',
                                    display: 'block',
                                    padding: '8px 12px',
                                    background: r.value === role ? '#F1F5F9' : 'transparent',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    color: '#0F172A',
                                    fontWeight: r.value === role ? 700 : 400,
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: rd.bg,
                            color: rd.text,
                            border: `1px solid ${rd.border}`,
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {rd.label}
                        </span>
                      )}
                      {wasSaved && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                          <CheckCircle2 size={11} />
                          Saved
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last Active */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748B' }}>
                      <Clock size={12} />
                      {formatRelativeTime(member.lastActive)}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    {member.isActive ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                        <CheckCircle2 size={13} />
                        Active
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>
                        <XCircle size={13} />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  {canManage && (
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleToggleActive(member.membership.id)}
                        title={member.isActive ? 'Deactivate member' : 'Reactivate member'}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: member.isActive ? '#FEE2E2' : '#D1FAE5',
                          color: member.isActive ? '#DC2626' : '#059669',
                          border: `1px solid ${member.isActive ? '#FCA5A5' : '#6EE7B7'}`,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {member.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* No manage access notice */}
      {!canManage && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#92400E',
          }}
        >
          <ShieldAlert size={14} />
          <span>
            Role management and member deactivation require <code>user.manage</code> permission.
            Switch to an <strong>Organisation Admin</strong> persona to try it.
          </span>
        </div>
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowInviteDialog(false); }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 24px 48px rgba(15,23,42,0.2)',
              width: '440px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} style={{ color: '#0284C7' }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Invite Team Member</span>
              </div>
              <button
                onClick={() => setShowInviteDialog(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {inviteSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={40} style={{ color: '#059669', marginBottom: '12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    Invitation Sent
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    A demo invite link for <strong>{invite.email}</strong> has been generated.
                    In production, a Supabase edge function would send a secure email.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="clinician@hospital.org"
                      value={invite.email}
                      onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: '6px' }}>
                      Assign Role
                    </label>
                    <select
                      value={invite.role}
                      onChange={(e) => setInvite((prev) => ({ ...prev, role: e.target.value as AppRole }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#0F172A',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {ROLES_FOR_INVITE.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px', fontSize: '12px', color: '#64748B', borderLeft: '3px solid #E2E8F0' }}>
                      {invite.role === 'organization_admin'
                        ? '⚠ Organisation Admin has no clinical decision authority. Admin is segregated from clinical access by design.'
                        : invite.role === 'clinician'
                        ? 'Clinician: Full clinical authority. Can create findings, review AI output, and record decisions.'
                        : invite.role === 'reviewer'
                        ? 'Reviewer: Read + review authority. Can accept/reject AI assessments and record decisions.'
                        : invite.role === 'nurse'
                        ? 'Nurse: Clinical support. Can create findings and update tasks. Cannot make clinical decisions.'
                        : 'Laboratory: Result entry only. No access to clinical decision workflow.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowInviteDialog(false)}
                      style={{ padding: '8px 16px', borderRadius: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '13px', color: '#64748B', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInvite}
                      disabled={!invite.email}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '6px',
                        background: invite.email ? '#0F172A' : '#94A3B8',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: invite.email ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Send Invitation
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#94A3B8' }}>
              Demo: Generates a pending <code>organization_invitations</code> record.
              Production: Supabase edge function delivers a time-limited invite link via email.
            </div>
          </div>
        </div>
      )}

      {/* Demo footnote */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        <strong>Demo Mode:</strong> Role changes and deactivations update local session state only.
        All membership mutations are recorded to <code>audit_events</code> in production with full RLS enforcement.
        Organisation Admin role is always strictly segregated from clinical decision authority.
      </div>
    </div>
  );
};
