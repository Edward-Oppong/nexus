// ============================================================
// src/components/intelligence/IntelligenceRail.tsx
// THE NEXUS CONTEXTUAL INTELLIGENCE & REVIEW RAIL
// 
// Right Pane of the Nexus Clinical Workstation
// Dynamically mounts 2–4 targeted panels based on what the
// clinician is actively examining in the center workspace.
// ============================================================

import React, { useState } from 'react';
import { useCase } from '../../app/providers/CaseContext';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

import { CaseSignalsPanel } from './rail/CaseSignalsPanel';
import { HypothesesRailPanel } from './rail/HypothesesRailPanel';
import { EvidenceRailPanel } from './rail/EvidenceRailPanel';
import { UncertaintyRailPanel } from './rail/UncertaintyRailPanel';
import { QuickReviewRailPanel } from './rail/QuickReviewRailPanel';
import { AskNexusRailPanel } from './rail/AskNexusRailPanel';

export const IntelligenceRail: React.FC = () => {
  const { activeCaseSubTab } = useCase();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [overrideFilter, setOverrideFilter] = useState<'AUTO' | 'SIGNALS' | 'REVIEW' | 'EVIDENCE'>('AUTO');

  if (isCollapsed) {
    return (
      <aside
        aria-label="Nexus intelligence rail (collapsed)"
        style={{
          width: '36px',
          background: '#FAFAFA',
          borderLeft: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => setIsCollapsed(false)}
        title="Expand Nexus Intelligence Rail"
      >
        <button
          style={{
            border: 'none',
            background: 'transparent',
            color: '#64748B',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#0F172A',
            marginTop: '20px',
            textTransform: 'uppercase',
          }}
        >
          ⬡ NEXUS INTELLIGENCE
        </div>
      </aside>
    );
  }

  // Context Dispatch Matrix
  const renderContextualPanels = () => {
    if (overrideFilter === 'SIGNALS') {
      return (
        <>
          <CaseSignalsPanel />
          <UncertaintyRailPanel />
          <AskNexusRailPanel />
        </>
      );
    }
    if (overrideFilter === 'REVIEW') {
      return (
        <>
          <QuickReviewRailPanel />
          <CaseSignalsPanel />
          <HypothesesRailPanel />
        </>
      );
    }
    if (overrideFilter === 'EVIDENCE') {
      return (
        <>
          <EvidenceRailPanel />
          <HypothesesRailPanel />
          <AskNexusRailPanel />
        </>
      );
    }

    // Auto Dispatch by Active Center Tab
    switch (activeCaseSubTab) {
      case 'documents':
        return (
          <>
            <QuickReviewRailPanel />
            <CaseSignalsPanel />
            <EvidenceRailPanel />
          </>
        );

      case 'investigations':
        return (
          <>
            <CaseSignalsPanel />
            <UncertaintyRailPanel />
            <HypothesesRailPanel />
          </>
        );

      case 'findings':
        return (
          <>
            <QuickReviewRailPanel />
            <UncertaintyRailPanel />
            <HypothesesRailPanel />
          </>
        );

      case 'reasoning':
        return (
          <>
            <HypothesesRailPanel />
            <EvidenceRailPanel />
            <UncertaintyRailPanel />
            <AskNexusRailPanel />
          </>
        );

      case 'safety':
      case 'rules':
        return (
          <>
            <CaseSignalsPanel />
            <UncertaintyRailPanel />
            <AskNexusRailPanel />
          </>
        );

      case 'summary':
      default:
        return (
          <>
            <CaseSignalsPanel />
            <HypothesesRailPanel />
            <EvidenceRailPanel />
            <AskNexusRailPanel />
          </>
        );
    }
  };

  return (
    <aside
      aria-label="Nexus intelligence rail"
      style={{
        width: '320px',
        background: '#FAFAFA',
        borderLeft: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      {/* Rail Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '3px',
              background: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            ⬡
          </div>
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#0F172A',
              }}
            >
              Nexus Rail
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>
              Context: <strong style={{ color: '#0F172A' }}>{activeCaseSubTab}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '2px',
          }}
          title="Collapse rail"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Context Quick Filter Switcher */}
      <div
        style={{
          display: 'flex',
          background: '#F1F5F9',
          padding: '4px',
          margin: '10px 14px 4px 14px',
          borderRadius: '5px',
          gap: '2px',
        }}
      >
        {(['AUTO', 'SIGNALS', 'REVIEW', 'EVIDENCE'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setOverrideFilter(mode)}
            style={{
              flex: 1,
              padding: '3px 0',
              fontSize: '9px',
              fontWeight: overrideFilter === mode ? 700 : 500,
              borderRadius: '3px',
              border: 'none',
              background: overrideFilter === mode ? '#FFFFFF' : 'transparent',
              color: overrideFilter === mode ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              boxShadow: overrideFilter === mode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Dynamic Contextual Panels */}
      <div
        style={{
          padding: '10px 14px 20px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {renderContextualPanels()}
      </div>
    </aside>
  );
};
