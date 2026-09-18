// ============================================================
// src/features/administration/tabs/AuditLogTab.tsx
// Phase 8: Immutable Audit Event Ledger Viewer
// Displays audit_events records for the active organisation.
// INSERT-only table — no update or delete ever permitted.
// Requires audit.view permission (reviewer, org_admin, platform_admin).
// ============================================================

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../authentication/AuthProvider';
import {
  DemoAuditEvent,
  AUDIT_ACTION_LABELS,
} from '../../../data/administration/mockAdminData';
import {
  Shield,
  ShieldAlert,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Lock,
} from 'lucide-react';

const RESOURCE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  case:                    { bg: '#EFF6FF', text: '#1D4ED8' },
  finding:                 { bg: '#F0FDF4', text: '#15803D' },
  nexus_assessment:        { bg: '#FDF4FF', text: '#7E22CE' },
  safety_issue:            { bg: '#FEF2F2', text: '#DC2626' },
  decision:                { bg: '#FFFBEB', text: '#D97706' },
  investigation:           { bg: '#F0FDF4', text: '#15803D' },
  fhir_bundle:             { bg: '#F0F9FF', text: '#0369A1' },
  organization_membership: { bg: '#F1F5F9', text: '#334155' },
  organization_fhir_config:{ bg: '#F0F9FF', text: '#0369A1' },
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function ActionLabel({ action }: { action: string }) {
  const label = AUDIT_ACTION_LABELS[action] || action;
  return <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{label}</span>;
}

function ResourceBadge({ type }: { type: string }) {
  const color = RESOURCE_TYPE_COLORS[type] || { bg: '#F1F5F9', text: '#334155' };
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '4px',
        background: color.bg,
        color: color.text,
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {type.replace(/_/g, ' ')}
    </span>
  );
}

interface ExpandedRow {
  id: string;
  isOpen: boolean;
}

export const AuditLogTab: React.FC = () => {
  const { activeOrganization, can } = useAuth();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const hasAuditView = can('audit.view');

  const orgEvents = useMemo(
    // Events will come from Supabase audit_events query when wired up.
    // Empty array shows the 'No audit events' empty state until then.
    () => ([] as DemoAuditEvent[]).filter((e) => e.organizationId === activeOrganization?.id),
    [activeOrganization]
  );

  const filtered = useMemo(() => {
    return orgEvents.filter((e) => {
      const matchesSearch =
        !search ||
        e.actorName.toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        e.resourceType.toLowerCase().includes(search.toLowerCase()) ||
        (e.resourceId || '').toLowerCase().includes(search.toLowerCase());
      const matchesAction = !filterAction || e.action === filterAction;
      const matchesResource = !filterResource || e.resourceType === filterResource;
      return matchesSearch && matchesAction && matchesResource;
    });
  }, [orgEvents, search, filterAction, filterResource]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const uniqueActions = [...new Set(orgEvents.map((e) => e.action))];
  const uniqueResources = [...new Set(orgEvents.map((e) => e.resourceType))];

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!hasAuditView) {
    return (
      <div
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
        }}
      >
        <ShieldAlert size={36} style={{ color: '#DC2626', marginBottom: '12px' }} />
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
          Audit Log — Access Denied
        </div>
        <div style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
          Viewing the audit ledger requires <code>audit.view</code> permission.
          Permitted roles: <strong>reviewer</strong>, <strong>organization_admin</strong>, <strong>platform_admin</strong>.
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8' }}>
          Switch to the Reviewer or Organisation Admin persona to view this section.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={18} style={{ color: '#0284C7' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Audit Log</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: '#0F172A', color: '#F8FAFC', fontSize: '10px', fontWeight: 700 }}>
              <Lock size={9} /> IMMUTABLE
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            Immutable clinical event ledger — {orgEvents.length} events for {activeOrganization?.name}.
            No UPDATE or DELETE is ever permitted on this table.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search actor, action, resource…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Action filter */}
        <div style={{ position: 'relative' }}>
          <Filter size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            style={{
              padding: '8px 28px 8px 28px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '13px',
              color: filterAction ? '#0F172A' : '#94A3B8',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              background: '#FFFFFF',
            }}
          >
            <option value="">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{AUDIT_ACTION_LABELS[a] || a}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
        </div>

        {/* Resource filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterResource}
            onChange={(e) => { setFilterResource(e.target.value); setPage(0); }}
            style={{
              padding: '8px 28px 8px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '13px',
              color: filterResource ? '#0F172A' : '#94A3B8',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              background: '#FFFFFF',
            }}
          >
            <option value="">All Resources</option>
            {uniqueResources.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#94A3B8' }}>
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Audit Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        {paginated.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            No events match the current filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['', 'Timestamp', 'Actor', 'Action', 'Resource', 'Resource ID'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#64748B',
                      borderBottom: '1px solid #E2E8F0',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((event: DemoAuditEvent) => {
                const isExpanded = expandedRows.has(event.id);
                return (
                  <React.Fragment key={event.id}>
                    <tr
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid #F1F5F9',
                        cursor: event.detail ? 'pointer' : 'default',
                        transition: 'background 0.1s',
                      }}
                      onClick={() => event.detail && toggleRow(event.id)}
                    >
                      {/* Expand toggle */}
                      <td style={{ padding: '12px 8px 12px 14px', width: '28px' }}>
                        {event.detail ? (
                          <div style={{ color: '#94A3B8', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            <ChevronRight size={14} />
                          </div>
                        ) : null}
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                          {formatTimestamp(event.recordedAt)}
                        </span>
                      </td>

                      {/* Actor */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: event.actorUserId === 'system' ? '#7C3AED' : '#0F172A' }}>
                          {event.actorName}
                        </div>
                        {event.actorUserId !== 'system' && (
                          <div style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                            {event.actorUserId.substring(0, 8)}…
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 14px' }}>
                        <ActionLabel action={event.action} />
                      </td>

                      {/* Resource Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <ResourceBadge type={event.resourceType} />
                      </td>

                      {/* Resource ID */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                          {event.resourceId || '—'}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && event.detail && (
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td />
                        <td colSpan={5} style={{ padding: '0 14px 14px 14px' }}>
                          <div
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '12px 14px',
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginBottom: '8px' }}>
                              Audit Detail
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                fontSize: '12px',
                                color: '#0F172A',
                                fontFamily: 'var(--font-mono)',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {JSON.stringify(event.detail, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Page {page + 1} of {totalPages} · {filtered.length} total events
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '6px 12px', borderRadius: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '12px', color: page === 0 ? '#94A3B8' : '#0F172A', cursor: page === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{ padding: '6px 12px', borderRadius: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', fontSize: '12px', color: page === totalPages - 1 ? '#94A3B8' : '#0F172A', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Immutable notice */}
      <div
        style={{
          padding: '12px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Lock size={11} style={{ color: '#0F172A' }} />
          <strong style={{ color: '#0F172A' }}>Immutable Ledger Guarantee (ARCHITECTURE §5 + §14)</strong>
        </div>
        The <code>audit_events</code> table is INSERT-only. No RLS UPDATE or DELETE policies exist.
        Critical mutations (case status transitions, decision recording) write the audit event in the same PostgreSQL transaction —
        if the audit write fails, the mutation rolls back. Edge function mutations use the outbox pattern.
      </div>
    </div>
  );
};
