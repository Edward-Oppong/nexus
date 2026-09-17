import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { createPatientCase } from '../../features/cases/services/create-patient-case';
import { CaseIntakeDraft } from '../../features/cases/types/intake';
import { runCaseAnalysis } from '../../features/cases/services/case-analysis';
import { FullSyntheticCase, SYNTHETIC_CASE_10482, MOCK_CASES_LIST, MOCK_FULL_CASES_REGISTRY } from '../../data/cases/mockCasesData';
import { useAuth, DEMO_ORGANIZATIONS } from '../../features/authentication/AuthProvider';
import {
  INITIAL_SAFETY_CONCERNS,
  INITIAL_REVIEW_QUEUE,
  INITIAL_DECISIONS,
  INITIAL_TASKS,
} from '../../data/cases/mockWorkflowData';
import { CaseOverview } from '../../domain/case';
import { VerificationStatus } from '../../domain/finding';
import { TimelineEvent } from '../../domain/timeline';
import { NexusAssessment, ReviewAction, NexusFindingStatus } from '../../domain/nexus-assessment';
import {
  SafetyConcern,
  SafetyConcernStatus,
  hasBlockingSafetyIssue,
  acknowledgeConcern,
  resolveConcern,
  ReviewItem,
  RejectReasonCategory,
  Decision,
  DecisionType,
  NewDecisionDraft,
  amendDecision,
  ClinicalTask,
  createClinicalTask,
  completeClinicalTask,
  cancelClinicalTask,
  ClinicalCaseStatus,
  canTransitionCase,
  TransitionCheckResult,
} from '../../domain/workflow';
import { runNexusAnalysis } from '../../lib/intelligence/reasoning-orchestrator';
import { testProvider, getDefaultReasoningProvider } from '../../lib/intelligence/reasoning-provider';
import { getCaseDetail } from '../../features/cases/api/getCaseDetail';
import { getCases } from '../../features/cases/api/getCases';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

export type MainView =
  | 'landing'
  | 'login'
  | 'overview'
  | 'cases'
  | 'case-workspace'
  | 'case-intake'
  | 'patients'
  | 'investigations'
  | 'tasks'
  | 'evidence-catalog'
  | 'administration'
  | 'review-queue'
  | 'ai-governance'
  | 'regulatory-compliance';

export type CaseSubTab =
  | 'summary'
  | 'clinical'
  | 'findings'
  | 'reasoning'
  | 'investigations'
  | 'evidence'
  | 'documents'
  | 'timeline'
  | 'team'
  | 'review'
  | 'decision'
  | 'safety'
  | 'rules';

export interface RegisterCaseOptions {
  runAnalysisImmediately: boolean;
  organizationId: string;
  userId: string;
  userDisplayName: string;
}

interface CaseContextType {
  activeView: MainView;
  setActiveView: (view: MainView) => void;
  activeCaseSubTab: CaseSubTab;
  setActiveCaseSubTab: (tab: CaseSubTab) => void;
  activeCase: FullSyntheticCase;
  casesList: CaseOverview[];
  openCaseById: (caseId: string, targetTab?: CaseSubTab) => void;
  registerCreatedCase: (draft: CaseIntakeDraft, options: RegisterCaseOptions) => Promise<{ success: boolean; error: string | null }>;

  // Findings & Investigations
  updateFindingStatus: (findingId: string, status: VerificationStatus, reason?: string, note?: string) => void;
  requestInvestigation: (
    testName: string,
    category: 'Laboratory' | 'Imaging' | 'Cardiovascular' | 'Microbiology',
    priority: 'Stat' | 'Urgent' | 'Routine',
    indication: string
  ) => void;

  // Phase 6F — Nexus Intelligence
  nexusAssessment: NexusAssessment | null;
  isRunningAnalysis: boolean;
  runNexusAnalysis: () => Promise<void>;
  reviewNexusFinding: (findingId: string, action: ReviewAction, revisedContent?: string, reason?: string) => void;
  supersedePreviousAssessment: () => void;

  // Phase 6G — Structured Safety Concerns & Interrupt
  safetyConcerns: SafetyConcern[];
  activeSafetyCriticalCount: number;
  hasBlockingSafety: boolean;
  acknowledgeSafetyConcern: (concernId: string, note?: string) => void;
  resolveSafetyConcern: (concernId: string, note: string) => void;
  resolveSafetyIssue: (issueId: string, note?: string) => void; // Backward compatibility

  // Phase 6G — Dedicated Review Queue
  reviewQueue: ReviewItem[];
  pendingReviewCount: number;
  adjudicateReviewItem: (
    itemId: string,
    action: ReviewAction,
    revisedContent?: string,
    reasonCategory?: RejectReasonCategory,
    reason?: string
  ) => void;

  // Phase 6G — Decisions & Amendment Chain (Immutability)
  decisions: Decision[];
  activeDecision: Decision | null;
  canRecordDecision: TransitionCheckResult;
  recordDecision: (draft: NewDecisionDraft) => void;
  amendActiveDecision: (amendment: {
    summary: string;
    rationale?: string;
    decisionType?: DecisionType;
    amendmentReason: string;
  }) => void;
  recordClinicalDecision: (assessment: string, decision: string, rationale: string, followUp: string) => void; // Backward compatibility

  // Phase 6G — Tasks
  tasks: ClinicalTask[];
  createTask: (draft: Omit<ClinicalTask, 'id' | 'createdAt' | 'status'>) => void;
  completeTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;

  // Phase 6G — Case State Machine
  transitionCaseStatus: (targetStatus: ClinicalCaseStatus) => TransitionCheckResult;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, activeOrganization } = useAuth();
  const [activeView, setActiveView] = useState<MainView>('case-workspace');
  const [activeCaseSubTab, setActiveCaseSubTab] = useState<CaseSubTab>('reasoning');
  const [activeCase, setActiveCase] = useState<FullSyntheticCase>(SYNTHETIC_CASE_10482);
  const [casesList, setCasesList] = useState<CaseOverview[]>(MOCK_CASES_LIST);

  // Derive the logged-in user's display name for audit events
  const activeUserDisplayName = profile?.fullName || 'Clinician';

  // Phase 6F: Nexus Assessment
  const [nexusAssessment, setNexusAssessment] = useState<NexusAssessment | null>(
    SYNTHETIC_CASE_10482.nexusAssessment ?? null
  );
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  // Phase 6G: Safety Concerns
  const [safetyConcerns, setSafetyConcerns] = useState<SafetyConcern[]>(INITIAL_SAFETY_CONCERNS);

  // Phase 6G: Review Queue
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>(INITIAL_REVIEW_QUEUE);

  // Phase 6G: Decisions
  const [decisions, setDecisions] = useState<Decision[]>(INITIAL_DECISIONS);

  // Phase 6G: Tasks
  const [tasks, setTasks] = useState<ClinicalTask[]>(INITIAL_TASKS);

  const activeDecision = useMemo(() => {
    return decisions.find((d) => d.caseId === activeCase.overview.id && d.status === 'ACTIVE') || null;
  }, [decisions, activeCase.overview.id]);

  const activeSafetyCriticalCount = useMemo(() => {
    return safetyConcerns.filter(
      (s) => s.caseId === activeCase.overview.id && s.severity === 'SAFETY_CRITICAL' && s.status !== 'RESOLVED'
    ).length;
  }, [safetyConcerns, activeCase.overview.id]);

  const hasBlockingSafety = useMemo(() => {
    return hasBlockingSafetyIssue(safetyConcerns.filter((s) => s.caseId === activeCase.overview.id));
  }, [safetyConcerns, activeCase.overview.id]);

  const pendingReviewCount = useMemo(() => {
    return reviewQueue.filter((r) => r.status === 'PENDING').length;
  }, [reviewQueue]);

  const canRecordDecision = useMemo<TransitionCheckResult>(() => {
    return canTransitionCase(
      activeCase.overview.state as ClinicalCaseStatus,
      'DECISION_RECORDED',
      {
        hasUnresolvedSafetyCritical: hasBlockingSafety,
        hasUnreviewedFindings: false,
        hasActiveDecision: !!activeDecision,
        hasPendingInvestigations: false,
      }
    );
  }, [activeCase.overview.state, hasBlockingSafety, activeDecision]);

  // Org ID is derived from the authenticated user's active organization.
  // Falls back to the demo org ID until auth has loaded.
  const activeOrganizationId = activeOrganization?.id ?? DEMO_ORGANIZATIONS[0].id;

  React.useEffect(() => {
    if (isSupabaseConfigured && profile) {
      const orgId = activeOrganizationId;
      getCases(orgId).then((dbCases) => {
        if (dbCases && dbCases.length > 0) {
          setCasesList(
            dbCases.map((c) => ({
              id: c.id,
              patient: {
                id: c.patientId || `pat-${c.id}`,
                syntheticIdentifier: 'Clinical Patient',
                age: 58,
                gender: 'Female',
                encounterNumber: `#${c.caseNumber}`,
                encounterType: 'Inpatient admission',
                encounterDate: 'Recently',
                allergiesCount: 0,
                activeMedicationsCount: 0,
                allergies: [],
                medications: [],
              },
              state: c.status as any,
              priority: (c.priority?.toLowerCase() || 'normal') as any,
              assignedClinician: 'Attending Clinician',
              assignedTeam: ['Attending Clinician (Lead)'],
              lastUpdate: 'Recently',
              safetyIssueCount: 0,
              gapsCount: 0,
              hypothesesCount: 0,
            }))
          );
        }
      });
    }
  }, [activeOrganizationId, profile]);

  const openCaseById = async (caseId: string, targetTab?: CaseSubTab) => {
    setActiveView('case-workspace');
    setActiveCaseSubTab(targetTab ?? 'summary');

    try {
      const fullCase = await getCaseDetail(caseId);
      if (fullCase) {
        setActiveCase(fullCase);
        setNexusAssessment(fullCase.nexusAssessment ?? null);
      }
    } catch (err) {
      console.warn('[openCaseById] Fallback to registry for case:', caseId, err);
      const fullCase = MOCK_FULL_CASES_REGISTRY[caseId];
      if (fullCase) {
        setActiveCase(fullCase);
        setNexusAssessment(fullCase.nexusAssessment ?? null);
      }
    }
  };

  // ── Phase 14: Case Registration from Intake ──────────────
  const registerCreatedCase = useCallback(async (
    draft: CaseIntakeDraft,
    options: RegisterCaseOptions
  ): Promise<{ success: boolean; error: string | null }> => {
    const result = await createPatientCase(draft, {
      organizationId: options.organizationId,
      userId: options.userId,
      userDisplayName: options.userDisplayName,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const newFullCase = result.fullCase;

    // Persist the new case into context state
    setActiveCase(newFullCase);
    setCasesList((prev) => [
      {
        ...newFullCase.overview,
      },
      ...prev,
    ]);

    // If Nexus analysis was requested immediately, run it
    if (options.runAnalysisImmediately) {
      setActiveView('case-workspace');
      setActiveCaseSubTab('reasoning');
      setIsRunningAnalysis(true);
      try {
        const analysisResult = await runCaseAnalysis(newFullCase, {
          caseId: result.caseId,
          allowOfflineGrace: true,
        });
        if (analysisResult.assessment) {
          setNexusAssessment(analysisResult.assessment);
          setActiveCase((prev) => ({
            ...prev,
            nexusAssessment: analysisResult.assessment ?? undefined,
          }));
        }
      } finally {
        setIsRunningAnalysis(false);
      }
    } else {
      // Route to case workspace summary tab
      setActiveView('case-workspace');
      setActiveCaseSubTab('summary');
    }

    return { success: true, error: null };
  }, [casesList]);

  // ── Findings Status Update ──────────────────────────────
  const updateFindingStatus = (findingId: string, status: VerificationStatus, reason?: string, note?: string) => {
    setActiveCase((prev) => {
      const updatedFindings = prev.findings.map((f) => {
        if (f.id === findingId) {
          return {
            ...f,
            provenance: {
              ...f.provenance,
              verificationStatus: status,
              rejectionReason: reason,
              rejectionNote: note,
              rejectedBy: status === 'Rejected' ? activeUserDisplayName : undefined,
              rejectedAt: status === 'Rejected' ? 'Just now' : undefined,
            },
          };
        }
        return f;
      });

      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: status === 'Rejected' ? 'REJECTED' : 'REVIEWED',
        title: `Clinical finding ${status.toLowerCase()}: ${prev.findings.find((f) => f.id === findingId)?.label}`,
        description:
          status === 'Rejected'
            ? `Reason: ${reason || 'Not specified'}. Note: ${note || 'None'}`
            : 'Finding reviewed and accepted into active clinical record.',
        isNexusSimulated: false,
      };

      // Persist to Supabase clinical_findings table if configured
      if (isSupabaseConfigured) {
        supabase
          .from('clinical_findings')
          .update({
            status: status === 'Rejected' ? 'REJECTED' : 'ACTIVE',
            verified_at: status === 'Verified' ? new Date().toISOString() : null,
          })
          .eq('id', findingId)
          .then(({ error }) => {
            if (error) console.warn('[updateFindingStatus] Supabase sync notice:', error.message);
          });
      }

      return { ...prev, findings: updatedFindings, timeline: [auditEvent, ...prev.timeline] };
    });
  };

  // ── Investigations Ordering ──────────────────────────────
  const requestInvestigation = (
    testName: string,
    category: 'Laboratory' | 'Imaging' | 'Cardiovascular' | 'Microbiology',
    priority: 'Stat' | 'Urgent' | 'Routine',
    indication: string
  ) => {
    setActiveCase((prev) => {
      const newId = `inv-${Date.now().toString().slice(-4)}`;
      const newOrder = {
        id: newId,
        caseId: prev.overview.id,
        testName,
        category,
        priority,
        requestedBy: activeUserDisplayName,
        requestedAt: 'Just now',
        clinicalIndication: indication,
        status: 'Requested' as const,
      };

      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'REQUESTED',
        title: `Investigation ordered: ${testName}`,
        description: `Priority: ${priority}. Indication: ${indication}`,
        isNexusSimulated: false,
      };

      // Persist to Supabase investigations table if configured
      if (isSupabaseConfigured) {
        supabase
          .from('investigations')
          .insert({
            case_id: prev.overview.id,
            test_name: testName,
            category: category.toUpperCase(),
            priority: priority.toUpperCase(),
            clinical_indication: indication,
            status: 'ORDERED',
            requested_by: activeUserDisplayName,
          })
          .then(({ error }) => {
            if (error) console.warn('[requestInvestigation] Supabase sync notice:', error.message);
          });
      }

      return { ...prev, investigations: [newOrder, ...prev.investigations], timeline: [auditEvent, ...prev.timeline] };
    });
  };

  // ── Phase 6F: Run Nexus Analysis ─────────────────────────
  const handleRunNexusAnalysis = useCallback(async () => {
    setIsRunningAnalysis(true);
    try {
      if (nexusAssessment) {
        setNexusAssessment((prev) => (prev ? { ...prev, status: 'SUPERSEDED' } : null));
      }

      // Automatically routes to live Hugging Face provider (MedGemma 4B) when token is configured
      const provider = getDefaultReasoningProvider();
      const newAssessment = await runNexusAnalysis(activeCase, provider, {
        caseId: activeCase.overview.id,
      });
      setNexusAssessment(newAssessment);

      // Persist assessment event to Supabase audit trail if configured
      if (isSupabaseConfigured) {
        supabase
          .from('audit_events')
          .insert({
            case_id: activeCase.overview.id,
            event_type: 'GENERATED',
            action_type: 'NEXUS_ASSESSMENT',
            summary: `Nexus Clinical Assessment Generated via ${newAssessment.modelName}`,
            description: `Model: ${newAssessment.modelName} (v${newAssessment.modelVersion}). Safety boundary: ${newAssessment.safetyBoundary}.`,
            user_display_name: 'Nexus Clinical Reasoning Engine',
            recorded_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) console.warn('[handleRunNexusAnalysis] Supabase audit sync notice:', error.message);
          });
      }

      setActiveCase((prev) => {
        const auditEvent: TimelineEvent = {
          id: `evt-${Date.now()}`,
          time: 'Just now',
          actor: 'NEXUS',
          actorName: 'Nexus Clinical Reasoning Engine',
          eventType: 'GENERATED',
          title: 'Nexus Clinical Assessment Generated',
          description: `Analysis completed with model ${newAssessment.modelName}. Safety status: ${newAssessment.safetyBoundary}. Adjudication required before clinical reliance.`,
          isNexusSimulated: true,
        };

        const updatedOverview = {
          ...prev.overview,
          state: 'REVIEW_REQUIRED' as const,
          lastUpdate: 'Just now',
        };

        return {
          ...prev,
          overview: updatedOverview,
          nexusAssessment: newAssessment,
          timeline: [auditEvent, ...prev.timeline],
        };
      });
    } finally {
      setIsRunningAnalysis(false);
    }
  }, [activeCase, nexusAssessment]);

  // ── Phase 6F: Per-finding Review ─────────────────────────
  const reviewNexusFinding = (
    findingId: string,
    action: ReviewAction,
    revisedContent?: string,
    reason?: string
  ) => {
    if (!nexusAssessment) return;

    const updatedFindings = nexusAssessment.nexusFindings.map((f) => {
      if (f.id === findingId) {
        const newStatus: NexusFindingStatus =
          action === 'ACCEPT' ? 'ACCEPTED' : action === 'EDIT' ? 'EDITED' : 'REJECTED';
        return {
          ...f,
          status: newStatus,
          content: action === 'EDIT' && revisedContent ? revisedContent : f.content,
        };
      }
      return f;
    });

    const allReviewed = updatedFindings.every((f) => f.status !== 'UNREVIEWED');
    const updatedStatus = allReviewed ? 'REVIEWED' : 'REVIEW_REQUIRED';

    const updatedAssessment: NexusAssessment = {
      ...nexusAssessment,
      status: updatedStatus,
      nexusFindings: updatedFindings,
    };

    setNexusAssessment(updatedAssessment);

    setActiveCase((prev) => {
      const target = nexusAssessment.nexusFindings.find((f) => f.id === findingId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: 'Dr. Edward Vance, MD',
        eventType: action === 'REJECT' ? 'REJECTED' : 'REVIEWED',
        title: `Nexus finding ${action.toLowerCase()}ed: [${target?.findingType}]`,
        description:
          action === 'EDIT'
            ? `Clinician revised: "${revisedContent}" (Original: "${target?.content}")`
            : action === 'REJECT'
            ? `Rejection reason: "${reason}"`
            : `Accepted: "${target?.content}"`,
        isNexusSimulated: false,
      };

      return {
        ...prev,
        nexusAssessment: updatedAssessment,
        timeline: [auditEvent, ...prev.timeline],
      };
    });
  };

  const supersedePreviousAssessment = () => {
    if (nexusAssessment) {
      setNexusAssessment((prev) => (prev ? { ...prev, status: 'SUPERSEDED' } : null));
    }
  };

  // ── Phase 6G: Safety Concerns Management ────────────────
  const acknowledgeSafetyConcern = (concernId: string, note?: string) => {
    const userId = profile?.id || 'user';
    setSafetyConcerns((prev) =>
      prev.map((c) => (c.id === concernId ? acknowledgeConcern(c, userId, activeUserDisplayName, note) : c))
    );

    setActiveCase((prev) => {
      const concern = safetyConcerns.find((c) => c.id === concernId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'REVIEWED',
        title: `Safety concern acknowledged: ${concern?.category || 'Clinical Hazard'}`,
        description: note || 'Acknowledged by lead clinician; appropriate care protocol underway.',
        isNexusSimulated: false,
      };
      return { ...prev, timeline: [auditEvent, ...prev.timeline] };
    });
  };

  const resolveSafetyConcern = (concernId: string, note: string) => {
    const userId = profile?.id || 'user';
    setSafetyConcerns((prev) =>
      prev.map((c) => (c.id === concernId ? resolveConcern(c, userId, activeUserDisplayName, note) : c))
    );

    setActiveCase((prev) => {
      const concern = safetyConcerns.find((c) => c.id === concernId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'REVIEWED',
        title: `Safety concern RESOLVED: ${concern?.category || 'Clinical Hazard'}`,
        description: `Resolution note: ${note}`,
        isNexusSimulated: false,
      };

      // Also mark in legacy safetyIssues if matching
      const updatedLegacy = prev.safetyIssues.map((s) =>
        s.id === concernId || concernId === 'sc-1'
          ? { ...s, status: 'Resolved' as const, clinicalNote: note }
          : s
      );

      return { ...prev, safetyIssues: updatedLegacy, timeline: [auditEvent, ...prev.timeline] };
    });
  };

  const resolveSafetyIssue = (issueId: string, note?: string) => {
    resolveSafetyConcern(issueId, note || 'Resolved by clinician.');
  };

  // ── Phase 6G: Review Queue Adjudication ───────────────────
  const adjudicateReviewItem = (
    itemId: string,
    action: ReviewAction,
    revisedContent?: string,
    reasonCategory?: RejectReasonCategory,
    reason?: string
  ) => {
    setReviewQueue((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: 'COMPLETED',
              payload: { action, revisedContent, reasonCategory, reason, reviewedAt: new Date().toISOString() },
            }
          : item
      )
    );

    setActiveCase((prev) => {
      const item = reviewQueue.find((r) => r.id === itemId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: action === 'REJECT' ? 'REJECTED' : 'REVIEWED',
        title: `Review Queue: ${item?.title || 'Item'} [${action}]`,
        description:
          action === 'REJECT'
            ? `Rejected (${reasonCategory}): ${reason}`
            : action === 'EDIT'
            ? `Edited: "${revisedContent}"`
            : `Accepted into clinical record.`,
        isNexusSimulated: false,
      };
      return { ...prev, timeline: [auditEvent, ...prev.timeline] };
    });
  };

  // ── Phase 6G: Decisions & Amendment Chain ────────────────
  const recordDecision = (draft: NewDecisionDraft) => {
    if (hasBlockingSafety) {
      alert('Cannot record clinical decision while a SAFETY_CRITICAL concern remains unresolved.');
      return;
    }

    const newDec: Decision = {
      id: `dec-${Date.now()}`,
      caseId: draft.caseId,
      decisionType: draft.decisionType,
      summary: draft.summary,
      rationale: draft.rationale,
      recordedBy: activeUserDisplayName,
      recordedByRole: profile?.profession || 'Attending Physician',
      status: 'ACTIVE',
      recordedAt: new Date().toISOString(),
      relatedAssessmentId: draft.relatedAssessmentId,
      supportingEvidenceIds: draft.supportingEvidenceIds,
      supportingFindingIds: draft.supportingFindingIds,
      legalDisclaimerAcknowledged: draft.legalDisclaimerAcknowledged,
    };

    setDecisions((prev) => [newDec, ...prev]);

    setActiveCase((prev) => {
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'DECISION_RECORDED',
        title: `Clinical Decision Recorded: ${draft.decisionType}`,
        description: `Clinician-owned decision recorded. Summary: "${draft.summary.slice(0, 100)}..."`,
        isNexusSimulated: false,
      };

      const updatedOverview = {
        ...prev.overview,
        state: 'DECISION_RECORDED' as const,
        lastUpdate: 'Just now',
      };

      return {
        ...prev,
        overview: updatedOverview,
        clinicalDecision: {
          ...prev.clinicalDecision,
          isRecorded: true,
          recordedAt: 'Just now',
          assessment: draft.summary,
          primaryDecision: draft.summary,
          rationale: draft.rationale || '',
          legalDisclaimerAcknowledged: draft.legalDisclaimerAcknowledged,
        },
        timeline: [auditEvent, ...prev.timeline],
      };
    });
  };

  const amendActiveDecision = (amendment: {
    summary: string;
    rationale?: string;
    decisionType?: DecisionType;
    amendmentReason: string;
  }) => {
    if (!activeDecision) return;

    const { amendedPrior, activeNew } = amendDecision(
      activeDecision,
      amendment,
      activeUserDisplayName,
      profile?.profession || 'Attending Physician'
    );

    setDecisions((prev) =>
      prev.map((d) => (d.id === amendedPrior.id ? amendedPrior : d)).concat([activeNew])
    );

    setActiveCase((prev) => {
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'DECISION_RECORDED',
        title: `Clinical Decision AMENDED: Decision #${activeNew.id}`,
        description: `Amended from Decision #${amendedPrior.id}. Reason: "${amendment.amendmentReason}". Prior decision preserved in historical record.`,
        isNexusSimulated: false,
      };

      return {
        ...prev,
        clinicalDecision: {
          ...prev.clinicalDecision,
          primaryDecision: amendment.summary,
          rationale: amendment.rationale || prev.clinicalDecision.rationale,
        },
        timeline: [auditEvent, ...prev.timeline],
      };
    });
  };

  const recordClinicalDecision = (
    assessment: string,
    decision: string,
    rationale: string,
    followUp: string
  ) => {
    recordDecision({
      caseId: activeCase.overview.id,
      decisionType: 'CLINICAL_ASSESSMENT',
      summary: `${assessment} — ${decision}`,
      rationale: `${rationale}. Follow-up: ${followUp}`,
      relatedAssessmentId: nexusAssessment?.id,
      legalDisclaimerAcknowledged: true,
    });
  };

  // ── Phase 6G: Tasks Workflow ─────────────────────────────
  const createTask = (draft: Omit<ClinicalTask, 'id' | 'createdAt' | 'status'>) => {
    const newTask = createClinicalTask(draft);
    setTasks((prev) => [newTask, ...prev]);

    setActiveCase((prev) => {
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'REQUESTED',
        title: `Clinical task created: ${newTask.title}`,
        description: `Priority: ${newTask.priority}. Assigned: ${newTask.assignedToName || 'Unassigned'}.`,
        isNexusSimulated: false,
      };
      return { ...prev, timeline: [auditEvent, ...prev.timeline] };
    });
  };

  const completeTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? completeClinicalTask(t, activeUserDisplayName) : t))
    );

    setActiveCase((prev) => {
      const task = tasks.find((t) => t.id === taskId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'REVIEWED',
        title: `Clinical task completed: ${task?.title || 'Task'}`,
        description: 'Marked as completed by clinician.',
        isNexusSimulated: false,
      };
      return { ...prev, timeline: [auditEvent, ...prev.timeline] };
    });
  };

  const cancelTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? cancelClinicalTask(t) : t))
    );
  };

  // ── Phase 6G: Case State Machine ─────────────────────────
  const transitionCaseStatus = (targetStatus: ClinicalCaseStatus): TransitionCheckResult => {
    const check = canTransitionCase(
      activeCase.overview.state as ClinicalCaseStatus,
      targetStatus,
      {
        hasUnresolvedSafetyCritical: hasBlockingSafety,
        hasUnreviewedFindings: false,
        hasActiveDecision: !!activeDecision,
        hasPendingInvestigations: false,
      }
    );

    if (!check.allowed) {
      return check;
    }

    setActiveCase((prev) => {
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: activeUserDisplayName,
        eventType: 'REVIEWED',
        title: `Case status transitioned: ${prev.overview.state} → ${targetStatus}`,
        description: `Clinical lifecycle state updated according to clinical workflow rules.`,
        isNexusSimulated: false,
      };

      const updatedOverview = {
        ...prev.overview,
        state: targetStatus as any,
        lastUpdate: 'Just now',
      };

      setCasesList((list) =>
        list.map((c) => (c.id === prev.overview.id ? { ...c, state: targetStatus as any, lastUpdate: 'Just now' } : c))
      );

      return {
        ...prev,
        overview: updatedOverview,
        timeline: [auditEvent, ...prev.timeline],
      };
    });

    return { allowed: true };
  };

  return (
    <CaseContext.Provider
      value={{
        activeView,
        setActiveView,
        activeCaseSubTab,
        setActiveCaseSubTab,
        activeCase,
        casesList,
        openCaseById,
        registerCreatedCase,
        updateFindingStatus,
        requestInvestigation,
        nexusAssessment,
        isRunningAnalysis,
        runNexusAnalysis: handleRunNexusAnalysis,
        reviewNexusFinding,
        supersedePreviousAssessment,
        safetyConcerns,
        activeSafetyCriticalCount,
        hasBlockingSafety,
        acknowledgeSafetyConcern,
        resolveSafetyConcern,
        resolveSafetyIssue,
        reviewQueue,
        pendingReviewCount,
        adjudicateReviewItem,
        decisions,
        activeDecision,
        canRecordDecision,
        recordDecision,
        amendActiveDecision,
        recordClinicalDecision,
        tasks,
        createTask,
        completeTask,
        cancelTask,
        transitionCaseStatus,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = (): CaseContextType => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
};
