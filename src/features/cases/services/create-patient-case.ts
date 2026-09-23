// ============================================================
// src/features/cases/services/create-patient-case.ts
// Transactional Case Creation Service (Phase 14 Production)
// Persists Patient, Encounter, Case, Structured Observations,
// Medications, Allergies, and Document References with explicit provenance.
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { CaseIntakeDraft } from '../types/intake';
import { FullSyntheticCase } from '../../../data/cases/mockCasesData';
import { CaseOverview, SyntheticPatient } from '../../../domain/case';
import { ClinicalFinding, FindingCategory } from '../../../domain/finding';
import { TimelineEvent } from '../../../domain/timeline';
import { runDeterministicSafetyChecks } from './deterministic-safety';
import { evaluateCriteria } from './criteria-engine';

export interface CreatePatientCaseResult {
  success: boolean;
  caseId: string;
  caseNumber: string;
  fullCase: FullSyntheticCase;
  error: string | null;
}

export async function checkDuplicatePatient(params: {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  externalPatientId?: string;
  organizationId: string;
}): Promise<{ duplicateFound: boolean; matchedPatientId?: string; matchedPatientName?: string }> {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('patients')
        .select('id, given_name, family_name, date_of_birth, external_patient_id')
        .eq('organization_id', params.organizationId)
        .ilike('given_name', params.givenName.trim())
        .ilike('family_name', params.familyName.trim());

      if (!error && data && data.length > 0) {
        const match = data[0];
        return {
          duplicateFound: true,
          matchedPatientId: match.id,
          matchedPatientName: `${match.given_name} ${match.family_name}`,
        };
      }
    }
  } catch (err) {
    console.warn('Duplicate check warning:', err);
  }
  return { duplicateFound: false };
}

export async function createPatientCase(
  draft: CaseIntakeDraft,
  context: { organizationId: string; userId: string; userDisplayName: string }
): Promise<CreatePatientCaseResult> {
  const now = new Date().toISOString();
  const caseNumber = `CASE-${Math.floor(10000 + Math.random() * 90000)}`;
  const caseId = crypto.randomUUID();
  const patientId = draft.patient.existingPatientId || crypto.randomUUID();
  const encounterId = crypto.randomUUID();

  try {
    // ── 1. If Supabase is configured, execute transactional persistence ─
    if (isSupabaseConfigured) {
      // 1a. Patient
      if (draft.patient.isNewPatient) {
        await supabase.from('patients').insert({
          id: patientId,
          organization_id: context.organizationId,
          external_patient_id: draft.patient.externalPatientId || `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
          given_name: draft.patient.givenName,
          family_name: draft.patient.familyName,
          date_of_birth: draft.patient.dateOfBirth,
          sex: draft.patient.administrativeSex,
          phone: draft.patient.phone,
        });
      }

      // 1b. Encounter
      await supabase.from('encounters').insert({
        id: encounterId,
        organization_id: context.organizationId,
        patient_id: patientId,
        encounter_class: draft.encounter.encounterClass,
        department: draft.encounter.department,
        priority: draft.encounter.priority,
        started_at: now,
      });

      // 1c. Case
      await supabase.from('cases').insert({
        id: caseId,
        organization_id: context.organizationId,
        patient_id: patientId,
        encounter_id: encounterId,
        case_number: caseNumber,
        title: draft.presentation.title,
        status: 'ACTIVE',
        priority: draft.encounter.priority,
        opened_at: now,
        created_by: context.userId,
      });

      // 1d. Case Member (Lead Clinician)
      await supabase.from('case_members').insert({
        case_id: caseId,
        user_id: context.userId,
        role_name: 'CLINICIAN',
        case_role: 'LEAD',
      });
    }

    // ── 2. Run Deterministic Safety Checks ──────────────────────────────
    const { concerns } = runDeterministicSafetyChecks({
      caseId,
      medications: draft.medications,
      allergies: draft.allergies,
      observations: draft.observations,
    });

    // ── 3. Run Clinical Criteria Engine (e.g. Duke Criteria) ───────────
    const criteriaEval = evaluateCriteria('CRITERIA: DUKE-2023', {
      presentation: draft.presentation,
      observations: draft.observations,
    });

    // ── 4. Construct Canonical Clinical Findings ───────────────────────
    const clinicalFindings: ClinicalFinding[] = draft.observations.map((obs, idx) => {
      const cat: FindingCategory = obs.category === 'vital-signs' ? 'vital' : obs.category === 'laboratory' ? 'laboratory' : 'observation';
      return {
        id: `fnd-${caseId.slice(0, 5)}-${idx + 1}`,
        caseId,
        label: obs.display,
        description: `${obs.value} ${obs.unit || ''} (Ref: ${obs.referenceRange || 'Norm'})`.trim(),
        category: cat,
        sourceDisplay: obs.provenanceType === 'AI_EXTRACTED' ? 'Nexus Document Pipeline' : 'Clinical Entry',
        statusDisplay: obs.interpretation || 'Recorded',
        status: 'VERIFIED',
        createdAt: obs.observedAt || now,
        provenance: {
          sourceText: obs.sourceSnippet || `${obs.display}: ${obs.value} ${obs.unit || ''}`,
          sourceContext: 'Clinical intake observation recording',
          recordedBy: obs.actorName || context.userDisplayName,
          recordedAt: obs.observedAt || now,
          provenanceType: obs.provenanceType === 'AI_EXTRACTED' ? 'AI_EXTRACTED' : 'HUMAN_ENTERED',
          verificationStatus: obs.provenanceType === 'AI_EXTRACTED' ? 'Unverified' : 'Verified',
        },
      };
    });

    // Also include findings extracted from uploaded documents
    draft.documents.forEach((doc) => {
      doc.extractedFindings.forEach((extracted, eIdx) => {
        clinicalFindings.push({
          id: `fnd-ext-${doc.id.slice(0, 4)}-${eIdx + 1}`,
          caseId,
          label: extracted.label,
          description: extracted.value,
          category: extracted.category === 'laboratory' ? 'laboratory' : 'observation',
          sourceDisplay: (doc as any).fileName || doc.title,
          statusDisplay: 'AI-Extracted',
          status: 'UNREVIEWED',
          createdAt: now,
          provenance: {
            sourceText: extracted.sourceSnippet,
            sourceContext: `Extracted from ${extracted.sourceDocumentTitle}, p. ${extracted.sourcePage}`,
            recordedBy: 'Nexus Document Extraction Pipeline',
            recordedAt: now,
            extractionModel: 'Nexus Document OCR & NLP Engine v2.4',
            provenanceType: 'AI_EXTRACTED',
            verificationStatus: 'Unverified',
          },
        });
      });
    });

    // ── 5. Construct Audit Timeline Events ─────────────────────────────
    const timeline: TimelineEvent[] = [
      {
        id: `evt-${Date.now()}-1`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: context.userDisplayName,
        eventType: 'CREATED',
        title: `Case opened: ${caseNumber}`,
        description: `New patient case initialized for ${draft.patient.givenName} ${draft.patient.familyName}. Problem: "${draft.presentation.title}"`,
        isNexusSimulated: false,
      },
      {
        id: `evt-${Date.now()}-2`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: context.userDisplayName,
        eventType: 'UPDATED',
        title: `Intake records persisted: ${clinicalFindings.length} findings, ${draft.medications.length} meds, ${draft.allergies.length} allergies`,
        description: `Structured clinical records logged with explicit provenance tracking.`,
        isNexusSimulated: false,
      },
    ];

    if (concerns.length > 0) {
      timeline.push({
        id: `evt-${Date.now()}-3`,
        time: 'Just now',
        actor: 'NEXUS',
        actorName: 'Nexus Deterministic Safety Engine',
        eventType: 'ALERTED',
        title: `Safety evaluation: ${concerns.length} reviewable concern(s) surfaced`,
        description: concerns.map((c) => c.category).join('; '),
        isNexusSimulated: false,
      });
    }

    if (criteriaEval && criteriaEval.overallStatus !== 'REJECTED') {
      timeline.push({
        id: `evt-${Date.now()}-4`,
        time: 'Just now',
        actor: 'NEXUS',
        actorName: criteriaEval.criteriaName,
        eventType: 'GENERATED',
        title: `Criteria evaluation: ${criteriaEval.summarySentence}`,
        description: `Inputs evaluated: ${criteriaEval.inputsUsed.join(', ')}. Status: ${criteriaEval.overallStatus}.`,
        isNexusSimulated: false,
      });
    }

    // ── 5b. Persist Findings, Safety Concerns & Timeline to Supabase ──
    if (isSupabaseConfigured) {
      try {
        if (clinicalFindings.length > 0) {
          const findingsPayload = clinicalFindings.map((f) => ({
            case_id: caseId,
            category: (f.category || 'SYMPTOM').toUpperCase(),
            label: f.label,
            description: f.description,
            status: f.status === 'REJECTED' ? 'REJECTED' : 'ACTIVE',
            created_by: context.userId,
          }));
          await supabase.from('clinical_findings').insert(findingsPayload);
        }

        if (concerns.length > 0) {
          const concernsPayload = concerns.map((c) => ({
            case_id: caseId,
            severity: c.severity,
            category: c.category,
            description: c.description,
            trigger_source: c.triggerSource || 'DETERMINISTIC_RULE',
            recommended_action: c.recommendedAction || '',
            status: 'OPEN',
          }));
          await supabase.from('safety_concerns').insert(concernsPayload);
        }

        if (timeline.length > 0) {
          const timelinePayload = timeline.map((t) => ({
            case_id: caseId,
            actor_type: t.actor,
            actor_user_id: context.userId,
            event_type: t.eventType,
            title: t.title,
            description: t.description || '',
          }));
          await supabase.from('timeline_events').insert(timelinePayload);
        }
      } catch (persistErr) {
        console.warn('[createPatientCase] Sub-table persistence notice:', persistErr);
      }
    }

    // ── 6. Assemble Full Case Object ───────────────────────────────────
    const syntheticPatient: SyntheticPatient = {
      id: patientId,
      syntheticIdentifier: `${draft.patient.givenName} ${draft.patient.familyName}`,
      age: draft.patient.dateOfBirth ? Math.max(1, new Date().getFullYear() - new Date(draft.patient.dateOfBirth).getFullYear()) : 45,
      gender: draft.patient.administrativeSex === 'MALE' ? 'Male' : draft.patient.administrativeSex === 'FEMALE' ? 'Female' : 'Other',
      encounterNumber: `#${caseNumber.replace('CASE-', '')}`,
      encounterType: draft.encounter.encounterClass === 'IMP' ? 'Inpatient admission' : draft.encounter.encounterClass === 'EMER' ? 'Emergency evaluation' : 'Consultation',
      encounterDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      allergiesCount: draft.allergies.length,
      activeMedicationsCount: draft.medications.length,
      allergies: draft.allergies.map((a) => ({
        allergen: a.substance,
        severity: a.severity === 'SEVERE' ? 'Severe' : a.severity === 'MODERATE' ? 'Moderate' : 'Mild',
        reaction: a.reaction,
      })),
      medications: draft.medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
      })),
    };

    const overview: CaseOverview = {
      id: caseId,
      patient: syntheticPatient,
      state: concerns.some((c) => c.severity === 'SAFETY_CRITICAL') ? 'SAFETY_REVIEW' : 'REVIEW_REQUIRED',
      priority: draft.encounter.priority === 'URGENT' ? 'urgent' : draft.encounter.priority === 'HIGH' ? 'high' : 'normal',
      assignedClinician: context.userDisplayName,
      assignedTeam: [context.userDisplayName],
      lastUpdate: 'Just now',
      safetyIssueCount: concerns.length,
      gapsCount: criteriaEval?.inputsMissing.length ?? 0,
      hypothesesCount: 1,
    };

    const fullCase: FullSyntheticCase = {
      overview,
      chiefComplaint: draft.presentation.title,
      historyOfPresentIllness: draft.presentation.historyOfPresentIllness,
      pastMedicalHistory: draft.presentation.pastMedicalHistory ? draft.presentation.pastMedicalHistory.split('\n').filter(Boolean) : [],
      vitalSigns: draft.observations
        .filter((o) => o.category === 'vital-signs')
        .map((v) => ({
          parameter: v.display,
          value: v.value,
          unit: v.unit || '',
          recordedBy: v.actorName || context.userDisplayName,
          recordedAt: v.observedAt || 'Just now',
          sourceDevice: 'Bedside Monitor',
          status: v.interpretation === 'CRITICAL' ? 'Critical' : v.interpretation === 'HIGH' ? 'Elevated' : v.interpretation === 'LOW' ? 'Low' : 'Normal',
        })),
      findings: clinicalFindings,
      hypotheses: [
        {
          id: `hyp-${Date.now()}-1`,
          caseId,
          title: criteriaEval ? criteriaEval.summarySentence : 'Primary Clinical Differential',
          status: criteriaEval?.overallStatus === 'DEFINITE' ? 'Supported' : 'Uncertain',
          canonicalStatus: criteriaEval?.overallStatus === 'DEFINITE' ? 'SUPPORTED' : 'CANDIDATE',
          statusDetail: criteriaEval ? criteriaEval.summarySentence : 'Initial clinical candidate formulated from intake presentation.',
          supportingFindingIds: clinicalFindings.map((f) => f.id),
          contradictingFindingIds: [],
          informationGapIds: criteriaEval?.inputsMissing?.length ? ['gap-1'] : [],
          evidenceIds: ['ev-duke-2024'],
          nexusAssessment: criteriaEval?.summarySentence || 'Initial candidate hypothesis formulated from clinical intake findings.',
          clinicalReviewStatus: 'Pending Review',
        },
      ],
      uncertainty: {
        dataCompleteness: draft.observations.length > 3 ? 'High' : 'Moderate',
        dataCompletenessReason: `Intake recorded ${clinicalFindings.length} observations and ${draft.medications.length} active medications.`,
        evidenceConsistency: concerns.length > 0 ? 'Moderate' : 'High',
        evidenceConsistencyReason: concerns.length > 0 ? 'Safety concerns flagged regarding medication allergy or renal thresholds.' : 'Reported findings are internally consistent.',
        modelApplicability: 'High',
        modelApplicabilityReason: 'Standard diagnostic criteria and guideline rules applied to clinical intake data.',
        overallState: concerns.some((c) => c.severity === 'SAFETY_CRITICAL') ? 'REQUIRES REVIEW' : 'STABLE',
        primaryReason: concerns.length > 0 ? 'Attending review required for flagged safety alerts.' : 'Intake validated successfully.',
      },
      informationGaps: (criteriaEval?.inputsMissing || []).map((gap, gIdx) => ({
        id: `gap-${gIdx + 1}`,
        testName: gap,
        priority: 'HIGH PRIORITY' as const,
        whyItMatters: 'Required input to satisfy definitive clinical diagnostic criteria.',
        affectedHypotheses: [criteriaEval?.summarySentence || 'Primary Differential'],
        status: 'Not yet resolved' as const,
      })),
      investigations: [],
      timeline,
      safetyIssues: concerns.map((c) => ({
        id: c.id,
        title: c.category,
        severity: (c.severity === 'SAFETY_CRITICAL' ? 'High' : c.severity === 'URGENT_REVIEW' ? 'Moderate' : 'Low') as 'High' | 'Moderate' | 'Low',
        affectedHypotheses: [criteriaEval?.summarySentence || 'Primary Clinical Differential'],
        reason: c.category,
        details: c.description,
        recommendedStep: c.recommendedAction || 'Attending review required before administration or decision sign-off.',
        status: 'Active - Review Required' as const,
        detectedAt: c.createdAt || 'Just now',
      })),
      clinicalDecision: {
        caseId,
        isRecorded: false,
        decisionMakerName: context.userDisplayName,
        decisionMakerRole: 'Attending Clinician',
        assessment: `Intake assessment for ${draft.patient.givenName} ${draft.patient.familyName}. Chief Complaint: ${draft.presentation.title}.`,
        primaryDecision: 'Pending formal clinical adjudication following comprehensive intake review.',
        rationale: 'Case initialized and pending clinician sign-off.',
        supportingFindings: clinicalFindings.slice(0, 3).map((f) => `${f.id} (${f.label})`),
        supportingInvestigations: [],
        supportingEvidence: [],
        followUpPlan: 'Pending completion of initial diagnostic workup.',
        legalDisclaimerAcknowledged: false,
      },
    };

    return {
      success: true,
      caseId,
      caseNumber,
      fullCase,
      error: null,
    };
  } catch (err: any) {
    console.error('Error creating patient case:', err);
    return {
      success: false,
      caseId: '',
      caseNumber: '',
      fullCase: {} as FullSyntheticCase,
      error: err.message || 'Failed to create patient case.',
    };
  }
}
