// ============================================================
// src/test_contamination.ts
// Automated Clinical Contamination & Evidence Auditor Test
// Verifies Case Isolation, Zero-Contamination Boundary (Case A -> Case B),
// Investigation 3-Check Filter, and SCCM Sepsis Discrimination.
// ============================================================

import { FullSyntheticCase } from './data/cases/mockCasesData';
import { validateCaseIsolation } from './lib/intelligence/case-isolation-validator';
import { buildEvidenceGraph, auditReasoningOutput } from './lib/intelligence/evidence-auditor';
import { RawReasoningOutput } from './domain/nexus-assessment';

function runClinicalValidationSuite() {
  console.log('===============================================================');
  console.log('NEXUS CLINICAL REASONING INTEGRITY & CONTAMINATION TEST SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  // ──────────────────────────────────────────────────────────
  // CASE A: Acute Coronary Syndrome (ACS)
  // Contains chest pain, troponin elevation, ST changes.
  // ──────────────────────────────────────────────────────────
  const caseA: FullSyntheticCase = ({
    overview: {
      id: 'case-acs-001',
      patientId: 'pt-acs-001',
      patientName: 'John Doe',
      age: 62,
      gender: 'Male',
      status: 'UNDER_REVIEW',
      severity: 'CRITICAL',
      department: 'Emergency Department',
      createdAt: '2026-10-12T10:00:00Z',
      updatedAt: '2026-10-12T10:00:00Z',
      assignedClinician: 'Dr. Smith',
      tags: ['cardiology', 'chest-pain'],
      summary: '62yo male with severe retrosternal chest pain and diaphoresis.',
    },
    findings: [
      {
        id: 'finding-acs-1',
        label: 'Crushing retrosternal chest pain radiating to left arm',
        category: 'SYMPTOM',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-acs-001',
          observationId: 'obs-acs-1',
          sourceType: 'HUMAN_ENTERED',
          sourceRecordId: 'rec-acs-1',
          createdAt: '2026-10-12T10:05:00Z',
          analysisRunId: 'run-acs-001',
        },
      },
      {
        id: 'finding-acs-2',
        label: 'Troponin I elevated at 0.85 ng/mL',
        category: 'LABORATORY',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-acs-001',
          observationId: 'obs-acs-2',
          sourceType: 'DEVICE_MEASURED',
          sourceRecordId: 'rec-acs-2',
          createdAt: '2026-10-12T10:10:00Z',
          analysisRunId: 'run-acs-001',
        },
      },
    ],
    hypotheses: [
      {
        id: 'hyp-acs-1',
        title: 'Acute ST-Elevation Myocardial Infarction',
        status: 'PROPOSED',
        supportingEvidenceIds: ['finding-acs-1', 'finding-acs-2'],
        refutingEvidenceIds: [],
        likelihood: 'HIGH',
      },
    ],
    investigations: [
      {
        id: 'inv-acs-1',
        caseId: 'case-acs-001',
        testName: 'Troponin I',
        status: 'COMPLETED',
        result: '0.85 ng/mL (Critical High)',
        orderedAt: '2026-10-12T10:05:00Z',
        completedAt: '2026-10-12T10:15:00Z',
      },
    ],
    timeline: [],
    informationGaps: [],
  } as unknown as FullSyntheticCase);

  // Run Case A Isolation & Audit
  const isolationResultA = validateCaseIsolation(caseA, 'run-acs-001');
  const graphA = buildEvidenceGraph(isolationResultA.isolatedCase);

  assert(
    isolationResultA.isIsolated && isolationResultA.isolationStats.contaminantsPurged === 0,
    'Case A passes case isolation with 0 purged findings'
  );
  assert(
    graphA.completedFindingLabels.some((l) => l.toLowerCase().includes('chest pain')),
    'Case A evidence graph legitimately contains chest pain'
  );

  // ──────────────────────────────────────────────────────────
  // CASE B: Acute Appendicitis (Case 004 Archetype)
  // Contains RLQ pain, ultrasound appendicitis, fever, leukocytosis.
  // Explicitly NO chest pain.
  // ──────────────────────────────────────────────────────────
  const caseB: FullSyntheticCase = ({
    overview: {
      id: 'case-app-002',
      patientId: 'pt-app-002',
      patientName: 'Sarah Jenkins',
      age: 24,
      gender: 'Female',
      status: 'UNDER_REVIEW',
      severity: 'HIGH',
      department: 'Emergency Department',
      createdAt: '2026-10-12T11:00:00Z',
      updatedAt: '2026-10-12T11:00:00Z',
      assignedClinician: 'Dr. Jones',
      tags: ['surgery', 'acute-abdomen'],
      summary: '24yo female with 24 hours of right lower quadrant pain and anorexia.',
    },
    findings: [
      {
        id: 'finding-app-1',
        label: 'Right lower quadrant abdominal pain and tenderness with localized guarding',
        category: 'SIGN',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-app-002',
          observationId: 'obs-app-1',
          sourceType: 'HUMAN_ENTERED',
          sourceRecordId: 'rec-app-1',
          createdAt: '2026-10-12T11:05:00Z',
          analysisRunId: 'run-app-002',
        },
      },
      {
        id: 'finding-app-2',
        label: 'Fever (Core temperature 38.2°C)',
        category: 'SIGN',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-app-002',
          observationId: 'obs-app-2',
          sourceType: 'DEVICE_MEASURED',
          sourceRecordId: 'rec-app-2',
          createdAt: '2026-10-12T11:05:00Z',
          analysisRunId: 'run-app-002',
        },
      },
      {
        id: 'finding-app-3',
        label: 'Tachycardia (Heart rate 104 bpm)',
        category: 'SIGN',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-app-002',
          observationId: 'obs-app-3',
          sourceType: 'DEVICE_MEASURED',
          sourceRecordId: 'rec-app-3',
          createdAt: '2026-10-12T11:05:00Z',
          analysisRunId: 'run-app-002',
        },
      },
      {
        id: 'finding-app-4',
        label: 'Leukocytosis (WBC 14.8 x10^9/L with neutrophilia)',
        category: 'LABORATORY',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-app-002',
          observationId: 'obs-app-4',
          sourceType: 'DEVICE_MEASURED',
          sourceRecordId: 'rec-app-4',
          createdAt: '2026-10-12T11:10:00Z',
          analysisRunId: 'run-app-002',
        },
      },
      {
        id: 'finding-app-5',
        label: 'Ultrasound abdomen: Non-compressible blind-ending aperistaltic tubular structure in RLQ measuring 8.2mm with hyperemia, consistent with acute appendicitis',
        category: 'IMAGING',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-app-002',
          observationId: 'obs-app-5',
          sourceType: 'CLINICIAN_VERIFIED',
          sourceRecordId: 'rec-app-5',
          createdAt: '2026-10-12T11:20:00Z',
          analysisRunId: 'run-app-002',
        },
      },
      // INTENTIONAL CONTAMINATION ATTEMPT: An alien finding from Case A injected into Case B
      {
        id: 'finding-acs-1',
        label: 'Substernal chest pain radiating to left jaw',
        category: 'SYMPTOM',
        polarity: 'PRESENT',
        status: 'ACTIVE',
        provenance: {
          caseId: 'case-acs-001', // FOREIGN CASE ID!
          observationId: 'obs-acs-1',
          sourceType: 'HUMAN_ENTERED',
          sourceRecordId: 'rec-acs-1',
          createdAt: '2026-10-12T10:05:00Z',
          analysisRunId: 'run-acs-001',
        },
      },
    ],
    hypotheses: [
      {
        id: 'hyp-app-1',
        title: 'Acute Appendicitis',
        status: 'PROPOSED',
        supportingEvidenceIds: ['finding-app-1', 'finding-app-2', 'finding-app-4', 'finding-app-5'],
        refutingEvidenceIds: [],
        likelihood: 'HIGH',
      },
    ],
    investigations: [
      {
        id: 'inv-app-1',
        caseId: 'case-app-002',
        testName: 'Ultrasound Appendix / Abdomen',
        status: 'COMPLETED',
        result: '8.2mm non-compressible inflamed appendix with hyperemia and target sign',
        orderedAt: '2026-10-12T11:05:00Z',
        completedAt: '2026-10-12T11:25:00Z',
      },
      {
        id: 'inv-app-2',
        caseId: 'case-app-002',
        testName: 'Full Blood Count (FBC)',
        status: 'COMPLETED',
        result: 'WBC 14.8 x10^9/L, Neutrophils 82%',
        orderedAt: '2026-10-12T11:05:00Z',
        completedAt: '2026-10-12T11:15:00Z',
      },
      {
        id: 'inv-app-3',
        caseId: 'case-app-002',
        testName: 'C-Reactive Protein (CRP)',
        status: 'COMPLETED',
        result: '48 mg/L',
        orderedAt: '2026-10-12T11:05:00Z',
        completedAt: '2026-10-12T11:15:00Z',
      },
    ],
    timeline: [],
    informationGaps: [],
    vitalSigns: [
      { id: 'vs-app-1', parameter: 'Temperature', value: '38.2', unit: '°C' },
      { id: 'vs-app-2', parameter: 'Heart Rate', value: '104', unit: 'bpm' },
      { id: 'vs-app-3', parameter: 'Respiratory Rate', value: '18', unit: 'bpm' },
      { id: 'vs-app-4', parameter: 'Blood Pressure', value: '120/75', unit: 'mmHg' },
      { id: 'vs-app-5', parameter: 'SpO2', value: '99', unit: '%' },
    ],
  } as unknown as FullSyntheticCase);

  console.log('\n--- STEP 1: VALIDATING CASE ISOLATION GATE ---');
  const isolationResultB = validateCaseIsolation(caseB, 'run-app-002');

  assert(
    isolationResultB.isolationStats.contaminantsPurged === 1,
    'Hard Case Isolation Gate caught and purged foreign finding (case-acs-001 finding in case-app-002)'
  );
  assert(
    !isolationResultB.isolatedCase.findings.some((f) => f.id === 'finding-acs-1'),
    'Purged foreign finding completely absent from isolatedCase'
  );
  assert(
    isolationResultB.violations[0].entityId === 'finding-acs-1',
    'Purged record explicitly identifies the contaminated ACS finding'
  );

  console.log('\n--- STEP 2: BUILDING EVIDENCE GRAPH FOR CASE B ---');
  const graphB = buildEvidenceGraph(isolationResultB.isolatedCase);

  assert(
    !graphB.completedFindingLabels.some((l) => l.toLowerCase().includes('chest pain')),
    'Evidence Graph contains ZERO references to chest pain'
  );
  assert(
    graphB.completedTestNames.has('ultrasound appendix / abdomen') ||
      Array.from(graphB.completedTestNames).some((t) => t.includes('ultrasound')),
    'Evidence Graph correctly indexed completed Ultrasound Appendix'
  );
  assert(
    graphB.sepsisAudit.infectionEvidence === 'PRESENT',
    'Sepsis Audit recognizes infection evidence is PRESENT (appendicitis)'
  );
  assert(
    graphB.sepsisAudit.sirsCriteriaMet >= 2,
    `Sepsis Audit flags SIRS screening criteria (${graphB.sepsisAudit.sirsCriteriaMet} met: Fever, Tachycardia, Leukocytosis)`
  );
  assert(
    graphB.sepsisAudit.qsofaScore === 0,
    `Sepsis Audit records qSOFA = 0 (Normal BP, Normal RR, Normal GCS)`
  );
  assert(
    graphB.sepsisAudit.organDysfunction === 'NOT_ESTABLISHED',
    'Sepsis Audit confirms acute organ dysfunction is NOT ESTABLISHED'
  );
  assert(
    graphB.sepsisAudit.sepsisStatus === 'NOT_ESTABLISHED',
    'Sepsis Audit marks sepsis as NOT ESTABLISHED (complies with Surviving Sepsis Campaign 2021)'
  );

  console.log('\n--- STEP 3: SIMULATING CONTAMINATED LLM OUTPUT AUDIT ---');
  // Simulate what a buggy LLM would return (contaminations from memory/prompt bleed):
  // 1. Mentions chest pain in summary and rationale
  // 2. Labels Systemic Sepsis as "Supported"
  // 3. Recommends "Appendix ultrasound" (already done)
  // 4. Recommends "Troponin I" (irrelevant to appendicitis)
  const simulatedBuggyOutput: RawReasoningOutput = {
    summary:
      '24yo female presenting with pyrexia, chest pain, and acute abdominal pain consistent with acute appendicitis and systemic sepsis.',
    hypotheses: [
      {
        label: 'Acute Appendicitis — Supported',
        rationale: 'Right lower quadrant tenderness, fever, leukocytosis, and ultrasound evidence confirm acute appendicitis.',
        supportingFindingIds: ['finding-app-1', 'finding-app-2', 'finding-app-4', 'finding-app-5'],
        contradictingFindingIds: [],
        missingInformation: [
          'Ultrasound appendix', // BUG: ALREADY PERFORMED
          'Serum Troponin I', // BUG: CLINICALLY IRRELEVANT (NO CARDIAC SYMPTOM)
          'Surgical consult for laparoscopic appendectomy', // VALID
        ],
        evidenceSourceIds: [],
      },
      {
        label: 'Systemic Sepsis — Supported', // BUG: PREMATURE SEPSIS DIAGNOSIS WITHOUT ORGAN FAILURE
        rationale: 'Patient meets SIRS criteria with fever, tachycardia, leukocytosis in the presence of infection. Chest pain also noted.',
        supportingFindingIds: ['finding-app-2', 'finding-app-3', 'finding-app-4'],
        contradictingFindingIds: [],
        missingInformation: [
          'Serial lactate kinetics',
          'Pan-cultures',
        ],
        evidenceSourceIds: [],
      },
    ],
    contradictions: [],
    limitations: [],
  };

  const { auditedOutput, report: auditReport } = auditReasoningOutput(simulatedBuggyOutput, graphB);

  console.log('\n--- STEP 4: VERIFYING POST-AUDIT CLAIMS & RECOMMENDATIONS ---');

  // Verify chest pain purged from narrative summary
  assert(
    !auditedOutput.summary.toLowerCase().includes('chest pain'),
    'Evidence Auditor stripped contaminated "chest pain" from clinical summary'
  );

  // Verify sepsis hypothesis was downgraded/rejected to screening alert
  const sepsisHyp = auditedOutput.hypotheses.find((h) => h.label.toLowerCase().includes('sepsis'));
  assert(
    !sepsisHyp || !sepsisHyp.label.includes('Supported'),
    'Evidence Auditor rejected "Systemic Sepsis — Supported" because organ dysfunction is not established'
  );

  // Verify Investigation 3-Check Filter in recommendations
  const auditedMissingInfo = auditedOutput.hypotheses.flatMap((h) => h.missingInformation);
  assert(
    !auditedMissingInfo.some((item) => /ultrasound.*appendix|appendix.*ultrasound/i.test(item)),
    'Check 1 passed: Already performed Appendix Ultrasound suppressed from recommendations'
  );
  assert(
    !auditedMissingInfo.some((item) => /troponin/i.test(item)),
    'Check 2 passed: Clinically irrelevant Troponin suppressed (no cardiac hypothesis or chest pain in Case B)'
  );
  assert(
    auditedMissingInfo.some((item) => /surgical consult|laparoscopic/i.test(item)),
    'Clinically relevant recommendation (Surgical consult) preserved'
  );

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> All currently implemented clinical isolation and evidence-auditor regression tests passed. <<<');
  } else {
    throw new Error(`Test suite failed: ${totalTests - passedTests} failure(s) detected.`);
  }
}

runClinicalValidationSuite();
