// ============================================================
// src/components/clinical/KnowledgeGraphDrawer.tsx
// Phase 13: Clinical Knowledge Graph Visual Explorer Drawer
// Visualizes UMLS/SNOMED pathophysiological paths from findings to hypotheses
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Network,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  CLINICAL_KNOWLEDGE_NODES,
  CLINICAL_KNOWLEDGE_EDGES,
  findPathophysiologicalPath,
} from '../../lib/knowledge/clinical-knowledge-graph';
import { PathophysiologicalPath } from '../../domain/knowledge-graph';

interface KnowledgeGraphDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFindingCui?: string;
  selectedHypothesisCui?: string;
}

export const KnowledgeGraphDrawer: React.FC<KnowledgeGraphDrawerProps> = ({
  isOpen,
  onClose,
  selectedFindingCui = 'C0011849', // Bacteremia
  selectedHypothesisCui = 'C0014144', // Infective Endocarditis
}) => {
  const [findingCui, setFindingCui] = useState<string>(selectedFindingCui);
  const [hypothesisCui, setHypothesisCui] = useState<string>(selectedHypothesisCui);

  const path: PathophysiologicalPath | null = findPathophysiologicalPath(findingCui, hypothesisCui);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Knowledge Graph Explorer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '540px',
        maxWidth: '92vw',
        backgroundColor: '#FFFFFF',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #E2E8F0',
      }}
    >
      {/* ── Drawer Header ─────────────────────────────────────── */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#EFF6FF', padding: '8px', borderRadius: '6px', color: '#2563EB' }}>
            <Network size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Pathophysiological Knowledge Graph
            </h3>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
              UMLS Metathesaurus &amp; SNOMED CT Ontology
            </span>
          </div>
        </div>

        <button onClick={onClose} className="btn btn-xs btn-outline" style={{ padding: '6px' }}>
          <X size={15} />
        </button>
      </div>

      {/* ── Traversal Selector Controls ───────────────────────── */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Source Finding
            </label>
            <select
              value={findingCui}
              onChange={(e) => setFindingCui(e.target.value)}
              className="input input-sm"
              style={{ width: '100%', fontSize: '11px' }}
            >
              <option value="C0011849">Bacteremia (Blood Culture Pos)</option>
              <option value="C0026266">Mitral Regurgitation (Murmur)</option>
              <option value="C0264157">Splinter Hemorrhages</option>
              <option value="C0264154">Osler Nodes</option>
              <option value="C0018802">Pyrexia (Fever)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Target Hypothesis
            </label>
            <select
              value={hypothesisCui}
              onChange={(e) => setHypothesisCui(e.target.value)}
              className="input input-sm"
              style={{ width: '100%', fontSize: '11px' }}
            >
              <option value="C0014144">Infective Endocarditis</option>
              <option value="C0027051">Acute Myocarditis</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Visual Path & Ontological Steps ────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {path ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Plausibility Banner */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  Semantic Path Plausibility: {path.overallPlausibility}
                </div>
                <div style={{ fontSize: '12px', color: '#15803D', marginTop: '2px' }}>
                  {path.steps.length > 0 ? `${path.steps.length}-Hop Direct Causal Pathway Identified` : 'Correlation Established'}
                </div>
              </div>
              <Sparkles size={18} style={{ color: '#16A34A' }} />
            </div>

            {/* Step-by-Step Path Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Biological Mechanism Steps
              </div>

              {path.steps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#0F172A', color: '#FFFFFF', padding: '2px 6px', borderRadius: '3px' }}>
                      Step 0{idx + 1}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                      {step.fromNode.preferredTerm}
                    </span>
                    <ArrowRight size={13} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>
                      {step.toNode.preferredTerm}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4, marginBottom: '8px' }}>
                    {step.stepExplanation}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#64748B', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
                    <span>
                      Predicate: <code style={{ fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{step.edge.predicate}</code>
                    </span>
                    {step.edge.referencePmids.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563EB' }}>
                        <BookOpen size={11} /> PubMed: {step.edge.referencePmids.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Narrative Explanation */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Clinical Synthesis Summary
              </div>
              <p style={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.5, margin: 0 }}>
                {path.narrativeSummary}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontSize: '13px' }}>
            No direct pathophysiological link found between selected concepts.
          </div>
        )}
      </div>
    </div>
  );
};
