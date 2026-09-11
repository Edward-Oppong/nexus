import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { FullSyntheticCase, SYNTHETIC_CASE_10482, MOCK_CASES_LIST } from '../../data/cases/mockCasesData';
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
import { testProvider } from '../../lib/intelligence/reasoning-provider';

export type MainView =
  | 'landing'
  | 'login'
  | 'overview'
  | 'cases'
  | 'case-workspace'
  | 'patients'
  | 'investigations'
  | 'tasks'
  | 'evidence-catalog'
  | 'administration'
  | 'review-queue';

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

interface CaseContextType {
  activeView: MainView;
  setActiveView: (view: MainView) => void;
  activeCaseSubTab: CaseSubTab;
  setActiveCaseSubTab: (tab: CaseSubTab) => void;
  activeCase: FullSyntheticCase;
  casesList: CaseOverview[];
  openCaseById: (caseId: string) => void;

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
  const [activeView, setActiveView] = useState<MainView>('case-workspace');
  const [activeCaseSubTab, setActiveCaseSubTab] = useState<CaseSubTab>('reasoning');
  const [activeCase, setActiveCase] = useState<FullSyntheticCase>(SYNTHETIC_CASE_10482);
  const [casesList, setCasesList] = useState<CaseOverview[]>(MOCK_CASES_LIST);

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

  const openCaseById = (caseId: string) => {
    setActiveView('case-workspace');
    setActiveCaseSubTab('summary');
  };

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
              rejectedBy: status === 'Rejected' ? 'Dr. Edward Vance, MD' : undefined,
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
        actorName: 'Dr. Edward Vance, MD',
        eventType: status === 'Rejected' ? 'REJECTED' : 'REVIEWED',
        title: `Clinical finding ${status.toLowerCase()}: ${prev.findings.find((f) => f.id === findingId)?.label}`,
        description:
          status === 'Rejected'
            ? `Reason: ${reason || 'Not specified'}. Note: ${note || 'None'}`
            : 'Finding reviewed and accepted into active clinical record.',
        isNexusSimulated: false,
      };

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
        requestedBy: 'Dr. Edward Vance, MD',
        requestedAt: 'Just now',
        clinicalIndication: indication,
        status: 'Requested' as const,
      };

      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: 'Dr. Edward Vance, MD',
        eventType: 'REQUESTED',
        title: `Investigation ordered: ${testName}`,
        description: `Priority: ${priority}. Indication: ${indication}`,
        isNexusSimulated: false,
      };

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

      const newAssessment = await runNexusAnalysis(activeCase, testProvider, {
        caseId: activeCase.overview.id,
      });
      setNexusAssessment(newAssessment);

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
    setSafetyConcerns((prev) =>
      prev.map((c) => (c.id === concernId ? acknowledgeConcern(c, 'dr-edward-vance', 'Dr. Edward Vance, MD', note) : c))
    );

    setActiveCase((prev) => {
      const concern = safetyConcerns.find((c) => c.id === concernId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: 'Dr. Edward Vance, MD',
        eventType: 'REVIEWED',
        title: `Safety concern acknowledged: ${concern?.category || 'Clinical Hazard'}`,
        description: note || 'Acknowledged by lead clinician; appropriate care protocol underway.',
        isNexusSimulated: false,
      };
      return { ...prev, timeline: [auditEvent, ...prev.timeline] };
    });
  };

  const resolveSafetyConcern = (concernId: string, note: string) => {
    setSafetyConcerns((prev) =>
      prev.map((c) => (c.id === concernId ? resolveConcern(c, 'dr-edward-vance', 'Dr. Edward Vance, MD', note) : c))
    );

    setActiveCase((prev) => {
      const concern = safetyConcerns.find((c) => c.id === concernId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: 'Dr. Edward Vance, MD',
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
        actorName: 'Dr. Edward Vance, MD',
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
      recordedBy: 'Dr. Edward Vance, MD',
      recordedByRole: 'Attending Physician · Lead Clinician',
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
        actorName: 'Dr. Edward Vance, MD',
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
      'Dr. Edward Vance, MD',
      'Attending Physician · Lead Clinician'
    );

    setDecisions((prev) =>
      prev.map((d) => (d.id === amendedPrior.id ? amendedPrior : d)).concat([activeNew])
    );

    setActiveCase((prev) => {
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: 'Dr. Edward Vance, MD',
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
        actorName: 'Dr. Edward Vance, MD',
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
      prev.map((t) => (t.id === taskId ? completeClinicalTask(t, 'Dr. Edward Vance, MD') : t))
    );

    setActiveCase((prev) => {
      const task = tasks.find((t) => t.id === taskId);
      const auditEvent: TimelineEvent = {
        id: `evt-${Date.now()}`,
        time: 'Just now',
        actor: 'CLINICIAN',
        actorName: 'Dr. Edward Vance, MD',
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
        actorName: 'Dr. Edward Vance, MD',
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
