// ============================================================
// src/features/cases/api/getCaseDetail.ts
// Hydrates complete clinical case from Supabase PostgreSQL tables
// (cases, patients, clinical_findings, investigations,
// hypotheses, audit_events / timeline)
// Falls back to synthetic registry if unauthenticated or offline.
// ============================================================

import { supabase, isSupabaseConfigured } from '../../../lib/supabase/client';
import { FullSyntheticCase, MOCK_FULL_CASES_REGISTRY, SYNTHETIC_CASE_10482 } from '../../../data/cases/mockCasesData';
import { CaseOverview, SyntheticPatient } from '../../../domain/case';
import { ClinicalFinding, FindingCategory, VerificationStatus, FindingProvenance } from '../../../domain/finding';
import { CandidateHypothesis, HypothesisStatus } from '../../../domain/hypothesis';
import { InvestigationOrder, InvestigationStatus } from '../../../domain/investigation';
import { TimelineEvent } from '../../../domain/timeline';

export async function getCaseDetail(caseId: string): Promise<FullSyntheticCase> {
  // If Supabase is not configured, resolve from registry
  if (!isSupabaseConfigured) {
    return MOCK_FULL_CASES_REGISTRY[caseId] || SYNTHETIC_CASE_10482;
  }

  try {
    // 1. Fetch Case Row
    const { data: caseRow, error: caseErr } = await supabase
      .from('cases')
      .select('*, patient:patients(*)')
      .eq('id', caseId)
      .maybeSingle();

    if (caseErr || !caseRow) {
      console.warn(`[getCaseDetail] Supabase case query failed for ${caseId}, using local fallback:`, caseErr?.message);
      return MOCK_FULL_CASES_REGISTRY[caseId] || SYNTHETIC_CASE_10482;
    }

    const patient = caseRow.patient || {};

    // 2. Fetch Clinical Findings
    const { data: findingsRows } = await supabase
      .from('clinical_findings')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    // 3. Fetch Investigations
    const { data: invRows } = await supabase
      .from('investigations')
      .select('*')
      .eq('case_id', caseId)
      .order('requested_at', { ascending: false });

    // 4. Fetch Hypotheses
    const { data: hypRows } = await supabase
      .from('hypotheses')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    // 5. Fetch Timeline / Audit Events
    const { data: timelineRows } = await supabase
      .from('audit_events')
      .select('*')
      .eq('case_id', caseId)
      .order('recorded_at', { ascending: false });

    // Build SyntheticPatient shape from DB patient row
    const syntheticPatient: SyntheticPatient = {
      id: patient.id || `pat-${caseId}`,
      syntheticIdentifier: patient.mrn || 'Clinical Patient',
      age: patient.age || 58,
      gender: (patient.sex || patient.gender || 'Female') as 'Female' | 'Male' | 'Other',
      encounterNumber: `#${caseRow.case_number || caseId.slice(0, 6)}`,
      encounterType: 'Inpatient admission',
      encounterDate: caseRow.opened_at
        ? new Date(caseRow.opened_at).toLocaleDateString()
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
      safetyIssueCount: 0,
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
    const investigations: InvestigationOrder[] = (invRows || []).map((row: any): InvestigationOrder => ({
      id: row.id,
      caseId: row.case_id,
      testName: row.test_name || row.name || 'Ordered Test',
      category: (row.category === 'LABORATORY' ? 'Laboratory'
        : row.category === 'IMAGING' ? 'Imaging'
        : row.category === 'CARDIOVASCULAR' ? 'Cardiovascular'
        : row.category === 'MICROBIOLOGY' ? 'Microbiology'
        : 'Laboratory') as 'Laboratory' | 'Imaging' | 'Cardiovascular' | 'Microbiology',
      priority: (row.priority === 'STAT' ? 'Stat'
        : row.priority === 'URGENT' ? 'Urgent'
        : 'Routine') as 'Stat' | 'Urgent' | 'Routine',
      requestedBy: row.requested_by || 'Attending Clinician',
      requestedAt: row.requested_at || row.created_at,
      clinicalIndication: row.indication || row.clinical_indication || 'Clinical investigation',
      status: (row.status as InvestigationStatus) || 'Requested',
    }));

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
      clinicalReviewStatus: 'Pending Review',
    }));

    // Map Timeline Events
    const timeline: TimelineEvent[] = (timelineRows || []).map((row: any): TimelineEvent => ({
      id: row.id,
      time: row.recorded_at ? new Date(row.recorded_at).toLocaleTimeString() : 'Recent',
      actor: row.action_type || 'SYSTEM',
      actorName: row.user_display_name || 'Clinician',
      eventType: row.event_type || 'UPDATED',
      title: row.summary || row.action || 'Clinical event recorded',
      description: row.description || '',
      isNexusSimulated: false,
    }));

    // Merge with base fallback to keep workstation-compatible structure
    const baseFallback = MOCK_FULL_CASES_REGISTRY[caseId] || SYNTHETIC_CASE_10482;

    return {
      ...baseFallback,
      overview,
      findings: findings.length > 0 ? findings : baseFallback.findings,
      investigations: investigations.length > 0 ? investigations : baseFallback.investigations,
      hypotheses: hypotheses.length > 0 ? hypotheses : baseFallback.hypotheses,
      timeline: timeline.length > 0 ? timeline : baseFallback.timeline,
    };
  } catch (err) {
    console.error(`[getCaseDetail] Exception querying Supabase:`, err);
    return MOCK_FULL_CASES_REGISTRY[caseId] || SYNTHETIC_CASE_10482;
  }
}
