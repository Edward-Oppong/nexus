import React, { useState } from 'react';
import {
  Layers,
  Database,
  HeartPulse,
  FlaskConical,
  FileCode,
  Activity,
  Server,
  Share2,
  CheckCircle2,
} from 'lucide-react';

export const EcosystemVisual: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>('fhir');

  const integrations = [
    {
      id: 'fhir',
      title: 'FHIR R4 & SMART on FHIR',
      category: 'EHR INTEROPERABILITY',
      icon: <Server size={18} color="#0F766E" />,
      protocols: ['US Core 6.1', 'SMART v1/v2 Launch', 'Condition / Observation / MedStatement'],
      desc: 'Seamlessly launches within Epic, Cerner, or independent EHRs via SMART OAuth2 protocols, reading patient demographics and encounters without bespoke database connectors.',
    },
    {
      id: 'dicom',
      title: 'DICOMweb PACS Imaging',
      category: 'RADIOLOGY & CARDIOLOGY',
      icon: <HeartPulse size={18} color="#DC2626" />,
      protocols: ['QIDO-RS', 'WADO-RS', 'Window/Level Presets', 'Caliper Measurements'],
      desc: 'Connects directly to hospital picture archiving systems. Renders multi-slice echocardiograms and CT scans directly inside clinical investigations with physical millimeter measurements.',
    },
    {
      id: 'hl7',
      title: 'HL7 v2.5.1 ER7 Messaging',
      category: 'HOSPITAL INFORMATION SYSTEMS',
      icon: <FileCode size={18} color="#2563EB" />,
      protocols: ['ADT^A01 (Admit)', 'ADT^A08 (Update)', 'ORU^R01 (Observation Results)'],
      desc: 'Pure parser ingests legacy hospital feed messages from labs and admissions, automatically extracting structured clinical findings while preserving raw payload provenance.',
    },
    {
      id: 'ihe',
      title: 'IHE XDS.b & HL7 CDA R2',
      category: 'CROSS-ENTERPRISE EXCHANGE',
      icon: <Share2 size={18} color="#D97706" />,
      protocols: ['ITI-18 Registry Stored Query', 'ITI-43 Document Retrieval', 'C-CDA Summaries'],
      desc: 'Enables regional health information exchanges (HIEs) to query and retrieve historical continuity of care documents across disparate hospital networks.',
    },
  ];

  const active = integrations.find((i) => i.id === selectedNode) || integrations[0];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* 4 Integration Pillar Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {integrations.map((item) => {
          const isSelected = item.id === selectedNode;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedNode(item.id)}
              style={{
                background: isSelected ? '#FFFFFF' : '#F8FAFC',
                border: `1.5px solid ${isSelected ? '#0F766E' : '#E2E8F0'}`,
                borderRadius: '8px',
                padding: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 12px rgba(15, 118, 110, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {item.icon}
                <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', color: '#64748B', fontWeight: 700 }}>
                  {item.category}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                {item.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Integration Detail Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: '12px',
          padding: '24px 28px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '2px 8px', borderRadius: '4px' }}>
              STANDARD HOSPITAL PROTOCOL
            </span>
            <h3 style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
              {active.title}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {active.protocols.map((p, i) => (
              <span
                key={i}
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--nexus-font-mono)',
                  background: '#F1F5F9',
                  color: '#334155',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 16px 0' }}>
          {active.desc}
        </p>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#0F766E',
            fontFamily: 'var(--nexus-font-mono)',
          }}
        >
          <CheckCircle2 size={14} /> Zero vendor lock-in · Built directly on HL7 International and DICOM open standards
        </div>
      </div>
    </div>
  );
};
