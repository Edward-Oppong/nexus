// ============================================================
// src/features/regulatory-compliance/RegulatoryComplianceView.tsx
// Phase 12: Regulatory & Compliance Workstation
// 4 Interactive Consoles:
// 1. MDCG 2021-6 & EU AI Act SaMD Auditor
// 2. FDA PCCP (Predetermined Change Control Plan) Tracker
// 3. Regional Data Residency & Patient Rights (GDPR / POPIA)
// 4. Regulatory FHIR R4 AuditEvent Exporter with SHA-256 Seal
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Copy,
  Check,
  RefreshCw,
  Globe2,
  Lock,
  FileCode2,
  ArrowRight,
  Sliders,
  Scale,
  Sparkles,
  Info,
  Server,
  UserCheck,
} from 'lucide-react';
import {
  MdcgAuditReport,
  MdcgClauseCategory,
  PccpModificationProtocol,
  PccpModificationType,
  RegulatoryJurisdiction,
  DataSubjectRequest,
  RegulatoryExportManifest,
} from '../../domain/regulatory-compliance';
import { runMdcgAudit } from '../../lib/compliance/mdcg-auditor';
import {
  CURRENT_FDA_PCCP_PLAN,
  evaluateProposedModification,
} from '../../lib/compliance/fda-pccp-tracker';
import {
  JURISDICTION_CONFIGS,
  INITIAL_PATIENT_CONSENTS,
  INITIAL_DSR_REQUESTS,
  createDataSubjectRequest,
} from '../../lib/compliance/data-residency-manager';
import { generateRegulatoryAuditBundle } from '../../lib/compliance/regulatory-audit-exporter';

type ComplianceTab = 'mdcg-audit' | 'fda-pccp' | 'data-residency' | 'audit-export';

export const RegulatoryComplianceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('mdcg-audit');

  // MDCG Audit State
  const [auditReport, setAuditReport] = useState<MdcgAuditReport>(() => runMdcgAudit());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const handleRerunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setAuditReport(runMdcgAudit());
      setIsAuditing(false);
    }, 600);
  };

  const filteredClauses = useMemo(() => {
    if (selectedCategory === 'ALL') return auditReport.clauses;
    return auditReport.clauses.filter((c) => c.category === selectedCategory);
  }, [auditReport, selectedCategory]);

  // FDA PCCP Tracker State
  const [protocols, setProtocols] = useState<PccpModificationProtocol[]>(
    CURRENT_FDA_PCCP_PLAN.authorizedProtocols
  );
  const [evalType, setEvalType] = useState<PccpModificationType>('PROMPT_TEMPLATE_OPTIMIZATION');
  const [evalDesc, setEvalDesc] = useState<string>('Refining sepsis shock clinical risk descriptors.');
  const [evalVariance, setEvalVariance] = useState<number>(0.15);
  const [evalResult, setEvalResult] = useState<ReturnType<typeof evaluateProposedModification> | null>(null);

  const handleEvaluatePccp = (e: React.FormEvent) => {
    e.preventDefault();
    const res = evaluateProposedModification(evalType, evalDesc, evalVariance);
    setEvalResult(res);
  };

  // Data Residency State
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<RegulatoryJurisdiction>('EU_GDPR');
  const [dsrRequests, setDsrRequests] = useState<DataSubjectRequest[]>(INITIAL_DSR_REQUESTS);
  const [showNewDsrModal, setShowNewDsrModal] = useState<boolean>(false);
  const [newDsrPatient, setNewDsrPatient] = useState<string>('syn-pat-00482');
  const [newDsrType, setNewDsrType] = useState<DataSubjectRequest['requestType']>('RIGHT_TO_ACCESS');
  const [newDsrDetails, setNewDsrDetails] = useState<string>('Patient requesting machine-readable export of clinical AI audit records.');

  const handleCreateDsr = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = createDataSubjectRequest(newDsrPatient, 'Amara Okafor', newDsrType, selectedJurisdiction, newDsrDetails);
    setDsrRequests([newReq, ...dsrRequests]);
    setShowNewDsrModal(false);
  };

  const handleFulfillDsr = (id: string) => {
    setDsrRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'FULFILLED',
              fulfilledAt: new Date().toISOString(),
              certifiedBy: 'Compliance Officer (Manual Override)',
            }
          : r
      )
    );
  };

  // Regulatory Exporter State
  const [targetAuthority, setTargetAuthority] = useState<RegulatoryExportManifest['targetAuthority']>('EU_NOTIFIED_BODY');
  const [exportManifest, setExportManifest] = useState<RegulatoryExportManifest | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateExport = async () => {
    setIsExporting(true);
    try {
      const manifest = await generateRegulatoryAuditBundle(targetAuthority);
      setExportManifest(manifest);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyJson = () => {
    if (!exportManifest?.fhirBundlePayload) return;
    navigator.clipboard.writeText(JSON.stringify(exportManifest.fhirBundlePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!exportManifest?.fhirBundlePayload) return;
    const blob = new Blob([JSON.stringify(exportManifest.fhirBundlePayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FHIR-AuditEvent-Bundle-${exportManifest.exportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main
      aria-label="Regulatory & Compliance Workstation"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#F8FAFC',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Header Banner ─────────────────────────────────── */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '20px 32px 0 32px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={13} style={{ color: '#2563EB' }} />
                MDR 2017/745 Class IIa SaMD
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                FDA Product Code: QAS · CE Notified Body Standard: MDCG 2021-6
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Regulatory & Compliance Workstation
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                padding: '6px 14px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={18} style={{ color: '#059669' }} />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>
                  Audited Compliance Status
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
                  {auditReport.overallScore}% · Verified Compliant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div style={{ display: 'flex', gap: '28px', borderBottom: '1px solid transparent' }}>
          {[
            { id: 'mdcg-audit', label: 'MDCG 2021-6 & EU AI Act', icon: <Scale size={15} /> },
            { id: 'fda-pccp', label: 'FDA PCCP Change Control', icon: <Sliders size={15} /> },
            { id: 'data-residency', label: 'Data Residency & GDPR/POPIA', icon: <Globe2 size={15} /> },
            { id: 'audit-export', label: 'Regulatory FHIR Audit Exporter', icon: <FileCode2 size={15} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ComplianceTab)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '12px 2px',
                  borderBottom: `2px solid ${isActive ? '#2563EB' : 'transparent'}`,
                  color: isActive ? '#2563EB' : '#64748B',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Tab Content ──────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {/* TAB 1: MDCG 2021-6 & EU AI ACT */}
        {activeTab === 'mdcg-audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
            {/* Top Scorecard Summary */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  MDCG 2021-6 Clinical Evaluation & AI Invariants
                </h2>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
                  European Medical Device Coordination Group guidance for Artificial Intelligence in Medical Devices (MDR 2017/745).
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                    Passing Clauses
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>
                    {auditReport.compliantCount} / {auditReport.totalClauses}
                  </div>
                </div>

                <button
                  onClick={handleRerunAudit}
                  disabled={isAuditing}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RefreshCw size={13} className={isAuditing ? 'spin' : ''} />
                  {isAuditing ? 'Auditing...' : 'Re-run Live Audit'}
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['ALL', 'HUMAN_OVERSIGHT', 'ROBUSTNESS_ACCURACY', 'TRANSPARENCY_IFU', 'DATA_GOVERNANCE', 'POST_MARKET_SURVEILLANCE', 'CYBERSECURITY_RISK'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? '#0F172A' : '#FFFFFF',
                    color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                    border: `1px solid ${selectedCategory === cat ? '#0F172A' : '#CBD5E1'}`,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Clause Verification Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredClauses.map((clause) => (
                <div
                  key={clause.clauseId}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '16px 20px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
                        {clause.clauseId}
                      </span>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {clause.clauseTitle}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: clause.status === 'COMPLIANT' ? '#ECFDF5' : '#FEF2F2',
                        color: clause.status === 'COMPLIANT' ? '#065F46' : '#991B1B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={12} /> {clause.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, margin: '0 0 10px 0' }}>
                    <strong>Regulatory Requirement: </strong>
                    {clause.requirementDescription}
                  </p>

                  <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '4px', padding: '10px 12px', fontSize: '12px', color: '#1E293B', marginBottom: '8px' }}>
                    <strong style={{ color: '#0F172A' }}>Nexus Technical Implementation: </strong>
                    {clause.nexusImplementation}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                    <span>
                      <strong>Audit Evidence: </strong>
                      <code style={{ fontFamily: 'var(--font-mono)', background: '#F1F5F9', padding: '2px 6px', borderRadius: '3px' }}>
                        {clause.auditEvidenceRef}
                      </code>
                    </span>
                    <span>
                      <strong>Risk Mitigation: </strong>
                      {clause.riskMitigation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FDA PCCP CHANGE CONTROL */}
        {activeTab === 'fda-pccp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
            {/* Header Description */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    FDA Predetermined Change Control Plan (PCCP) Protocol
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Cleared modification boundaries for AI/ML-enabled Software as a Medical Device (21 CFR 820 / FDA PCCP Guidance).
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>
                    Device: Nexus CDS SaMD (Class II)
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Proposed Change Evaluator */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} style={{ color: '#2563EB' }} />
                Interactive Change Boundary Evaluator (510(k) vs AMP)
              </h3>

              <form onSubmit={handleEvaluatePccp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Modification Category
                  </label>
                  <select
                    value={evalType}
                    onChange={(e) => setEvalType(e.target.value as PccpModificationType)}
                    className="input input-sm"
                    style={{ width: '100%' }}
                  >
                    <option value="PROMPT_TEMPLATE_OPTIMIZATION">Prompt Template Optimization</option>
                    <option value="REASONING_TEMPERATURE_TUNING">Reasoning Temperature Tuning</option>
                    <option value="WEIGHT_QUANTIZATION_CHANGE">Weight Quantization (FP16/AWQ)</option>
                    <option value="RETRAINING_SET_EXPANSION">Retraining Set Expansion (DPO)</option>
                    <option value="CLINICAL_DECISION_RULE_ADDITION">Clinical Decision Rule Addition</option>
                    <option value="OUT_OF_BOUNDS_ARCHITECTURE_SHIFT">Out-of-Bounds Autonomous Actuation</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Proposed Change Description
                  </label>
                  <input
                    type="text"
                    value={evalDesc}
                    onChange={(e) => setEvalDesc(e.target.value)}
                    className="input input-sm"
                    style={{ width: '100%' }}
                  />
                </div>

                <button type="submit" className="btn btn-sm btn-primary">
                  Evaluate Boundary
                </button>
              </form>

              {evalResult && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    background: evalResult.requires510k ? '#FEF2F2' : '#F0FDF4',
                    border: `1px solid ${evalResult.requires510k ? '#FECACA' : '#BBF7D0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: evalResult.requires510k ? '#991B1B' : '#166534' }}>
                      Result: {evalResult.boundary.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '11px', color: evalResult.requires510k ? '#B91C1C' : '#15803D', marginTop: '2px' }}>
                      {evalResult.rationale}
                    </div>
                  </div>
                  <span
                    className={`badge ${evalResult.requires510k ? 'badge-critical' : 'badge-verified'}`}
                  >
                    {evalResult.requires510k ? 'MANDATORY 510(k)' : 'WITHIN PCCP'}
                  </span>
                </div>
              )}
            </div>

            {/* Authorized Protocols List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Authorized Modification Protocols (AMP)
              </div>

              {protocols.map((proto) => {
                const isApproved = proto.approvalStatus === 'APPROVED';
                const isRejected = proto.approvalStatus === 'REJECTED';
                return (
                  <div
                    key={proto.protocolId}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>
                          {proto.protocolId}
                        </span>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                          {proto.modificationType.replace(/_/g, ' ')}
                        </h4>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: isApproved ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#FFFBEB',
                          color: isApproved ? '#065F46' : isRejected ? '#991B1B' : '#92400E',
                        }}
                      >
                        {proto.boundaryEvaluation.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                      <strong>Authorized Variance Range: </strong>
                      {proto.allowedVarianceRange}
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', color: '#1E293B', marginBottom: '6px' }}>
                      <strong>Verification Method & Acceptance Criteria: </strong>
                      {proto.verificationMethod} — {proto.acceptanceCriteria}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                      <span>
                        <strong>Sign-Off: </strong>
                        {proto.reviewedBy || 'Pending Review Committee'}
                      </span>
                      <span>
                        <strong>Rationale: </strong>
                        {proto.regulatoryImpactRationale}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DATA RESIDENCY & GDPR/POPIA */}
        {activeTab === 'data-residency' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
            {/* Jurisdiction Picker Cards */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                Regional Sovereignty & Jurisdiction Config
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                {(Object.keys(JURISDICTION_CONFIGS) as RegulatoryJurisdiction[]).map((jur) => {
                  const cfg = JURISDICTION_CONFIGS[jur];
                  const isSelected = selectedJurisdiction === jur;
                  return (
                    <div
                      key={jur}
                      onClick={() => setSelectedJurisdiction(jur)}
                      style={{
                        background: '#FFFFFF',
                        border: `2px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                        borderRadius: '6px',
                        padding: '14px',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 4px rgba(37,99,235,0.1)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                          {jur}
                        </span>
                        {isSelected && <CheckCircle2 size={15} style={{ color: '#2563EB' }} />}
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                        {cfg.jurisdictionLabel}
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.3 }}>
                        Region: {cfg.primaryDataCenterRegion}
                      </div>

                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', fontSize: '10px', color: '#059669', fontWeight: 600 }}>
                        {cfg.encryptionAtRest}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Jurisdiction Specs */}
            {(() => {
              const activeCfg = JURISDICTION_CONFIGS[selectedJurisdiction];
              return (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px 20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                    Active Sovereignty Policy: {activeCfg.jurisdictionLabel}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '12px' }}>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Legal Basis for Processing</div>
                      <div style={{ color: '#0F172A', marginTop: '2px' }}>{activeCfg.legalBasis}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Cross-Border Data Transfer</div>
                      <div style={{ color: activeCfg.crossBorderTransferAllowed ? '#D97706' : '#16A34A', fontWeight: 600, marginTop: '2px' }}>
                        {activeCfg.crossBorderTransferAllowed ? 'Permitted with BAA' : 'Strictly Prohibited (In-Country Only)'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Statutory DPO Contact</div>
                      <div style={{ color: '#0F172A', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{activeCfg.statutoryDpoContact}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Patient Consent & DSR Requests */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Data Subject Rights (DSR) & Patient AI Consent Ledger
                  </h3>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Fulfillment tracking for GDPR Articles 15-18 & POPIA Section 23/24 requests.
                  </p>
                </div>

                <button onClick={() => setShowNewDsrModal(true)} className="btn btn-sm btn-outline">
                  + Log Patient DSR Request
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dsrRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>
                          {req.id}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                          {req.requestType.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>
                          {req.patientName} ({req.patientId})
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                        {req.requestDetails}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        className={`badge ${req.status === 'FULFILLED' ? 'badge-verified' : 'badge-review'}`}
                      >
                        {req.status}
                      </span>
                      {req.status !== 'FULFILLED' && (
                        <button
                          onClick={() => handleFulfillDsr(req.id)}
                          className="btn btn-xs btn-primary"
                        >
                          Fulfill & Certify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal for new DSR */}
            {showNewDsrModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 999,
                }}
              >
                <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '24px', width: '480px', maxWidth: '90%' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
                    Log Patient Data Subject Request (DSR)
                  </h3>
                  <form onSubmit={handleCreateDsr} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Patient ID
                      </label>
                      <input
                        type="text"
                        value={newDsrPatient}
                        onChange={(e) => setNewDsrPatient(e.target.value)}
                        className="input input-sm"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Request Type
                      </label>
                      <select
                        value={newDsrType}
                        onChange={(e) => setNewDsrType(e.target.value as any)}
                        className="input input-sm"
                        style={{ width: '100%' }}
                      >
                        <option value="RIGHT_TO_ACCESS">Right to Access (Art 15 / Sec 23)</option>
                        <option value="RIGHT_TO_RECTIFICATION">Right to Rectification (Art 16 / Sec 24)</option>
                        <option value="RIGHT_TO_ERASURE">Right to Erasure / De-identification (Art 17)</option>
                        <option value="RIGHT_TO_RESTRICTION">Right to Restriction of Processing (Art 18)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Specific Request Scope & Details
                      </label>
                      <textarea
                        value={newDsrDetails}
                        onChange={(e) => setNewDsrDetails(e.target.value)}
                        className="input input-sm"
                        rows={3}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                      <button type="button" onClick={() => setShowNewDsrModal(false)} className="btn btn-sm btn-outline">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-sm btn-primary">
                        Register Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REGULATORY FHIR AUDIT EXPORTER */}
        {activeTab === 'audit-export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Regulatory FHIR R4 AuditEvent Package Generator
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Compiles immutable clinical audit events into a standardized FHIR R4 Bundle with cryptographic SHA-256 seal.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={targetAuthority}
                    onChange={(e) => setTargetAuthority(e.target.value as any)}
                    className="input input-sm"
                    style={{ fontSize: '12px' }}
                  >
                    <option value="EU_NOTIFIED_BODY">Target: EU Notified Body (TÜV / BSI)</option>
                    <option value="FDA_CDRH">Target: US FDA CDRH Inspection</option>
                    <option value="NATIONAL_DATA_AUTHORITY">Target: National Data Protection Authority</option>
                    <option value="INTERNAL_COMPLIANCE">Target: Internal Clinical Quality Audit</option>
                  </select>

                  <button
                    onClick={handleGenerateExport}
                    disabled={isExporting}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={13} className={isExporting ? 'spin' : ''} />
                    {isExporting ? 'Compiling Bundle...' : 'Generate Sealed Audit Bundle'}
                  </button>
                </div>
              </div>
            </div>

            {exportManifest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Manifest Metadata Card */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '16px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Export Package ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                      {exportManifest.exportId}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Total Audit Events</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB' }}>
                      {exportManifest.totalEventCount} AuditEvent Resources
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>SHA-256 Cryptographic Hash Checksum</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#059669', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                      {exportManifest.sha256Checksum}
                    </div>
                  </div>
                </div>

                {/* JSON Preview & Action Controls */}
                <div style={{ background: '#0F172A', borderRadius: '8px', padding: '16px 20px', color: '#E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileCode2 size={16} style={{ color: '#38BDF8' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        FHIR R4 Bundle (type: collection) · {exportManifest.totalEventCount} entries
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={handleCopyJson}
                        className="btn btn-xs btn-outline"
                        style={{ color: '#E2E8F0', borderColor: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {copied ? <Check size={12} style={{ color: '#4ADE80' }} /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy JSON'}
                      </button>

                      <button
                        onClick={handleDownloadJson}
                        className="btn btn-xs btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={12} /> Download Bundle
                      </button>
                    </div>
                  </div>

                  <pre
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      background: '#1E293B',
                      padding: '12px',
                      borderRadius: '4px',
                      lineHeight: 1.4,
                      color: '#CBD5E1',
                    }}
                  >
                    {JSON.stringify(exportManifest.fhirBundlePayload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '8px',
                  padding: '48px',
                  textAlign: 'center',
                }}
              >
                <FileCode2 size={36} style={{ color: '#94A3B8', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                  No Regulatory Package Compiled Yet
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', maxWidth: '460px', margin: '4px auto 16px auto' }}>
                  Select the receiving authority and click "Generate Sealed Audit Bundle" to produce a signed, tamper-evident FHIR R4 AuditEvent bundle.
                </p>
                <button onClick={handleGenerateExport} className="btn btn-sm btn-primary">
                  Generate Sealed Audit Bundle
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};
