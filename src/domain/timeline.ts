export type TimelineActor =
  | 'PATIENT'
  | 'CLINICIAN'
  | 'NURSE'
  | 'LAB'
  | 'SYSTEM'
  | 'NEXUS'
  | 'ADMIN';

export type TimelineEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'EXTRACTED'
  | 'REVIEWED'
  | 'REJECTED'
  | 'APPROVED'
  | 'REQUESTED'
  | 'RESULT_RECEIVED'
  | 'ALERTED'
  | 'DECISION_RECORDED'
  | 'GENERATED';

export interface TimelineEvent {
  id: string;
  time: string;
  actor: TimelineActor;
  actorName: string;
  eventType: TimelineEventType;
  title: string;
  description: string;
  modelIdentifier?: string; // e.g. "Nexus Reasoning v2.1 (Simulated)"
  isNexusSimulated: boolean;
  metadata?: Record<string, string>;
}
