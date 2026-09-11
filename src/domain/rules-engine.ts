// ============================================================
// src/domain/rules-engine.ts
// Phase 9: Clinical Decision Rules Engine Domain Types
// Pure types for deterministic clinical decision support (CDS)
// ============================================================

// ------------------------------------------------------------
// 1. Structured Clinical Decision Rules
// ------------------------------------------------------------

export type RuleCategory =
  | 'DIAGNOSTIC_CRITERIA'
  | 'PROGNOSTIC_SCORE'
  | 'SEVERITY_INDEX'
  | 'CLINICAL_TRIGGER';

export type CriterionOperator =
  | 'EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_EQUAL'
  | 'LESS_EQUAL'
  | 'IN_SET'
  | 'BOOLEAN_TRUE'
  | 'EXISTS';

export interface RuleCriterion {
  id: string;
  name: string;
  description: string;
  category?: 'MAJOR' | 'MINOR' | 'STANDARD';
  points?: number;
  dataField?: string; // e.g. 'vitals.respiratoryRate', 'labs.bloodCulture'
  operator?: CriterionOperator;
  threshold?: number | string | boolean;
  unit?: string;
  isMet?: boolean;
}

export interface RuleScoreTier {
  id: string;
  label: string;
  minScore?: number;
  maxScore?: number;
  clinicalInterpretation: string;
  recommendedAction: string;
  riskSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface ClinicalRule {
  id: string;
  code: string;
  title: string;
  shortDescription: string;
  category: RuleCategory;
  specialty: string;
  guidelineCitation: string;
  version: string;
  criteria: RuleCriterion[];
  tiers: RuleScoreTier[];
  evaluationLogic: 'SUM_POINTS' | 'MAJOR_MINOR_CRITERIA' | 'THRESHOLD_MATCH';
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleTitle: string;
  evaluatedAt: string;
  score?: number;
  majorCount?: number;
  minorCount?: number;
  matchedTier: RuleScoreTier;
  criteriaResults: Array<{
    criterionId: string;
    criterionName: string;
    isMet: boolean;
    evidenceFound?: string;
    isManualOverride?: boolean;
  }>;
  meetsGuidelineThreshold: boolean;
  clinicalSummary: string;
}

// ------------------------------------------------------------
// 2. Pharmacotherapy & Renal Dosing
// ------------------------------------------------------------

export type RenalEquation = 'COCKCROFT_GAULT' | 'CKD_EPI_2021';

export interface PatientDosingMetrics {
  age: number;
  gender: 'MALE' | 'FEMALE';
  weightKg: number;
  heightCm: number;
  serumCreatinineMgDl: number; // mg/dL
  isAmputee?: boolean;
  isPregnant?: boolean;
}

export interface RenalFunctionResult {
  cockcroftGaultCrCl: number; // mL/min
  ckdEpiEgfr: number; // mL/min/1.73m2
  bsaMosteller: number; // m2
  idealBodyWeightKg: number; // IBW (Devine)
  adjustedBodyWeightKg?: number; // AdjBW (if obese BMI >= 30)
  bmi: number;
  ckdStage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3A' | 'STAGE_3B' | 'STAGE_4' | 'STAGE_5';
  interpretation: string;
}

export interface RenalDoseAdjustmentTier {
  minCrCl?: number;
  maxCrCl?: number;
  recommendedDose: string;
  interval: string;
  clinicalNote: string;
  severityWarning?: 'NORMAL' | 'CAUTION' | 'HIGH_ALERT';
}

export interface DrugDosingProtocol {
  id: string;
  genericName: string;
  brandNames: string[];
  rxNormCode: string;
  drugClass: string;
  standardDose: string;
  standardInterval: string;
  indication: string;
  isWeightBased: boolean;
  mgPerKgStandard?: number;
  mgPerKgLoading?: number;
  maxSingleDoseMg?: number;
  renalAdjustmentRequired: boolean;
  renalTiers: RenalDoseAdjustmentTier[];
  monitoringGuidance: {
    targetTrough?: string;
    targetPeak?: string;
    targetAucMic?: string;
    monitoringFrequency: string;
    toxicities: string[];
  };
}

export interface DosingCalculationResult {
  drugId: string;
  drugName: string;
  patientMetrics: PatientDosingMetrics;
  renalMetrics: RenalFunctionResult;
  calculatedLoadingDose?: string;
  calculatedMaintenanceDose: string;
  calculatedInterval: string;
  adjustmentTier: RenalDoseAdjustmentTier;
  monitoringPlan: string;
  safetyAlerts: string[];
  calculatedAt: string;
}

// ------------------------------------------------------------
// 3. Drug-Drug Interactions (DDI)
// ------------------------------------------------------------

export type InteractionSeverity = 'CONTRAINDICATED' | 'MAJOR' | 'MODERATE' | 'MINOR';

export interface DrugInteraction {
  id: string;
  drugA: { name: string; rxNorm: string };
  drugB: { name: string; rxNorm: string };
  severity: InteractionSeverity;
  mechanism: string; // e.g. CYP3A4 inhibition, Additive QT prolongation
  clinicalConsequence: string;
  evidenceLevel: 'DEFINITIVE' | 'PROBABLE' | 'SUSPECTED';
  managementRecommendation: string;
  guidelineReference: string;
}

export interface DdiCheckResult {
  detectedInteractions: DrugInteraction[];
  hasContraindications: boolean;
  highestSeverity: InteractionSeverity | 'NONE';
  checkedMedications: Array<{ name: string; rxNorm?: string }>;
  timestamp: string;
}

// ------------------------------------------------------------
// 4. Allergy Cross-Reactivity
// ------------------------------------------------------------

export type AllergyRiskLevel =
  | 'CONTRAINDICATED'
  | 'HIGH_RISK'
  | 'MODERATE_RISK'
  | 'LOW_RISK'
  | 'SAFE_ALTERNATIVE';

export interface AllergyCrossReactivityRule {
  id: string;
  allergenClass: string; // e.g. 'PENICILLIN', 'SULFONAMIDE', 'NSAID'
  offendingAgent: string; // e.g. 'Penicillin G', 'Amoxicillin'
  targetAgent: string; // e.g. 'Ceftriaxone', 'Meropenem', 'Aztreonam'
  targetDrugClass: string;
  riskLevel: AllergyRiskLevel;
  estimatedCrossReactivityPercent: string; // e.g. '< 1%', '3-5%', '100%'
  immunologicalMechanism: string; // e.g. 'Shared R1 side-chain', 'Core beta-lactam ring'
  clinicalGuidance: string;
  recommendedAction: 'AVOID' | 'USE_WITH_MONITORING' | 'SAFE_TO_ADMINISTER' | 'SKIN_TEST_FIRST';
  safeAlternatives: string[];
}

export interface AllergyAlertResult {
  offendingAllergy: string;
  targetDrugName: string;
  riskLevel: AllergyRiskLevel;
  rule: AllergyCrossReactivityRule;
  alertHeadline: string;
  managementAdvice: string;
  safeSubstitutes: string[];
}
