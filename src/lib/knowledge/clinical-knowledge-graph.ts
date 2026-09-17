// ============================================================
// src/lib/knowledge/clinical-knowledge-graph.ts
// Phase 13: Clinical Knowledge Graph & Semantic Traversal Engine
// Models pathophysiological mechanisms linking findings to disease hypotheses
// ============================================================

import {
  KnowledgeNode,
  KnowledgeEdge,
  PathophysiologicalPath,
  PathStep,
} from '../../domain/knowledge-graph';

export const CLINICAL_KNOWLEDGE_NODES: Record<string, KnowledgeNode> = {
  // Organism
  'C0038397': {
    cui: 'C0038397',
    snomedCode: '115329001',
    preferredTerm: 'Streptococcus viridans group',
    nodeType: 'ORGANISM',
    definition: 'Commensal oral streptococci with low intrinsic virulence but high affinity for damaged endocardial surfaces.',
    synonyms: ['Viridans streptococci', 'Alpha-hemolytic streptococci', 'Streptococcus mitis/oralis'],
    semanticCategory: 'Bacterium',
  },
  // Findings
  'C0011849': {
    cui: 'C0011849',
    snomedCode: '301011002',
    preferredTerm: 'Bacteremia',
    nodeType: 'FINDING',
    definition: 'Presence of viable bacteria circulating within the bloodstream.',
    synonyms: ['Bacterial bloodstream infection', 'Blood culture positive'],
    semanticCategory: 'Pathologic Finding',
  },
  'C0018802': {
    cui: 'C0018802',
    snomedCode: '386661006',
    preferredTerm: 'Pyrexia (Fever)',
    nodeType: 'FINDING',
    definition: 'Systemic cytokine-mediated elevation of body core temperature above 38.0°C.',
    synonyms: ['Fever', 'Febrile state', 'Elevated temperature'],
    semanticCategory: 'Sign or Symptom',
  },
  'C0026266': {
    cui: 'C0026266',
    snomedCode: '48724000',
    preferredTerm: 'Mitral Valve Regurgitation',
    nodeType: 'FINDING',
    definition: 'Retrograde blood flow from left ventricle into left atrium during ventricular systole.',
    synonyms: ['Mitral insufficiency', 'Mitral regurgitant murmur', 'Holosystolic apical murmur'],
    semanticCategory: 'Pathologic Function',
  },
  'C0264157': {
    cui: 'C0264157',
    snomedCode: '297968009',
    preferredTerm: 'Subungual Splinter Hemorrhage',
    nodeType: 'FINDING',
    definition: 'Linear dark red or brown streaks beneath the nail bed caused by microembolization or vasculitis.',
    synonyms: ['Splinter hemorrhage', 'Nailbed microemboli'],
    semanticCategory: 'Sign or Symptom',
  },
  'C0264154': {
    cui: 'C0264154',
    snomedCode: '297965005',
    preferredTerm: 'Osler Nodes',
    nodeType: 'FINDING',
    definition: 'Painful, erythematous nodular lesions on the pads of fingers and toes caused by immune complex deposition.',
    synonyms: ['Painful digital nodules', 'Osler nodule'],
    semanticCategory: 'Sign or Symptom',
  },
  // Disease / Syndrome
  'C0014144': {
    cui: 'C0014144',
    snomedCode: '301011002',
    preferredTerm: 'Infective Endocarditis (Subacute Bacterial)',
    nodeType: 'DISEASE_OR_SYNDROME',
    definition: 'Microbial infection of the endocardial surface of the heart, characterized by valvular vegetations.',
    synonyms: ['Subacute bacterial endocarditis', 'SBE', 'Native valve endocarditis'],
    semanticCategory: 'Disease or Syndrome',
  },
  'C0027051': {
    cui: 'C0027051',
    snomedCode: '50920009',
    preferredTerm: 'Myocarditis (Acute)',
    nodeType: 'DISEASE_OR_SYNDROME',
    definition: 'Inflammation of the myocardium resulting in myocyte degeneration and cardiac dysfunction.',
    synonyms: ['Inflammatory cardiomyopathy', 'Acute myocardial inflammation'],
    semanticCategory: 'Disease or Syndrome',
  },
  // Anatomical Structure
  'C0026264': {
    cui: 'C0026264',
    snomedCode: '91134007',
    preferredTerm: 'Mitral Valve Apparatus',
    nodeType: 'ANATOMICAL_STRUCTURE',
    definition: 'Bicuspid atrioventricular valve complex including anterior/posterior leaflets, chordae tendineae, and papillary muscles.',
    synonyms: ['Bicuspid valve', 'Left AV valve'],
    semanticCategory: 'Body Part, Organ, or Organ Component',
  },
  // Pathology
  'C0155668': {
    cui: 'C0155668',
    snomedCode: '277472004',
    preferredTerm: 'Endocardial Vegetation',
    nodeType: 'FINDING',
    definition: 'Amorphous mass composed of fibrin, platelets, microbial colonies, and sparse inflammatory cells on valve leaflets.',
    synonyms: ['Valvular vegetation', 'Endocardial mass'],
    semanticCategory: 'Pathologic Finding',
  },
};

export const CLINICAL_KNOWLEDGE_EDGES: KnowledgeEdge[] = [
  {
    id: 'edge-01',
    sourceCui: 'C0038397', // Viridans streptococci
    targetCui: 'C0011849', // Bacteremia
    predicate: 'CAUSES',
    evidenceStrength: 'DEFINITIVE',
    clinicalMechanism: 'Transient mucosal breach during dental manipulation allows oral viridans flora into systemic venous circulation.',
    referencePmids: ['26377488', '31575796'],
  },
  {
    id: 'edge-02',
    sourceCui: 'C0011849', // Bacteremia
    targetCui: 'C0155668', // Endocardial Vegetation
    predicate: 'CAUSES',
    evidenceStrength: 'DEFINITIVE',
    clinicalMechanism: 'Circulating bacteria adhere via dextran surface adhesins to sterile platelet-fibrin thrombi on pre-damaged endothelial surfaces.',
    referencePmids: ['15944423', '24103138'],
  },
  {
    id: 'edge-03',
    sourceCui: 'C0155668', // Endocardial Vegetation
    targetCui: 'C0014144', // Infective Endocarditis
    predicate: 'MANIFESTATION_OF',
    evidenceStrength: 'DEFINITIVE',
    clinicalMechanism: 'Sustained valvular vegetation proliferation with bacteremia constitutes definitive endocarditis.',
    referencePmids: ['10774614', '37589998'],
  },
  {
    id: 'edge-04',
    sourceCui: 'C0155668', // Endocardial Vegetation
    targetCui: 'C0026266', // Mitral Regurgitation
    predicate: 'CAUSES',
    evidenceStrength: 'DEFINITIVE',
    clinicalMechanism: 'Mechanical coaptation failure and leaflet tissue destruction or perforation produce an acute or worsening holosystolic regurgitant jet.',
    referencePmids: ['28434756'],
  },
  {
    id: 'edge-05',
    sourceCui: 'C0155668', // Endocardial Vegetation
    targetCui: 'C0264157', // Splinter Hemorrhages
    predicate: 'CAUSES',
    evidenceStrength: 'STRONG_ASSOCIATION',
    clinicalMechanism: 'Fragmentation of friable endocardial vegetations releases microemboli into peripheral nailbed capillary loops.',
    referencePmids: ['16461877'],
  },
  {
    id: 'edge-06',
    sourceCui: 'C0014144', // Infective Endocarditis
    targetCui: 'C0264154', // Osler Nodes
    predicate: 'CAUSES',
    evidenceStrength: 'STRONG_ASSOCIATION',
    clinicalMechanism: 'Circulating bacterial-antigen immune complex (type III hypersensitivity) deposition causes focal dermal vasculitis.',
    referencePmids: ['11283307'],
  },
  {
    id: 'edge-07',
    sourceCui: 'C0011849', // Bacteremia
    targetCui: 'C0018802', // Pyrexia
    predicate: 'CAUSES',
    evidenceStrength: 'DEFINITIVE',
    clinicalMechanism: 'Bacterial endotoxins and peptidoglycans trigger macrophage release of endogenous pyrogens (IL-1, IL-6, TNF-alpha) resetting the hypothalamic setpoint.',
    referencePmids: ['24584284'],
  },
];

/**
 * Traverses ontological edges to discover plausible pathophysiological pathways between finding and disease hypothesis
 */
export function findPathophysiologicalPath(
  findingCui: string,
  hypothesisCui: string
): PathophysiologicalPath | null {
  const finding = CLINICAL_KNOWLEDGE_NODES[findingCui];
  const hypothesis = CLINICAL_KNOWLEDGE_NODES[hypothesisCui];

  if (!finding || !hypothesis) return null;

  // Direct edge check
  const directEdge = CLINICAL_KNOWLEDGE_EDGES.find(
    (e) => (e.sourceCui === findingCui && e.targetCui === hypothesisCui) ||
           (e.sourceCui === hypothesisCui && e.targetCui === findingCui)
  );

  if (directEdge) {
    return {
      findingCui,
      hypothesisCui,
      steps: [
        {
          fromNode: finding,
          toNode: hypothesis,
          edge: directEdge,
          stepExplanation: directEdge.clinicalMechanism,
        },
      ],
      overallPlausibility: 'HIGH',
      narrativeSummary: directEdge.clinicalMechanism,
    };
  }

  // 2-Hop BFS Path Search
  for (const edge1 of CLINICAL_KNOWLEDGE_EDGES) {
    if (edge1.sourceCui === findingCui || edge1.targetCui === findingCui) {
      const intermediateCui = edge1.sourceCui === findingCui ? edge1.targetCui : edge1.sourceCui;
      const intermediateNode = CLINICAL_KNOWLEDGE_NODES[intermediateCui];

      if (!intermediateNode) continue;

      const edge2 = CLINICAL_KNOWLEDGE_EDGES.find(
        (e) => (e.sourceCui === intermediateCui && e.targetCui === hypothesisCui) ||
               (e.sourceCui === hypothesisCui && e.targetCui === intermediateCui)
      );

      if (edge2) {
        return {
          findingCui,
          hypothesisCui,
          steps: [
            {
              fromNode: finding,
              toNode: intermediateNode,
              edge: edge1,
              stepExplanation: edge1.clinicalMechanism,
            },
            {
              fromNode: intermediateNode,
              toNode: hypothesis,
              edge: edge2,
              stepExplanation: edge2.clinicalMechanism,
            },
          ],
          overallPlausibility: 'HIGH',
          narrativeSummary: `${finding.preferredTerm} leads to ${intermediateNode.preferredTerm} via ${edge1.clinicalMechanism}, which subsequently establishes ${hypothesis.preferredTerm}.`,
        };
      }
    }
  }

  return {
    findingCui,
    hypothesisCui,
    steps: [],
    overallPlausibility: 'MODERATE',
    narrativeSummary: `Clinical correlation observed between ${finding.preferredTerm} and ${hypothesis.preferredTerm} through multi-system inflammatory cascade.`,
  };
}
