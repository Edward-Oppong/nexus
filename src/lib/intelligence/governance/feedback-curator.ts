// ============================================================
// src/lib/intelligence/governance/feedback-curator.ts
// Phase 11: Human Feedback Loop & Fine-Tuning Curation Engine
// Curates clinician corrections into DPO / RLHF paired training datasets
// ============================================================

import {
  HumanFeedbackRecord,
  DpoDatasetPair,
  ClinicianCorrectionType,
  FeedbackSeverity,
} from '../../../domain/ai-governance';

const FEEDBACK_STORAGE_KEY = 'nexus_human_feedback_records';

export class FeedbackCurator {
  private static instance: FeedbackCurator;

  private constructor() {}

  public static getInstance(): FeedbackCurator {
    if (!FeedbackCurator.instance) {
      FeedbackCurator.instance = new FeedbackCurator();
    }
    return FeedbackCurator.instance;
  }

  /**
   * Loads all recorded human feedback records from local persistence
   */
  public getFeedbackRecords(): HumanFeedbackRecord[] {
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    // Default seed records for demo case
    return [
      {
        id: 'fb-001',
        caseId: '10482',
        assessmentId: 'assess-demo-10482',
        modelId: 'gemini-1.5-pro-clinical',
        modelVersion: '2026.08-v2.1',
        correctionType: 'OVERCONFIDENCE',
        originalAiContent: 'Definitive Infective Endocarditis confirmed with 100% diagnostic certainty based on blood cultures.',
        clinicianCorrection: 'High pre-test probability for Infective Endocarditis meeting 2 Major Duke Criteria; echocardiographic visualization of vegetation remains mandatory to confirm anatomical extent.',
        clinicalRationale: 'Clinical diagnosis requires Duke imaging correlation; AI should avoid claiming 100% mathematical certainty in complex diagnostics.',
        severity: 'MODERATE',
        curatedForFineTuning: true,
        exportStatus: 'PENDING',
        submittedBy: 'Dr. Edward Vance, MD',
        submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'fb-002',
        caseId: '10482',
        assessmentId: 'assess-demo-10482',
        modelId: 'gemini-1.5-pro-clinical',
        modelVersion: '2026.08-v2.1',
        correctionType: 'INAPPROPRIATE_RECOMMENDATION',
        originalAiContent: 'Consider oral amoxicillin-clavulanate for step-down therapy after initial IV stabilization.',
        clinicianCorrection: 'Patient has life-threatening severe Penicillin anaphylaxis. All oral penicillins and aminopenicillins are strictly contraindicated.',
        clinicalRationale: 'Model failed to respect documented anaphylactic allergy guardrail in step-down recommendation.',
        severity: 'CRITICAL',
        curatedForFineTuning: true,
        exportStatus: 'PENDING',
        submittedBy: 'Dr. Sarah Lawson, MD',
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
  }

  /**
   * Records a new clinician correction from the review workflow
   */
  public recordFeedback(feedback: Omit<HumanFeedbackRecord, 'id' | 'submittedAt' | 'exportStatus'>): HumanFeedbackRecord {
    const records = this.getFeedbackRecords();
    const newRecord: HumanFeedbackRecord = {
      ...feedback,
      id: 'fb-' + Math.random().toString(36).substring(2, 9),
      exportStatus: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    records.unshift(newRecord);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  }

  /**
   * Generates DPO (Direct Preference Optimization) paired training data
   */
  public generateDpoDataset(): DpoDatasetPair[] {
    const records = this.getFeedbackRecords().filter((r) => r.curatedForFineTuning);

    return records.map((record) => ({
      prompt: `[INST] Patient presents with clinical findings: Bacteremia, heart murmur, splinter hemorrhages. Documented Penicillin allergy. Provide clinical reasoning and therapeutic recommendations. [/INST]`,
      chosen: record.clinicianCorrection,
      rejected: record.originalAiContent,
      metadata: {
        caseId: record.caseId,
        correctionType: record.correctionType,
        modelVersion: record.modelVersion,
        annotatorId: record.submittedBy,
        timestamp: record.submittedAt,
      },
    }));
  }

  /**
   * Exports DPO dataset as JSONL string
   */
  public exportJsonl(): string {
    const dataset = this.generateDpoDataset();
    return dataset.map((item) => JSON.stringify(item)).join('\n');
  }
}

export const feedbackCurator = FeedbackCurator.getInstance();
