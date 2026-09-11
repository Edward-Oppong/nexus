// ============================================================
// src/features/administration/tabs/FhirEndpointsTab.tsx
// Phase 8: Organisation-scoped FHIR Endpoint Registry
// Manage external system connections (EHR, LIS, PACS, Devices).
// Architecture §10: Integration boundary — FHIR translation only at edge.
// Requires organization.manage permission for write operations.
// ============================================================

import React, { useState } from 'react';
import { useAuth, DEMO_FHIR_CONFIGS } from '../../authentication/AuthProvider';
import { OrganizationFhirConfig } from '../../../domain/auth';
import {
  Globe,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Wifi,
  Activity,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const SYSTEM_TYPE_LABELS: Record<string, string> = {
  EHR: 'EHR / EMR',
  LIS: 'Laboratory (LIS)',
  RIS: 'Radiology (RIS)',
  PACS: 'PACS / Imaging',
  DEVICE: 'Bedside Device',
  PHARMACY: 'Pharmacy',
  REGISTRY: 'Clinical Registry',
  RESEARCH_DB: 'Research Database',
  MANUAL_UPLOAD: 'Manual Upload',
  OTHER: 'Other',
};

const PROTOCOL_LABELS: Record<string, string> = {
  FHIR_R4: 'FHIR R4',
  HL7_V2: 'HL7 v2',
  DICOM: 'DICOM / DICOMweb',
  CSV: 'CSV',
  PDF: 'PDF Upload',
  MANUAL: 'Manual',
  API: 'REST API',
  OTHER: 'Other',
};

const TRUST_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  AUTHORITATIVE: { label: 'Authoritative', bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  STANDARD:      { label: 'Standard',      bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  SUPPLEMENTARY: { label: 'Supplementary', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  UNVERIFIED:    { label: 'Unverified',    bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
};

function CircuitBreakerBadge({ status }: { status: OrganizationFhirConfig['circuitBreakerStatus'] }) {
  if (status === 'CLOSED') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 700 }}>
        <Wifi size={11} /> Online
      </span>
    );
  }
  if (status === 'HALF_OPEN') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#D97706', fontWeight: 700 }}>
        <Activity size={11} /> Probing
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>
      <WifiOff size={11} /> Circuit Open
    </span>
  );
}

interface AddEndpointForm {
  name: string;
  systemType: OrganizationFhirConfig['systemType'];
  protocol: OrganizationFhirConfig['protocol'];
  baseUrl: string;
  trustLevel: OrganizationFhirConfig['trustLevel'];
}

const EMPTY_FORM: AddEndpointForm = {
  name: '',
  systemType: 'EHR',
  protocol: 'FHIR_R4',
  baseUrl: '',
  trustLevel: 'STANDARD',
};

export const FhirEndpointsTab: React.FC = () => {
  const { activeOrganization, can } = useAuth();
  const [endpoints, setEndpoints] = useState<OrganizationFhirConfig[]>(DEMO_FHIR_CONFIGS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<AddEndpointForm>(EMPTY_FORM);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, 'success' | 'fail'>>({});
  const [addSuccess, setAddSuccess] = useState(false);

  const canManage = can('organization.manage');

  const orgEndpoints = endpoints.filter((e) => e.organizationId === activeOrganization?.id);

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    // Simulate test — HALF_OPEN endpoints fail, others succeed
    setTimeout(() => {
      const ep = endpoints.find((e) => e.id === id);
      const result = ep?.circuitBreakerStatus !== 'OPEN' ? 'success' : 'fail';
      setTestResult((prev) => ({ ...prev, [id]: result }));
      setTestingId(null);
      setTimeout(() => setTestResult((prev) => { const n = { ...prev }; delete n[id]; return n; }), 4000);
    }, 1200);
  };

  const handleDeactivate = (id: string) => {
    setEndpoints((prev) =>
      prev.map((e) => e.id === id ? { ...e, isActive: !e.isActive } : e)
    );
  };

  const handleAdd = () => {
    if (!form.name || !activeOrganization) return;
    const newEndpoint: OrganizationFhirConfig = {
      id: `fhir-cfg-${Date.now()}`,
      organizationId: activeOrganization.id,
      name: form.name,
      systemType: form.systemType,
      protocol: form.protocol,
      baseUrl: form.baseUrl || undefined,
      trustLevel: form.trustLevel,
      isActive: true,
      circuitBreakerStatus: 'CLOSED',
      createdAt: new Date().toISOString(),
    };
    setEndpoints((prev) => [...prev, newEndpoint]);
    setForm(EMPTY_FORM);
    setAddSuccess(true);
    setTimeout(() => { setAddSuccess(false); setShowAddForm(false); }, 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#FFFFFF',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#64748B',
    marginBottom: '5px',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Globe size={18} style={{ color: '#0284C7' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
              FHIR Endpoints
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            Organisation-scoped external system connections. FHIR translation occurs only at this boundary — the internal domain model is FHIR-free.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
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
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} />
            Add Endpoint
          </button>
        )}
      </div>

      {/* Add Endpoint Form */}
      {showAddForm && canManage && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Register New Endpoint</span>
            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Display Name</label>
              <input
                placeholder="e.g. Epic EHR — Ward 7"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>System Type</label>
              <select value={form.systemType} onChange={(e) => setForm((p) => ({ ...p, systemType: e.target.value as OrganizationFhirConfig['systemType'] }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(SYSTEM_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Protocol</label>
              <select value={form.protocol} onChange={(e) => setForm((p) => ({ ...p, protocol: e.target.value as OrganizationFhirConfig['protocol'] }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(PROTOCOL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Base URL</label>
              <input
                placeholder="https://ehr.hospital.org/fhir/r4"
                value={form.baseUrl}
                onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Trust Level</label>
              <select value={form.trustLevel} onChange={(e) => setForm((p) => ({ ...p, trustLevel: e.target.value as OrganizationFhirConfig['trustLevel'] }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(TRUST_BADGES).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>
          {addSuccess ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Endpoint registered successfully.
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!form.name}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                background: form.name ? '#0F172A' : '#94A3B8',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: form.name ? 'pointer' : 'not-allowed',
              }}
            >
              Register Endpoint
            </button>
          )}
        </div>
      )}

      {/* Endpoints Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
        {orgEndpoints.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            <Globe size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div>No endpoints registered for this organisation.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Endpoint', 'Type / Protocol', 'Trust Level', 'Circuit Breaker', 'Status', ''].map((h) => (
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
              {orgEndpoints.map((ep) => {
                const tb = TRUST_BADGES[ep.trustLevel];
                const isTesting = testingId === ep.id;
                const result = testResult[ep.id];

                return (
                  <tr
                    key={ep.id}
                    style={{ borderBottom: '1px solid #F1F5F9', opacity: ep.isActive ? 1 : 0.5 }}
                  >
                    {/* Endpoint */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{ep.name}</div>
                      {ep.baseUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                          <ExternalLink size={10} />
                          {ep.baseUrl}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        id: {ep.id}
                      </div>
                    </td>

                    {/* Type / Protocol */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{SYSTEM_TYPE_LABELS[ep.systemType]}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{PROTOCOL_LABELS[ep.protocol]}</div>
                    </td>

                    {/* Trust Level */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', background: tb.bg, color: tb.text, border: `1px solid ${tb.border}`, fontSize: '11px', fontWeight: 700 }}>
                        {tb.label}
                      </span>
                    </td>

                    {/* Circuit Breaker */}
                    <td style={{ padding: '14px 16px' }}>
                      <CircuitBreakerBadge status={ep.circuitBreakerStatus} />
                      {ep.circuitBreakerStatus === 'HALF_OPEN' && (
                        <div style={{ fontSize: '10px', color: '#D97706', marginTop: '2px' }}>Auto-probing after cooldown</div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      {ep.isActive ? (
                        <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>Enabled</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>Disabled</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Test Connection */}
                        <button
                          onClick={() => handleTestConnection(ep.id)}
                          disabled={!!testingId}
                          title="Test connection"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            fontSize: '11px',
                            color: '#334155',
                            cursor: testingId ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {isTesting
                            ? <><RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Testing…</>
                            : result === 'success'
                            ? <><CheckCircle2 size={11} style={{ color: '#059669' }} /> OK</>
                            : result === 'fail'
                            ? <><AlertTriangle size={11} style={{ color: '#DC2626' }} /> Failed</>
                            : <><Activity size={11} /> Test</>}
                        </button>

                        {/* Deactivate / Enable */}
                        {canManage && (
                          <button
                            onClick={() => handleDeactivate(ep.id)}
                            title={ep.isActive ? 'Disable endpoint' : 'Enable endpoint'}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: ep.isActive ? '#FEE2E2' : '#D1FAE5',
                              color: ep.isActive ? '#DC2626' : '#059669',
                              border: `1px solid ${ep.isActive ? '#FCA5A5' : '#6EE7B7'}`,
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {ep.isActive ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Circuit Breaker Parameters Info */}
      <div
        style={{
          padding: '14px 16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px', fontSize: '13px' }}>Circuit Breaker Parameters (ARCHITECTURE §10)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            ['Failure Threshold', '3 failures → OPEN'],
            ['Cooldown', '60,000 ms'],
            ['Max Retries', '3 (hard cap)'],
            ['Base Delay', '1,000 ms'],
            ['Max Delay', '10,000 ms'],
            ['Jitter', '±20%'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B' }}>{label}</span>
              <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {!canManage && (
        <div
          style={{
            marginTop: '12px',
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
          Endpoint registration requires <code>organization.manage</code> permission.
        </div>
      )}
    </div>
  );
};
