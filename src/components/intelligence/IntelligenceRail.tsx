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
} from 'lucide-react';

import { CaseSignalsPanel } from './rail/CaseSignalsPanel';
import { HypothesesRailPanel } from './rail/HypothesesRailPanel';
import { EvidenceRailPanel } from './rail/EvidenceRailPanel';
import { UncertaintyRailPanel } from './rail/UncertaintyRailPanel';
import { QuickReviewRailPanel } from './rail/QuickReviewRailPanel';
import { AskNexusRailPanel } from './rail/AskNexusRailPanel';
import { NexusAnalysisRailPanel } from './rail/NexusAnalysisRailPanel';

export const IntelligenceRail: React.FC = () => {
  const { activeCaseSubTab } = useCase();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [overrideFilter, setOverrideFilter] = useState<'AUTO' | 'SIGNALS' | 'REVIEW' | 'EVIDENCE'>('AUTO');

  if (isCollapsed) {
    return (
      <aside
        aria-label="Nexus intelligence rail (collapsed)"
        style={{
          width: '38px',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
        onClick={() => setIsCollapsed(false)}
        title="Expand Nexus Intelligence Rail"
      >
        <button
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
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
            color: 'var(--accent-primary)',
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
          <NexusAnalysisRailPanel />
          <CaseSignalsPanel />
          <UncertaintyRailPanel />
          <AskNexusRailPanel />
        </>
      );
    }
    if (overrideFilter === 'REVIEW') {
      return (
        <>
          <NexusAnalysisRailPanel />
          <QuickReviewRailPanel />
          <CaseSignalsPanel />
          <HypothesesRailPanel />
        </>
      );
    }
    if (overrideFilter === 'EVIDENCE') {
      return (
        <>
          <NexusAnalysisRailPanel />
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
            <NexusAnalysisRailPanel />
            <QuickReviewRailPanel />
            <CaseSignalsPanel />
            <EvidenceRailPanel />
          </>
        );

      case 'findings':
        return (
          <>
            <NexusAnalysisRailPanel />
            <QuickReviewRailPanel />
            <UncertaintyRailPanel />
            <HypothesesRailPanel />
          </>
        );

      case 'reasoning':
        return (
          <>
            <NexusAnalysisRailPanel />
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
            <NexusAnalysisRailPanel />
            <CaseSignalsPanel />
            <UncertaintyRailPanel />
            <AskNexusRailPanel />
          </>
        );

      case 'evidence':
        return (
          <>
            <NexusAnalysisRailPanel />
            <EvidenceRailPanel />
            <HypothesesRailPanel />
            <AskNexusRailPanel />
          </>
        );

      case 'summary':
      default:
        return (
          <>
            <NexusAnalysisRailPanel />
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
        minWidth: '320px',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        overflowY: 'auto',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Rail Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--accent-primary)',
              color: 'var(--bg-surface)',
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
                color: 'var(--text-primary)',
              }}
            >
              Nexus Rail
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Context: <strong style={{ color: 'var(--accent-primary)' }}>{activeCaseSubTab}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
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
          background: 'var(--bg-subtle)',
          padding: '3px',
          margin: '10px 14px 4px 14px',
          borderRadius: 'var(--radius-md)',
          gap: '2px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {(['AUTO', 'SIGNALS', 'REVIEW', 'EVIDENCE'] as const).map((mode) => {
          const isSelected = overrideFilter === mode;
          return (
            <button
              key={mode}
              onClick={() => setOverrideFilter(mode)}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '10px',
                fontWeight: isSelected ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                background: isSelected ? 'var(--bg-surface)' : 'transparent',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.12s ease',
              }}
            >
              {mode}
            </button>
          );
        })}
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
