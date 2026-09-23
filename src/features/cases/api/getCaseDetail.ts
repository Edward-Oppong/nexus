// ============================================================
// src/features/cases/api/getCaseDetail.ts
// Hydrates complete clinical case from Supabase PostgreSQL tables
// (cases, patients, clinical_findings, investigations,
// hypotheses, audit_events / timeline)
// Falls back to synthetic registry if unauthenticated or offline.
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { FullSyntheticCase, EMPTY_CASE, MOCK_FULL_CASES_REGISTRY, SYNTHETIC_CASE_10482 } from '../../../data/cases/mockCasesData';
import { CaseOverview, SyntheticPatient } from '../../../domain/case';
import { ClinicalFinding, FindingCategory, VerificationStatus, FindingProvenance } from '../../../domain/finding';
import { CandidateHypothesis, HypothesisStatus } from '../../../domain/hypothesis';
import { InvestigationOrder, InvestigationStatus } from '../../../domain/investigation';
import { TimelineEvent } from '../../../domain/timeline';

export async function getCaseDetail(caseId: string): Promise<FullSyntheticCase> {
  // Check if case was deleted
  try {
    const deletedIds: string[] = JSON.parse(localStorage.getItem('nexus_deleted_cases') || '[]');
    if (deletedIds.includes(caseId)) {
      return EMPTY_CASE;
    }
  } catch {
    // ignore
  }

  // If Supabase is not configured, return full synthetic case from registry
  if (!isSupabaseConfigured) {
    return MOCK_FULL_CASES_REGISTRY[caseId] || EMPTY_CASE;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId);

    // 1. Fetch Case Row by ID or case_number
    let query = supabase.from('cases').select('*, patient:patients(*)');
    if (isUuid) {
      query = query.eq('id', caseId);
    } else {
      const formattedCaseNumber = caseId.startsWith('CASE-') ? caseId : `CASE-${caseId}`;
      query = query.eq('case_number', formattedCaseNumber);
    }

    const { data: caseRows, error: caseErr } = await query.limit(1);

    if (caseErr || !caseRows || caseRows.length === 0) {
      console.warn(`[getCaseDetail] Supabase case query failed for ${caseId}, trying mock fallback:`, caseErr?.message);
      return MOCK_FULL_CASES_REGISTRY[caseId] || EMPTY_CASE;
    }

    const caseRow = caseRows[0];
    const realCaseId = caseRow.id;
    const patient = caseRow.patient || {};

    // 2. Fetch Clinical Findings, Investigations, Hypotheses, Timeline, Safety Concerns, Decisions concurrently
    const [
      { data: findingsRows },
      { data: invRows },
      { data: hypRows },
      { data: timelineRows },
      { data: safetyRows },
      { data: decisionRows },
    ] = await Promise.all([
      supabase.from('clinical_findings').select('*').eq('case_id', realCaseId).order('created_at', { ascending: false }),
      supabase.from('investigations').select('*').eq('case_id', realCaseId).order('requested_at', { ascending: false }),
      supabase.from('hypotheses').select('*').eq('case_id', realCaseId).order('created_at', { ascending: false }),
      supabase.from('timeline_events').select('*').eq('case_id', realCaseId).order('occurred_at', { ascending: false }),
      supabase.from('safety_concerns').select('*').eq('case_id', realCaseId).order('created_at', { ascending: false }),
      supabase.from('decisions').select('*').eq('case_id', realCaseId).order('recorded_at', { ascending: false }),
    ]);

    // Calculate real patient age if dateOfBirth is present
    let patientAge = 58;
    if (patient.date_of_birth) {
      const birthYear = new Date(patient.date_of_birth).getFullYear();
      if (!isNaN(birthYear)) {
        patientAge = Math.max(1, new Date().getFullYear() - birthYear);
      }
    }

    const patientFullName = `${patient.given_name || ''} ${patient.family_name || ''}`.trim();
    const patientIdentifier = patientFullName || patient.external_patient_id || 'Clinical Patient';
    const patientGender = patient.sex === 'M' || patient.sex === 'MALE' ? 'Male' : patient.sex === 'F' || patient.sex === 'FEMALE' ? 'Female' : 'Other';

    // Build SyntheticPatient shape from DB patient row
    const syntheticPatient: SyntheticPatient = {
      id: patient.id || `pat-${realCaseId}`,
      syntheticIdentifier: patientIdentifier,
      age: patientAge,
      gender: patientGender,
      encounterNumber: `#${caseRow.case_number || realCaseId.slice(0, 6)}`,
      encounterType: 'Inpatient admission',
      encounterDate: caseRow.opened_at
        ? new Date(caseRow.opened_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Recently',
      allergiesCount: 0,
      activeMedicationsCount: 0,
      allergies: [],
      medications: [],
    };

    // Map Case Overview
    const overview: CaseOverview = {
      id: caseRow.id,
      patient: syntheticPatient,
      state: (caseRow.status || 'ACTIVE') as any,
      priority: ((caseRow.priority?.toLowerCase() || 'high') as any),
      assignedClinician: 'Attending Clinician',
      assignedTeam: ['Attending Clinician (Lead)'],
      lastUpdate: 'Recently',
      safetyIssueCount: (safetyRows || []).filter((s: any) => s.status !== 'RESOLVED').length,
      gapsCount: 0,
      hypothesesCount: (hypRows || []).length,
    };

    // Map Findings — align with ClinicalFinding interface
    const findings: ClinicalFinding[] = (findingsRows || []).map((row: any): ClinicalFinding => {
      const provenance: FindingProvenance = {
        sourceContext: row.source_context || 'Clinical record',
        recordedBy: row.created_by || 'Clinician',
        recordedAt: row.created_at || new Date().toISOString(),
        provenanceType: 'Human-entered',
        verificationStatus: (row.verified_by ? 'Verified' : 'Unverified') as VerificationStatus,
      };

      return {
        id: row.id,
        caseId: row.case_id,
        category: (row.category as FindingCategory) || 'SYMPTOM',
        label: row.label || 'Clinical finding',
        description: row.description || row.label,
        provenance,
        status: row.status === 'REJECTED' ? 'REJECTED' : row.status === 'VERIFIED' ? 'VERIFIED' : 'UNREVIEWED',
        verifiedBy: row.verified_by || undefined,
        verifiedAt: row.verified_at || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    // Map Investigations — align with InvestigationOrder interface
    const investigations: InvestigationOrder[] = (invRows || []).map((row: any): InvestigationOrder => {
      const cat = (row.investigation_type?.toUpperCase().includes('SCAN') || row.investigation_type?.toUpperCase().includes('CT') || row.investigation_type?.toUpperCase().includes('X-RAY') || row.investigation_type?.toUpperCase().includes('ECHO'))
        ? 'Imaging'
        : (row.investigation_type?.toUpperCase().includes('ECG') || row.investigation_type?.toUpperCase().includes('CARDIO'))
        ? 'Cardiovascular'
        : (row.investigation_type?.toUpperCase().includes('CULTURE') || row.investigation_type?.toUpperCase().includes('MICRO'))
        ? 'Microbiology'
        : 'Laboratory';

      const prio = (row.priority?.toUpperCase() === 'STAT' ? 'Stat'
        : row.priority?.toUpperCase() === 'URGENT' ? 'Urgent'
        : 'Routine') as 'Stat' | 'Urgent' | 'Routine';

      const stat = (row.status?.toUpperCase() === 'COMPLETED' ? 'Completed'
        : row.status?.toUpperCase() === 'SCHEDULED' ? 'Scheduled'
        : row.status?.toUpperCase() === 'IN_PROGRESS' ? 'In Progress'
        : row.status?.toUpperCase() === 'CANCELLED' ? 'Cancelled'
        : 'Requested') as InvestigationStatus;

      return {
        id: row.id,
        caseId: row.case_id,
        testName: row.investigation_type || row.test_name || 'Ordered Investigation',
        category: cat,
        priority: prio,
        requestedBy: row.requested_by_name || 'Attending Clinician',
        requestedAt: row.requested_at ? new Date(row.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        clinicalIndication: row.reason || row.clinical_indication || 'Clinical investigation',
        status: stat,
      };
    });

    // Map Hypotheses — align with CandidateHypothesis interface
    const hypotheses: CandidateHypothesis[] = (hypRows || []).map((row: any): CandidateHypothesis => ({
      id: row.id,
      caseId: row.case_id,
      title: row.label || row.title || 'Candidate Differential',
      status: (row.status === 'SUPPORTED' ? 'Supported'
        : row.status === 'CONTRADICTED' ? 'Contradicted'
        : 'Uncertain') as HypothesisStatus,
      statusDetail: row.rationale || 'Under evaluation by Nexus Clinical Reasoning Engine.',
      supportingFindingIds: [],
      contradictingFindingIds: [],
      informationGapIds: [],
      evidenceIds: [],
      rationale: row.rationale || 'Derived from clinical evidence presentation.',
      nexusAssessment: 'Pending adjudication by attending clinician.',
      clinicalReviewStatus: (row.status === 'SUPPORTED' ? 'Accepted' : row.status === 'CONTRADICTED' ? 'Rejected' : 'Pending Review') as any,
    }));

    // Map Timeline Events
    const timeline: TimelineEvent[] = (timelineRows || []).map((row: any): TimelineEvent => {
      let actor = 'SYSTEM' as any;
      if (row.actor_type?.toUpperCase().includes('CLINICIAN')) actor = 'CLINICIAN';
      else if (row.actor_type?.toUpperCase().includes('NURSE')) actor = 'NURSE';
      else if (row.actor_type?.toUpperCase().includes('NEXUS') || row.actor_type?.toUpperCase().includes('AI')) actor = 'NEXUS';
      else if (row.actor_type?.toUpperCase().includes('LAB')) actor = 'LAB';

      return {
        id: row.id,
        time: row.occurred_at
          ? new Date(row.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Recent',
        actor,
        actorName: row.actor_type || 'System',
        eventType: row.event_type || 'UPDATED',
        title: row.title || 'Clinical event recorded',
        description: row.description || '',
        isNexusSimulated: false,
      };
    });

    // Map Safety Issues
    const safetyIssues = (safetyRows || []).map((row: any) => ({
      id: row.id,
      title: row.category || 'Clinical Safety Alert',
      category: row.category || 'Clinical Hazard',
      description: row.description || '',
      severity: (row.severity === 'SAFETY_CRITICAL' ? 'High' : row.severity === 'URGENT_REVIEW' ? 'Moderate' : 'Low') as 'High' | 'Moderate' | 'Low',
      affectedHypotheses: [],
      reason: row.description || '',
      details: row.recommended_action || row.description || '',
      recommendedStep: row.recommended_action || 'Review clinical protocol',
      status: (row.status === 'RESOLVED' ? 'Resolved' : row.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Active - Review Required') as 'Active - Review Required' | 'Acknowledged' | 'Resolved',
      detectedAt: row.created_at ? new Date(row.created_at).toLocaleTimeString() : 'Recently',
      clinicalNote: row.clinical_notes || undefined,
    }));

    // Map Active Decision if recorded
    const latestDecision = decisionRows && decisionRows.length > 0 ? decisionRows[0] : null;
    const clinicalDecision = latestDecision
      ? {
          caseId: realCaseId,
          isRecorded: true,
          decisionMakerName: 'Attending Clinician',
          decisionMakerRole: 'Attending Physician',
          recordedAt: latestDecision.recorded_at ? new Date(latestDecision.recorded_at).toLocaleTimeString() : 'Recently',
          assessment: latestDecision.summary,
          primaryDecision: latestDecision.summary,
          rationale: latestDecision.rationale || '',
          supportingFindings: [],
          supportingInvestigations: [],
          supportingEvidence: [],
          followUpPlan: '',
          legalDisclaimerAcknowledged: latestDecision.legal_disclaimer_acknowledged ?? true,
        }
      : {
          ...EMPTY_CASE.clinicalDecision,
          caseId: realCaseId,
        };

    // Merge with EMPTY_CASE to maintain the full workstation-compatible shape
    return {
      ...EMPTY_CASE,
      overview,
      findings,
      investigations,
      hypotheses,
      timeline,
      safetyIssues,
      clinicalDecision,
      // Populate clinical narrative from real DB fields
      chiefComplaint: caseRow.title || EMPTY_CASE.chiefComplaint,
      historyOfPresentIllness: caseRow.notes || EMPTY_CASE.historyOfPresentIllness,
    };
  } catch (err) {
    console.error(`[getCaseDetail] Exception querying Supabase:`, err);
    return MOCK_FULL_CASES_REGISTRY[caseId] || SYNTHETIC_CASE_10482 || EMPTY_CASE;
  }
}
