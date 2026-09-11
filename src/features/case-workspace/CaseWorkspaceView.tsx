import React from 'react';
import { useCase } from '../../app/providers/CaseContext';
import { CaseHeader } from '../../components/clinical/CaseHeader';
import { CaseNav } from '../../components/clinical/CaseNav';
import { IntelligenceRail } from '../../components/intelligence/IntelligenceRail';

import { SummaryTab } from './tabs/SummaryTab';
import { ClinicalDataTab } from './tabs/ClinicalDataTab';
import { FindingsTab } from './tabs/FindingsTab';
import { ReasoningTab } from './tabs/ReasoningTab';
import { InvestigationsTab } from './tabs/InvestigationsTab';
import { EvidenceTab } from './tabs/EvidenceTab';
import { TimelineTab } from './tabs/TimelineTab';
import { TeamTab } from './tabs/TeamTab';
import { ReviewTab } from './tabs/ReviewTab';
import { DecisionTab } from './tabs/DecisionTab';
import { SafetyTab } from './tabs/SafetyTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { SafetyBanner } from '../safety/SafetyBanner';

export const CaseWorkspaceView: React.FC = () => {
  const { activeCaseSubTab } = useCase();

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
      case 'investigations':
        return <InvestigationsTab />;
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
      default:
        return <ReasoningTab />;
    }
  };

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
