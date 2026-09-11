// ============================================================
// src/features/case-workspace/tabs/RulesTab.tsx
// Phase 9: Clinical Decision Rules & CDS Engine Workstation
// Deterministic clinical decision support: Guideline Rules,
// Pharmacotherapy & Renal Dosing, Drug-Drug Interactions, and Allergy Cross-Reactivity
// ============================================================

import React, { useState, useMemo } from 'react';
import { useCase } from '../../../app/providers/CaseContext';
import {
  Cpu,
  Calculator,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Activity,
  Layers,
  Info,
  RotateCcw,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Pill,
} from 'lucide-react';
import {
  CLINICAL_RULES_REGISTRY,
  evaluateClinicalRule,
} from '../../../lib/rules-engine/clinical-rules-definitions';
import {
  calculateRenalMetrics,
  calculateDrugDosing,
  DRUG_DOSING_CATALOG,
} from '../../../lib/rules-engine/dosing-calculator';
import {
  checkDrugInteractions,
  DDI_DATABASE,
} from '../../../lib/rules-engine/ddi-checker';
import {
  evaluateAllergyCrossReactivity,
  ALLERGY_CROSS_REACTIVITY_DATABASE,
} from '../../../lib/rules-engine/allergy-engine';
import {
  PatientDosingMetrics,
  DrugDosingProtocol,
  InteractionSeverity,
} from '../../../domain/rules-engine';

type CdsSubSection = 'RULES' | 'DOSING' | 'DDI' | 'ALLERGY';

export const RulesTab: React.FC = () => {
  const { activeCase, setActiveCaseSubTab } = useCase();
  const [activeSection, setActiveSection] = useState<CdsSubSection>('RULES');

  // ------------------------------------------------------------
  // SUB-SECTION 1: CLINICAL RULES STATE
  // ------------------------------------------------------------
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rule-duke-endocarditis');
  const selectedRule = useMemo(
    () => CLINICAL_RULES_REGISTRY.find((r) => r.id === selectedRuleId) || CLINICAL_RULES_REGISTRY[0],
    [selectedRuleId]
  );

  // Default criteria active for Case 10482 (Infective Endocarditis demo)
  const defaultCriteriaMap: Record<string, string[]> = {
    'rule-duke-endocarditis': ['duke-major-1', 'duke-major-2', 'duke-minor-2', 'duke-minor-3'],
    'rule-curb-65': [],
    'rule-wells-pe': ['wells-tachycardia'],
    'rule-qsofa': ['qsofa-rr'],
    'rule-cha2ds2-vasc': ['chads-sc'],
  };

  const [activeCriteria, setActiveCriteria] = useState<Record<string, string[]>>(defaultCriteriaMap);

  const currentRuleActiveCriteria = activeCriteria[selectedRule.id] || [];

  const toggleCriterion = (criterionId: string) => {
    setActiveCriteria((prev) => {
      const existing = prev[selectedRule.id] || [];
      const updated = existing.includes(criterionId)
        ? existing.filter((id) => id !== criterionId)
        : [...existing, criterionId];
      return { ...prev, [selectedRule.id]: updated };
    });
  };

  const ruleResult = useMemo(
    () => evaluateClinicalRule(selectedRule, currentRuleActiveCriteria),
    [selectedRule, currentRuleActiveCriteria]
  );

  // ------------------------------------------------------------
  // SUB-SECTION 2: DOSING & RENAL STATE
  // ------------------------------------------------------------
  const [patientMetrics, setPatientMetrics] = useState<PatientDosingMetrics>({
    age: activeCase.overview.patient.age || 42,
    gender: activeCase.overview.patient.gender === 'Female' ? 'FEMALE' : 'MALE',
    weightKg: 68.0,
    heightCm: 165,
    serumCreatinineMgDl: 1.1, // mg/dL
  });

  const [selectedDrugId, setSelectedDrugId] = useState<string>('drug-vancomycin');
  const selectedDrug = useMemo(
    () => DRUG_DOSING_CATALOG.find((d) => d.id === selectedDrugId) || DRUG_DOSING_CATALOG[0],
    [selectedDrugId]
  );

  const renalMetrics = useMemo(() => calculateRenalMetrics(patientMetrics), [patientMetrics]);
  const dosingResult = useMemo(
    () => calculateDrugDosing(selectedDrug, patientMetrics),
    [selectedDrug, patientMetrics]
  );

  // ------------------------------------------------------------
  // SUB-SECTION 3: DRUG-DRUG INTERACTIONS STATE
  // ------------------------------------------------------------
  const [activeMeds, setActiveMeds] = useState<Array<{ name: string; rxNorm?: string }>>([
    { name: 'Vancomycin', rxNorm: '11124' },
    { name: 'Gentamicin', rxNorm: '4734' },
    { name: 'Amiodarone', rxNorm: '703' },
  ]);
  const [newMedInput, setNewMedInput] = useState<string>('');

  const ddiResult = useMemo(() => checkDrugInteractions(activeMeds), [activeMeds]);

  const addMedication = (name: string, rxNorm?: string) => {
    if (!name.trim()) return;
    if (activeMeds.some((m) => m.name.toLowerCase() === name.trim().toLowerCase())) return;
    setActiveMeds([...activeMeds, { name: name.trim(), rxNorm }]);
    setNewMedInput('');
  };

  const removeMedication = (index: number) => {
    setActiveMeds(activeMeds.filter((_, i) => i !== index));
  };

  // ------------------------------------------------------------
  // SUB-SECTION 4: ALLERGY CROSS-REACTIVITY STATE
  // ------------------------------------------------------------
  const patientKnownAllergies = useMemo(() => {
    return ['Penicillin (Severe anaphylactic shock at age 28)', 'Sulfa antibiotics (Urticaria)'];
  }, []);

  const [testAntimicrobial, setTestAntimicrobial] = useState<string>('Ceftriaxone');

  const allergyAlerts = useMemo(
    () => evaluateAllergyCrossReactivity(patientKnownAllergies, testAntimicrobial),
    [patientKnownAllergies, testAntimicrobial]
  );

  const getSeverityBadgeColor = (sev: InteractionSeverity | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'NONE') => {
    switch (sev) {
      case 'CONTRAINDICATED':
      case 'CRITICAL':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      case 'MAJOR':
      case 'HIGH':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case 'MODERATE':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'NONE':
        return { bg: '#F8FAFC', text: '#64748B', border: '#CBD5E1' };
      default:
        return { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Workstation Header */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  background: '#E0F2FE',
                  color: '#0284C7',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                }}
              >
                <Cpu size={18} />
              </div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                Clinical Decision Rules & CDS Engine
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0284C7',
                  background: '#F0F9FF',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #BAE6FD',
                }}
              >
                Phase 9 · Deterministic CDS
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', maxWidth: '750px' }}>
              Deterministic, evidence-based clinical algorithms separate from generative AI reasoning.
              Enforces reproducible scoring, pharmacotherapy dosing, drug interaction safety, and immunological allergy cross-reactivity.
            </p>
          </div>

          <button
            onClick={() => setActiveCaseSubTab('decision')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apply to Decision <ArrowRight size={14} />
          </button>
        </div>

        {/* 4-Panel Sub-Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
          {[
            { id: 'RULES' as const, label: '1. Guideline Rules & Scores', icon: BookOpen, count: CLINICAL_RULES_REGISTRY.length },
            { id: 'DOSING' as const, label: '2. Renal & Dosing Calculator', icon: Calculator, count: DRUG_DOSING_CATALOG.length },
            { id: 'DDI' as const, label: '3. Drug-Drug Interactions', icon: Pill, count: ddiResult.detectedInteractions.length, alert: ddiResult.hasContraindications },
            { id: 'ALLERGY' as const, label: '4. Allergy Cross-Reactivity', icon: ShieldAlert, count: allergyAlerts.length, alert: allergyAlerts.some(a => a.riskLevel === 'CONTRAINDICATED') },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0284C7' : '#475569',
                  background: isActive ? '#F0F9FF' : '#FFFFFF',
                  border: isActive ? '1px solid #BAE6FD' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: tab.alert ? '#FEE2E2' : isActive ? '#BAE6FD' : '#F1F5F9',
                      color: tab.alert ? '#991B1B' : isActive ? '#0369A1' : '#64748B',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* SECTION 1: GUIDELINE RULES & SCORES                           */}
      {/* ------------------------------------------------------------ */}
      {activeSection === 'RULES' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          {/* Rules Selector Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>
              Deterministic Rule Catalog
            </div>
            {CLINICAL_RULES_REGISTRY.map((rule) => {
              const isSelected = rule.id === selectedRuleId;
              return (
                <button
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid #0284C7' : '1px solid #E2E8F0',
                    background: isSelected ? '#F0F9FF' : '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 1px 3px rgba(2, 132, 199, 0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#0284C7' : '#64748B' }}>
                      {rule.code}
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: '#F1F5F9',
                        color: '#475569',
                        fontWeight: 600,
                      }}
                    >
                      {rule.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>
                    {rule.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {rule.specialty}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rule Detail & Evaluator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Rule Header Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                    {selectedRule.title}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                    {selectedRule.shortDescription}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#475569',
                  }}
                >
                  Version {selectedRule.version}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#475569', background: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                <strong>Evidence Base:</strong> {selectedRule.guidelineCitation}
              </div>
            </div>

            {/* Criteria Checklist */}
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Clinical Criteria Checklist
                </h3>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Click to toggle criteria based on patient examination
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedRule.criteria.map((criterion) => {
                  const isChecked = currentRuleActiveCriteria.includes(criterion.id);
                  return (
                    <div
                      key={criterion.id}
                      onClick={() => toggleCriterion(criterion.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        background: isChecked ? '#F8FAFC' : '#FFFFFF',
                        border: isChecked ? '1px solid #CBD5E1' : '1px solid #F1F5F9',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isChecked ? '1px solid #0284C7' : '1px solid #CBD5E1',
                          background: isChecked ? '#0284C7' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px',
                          flexShrink: 0,
                        }}
                      >
                        {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                            {criterion.name}
                          </span>
                          {criterion.category && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: criterion.category === 'MAJOR' ? '#FEE2E2' : '#E0F2FE',
                                color: criterion.category === 'MAJOR' ? '#991B1B' : '#0369A1',
                              }}
                            >
                              {criterion.category}
                            </span>
                          )}
                          {criterion.points !== undefined && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                              +{criterion.points} pts
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
                          {criterion.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evaluation Result Banner */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '8px',
                border: `2px solid ${getSeverityBadgeColor(ruleResult.matchedTier.riskSeverity).border}`,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} color={getSeverityBadgeColor(ruleResult.matchedTier.riskSeverity).text} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                    {ruleResult.matchedTier.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: getSeverityBadgeColor(ruleResult.matchedTier.riskSeverity).bg,
                    color: getSeverityBadgeColor(ruleResult.matchedTier.riskSeverity).text,
                    border: `1px solid ${getSeverityBadgeColor(ruleResult.matchedTier.riskSeverity).border}`,
                  }}
                >
                  RISK: {ruleResult.matchedTier.riskSeverity}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                {ruleResult.matchedTier.clinicalInterpretation}
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                  color: '#0F172A',
                }}
              >
                <strong>Mandated Clinical Action:</strong> {ruleResult.matchedTier.recommendedAction}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* SECTION 2: RENAL & PHARMACOTHERAPY DOSING CALCULATOR         */}
      {/* ------------------------------------------------------------ */}
      {activeSection === 'DOSING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Patient Parameter Controls */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Patient Anthropometric & Renal Metrics
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Synchronized from active patient encounter (#00482) — adjust parameters for clinical simulation.
                </p>
              </div>
              <button
                onClick={() =>
                  setPatientMetrics({
                    age: 42,
                    gender: 'FEMALE',
                    weightKg: 68.0,
                    heightCm: 165,
                    serumCreatinineMgDl: 1.1,
                  })
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                <RotateCcw size={12} /> Reset to Case
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Age (years)
                </label>
                <input
                  type="number"
                  value={patientMetrics.age}
                  onChange={(e) => setPatientMetrics({ ...patientMetrics, age: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Biological Sex
                </label>
                <select
                  value={patientMetrics.gender}
                  onChange={(e) => setPatientMetrics({ ...patientMetrics, gender: e.target.value as 'MALE' | 'FEMALE' })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF' }}
                >
                  <option value="FEMALE">Female (x0.85 CrCl)</option>
                  <option value="MALE">Male (x1.0 CrCl)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={patientMetrics.weightKg}
                  onChange={(e) => setPatientMetrics({ ...patientMetrics, weightKg: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={patientMetrics.heightCm}
                  onChange={(e) => setPatientMetrics({ ...patientMetrics, heightCm: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Serum Creatinine (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={patientMetrics.serumCreatinineMgDl}
                  onChange={(e) => setPatientMetrics({ ...patientMetrics, serumCreatinineMgDl: Number(e.target.value) })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}
                />
              </div>
            </div>

            {/* Calculated Pharmacokinetic Summary Strip */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px 18px',
                borderRadius: '6px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Cockcroft-Gault CrCl
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>
                  {renalMetrics.cockcroftGaultCrCl} <span style={{ fontSize: '11px', fontWeight: 500 }}>mL/min</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  CKD-EPI 2021 eGFR
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {renalMetrics.ckdEpiEgfr} <span style={{ fontSize: '11px', fontWeight: 500 }}>mL/min/1.73m²</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Body Mass Index (BMI)
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {renalMetrics.bmi} <span style={{ fontSize: '11px', fontWeight: 500 }}>kg/m²</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  Devine IBW / AdjBW
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                  IBW: {renalMetrics.idealBodyWeightKg} kg
                  {renalMetrics.adjustedBodyWeightKg && (
                    <span style={{ display: 'block', fontSize: '11px', color: '#0284C7' }}>
                      AdjBW: {renalMetrics.adjustedBodyWeightKg} kg
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  KDIGO Stage
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: renalMetrics.ckdStage === 'STAGE_1' ? '#F0FDF4' : '#FEF3C7',
                      color: renalMetrics.ckdStage === 'STAGE_1' ? '#166534' : '#92400E',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    {renalMetrics.ckdStage.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drug Selection & Regimen Calculation */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>
            {/* Drug Catalog */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>
                Select Clinical Medication
              </div>
              {DRUG_DOSING_CATALOG.map((drug) => {
                const isSelected = drug.id === selectedDrugId;
                return (
                  <button
                    key={drug.id}
                    onClick={() => setSelectedDrugId(drug.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #0284C7' : '1px solid #E2E8F0',
                      background: isSelected ? '#F0F9FF' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        {drug.genericName}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748B' }}>RxNorm: {drug.rxNormCode}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {drug.drugClass}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Calculated Pharmacotherapy Recommendation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                      {selectedDrug.genericName} ({selectedDrug.brandNames.join(', ')})
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>
                      Indication: {selectedDrug.indication}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: '#E0F2FE',
                      color: '#0284C7',
                    }}
                  >
                    CrCl: {renalMetrics.cockcroftGaultCrCl} mL/min
                  </span>
                </div>

                {/* Specific Calculated Regimen Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                  {dosingResult.calculatedLoadingDose && (
                    <div style={{ background: '#FEF3C7', padding: '14px', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#92400E' }}>
                        Recommended Loading Dose
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#78350F', marginTop: '4px' }}>
                        {dosingResult.calculatedLoadingDose}
                      </div>
                      <div style={{ fontSize: '11px', color: '#92400E', marginTop: '4px' }}>
                        Administer over 120 minutes (rate &le; 1000 mg/hr) to avoid Red Man Syndrome.
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#F0F9FF', padding: '14px', borderRadius: '6px', border: '1px solid #BAE6FD' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0284C7' }}>
                      Maintenance Regimen & Interval
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0369A1', marginTop: '4px' }}>
                      {dosingResult.calculatedMaintenanceDose} {dosingResult.calculatedInterval}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0369A1', marginTop: '4px' }}>
                      Tier: {dosingResult.adjustmentTier.clinicalNote}
                    </div>
                  </div>
                </div>

                {/* Therapeutic Monitoring Guidance */}
                <div style={{ marginTop: '16px', padding: '14px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Activity size={15} color="#0284C7" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                      Therapeutic Drug Monitoring (TDM) Protocol
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                    {dosingResult.monitoringPlan}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B' }}>
                    <strong>Key Toxicities to Monitor:</strong> {selectedDrug.monitoringGuidance.toxicities.join(' · ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* SECTION 3: DRUG-DRUG INTERACTIONS (DDI)                     */}
      {/* ------------------------------------------------------------ */}
      {activeSection === 'DDI' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Patient Medication Bar */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Encounter Medication Regimen (Pairwise DDI Evaluation)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                  Checks active prescriptions and proposed orders against the RxNorm interaction database.
                </p>
              </div>

              {/* Add Medication Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Type drug name (e.g. Ciprofloxacin)..."
                  value={newMedInput}
                  onChange={(e) => setNewMedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMedication(newMedInput)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', width: '240px' }}
                />
                <button
                  onClick={() => addMedication(newMedInput)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Medication Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activeMeds.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 10px',
                    borderRadius: '20px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0F172A',
                  }}
                >
                  <Pill size={12} color="#0284C7" />
                  <span>{med.name}</span>
                  {med.rxNorm && <span style={{ fontSize: '10px', color: '#64748B' }}>({med.rxNorm})</span>}
                  <button
                    onClick={() => removeMedication(idx)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94A3B8' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DDI Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color={ddiResult.hasContraindications ? '#DC2626' : '#D97706'} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Detected Interactions ({ddiResult.detectedInteractions.length})
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: getSeverityBadgeColor(ddiResult.highestSeverity).bg,
                  color: getSeverityBadgeColor(ddiResult.highestSeverity).text,
                  border: `1px solid ${getSeverityBadgeColor(ddiResult.highestSeverity).border}`,
                }}
              >
                HIGHEST SEVERITY: {ddiResult.highestSeverity}
              </span>
            </div>

            {ddiResult.detectedInteractions.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '30px', textAlign: 'center', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '13px' }}>
                No dangerous drug-drug interactions detected between current co-prescribed agents.
              </div>
            ) : (
              ddiResult.detectedInteractions.map((ddi) => {
                const badge = getSeverityBadgeColor(ddi.severity);
                return (
                  <div
                    key={ddi.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '8px',
                      border: `1px solid ${badge.border}`,
                      borderLeft: `4px solid ${badge.text}`,
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                          {ddi.drugA.name} + {ddi.drugB.name}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          (RxNorm {ddi.drugA.rxNorm} &harr; {ddi.drugB.rxNorm})
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.text,
                        }}
                      >
                        {ddi.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
                      <strong>Mechanism:</strong> {ddi.mechanism}
                    </div>

                    <div style={{ fontSize: '12px', color: '#991B1B', background: '#FEF2F2', padding: '8px 12px', borderRadius: '4px', border: '1px solid #FEE2E2' }}>
                      <strong>Clinical Hazard:</strong> {ddi.clinicalConsequence}
                    </div>

                    <div style={{ fontSize: '12px', color: '#0F172A', background: '#F8FAFC', padding: '8px 12px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                      <strong>Clinical Management Strategy:</strong> {ddi.managementRecommendation}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* SECTION 4: ALLERGY CROSS-REACTIVITY                          */}
      {/* ------------------------------------------------------------ */}
      {activeSection === 'ALLERGY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Patient Documented Allergies */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldAlert size={18} color="#DC2626" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Documented Patient Immunological Allergies
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {patientKnownAllergies.map((allergy, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: '1px solid #FCA5A5',
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>{allergy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Challenge Tool */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
              Pre-Prescription Allergy Cross-Reactivity Simulator
            </h4>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748B' }}>
              Select an intended candidate antimicrobial or therapeutic agent to compute structural cross-reactivity and shared side-chain risk.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {[
                'Ampicillin',
                'Piperacillin / Tazobactam',
                'Cephalexin',
                'Cefazolin',
                'Ceftriaxone',
                'Cefepime',
                'Meropenem',
                'Aztreonam',
                'Sulfamethoxazole',
                'Furosemide',
                'Ibuprofen',
                'Enoxaparin',
              ].map((agent) => {
                const isSelected = testAntimicrobial === agent;
                return (
                  <button
                    key={agent}
                    onClick={() => setTestAntimicrobial(agent)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: isSelected ? '1px solid #0284C7' : '1px solid #CBD5E1',
                      background: isSelected ? '#0284C7' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {agent}
                  </button>
                );
              })}
            </div>

            {/* Simulator Output */}
            {allergyAlerts.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#166534',
                  fontSize: '13px',
                }}
              >
                <strong>SAFE TO ADMINISTER:</strong> No significant structural or immunological cross-reactivity detected between <strong>{testAntimicrobial}</strong> and documented patient allergies.
              </div>
            ) : (
              allergyAlerts.map((alert, idx) => {
                const isContra = alert.riskLevel === 'CONTRAINDICATED';
                return (
                  <div
                    key={idx}
                    style={{
                      background: isContra ? '#FEF2F2' : '#FFFBEB',
                      border: isContra ? '1px solid #FCA5A5' : '1px solid #FCD34D',
                      borderLeft: isContra ? '4px solid #DC2626' : '4px solid #D97706',
                      borderRadius: '6px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: isContra ? '#991B1B' : '#92400E' }}>
                        {alert.alertHeadline}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isContra ? '#DC2626' : '#D97706',
                          color: '#FFFFFF',
                        }}
                      >
                        {alert.riskLevel}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.4 }}>
                      <strong>Immunological Mechanism:</strong> {alert.rule.immunologicalMechanism}
                    </div>

                    <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.4 }}>
                      <strong>Clinical Practice Guidance:</strong> {alert.managementAdvice}
                    </div>

                    <div style={{ fontSize: '12px', color: '#0369A1', background: '#F0F9FF', padding: '8px 12px', borderRadius: '4px', border: '1px solid #BAE6FD', marginTop: '4px' }}>
                      <strong>Validated Safe Therapeutic Alternatives:</strong>{' '}
                      {alert.safeSubstitutes.join(', ')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
