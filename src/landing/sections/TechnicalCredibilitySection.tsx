import React from 'react';
import {
  Layers,
  ShieldCheck,
  UserCheck,
  Lock,
  Share2,
  FileCheck2,
  AlertTriangle,
  Server,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface TechnicalCredibilitySectionProps {
  onOpenArchitecture: () => void;
}

export const TechnicalCredibilitySection: React.FC<TechnicalCredibilitySectionProps> = ({
  onOpenArchitecture,
}) => {
  const pillars = [
    {
      title: 'Clinical Workflow',
      icon: <Layers size={16} color="#0F766E" />,
      desc: 'Finite state machine enforcing transition invariants from DRAFT through CLINICIAN_REVIEW to RESOLVED.',
    },
    {
      title: 'Evidence & Provenance',
      icon: <ShieldCheck size={16} color="#0F766E" />,
      desc: 'W3C PROV-O data model tracking origin, ingestion timestamps, and verification status for every finding.',
    },
    {
      title: 'Human Review',
      icon: <UserCheck size={16} color="#0F766E" />,
      desc: 'Strict human-in-the-loop requirement. Zero unreviewed AI writes to permanent diagnostic records.',
    },
    {
      title: 'Role-Based Access',
      icon: <Lock size={16} color="#0F766E" />,
      desc: 'Granular permissions (Physician, Nurse, Resident, Reviewer, Admin) with organization-level tenancy.',
    },
    {
      title: 'Healthcare Interoperability',
      icon: <Share2 size={16} color="#0F766E" />,
      desc: 'Native FHIR R4, SMART on FHIR, DICOMweb PACS, HL7 v2.5.1 ER7, and IHE XDS.b exchange.',
    },
    {
      title: 'Auditability',
      icon: <FileCheck2 size={16} color="#0F766E" />,
      desc: 'Sealed FHIR R4 AuditEvent exports with cryptographic SHA-256 integrity hashes for regulatory inspection.',
    },
    {
      title: 'Safety Controls',
      icon: <AlertTriangle size={16} color="#0F766E" />,
      desc: 'Deterministic rules engine (Duke Criteria, Cockcroft-Gault CrCl, RxNorm drug-drug interactions, allergy side chains).',
    },
    {
      title: 'Resilient Architecture',
      icon: <Server size={16} color="#0F766E" />,
      desc: 'Offline-first outbox sync queue, cross-session persistent idempotency, and PostgreSQL row-level security.',
    },
  ];

  return (
    <section className="nexus-narrative-section" id="section-architecture">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 48px auto', textAlign: 'center' }}>
        <div className="nexus-section-label nexus-section-label--neutral">
          <Server size={13} />
          <span>SECTION 16 · TECHNICAL CREDIBILITY</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          Engineered for clinical responsibility.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          Behind the calm editorial surface lies a high-assurance clinical architecture designed to meet rigorous hospital safety and regulatory standards.
        </p>
      </div>

      {/* 8-Pillar Restrained Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          maxWidth: '1080px',
          margin: '0 auto 36px auto',
        }}
      >
        {pillars.map((pillar, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '16px 18px',
              transition: 'border-color 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {pillar.icon}
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                {pillar.title}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.5 }}>
              {pillar.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onOpenArchitecture}
          className="nexus-btn nexus-btn--secondary"
          style={{
            fontSize: '13px',
            padding: '10px 20px',
          }}
        >
          <span>Explore the full technical architecture (v1.0.0)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
};
