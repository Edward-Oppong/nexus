import React, { useState } from 'react';
import {
  FileText,
  Activity,
  FlaskConical,
  HeartPulse,
  Pill,
  History,
  ClipboardList,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export type OrbitMode = 'initial' | 'fragmented' | 'converged';

interface CaseOrbitVisualProps {
  mode?: OrbitMode;
  interactive?: boolean;
}

interface ClinicalNode {
  id: string;
  title: string;
  category: string;
  summary: string;
  icon: React.ReactNode;
  silo: string;
  fragmentedOffset: { x: number; y: number };
  convergedOffset: { x: number; y: number };
}

export const CaseOrbitVisual: React.FC<CaseOrbitVisualProps> = ({
  mode: initialMode = 'initial',
  interactive = true,
}) => {
  const [currentMode, setCurrentMode] = useState<OrbitMode>(initialMode);

  const clinicalNodes: ClinicalNode[] = [
    {
      id: 'history',
      title: 'Patient History',
      category: 'EHR / History',
      summary: 'Bicuspid aortic valve, dental extraction 4 weeks prior',
      icon: <History size={16} className="text-amber-600" />,
      silo: 'Outpatient Clinic EHR',
      fragmentedOffset: { x: -280, y: -160 },
      convergedOffset: { x: -180, y: -90 },
    },
    {
      id: 'findings',
      title: 'Clinical Findings',
      category: 'Bedside Exam',
      summary: 'Temp 38.8°C, new Grade III/VI murmur, Janeway lesions',
      icon: <Activity size={16} className="text-emerald-600" />,
      silo: 'Emergency Triage System',
      fragmentedOffset: { x: 260, y: -170 },
      convergedOffset: { x: 180, y: -90 },
    },
    {
      id: 'labs',
      title: 'Laboratory Results',
      category: 'LIS Diagnostic Feed',
      summary: 'Blood cultures 3/3 Streptococcus viridans, CRP 112 mg/L',
      icon: <FlaskConical size={16} className="text-teal-600" />,
      silo: 'Central Lab System',
      fragmentedOffset: { x: -320, y: 30 },
      convergedOffset: { x: -200, y: 10 },
    },
    {
      id: 'imaging',
      title: 'Imaging Reports',
      category: 'PACS / TEE Echo',
      summary: '11mm mobile oscillating vegetation on anterior mitral leaflet',
      icon: <HeartPulse size={16} className="text-rose-600" />,
      silo: 'Radiology PACS Archive',
      fragmentedOffset: { x: 310, y: 20 },
      convergedOffset: { x: 200, y: 10 },
    },
    {
      id: 'meds',
      title: 'Medications & Allergies',
      category: 'Pharmacy Record',
      summary: 'Empiric Ceftriaxone IV · Documented Penicillin allergy',
      icon: <Pill size={16} className="text-purple-600" />,
      silo: 'Inpatient Pharmacy Barcode System',
      fragmentedOffset: { x: -250, y: 180 },
      convergedOffset: { x: -160, y: 100 },
    },
    {
      id: 'notes',
      title: 'Clinical Notes',
      category: 'Unstructured Text',
      summary: 'Cardiology attending initial consult & infectious disease draft',
      icon: <FileText size={16} className="text-sky-600" />,
      silo: 'Clinical Documentation Repo',
      fragmentedOffset: { x: 270, y: 170 },
      convergedOffset: { x: 160, y: 100 },
    },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 10px',
        overflow: 'hidden',
      }}
    >
      {/* Mode Selector for Interactive Exploration */}
      {interactive && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: '4px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setCurrentMode('initial')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: currentMode === 'initial' ? 600 : 500,
              background: currentMode === 'initial' ? '#0F172A' : 'transparent',
              color: currentMode === 'initial' ? '#FFFFFF' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            1. Unified Case
          </button>
          <button
            onClick={() => setCurrentMode('fragmented')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: currentMode === 'fragmented' ? 600 : 500,
              background: currentMode === 'fragmented' ? '#0F172A' : 'transparent',
              color: currentMode === 'fragmented' ? '#FFFFFF' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            2. Siloed Fragmentation
          </button>
          <button
            onClick={() => setCurrentMode('converged')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: currentMode === 'converged' ? 600 : 500,
              background: currentMode === 'converged' ? '#0F766E' : 'transparent',
              color: currentMode === 'converged' ? '#FFFFFF' : '#64748B',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            3. Nexus Convergence
          </button>
        </div>
      )}

      {/* Spatial Visual Stage */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '820px',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle Confluence Background Rings */}
        <div
          style={{
            position: 'absolute',
            width: currentMode === 'converged' ? '440px' : currentMode === 'fragmented' ? '680px' : '520px',
            height: currentMode === 'converged' ? '440px' : currentMode === 'fragmented' ? '680px' : '520px',
            borderRadius: '50%',
            border: `1px dashed ${currentMode === 'converged' ? '#99F6E4' : '#E2E8F0'}`,
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }}
        />

        {/* Central Core Object */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '210px',
            background: currentMode === 'converged' ? '#0F172A' : '#FFFFFF',
            border: `1.5px solid ${currentMode === 'converged' ? '#0F766E' : '#CBD5E1'}`,
            borderRadius: '12px',
            padding: '18px',
            textAlign: 'center',
            boxShadow: currentMode === 'converged' ? '0 16px 36px rgba(15, 118, 110, 0.2)' : '0 6px 20px rgba(15, 23, 42, 0.08)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--nexus-font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: currentMode === 'converged' ? '#5EEAD4' : '#0F766E',
              marginBottom: '6px',
            }}
          >
            {currentMode === 'converged' ? <Sparkles size={12} /> : <Layers size={12} />}
            {currentMode === 'converged' ? 'NEXUS CONTEXT HUB' : 'CLINICAL CASE'}
          </div>
          <h4
            style={{
              margin: '0 0 4px 0',
              fontSize: '15px',
              fontWeight: 700,
              color: currentMode === 'converged' ? '#FFFFFF' : '#0F172A',
            }}
          >
            Case #10482
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: currentMode === 'converged' ? '#94A3B8' : '#64748B',
              lineHeight: 1.4,
            }}
          >
            {currentMode === 'converged'
              ? 'Unified Context · 6 Streams Connected · Active Reasoning'
              : 'Synthetic Patient · Adult Cardiology Encounter'}
          </p>
          {currentMode === 'converged' && (
            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '10px',
                fontFamily: 'var(--nexus-font-mono)',
                color: '#5EEAD4',
              }}
            >
              <ShieldCheck size={12} /> Provenance Anchored
            </div>
          )}
        </div>

        {/* Orbiting / Fragmented / Converged Clinical Nodes */}
        {clinicalNodes.map((node) => {
          let pos = { x: 0, y: 0 };
          if (currentMode === 'fragmented') {
            pos = node.fragmentedOffset;
          } else if (currentMode === 'converged') {
            pos = node.convergedOffset;
          } else {
            // initial balanced ring
            pos = {
              x: node.convergedOffset.x * 1.3,
              y: node.convergedOffset.y * 1.3,
            };
          }

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                width: '185px',
                background: '#FFFFFF',
                border: `1px solid ${currentMode === 'fragmented' ? '#FCA5A5' : currentMode === 'converged' ? '#99F6E4' : '#E2E8F0'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                boxShadow: currentMode === 'converged' ? '0 4px 12px rgba(15, 118, 110, 0.08)' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {node.icon}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>
                    {node.title}
                  </span>
                </div>
                {currentMode === 'fragmented' && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: 'var(--nexus-font-mono)',
                      color: '#DC2626',
                      background: '#FEF2F2',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}
                  >
                    SILOED
                  </span>
                )}
                {currentMode === 'converged' && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: 'var(--nexus-font-mono)',
                      color: '#0F766E',
                      background: '#F0FDFA',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}
                  >
                    LINKED
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '10px', color: '#64748B', lineHeight: 1.35 }}>
                {node.summary}
              </p>
              <div
                style={{
                  marginTop: '6px',
                  paddingTop: '4px',
                  borderTop: '1px solid #F1F5F9',
                  fontSize: '9px',
                  fontFamily: 'var(--nexus-font-mono)',
                  color: currentMode === 'fragmented' ? '#94A3B8' : '#0F766E',
                }}
              >
                {currentMode === 'fragmented' ? `Source: ${node.silo}` : '✓ Active Context'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Educational Caption */}
      <div
        style={{
          marginTop: '28px',
          textAlign: 'center',
          maxWidth: '560px',
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
          {currentMode === 'initial' &&
            'One clinical case naturally spans multiple systems, diagnostic specialties, and historical notes.'}
          {currentMode === 'fragmented' &&
            'In conventional workflows, information remains trapped in distinct hospital silos without shared contextual meaning.'}
          {currentMode === 'converged' &&
            'Nexus unites these fragmented signals into a coherent case context, making connections and gaps immediately visible.'}
        </p>
      </div>
    </div>
  );
};
