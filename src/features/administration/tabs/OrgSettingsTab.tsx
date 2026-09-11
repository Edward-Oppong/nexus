// ============================================================
// src/features/administration/tabs/OrgSettingsTab.tsx
// Phase 8: Organisation Settings Panel
// Allows org_admin to view and edit organisation details.
// Changes persist to demo session state only (no Supabase write in demo mode).
// ============================================================

import React, { useState } from 'react';
import { useAuth, DEMO_ORGANIZATIONS } from '../../authentication/AuthProvider';
import { Organization } from '../../../domain/auth';
import { ORG_TYPE_LABELS } from '../../../data/administration/mockAdminData';
import { Building2, Save, CheckCircle2, Globe, Clock } from 'lucide-react';

const COUNTRY_CODES: Record<string, string> = {
  GB: 'United Kingdom',
  NG: 'Nigeria',
  GH: 'Ghana',
  ZA: 'South Africa',
  KE: 'Kenya',
  IN: 'India',
  US: 'United States',
  AU: 'Australia',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
};

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #E2E8F0',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#0F172A',
  background: '#FFFFFF',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748B',
  marginBottom: '6px',
};

interface Field {
  label: string;
  key: keyof Organization;
  type?: 'text' | 'select' | 'toggle';
  options?: { value: string; label: string }[];
}

const FIELDS: Field[] = [
  { label: 'Organisation Name', key: 'name', type: 'text' },
  {
    label: 'Organisation Type',
    key: 'organizationType',
    type: 'select',
    options: Object.entries(ORG_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
  },
  {
    label: 'Country',
    key: 'countryCode',
    type: 'select',
    options: Object.entries(COUNTRY_CODES).map(([v, l]) => ({ value: v, label: `${v} — ${l}` })),
  },
  {
    label: 'Timezone',
    key: 'timezone',
    type: 'select',
    options: TIMEZONES.map((tz) => ({ value: tz, label: tz })),
  },
];

export const OrgSettingsTab: React.FC = () => {
  const { activeOrganization, can } = useAuth();
  const [form, setForm] = useState<Partial<Organization>>(activeOrganization || {});
  const [saved, setSaved] = useState(false);
  const canEdit = can('organization.manage');

  // Find the full org from the demo list (for cross-reference display)
  const orgIdx = DEMO_ORGANIZATIONS.findIndex((o) => o.id === activeOrganization?.id);

  const handleChange = (key: keyof Organization, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // Demo: save to local state only, no Supabase write
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!activeOrganization) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
        No active organisation selected.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Building2 size={18} style={{ color: '#0284C7' }} />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            Organisation Settings
          </h2>
          {activeOrganization.isActive ? (
            <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#D1FAE5', color: '#065F46', fontSize: '11px', fontWeight: 700 }}>
              ACTIVE
            </span>
          ) : (
            <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#FEE2E2', color: '#991B1B', fontSize: '11px', fontWeight: 700 }}>
              INACTIVE
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
          Organisation-level configuration. Changes apply to all members within this tenancy.
          {!canEdit && (
            <span style={{ marginLeft: '6px', color: '#DC2626', fontWeight: 600 }}>
              — Read-only. Requires <code style={{ fontSize: '11px' }}>organization.manage</code> permission.
            </span>
          )}
        </p>
      </div>

      {/* Organisation Identity Card */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '10px',
            background: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Building2 size={24} style={{ color: '#38BDF8' }} />
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{activeOrganization.name}</div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {ORG_TYPE_LABELS[activeOrganization.organizationType || ''] || activeOrganization.organizationType}
            {activeOrganization.countryCode ? ` · ${COUNTRY_CODES[activeOrganization.countryCode] || activeOrganization.countryCode}` : ''}
            {activeOrganization.timezone ? ` · ${activeOrganization.timezone}` : ''}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            id: {activeOrganization.id}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
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
          Edit Details
        </div>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {FIELDS.map(({ label, key, type, options }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              {type === 'select' ? (
                <select
                  value={(form[key] as string) || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  disabled={!canEdit}
                  style={{ ...inputStyle, cursor: canEdit ? 'pointer' : 'not-allowed', background: canEdit ? '#FFFFFF' : '#F8FAFC' }}
                >
                  <option value="">— Select —</option>
                  {options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={(form[key] as string) || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  disabled={!canEdit}
                  style={{ ...inputStyle, cursor: canEdit ? 'text' : 'not-allowed', background: canEdit ? '#FFFFFF' : '#F8FAFC' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Supplementary Read-only Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Globe size={16} style={{ color: '#64748B', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              FHIR Tenancy Scope
            </div>
            <div style={{ fontSize: '13px', color: '#0F172A', marginTop: '2px' }}>
              {activeOrganization.id}
            </div>
          </div>
        </div>
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Clock size={16} style={{ color: '#64748B', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              Clinical Time Reference
            </div>
            <div style={{ fontSize: '13px', color: '#0F172A', marginTop: '2px' }}>
              {activeOrganization.timezone || 'UTC'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {canEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '6px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Save size={14} />
            Save Changes
          </button>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              Changes saved to demo session
            </div>
          )}
        </div>
      )}

      {/* Demo footnote */}
      <div
        style={{
          marginTop: '24px',
          padding: '12px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        <strong>Demo Mode:</strong> Changes update local session state only. Production deployments write to
        the <code>organizations</code> table with full RLS enforcement.
        Organisation modifications are recorded in the immutable <code>audit_events</code> ledger.
      </div>
    </div>
  );
};
