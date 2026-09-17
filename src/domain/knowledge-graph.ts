// ============================================================
// src/domain/knowledge-graph.ts
// Phase 13: Clinical Knowledge Graph Pure Domain Models
// UMLS & SNOMED CT Ontological Modeling for Clinical Reasoning
// Pure TypeScript — zero external dependencies
// ============================================================

export type KnowledgeNodeType =
  | 'DISEASE_OR_SYNDROME'
  | 'FINDING'
  | 'ORGANISM'
  | 'ANATOMICAL_STRUCTURE'
  | 'PHARMACOLOGICAL_SUBSTANCE'
  | 'DIAGNOSTIC_PROCEDURE';

export type KnowledgePredicate =
  | 'CAUSES'
  | 'MANIFESTATION_OF'
  | 'CORRELATES_WITH'
  | 'INDICATES'
  | 'DIAGNOSED_BY'
  | 'TREATED_BY'
  | 'CONTRADICTS'
  | 'LOCATION_OF';

export interface KnowledgeNode {
  cui: string; // UMLS Concept Unique Identifier, e.g. "C0014144"
  snomedCode?: string; // SNOMED CT Concept ID, e.g. "301011002"
  preferredTerm: string;
  nodeType: KnowledgeNodeType;
  definition: string;
  synonyms: string[];
  semanticCategory: string;
}

export interface KnowledgeEdge {
  id: string;
  sourceCui: string;
  targetCui: string;
  predicate: KnowledgePredicate;
  evidenceStrength: 'DEFINITIVE' | 'STRONG_ASSOCIATION' | 'MODERATE' | 'THEORETICAL';
  clinicalMechanism: string;
  referencePmids: string[];
}

export interface PathStep {
  fromNode: KnowledgeNode;
  toNode: KnowledgeNode;
  edge: KnowledgeEdge;
  stepExplanation: string;
}

export interface PathophysiologicalPath {
  findingCui: string;
  hypothesisCui: string;
  steps: PathStep[];
  overallPlausibility: 'HIGH' | 'MODERATE' | 'LOW';
  narrativeSummary: string;
}
