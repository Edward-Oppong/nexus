import React from 'react';
import { useCase } from '../app/providers/CaseContext';
import './landing.css';

import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './sections/HeroSection';
import { ProblemCenterpiece } from './components/ProblemCenterpiece';
import { FeaturesAccordion } from './components/FeaturesAccordion';
import { FinalCTASection } from './sections/FinalCTASection';

export const LandingPage: React.FC = () => {
  const { setActiveView, setActiveCaseSubTab } = useCase();

  const handleExperienceCase = () => {
    setActiveView('case-workspace');
    setActiveCaseSubTab('reasoning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreClick = () => {
    const el = document.getElementById('problem-centerpiece');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="nexus-landing-wrapper">
      {/* Sticky Minimal Navigation */}
      <LandingNavbar onExperienceCase={handleExperienceCase} />

      <main id="main-content">
        {/* Hero: Plain headline, clinical explanation, direct action */}
        <HeroSection
          onExploreClick={handleExploreClick}
          onExperienceCase={handleExperienceCase}
        />

        {/* The One Bold Centerpiece: Fragmented vs. Unified Endocarditis Case */}
        <ProblemCenterpiece />

        {/* Features: Five plain-language clinical facets with static previews */}
        <FeaturesAccordion />

        {/* Final CTA: Direct clinical invitation + understated disclaimer */}
        <FinalCTASection onExperienceCase={handleExperienceCase} />
      </main>
    </div>
  );
};
