-- ============================================================
-- 012_tasks_timeline.sql
-- Tasks and chronological clinical timeline events.
-- Timeline answers: "What happened clinically?"
-- ============================================================

-- ----------------------------------------------------------
-- tasks
-- Clinical and administrative tasks associated with a case.
-- ----------------------------------------------------------
create table public.tasks (
  id            uuid                primary key default gen_random_uuid(),
  case_id       uuid                references public.cases(id) on delete cascade,
  assigned_to   uuid                references public.profiles(id),
  title         text                not null,
  description   text,
  status        public.task_status  not null default 'OPEN',
  priority      text                not null default 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
  due_at        timestamptz,
  created_by    uuid                references public.profiles(id),
  created_at    timestamptz         not null default now(),
  completed_at  timestamptz
);

comment on table public.tasks is
  'Clinical tasks and workflows assigned to clinicians, nurses, or labs.';

-- ----------------------------------------------------------
-- timeline_events
-- Chronological event stream for a case.
-- Unifies clinical occurrences, observations, orders, notes,
-- and AI analysis markers into an accessible clinical timeline.
-- ----------------------------------------------------------
create table public.timeline_events (
  id            uuid        primary key default gen_random_uuid(),
  case_id       uuid        not null references public.cases(id) on delete cascade,
  actor_type    text        not null,              -- 'CLINICIAN', 'NURSE', 'SYSTEM', 'NEXUS_AI', 'DEVICE'
  actor_user_id uuid        references public.profiles(id),
  event_type    text        not null,              -- 'CASE_OPENED', 'OBSERVATION_ADDED', 'INVESTIGATION_ORDERED', 'NEXUS_SYNTHESIS', 'DECISION_FINALIZED'
  title         text        not null,
  description   text,
  metadata      jsonb,
  occurred_at   timestamptz not null default now()
);

comment on table public.timeline_events is
  'Chronological case history. Answers: What occurred in this clinical encounter and when?';
