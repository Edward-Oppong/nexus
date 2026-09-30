import React from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { CaseHeader } from '../../components/clinical/CaseHeader';
import { CaseNav } from '../../components/clinical/CaseNav';
import { IntelligenceRail } from '../../components/intelligence/IntelligenceRail';

import { SummaryTab } from './tabs/SummaryTab';
import { ClinicalDataTab } from './tabs/ClinicalDataTab';
import { FindingsTab } from './tabs/FindingsTab';
import { ReasoningTab } from './tabs/ReasoningTab';
import { EvidenceTab } from './tabs/EvidenceTab';
import { TimelineTab } from './tabs/TimelineTab';
import { TeamTab } from './tabs/TeamTab';
import { ReviewTab } from './tabs/ReviewTab';
import { DecisionTab } from './tabs/DecisionTab';
import { SafetyTab } from './tabs/SafetyTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { RulesTab } from './tabs/RulesTab';
import { SafetyBanner } from '../safety/SafetyBanner';

import { FolderKanban, Plus, ArrowRight } from 'lucide-react';

export const CaseWorkspaceView: React.FC = () => {
  const { activeCaseSubTab, activeCase, setActiveView } = useCase();

  const hasRealCase = Boolean(
    activeCase &&
    activeCase.overview &&
    activeCase.overview.id &&
    activeCase.overview.id !== 'EMPTY' &&
    activeCase.overview.patient?.syntheticIdentifier &&
    activeCase.overview.patient?.syntheticIdentifier !== 'No Active Patient'
  );

  const renderActiveTab = () => {
    switch (activeCaseSubTab) {
      case 'summary':
        return <SummaryTab />;
      case 'clinical':
        return <ClinicalDataTab />;
      case 'findings':
        return <FindingsTab />;
      case 'reasoning':
        return <ReasoningTab />;
      case 'evidence':
        return <EvidenceTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'timeline':
        return <TimelineTab />;
      case 'team':
        return <TeamTab />;
      case 'review':
        return <ReviewTab />;
      case 'decision':
        return <DecisionTab />;
      case 'safety':
        return <SafetyTab />;
      case 'rules':
        return <RulesTab />;
      default:
        return <ReasoningTab />;
    }
  };

  // If no case is loaded or created yet, show clean guidance rather than empty shell
  if (!hasRealCase) {
    return (
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          background: '#F8FAFC',
          height: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '36px 32px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
            }}
          >
            <FolderKanban size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              No Active Case Selected
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              The clinical workspace requires an active case to evaluate evidence, generate differential reasoning, and review safety guardrails.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={() => setActiveView('cases')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Browse Case List
            </button>
            <button
              onClick={() => setActiveView('case-intake')}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} /> New Case Intake
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', flex: 1 }}>
      {/* Persistent Case Header (WHO / WHAT / WHERE / STATE) */}
      <CaseHeader />

      {/* 3-Zone Clinical Workspace Grid */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Zone 1: Case Navigation */}
        <CaseNav />

        {/* Zone 2: Main Clinical Workspace */}
        <main
          aria-label="Active case workspace"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            background: '#F8FAFC',
          }}
        >
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <SafetyBanner />
            {renderActiveTab()}
          </div>
        </main>

        {/* Zone 3: Contextual Nexus Intelligence Rail */}
        <IntelligenceRail />
      </div>
    </div>
  );
};
