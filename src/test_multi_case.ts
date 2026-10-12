import { DeterministicClinicalProvider, ReasoningInput } from '../src/lib/intelligence/reasoning-provider';
import { evaluateOptimalCriteria } from '../src/features/cases/services/criteria-engine';

async function runMultiCaseTest() {
  console.log('====================================================');
  console.log('Multi-Case Diagnostic Discrimination Test');
  console.log('====================================================');

  const provider = new DeterministicClinicalProvider();

  // ── Case 1: Acute Coronary Syndrome (Chest Pain Patient) ──
  console.log('\n--- TEST CASE 1: Acute Coronary Syndrome Patient ---');
  const acsInput: ReasoningInput = {
    caseId: 'case-acs',
    clinicalSummary: '62-year-old female presenting with crushing substernal chest pain radiating to left arm and jaw for 2 hours, with diaphoresis and nausea. No cough, clear lungs.',
    verifiedFindings: [
      { id: 'fnd-cp-1', category: 'symptom', label: 'Crushing substernal chest pain', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-cp-2', category: 'symptom', label: 'Diaphoresis and nausea', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-cp-3', category: 'observation', label: 'ECG: 2mm ST-segment elevation in leads V2-V5', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-cp-4', category: 'observation', label: 'Lungs: clear to auscultation bilaterally, no crackles, no wheezes', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
    ],
    investigationResults: [
      { id: 'lab-trop', testName: 'High-Sensitivity Troponin I', value: '3.42 ng/mL', status: 'FINAL', interpretation: 'CRITICAL' },
    ],
    existingHypotheses: [],
    retrievedEvidence: [],
    safetyContext: [],
    informationGaps: [],
    scope: { purpose: 'CASE_REVIEW', allowedOutputs: [], prohibitedOutputs: [] },
  };

  const acsAssessment = await provider.generateAssessment(acsInput);
  console.log('ACS Primary Hypothesis:', acsAssessment.hypotheses[0]?.label);
  console.log('ACS Summary:', acsAssessment.summary);
  const acsDoesNotContainCap = !acsAssessment.hypotheses[0]?.label.includes('Pneumonia') && !acsAssessment.summary.includes('Pneumonia');
  console.log('ACS Test Passed (No Pneumonia Seeded):', acsDoesNotContainCap ? 'PASSED ✅' : 'FAILED ❌');

  // Criteria test for ACS patient:
  const acsCriteria = evaluateOptimalCriteria({
    presentation: {
      title: 'Chest pain',
      historyOfPresentIllness: acsInput.clinicalSummary,
      pastMedicalHistory: '',
      physicalExamNotes: '',
    },
    observations: [
      {
        id: 'o-1',
        code: 'TROP',
        display: 'Troponin',
        value: '3.42',
        interpretation: 'CRITICAL',
        category: 'laboratory',
        observedAt: new Date().toISOString(),
        source: 'MANUAL',
        provenanceType: 'HUMAN_ENTERED',
        actorName: 'Dr. Physician',
        verificationStatus: 'VERIFIED',
      },
    ],
  });
  console.log('ACS Criteria Result (Should be null or non-pneumonia):', acsCriteria === null ? 'PASSED (Null as expected) ✅' : 'FAILED ❌');

  // ── Case 2: Acute Heart Failure Patient ──
  console.log('\n--- TEST CASE 2: Acute Heart Failure Patient ---');
  const hfInput: ReasoningInput = {
    caseId: 'case-hf',
    clinicalSummary: '74-year-old male with progressive dyspnea on exertion, orthopnea, bilateral lower-extremity pitting edema, and elevated JVP. Afebrile, no cough, no sputum.',
    verifiedFindings: [
      { id: 'fnd-hf-1', category: 'symptom', label: 'Progressive exertional dyspnea and orthopnea', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-hf-2', category: 'observation', label: 'Bilateral 3+ pitting lower extremity edema and raised JVP', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-hf-3', category: 'vital', label: 'Body Temperature', value: '36.8', unit: '°C', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
    ],
    investigationResults: [
      { id: 'lab-bnp', testName: 'NT-proBNP', value: '4,850 pg/mL', status: 'FINAL', interpretation: 'CRITICAL' },
    ],
    existingHypotheses: [],
    retrievedEvidence: [],
    safetyContext: [],
    informationGaps: [],
    scope: { purpose: 'CASE_REVIEW', allowedOutputs: [], prohibitedOutputs: [] },
  };

  const hfAssessment = await provider.generateAssessment(hfInput);
  console.log('HF Primary Hypothesis:', hfAssessment.hypotheses[0]?.label);
  console.log('HF Summary:', hfAssessment.summary);
  const hfDoesNotContainCap = !hfAssessment.hypotheses[0]?.label.includes('Pneumonia') && !hfAssessment.summary.includes('Pneumonia');
  console.log('HF Test Passed (No Pneumonia Seeded):', hfDoesNotContainCap ? 'PASSED ✅' : 'FAILED ❌');

  // ── Case 3: Actual Pneumonia Patient (CAP) ──
  console.log('\n--- TEST CASE 3: Actual Pneumonia Case (CAP) ---');
  const capInput: ReasoningInput = {
    caseId: 'case-cap',
    clinicalSummary: '58-year-old male presenting with progressive shortness of breath and productive yellowish cough for 4 days, fever for 3 days, crackles over the right lower lung field.',
    verifiedFindings: [
      { id: 'fnd-cap-1', category: 'symptom', label: 'Productive yellowish cough', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-cap-2', category: 'vital', label: 'Body Temperature', value: '39.1', unit: '°C', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-cap-3', category: 'vital', label: 'SpO2', value: '89', unit: '% on room air', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-cap-4', category: 'observation', label: 'Auscultation: crackles over right lower lung field', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-cap-5', category: 'imaging', label: 'Chest X-ray: right lower-lobe air-space opacity consistent with focal consolidation', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
    ],
    investigationResults: [
      { id: 'lab-wbc', testName: 'WBC', value: '17.2', interpretation: 'HIGH', status: 'FINAL' },
      { id: 'lab-crp', testName: 'CRP', value: 'Markedly elevated', interpretation: 'CRITICAL', status: 'FINAL' },
    ],
    existingHypotheses: [],
    retrievedEvidence: [],
    safetyContext: [],
    informationGaps: [],
    scope: { purpose: 'CASE_REVIEW', allowedOutputs: [], prohibitedOutputs: [] },
  };

  const capAssessment = await provider.generateAssessment(capInput);
  console.log('CAP Primary Hypothesis:', capAssessment.hypotheses[0]?.label);
  console.log('CAP Summary:', capAssessment.summary);
  const capCorrectlyIdentified = capAssessment.hypotheses[0]?.label.includes('Community-Acquired Pneumonia');
  console.log('CAP Test Passed (Correctly identified when findings present):', capCorrectlyIdentified ? 'PASSED ✅' : 'FAILED ❌');

  // ── Case 4: Acute Appendicitis (Test Case 004) ──
  console.log('\n--- TEST CASE 4: Acute Appendicitis (Test Case 004) ---');
  const appInput: ReasoningInput = {
    caseId: 'case-app',
    clinicalSummary: '24-year-old presenting with acute right lower quadrant abdominal pain, anorexia, McBurney point tenderness, and guarding. Clear breath sounds bilaterally, no chest discomfort.',
    verifiedFindings: [
      { id: 'fnd-app-1', category: 'symptom', label: 'Acute abdominal pain localized to right lower quadrant', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-app-2', category: 'symptom', label: 'Anorexia and localized guarding at McBurney point', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-app-3', category: 'vital', label: 'Body Temperature', value: '38.4', unit: '°C', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-app-4', category: 'vital', label: 'Blood Pressure', value: '118/76', unit: 'mmHg', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-app-5', category: 'vital', label: 'Heart Rate', value: '102', unit: 'bpm', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-app-6', category: 'vital', label: 'Respiratory Rate', value: '18', unit: '/min', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
      { id: 'fnd-app-7', category: 'observation', label: 'Ultrasound: non-compressible blind-ending tubular structure measuring 8.2mm, findings consistent with acute appendicitis', provenanceType: 'HUMAN_ENTERED', verificationStatus: 'VERIFIED' },
    ],
    investigationResults: [
      { id: 'lab-wbc', testName: 'WBC', value: '15.4', interpretation: 'HIGH', status: 'FINAL' },
      { id: 'lab-crp', testName: 'CRP', value: '88.0', interpretation: 'HIGH', status: 'FINAL' },
    ],
    existingHypotheses: [],
    retrievedEvidence: [],
    safetyContext: [],
    informationGaps: [],
    scope: { purpose: 'CASE_REVIEW', allowedOutputs: [], prohibitedOutputs: [] },
  };

  const appAssessment = await provider.generateAssessment(appInput);
  console.log('Appendicitis Primary Hypothesis:', appAssessment.hypotheses[0]?.label);
  console.log('Appendicitis Summary:', appAssessment.summary);

  const allMissing = appAssessment.hypotheses.flatMap((h) => h.missingInformation);
  console.log('Appendicitis Missing Info Items:', allMissing);

  // Check 1: No chest pain contamination
  const noChestPainContamination = !appAssessment.summary.toLowerCase().includes('chest pain');
  console.log('1. No Chest Pain Contamination:', noChestPainContamination ? 'PASSED ✅' : 'FAILED ❌');

  // Check 2: No repeat ultrasound recommended (already performed)
  const noRepeatUltrasound = !allMissing.some((m) => m.toLowerCase().includes('ultrasound of the appendix'));
  console.log('2. No Repeat Ultrasound (Already Completed):', noRepeatUltrasound ? 'PASSED ✅' : 'FAILED ❌');

  // Check 3: No troponin recommended
  const noTroponinRecommended = !allMissing.some((m) => m.toLowerCase().includes('troponin'));
  console.log('3. No Troponin Pathway:', noTroponinRecommended ? 'PASSED ✅' : 'FAILED ❌');

  // Check 4: qSOFA not flagged (RR=18, SBP=118, GCS=15)
  const noQsofaFlagged = !appAssessment.summary.toLowerCase().includes('qsofa criteria flagged') &&
    !appAssessment.hypotheses.some((h) => h.label.includes('Systemic Sepsis'));
  console.log('4. No False qSOFA / Sepsis Overcall:', noQsofaFlagged ? 'PASSED ✅' : 'FAILED ❌');

  // Check 5: No generic pan-cultures / serial lactate
  const noGenericPanCultures = !allMissing.some((m) => m.toLowerCase().includes('pan-culture') || m.toLowerCase().includes('serial serum lactate'));
  console.log('5. No Generic Pan-Cultures or Serial Lactate:', noGenericPanCultures ? 'PASSED ✅' : 'FAILED ❌');

  const appPassed = noChestPainContamination && noRepeatUltrasound && noTroponinRecommended && noQsofaFlagged && noGenericPanCultures;

  if (acsDoesNotContainCap && hfDoesNotContainCap && capCorrectlyIdentified && appPassed) {
    console.log('\n====================================================');
    console.log('ALL DISCRIMINATION & TEST CASE 004 TESTS PASSED! 🎉');
    console.log('====================================================');
  } else {
    throw new Error('Test validation failed');
  }
}

runMultiCaseTest().catch((e) => {
  console.error(e);
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.exit) {
    (globalThis as any).process.exit(1);
  }
});
