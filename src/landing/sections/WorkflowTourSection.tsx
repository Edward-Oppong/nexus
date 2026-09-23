import React, { useState } from 'react';
import { WorkstationMockup, TourStep } from '../visuals/WorkstationMockup';
import {
  Activity,
  FlaskConical,
  BookOpen,
  Clock,
  Sparkles,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

export const WorkflowTourSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<TourStep>('findings');

  const tourSteps: Array<{
    id: TourStep;
    title: string;
    label: string;
    icon: React.ReactNode;
    narrative: string;
  }> = [
    {
      id: 'findings',
      title: 'Clinical Findings',
      label: 'STEP 1 · EXTRACT & VERIFY',
      icon: <Activity size={16} />,
      narrative:
        'Observations, vital signs, and bedside exam findings are tagged with provenance. Clinicians verify unreviewed symptoms and confirm microbiological cultures.',
    },
    {
      id: 'investigations',
      title: 'Imaging & Labs',
      label: 'STEP 2 · OBJECTIVE DIAGNOSTICS',
      icon: <FlaskConical size={16} />,
      narrative:
        'Diagnostic laboratory results and multi-source clinical investigations are evaluated with integrated reference ranges, microbiological culture alerts, and quantitative tracking.',
    },
    {
      id: 'evidence',
      title: 'Evidence Guidelines',
      label: 'STEP 3 · CRITERIA MATCHING',
      icon: <BookOpen size={16} />,
      narrative:
        'Validated scoring guidelines (Modified Duke Criteria 2023) match patient bacteremia and echocardiographic findings to evaluate diagnostic thresholds.',
    },
    {
      id: 'timeline',
      title: 'Longitudinal Sequence',
      label: 'STEP 4 · TEMPORAL CONTEXT',
      icon: <Clock size={16} />,
      narrative:
        'Patient events are arranged chronologically: from dental extraction 4 weeks ago to fever onset and acute emergency presentation.',
    },
    {
      id: 'assessment',
      title: 'Nexus Assessment',
      label: 'STEP 5 · DIFFERENTIAL SYNTHESIS',
      icon: <Sparkles size={16} />,
      narrative:
        'Contextual intelligence ranks diagnostic hypotheses qualitatively—highlighting supported findings and explicitly surfacing evidentiary blind spots.',
    },
    {
      id: 'review',
      title: 'Clinician Review',
      label: 'STEP 6 · HUMAN SIGN-OFF',
      icon: <UserCheck size={16} />,
      narrative:
        'Attending physician inspects the proposed hypothesis, modifies treatment orders for drug allergies, and signs the clinical decision into the record.',
    },
  ];

  const current = tourSteps.find((s) => s.id === activeStep) || tourSteps[0];

  return (
    <section className="nexus-narrative-section" id="section-workflow-tour">
      <hr className="nexus-editorial-divider" style={{ marginBottom: '90px' }} />

      <div style={{ maxWidth: '820px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <div className="nexus-section-label nexus-section-label--neutral">
          <Activity size={13} />
          <span>SECTION 07 · GUIDED CASE PROGRESSION</span>
        </div>

        <h2 className="nexus-section-headline" style={{ margin: '0 auto 16px' }}>
          Follow the case through the clinical workflow.
        </h2>

        <p className="nexus-section-subhead" style={{ margin: '0 auto' }}>
          Select any phase of the diagnostic process to observe how Nexus structures evidence and assists clinical review.
        </p>
      </div>

      {/* Tour Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '28px',
        }}
      >
        {tourSteps.map((step) => {
          const isSelected = step.id === activeStep;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '24px',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                background: isSelected ? '#0F172A' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#475569',
                border: `1px solid ${isSelected ? '#0F172A' : '#CBD5E1'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {step.icon}
              <span>{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step Narrative Banner */}
      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto 24px auto',
          background: '#F0FDFA',
          border: '1px solid #99F6E4',
          borderRadius: '8px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '10px', fontFamily: 'var(--nexus-font-mono)', fontWeight: 700, color: '#0F766E' }}>
            {current.label}
          </span>
          <div style={{ fontSize: '13px', color: '#134E4A', marginTop: '2px', lineHeight: 1.5 }}>
            {current.narrative}
          </div>
        </div>
      </div>

      {/* Interactive Workstation Mockup tied to Tour Step */}
      <WorkstationMockup
        activeTourStep={activeStep}
        onSelectTourStep={setActiveStep}
        interactive={false}
      />
    </section>
  );
};
