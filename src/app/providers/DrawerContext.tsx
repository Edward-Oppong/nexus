import React, { createContext, useContext, useState } from 'react';
import { ClinicalFinding } from '../../domain/finding';
import { EvidenceItem } from '../../domain/evidence';

export interface ContextualAiPrompt {
  title: string;
  query: string;
  response: string;
  scope?: {
    purpose: string;
    allowedOutputs: string[];
    prohibitedOutputs: string[];
  };
  safetyBoundary?: string;
  groundedFindings?: string[];
  groundedEvidence?: string[];
}

interface DrawerContextType {
  selectedFinding: ClinicalFinding | null;
  openFindingDrawer: (finding: ClinicalFinding) => void;
  closeFindingDrawer: () => void;

  selectedEvidence: EvidenceItem | null;
  openEvidenceDrawer: (evidence: EvidenceItem) => void;
  closeEvidenceDrawer: () => void;

  contextualAiPrompt: ContextualAiPrompt | null;
  openContextualAi: (prompt: ContextualAiPrompt) => void;
  closeContextualAi: () => void;

  isShortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;

  isHfTestingOpen: boolean;
  openHfTesting: () => void;
  closeHfTesting: () => void;

  closeAllDrawers: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFinding, setSelectedFinding] = useState<ClinicalFinding | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [contextualAiPrompt, setContextualAiPrompt] = useState<ContextualAiPrompt | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isHfTestingOpen, setIsHfTestingOpen] = useState(false);

  const openFindingDrawer = (finding: ClinicalFinding) => {
    setSelectedEvidence(null);
    setContextualAiPrompt(null);
    setSelectedFinding(finding);
  };

  const closeFindingDrawer = () => setSelectedFinding(null);

  const openEvidenceDrawer = (evidence: EvidenceItem) => {
    setSelectedFinding(null);
    setContextualAiPrompt(null);
    setSelectedEvidence(evidence);
  };

  const closeEvidenceDrawer = () => setSelectedEvidence(null);

  const openContextualAi = (prompt: { title: string; query: string; response: string }) => {
    setSelectedFinding(null);
    setSelectedEvidence(null);
    setContextualAiPrompt(prompt);
  };

  const closeContextualAi = () => setContextualAiPrompt(null);

  const openShortcuts = () => setIsShortcutsOpen(true);
  const closeShortcuts = () => setIsShortcutsOpen(false);

  const openHfTesting = () => setIsHfTestingOpen(true);
  const closeHfTesting = () => setIsHfTestingOpen(false);

  const closeAllDrawers = () => {
    setSelectedFinding(null);
    setSelectedEvidence(null);
    setContextualAiPrompt(null);
    setIsShortcutsOpen(false);
    setIsHfTestingOpen(false);
  };

  return (
    <DrawerContext.Provider
      value={{
        selectedFinding,
        openFindingDrawer,
        closeFindingDrawer,
        selectedEvidence,
        openEvidenceDrawer,
        closeEvidenceDrawer,
        contextualAiPrompt,
        openContextualAi,
        closeContextualAi,
        isShortcutsOpen,
        openShortcuts,
        closeShortcuts,
        isHfTestingOpen,
        openHfTesting,
        closeHfTesting,
        closeAllDrawers,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('useDrawer must be used within a DrawerProvider');
  return context;
};
