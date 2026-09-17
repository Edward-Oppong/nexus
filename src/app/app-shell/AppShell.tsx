import React, { useEffect, useState } from 'react';
import { useCase } from '../providers/CaseContext';
import { useDrawer } from '../providers/DrawerContext';
import { DemoBanner } from '../../components/navigation/DemoBanner';
import { GlobalNav } from '../../components/navigation/GlobalNav';

import { LandingView } from '../../features/landing/LandingView';
import { OverviewView } from '../../features/overview/OverviewView';
import { CaseListView } from '../../features/cases/CaseListView';
import { CaseWorkspaceView } from '../../features/case-workspace/CaseWorkspaceView';
import { CaseIntakeWorkspace } from '../../features/cases/components/CaseIntakeWorkspace';
import { PatientsView } from '../../features/patients/PatientsView';
import { TasksView } from '../../features/tasks/TasksView';
import { ReviewQueueView } from '../../features/review/ReviewQueueView';
import { EvidenceTab } from '../../features/case-workspace/tabs/EvidenceTab';
import { InvestigationsTab } from '../../features/case-workspace/tabs/InvestigationsTab';
import { AdministrationView } from '../../features/administration/AdministrationView';
import { AiGovernanceView } from '../../features/ai-governance/AiGovernanceView';
import { RegulatoryComplianceView } from '../../features/regulatory-compliance/RegulatoryComplianceView';

import { FindingProvenanceDrawer } from '../../components/drawers/FindingProvenanceDrawer';
import { EvidenceDrawer } from '../../components/drawers/EvidenceDrawer';
import { ContextualAiModal } from '../../components/drawers/ContextualAiModal';
import { KeyboardShortcutsModal } from '../../components/ui/KeyboardShortcutsModal';
import { HuggingFaceModelTestingModal } from '../../components/intelligence/HuggingFaceModelTestingModal';
import { LoginPage } from '../../features/authentication/LoginPage';
import { useAuth } from '../../features/authentication/AuthProvider';

const ADMIN_ONLY_VIEWS = ['administration', 'ai-governance', 'regulatory-compliance'];

export const AppShell: React.FC = () => {
  const { activeView, setActiveView, setActiveCaseSubTab } = useCase();
  const { closeAllDrawers, openShortcuts, isHfTestingOpen, closeHfTesting } = useDrawer();
  const { isAuthenticated, role, loading } = useAuth();
  const [lastKey, setLastKey] = useState<string>('');

  const isAdmin = role === 'organization_admin' || role === 'platform_admin';

  // Route guard: If authenticated and role is clinician (non-admin) and activeView is admin-only → redirect to overview
  useEffect(() => {
    if (isAuthenticated && !isAdmin && ADMIN_ONLY_VIEWS.includes(activeView)) {
      setActiveView('overview');
    }
  }, [isAuthenticated, isAdmin, activeView, setActiveView]);

  // Keyboard shortcut listener (Item 20)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        closeAllDrawers();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        openShortcuts();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setActiveView('cases');
        return;
      }

      if (e.key === 'r') {
        e.preventDefault();
        setActiveView('case-workspace');
        setActiveCaseSubTab('review');
        return;
      }

      if (lastKey === 'g' && e.key === 'c') {
        setActiveView('cases');
        setLastKey('');
        return;
      }

      if (lastKey === 'g' && e.key === 'p') {
        setActiveView('patients');
        setLastKey('');
        return;
      }

      setLastKey(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastKey, closeAllDrawers, openShortcuts, setActiveView, setActiveCaseSubTab]);

  // Loading state while checking session
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#05080f',
          color: '#94a3b8',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(14, 165, 233, 0.3)',
              borderTopColor: '#0ea5e9',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '14px', letterSpacing: '0.02em', color: '#cbd5e1' }}>
            Initializing Nexus Workstation...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If not authenticated, always display the login gate regardless of activeView
  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => setActiveView('overview')} />;
  }

  // If in landing page mode, display the full editorial landing view
  if (activeView === 'landing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <DemoBanner />
        <LandingView />
      </div>
    );
  }

  // Workstation Mode
  const renderCurrentView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView />;
      case 'cases':
        return <CaseListView />;
      case 'case-workspace':
        return <CaseWorkspaceView />;
      case 'case-intake':
        return <CaseIntakeWorkspace />;
      case 'patients':
        return <PatientsView />;
      case 'investigations':
        return (
          <main
            aria-label="Clinical Investigations"
            style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: '#F8FAFC' }}
          >
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <InvestigationsTab />
            </div>
          </main>
        );
      case 'tasks':
        return <TasksView />;
      case 'review-queue':
        return (
          <main
            aria-label="Clinical Review Queue"
            style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: '#F8FAFC' }}
          >
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <ReviewQueueView />
            </div>
          </main>
        );
      case 'evidence-catalog':
        return (
          <main
            aria-label="Clinical Evidence Catalog"
            style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', background: '#F8FAFC' }}
          >
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <EvidenceTab />
            </div>
          </main>
        );
      case 'administration':
        return isAdmin ? <AdministrationView /> : <OverviewView />;
      case 'ai-governance':
        return isAdmin ? <AiGovernanceView /> : <OverviewView />;
      case 'regulatory-compliance':
        return isAdmin ? <RegulatoryComplianceView /> : <OverviewView />;
      default:
        return <CaseWorkspaceView />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Demo Disclosure Banner */}
      <DemoBanner />

      {/* Main Workstation Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Global Sidebar Navigation */}
        <GlobalNav />

        {/* Active Content Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {renderCurrentView()}
        </div>
      </div>

      {/* Global Slide-Over Drawers & Modals */}
      <FindingProvenanceDrawer />
      <EvidenceDrawer />
      <ContextualAiModal />
      <KeyboardShortcutsModal />
      <HuggingFaceModelTestingModal isOpen={isHfTestingOpen} onClose={closeHfTesting} />
    </div>
  );
};
