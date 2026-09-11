-- ============================================================
-- 017_rls.sql
-- Row Level Security (RLS) policies and role grants.
-- Strict multi-tenant isolation:
-- Authenticated User -> Organization Membership -> Case Membership -> Resource.
-- No permissive "using (true)" on clinical tables.
-- ============================================================

-- ----------------------------------------------------------
-- 1. Enable RLS on ALL tables
-- ----------------------------------------------------------
alter table public.organizations         enable row level security;
alter table public.profiles              enable row level security;
alter table public.organization_members  enable row level security;
alter table public.roles                 enable row level security;
alter table public.permissions           enable row level security;
alter table public.role_permissions      enable row level security;

alter table public.patients              enable row level security;
alter table public.encounters            enable row level security;
alter table public.cases                 enable row level security;
alter table public.case_members          enable row level security;

alter table public.provenance_records    enable row level security;
alter table public.observations          enable row level security;
alter table public.clinical_findings     enable row level security;
alter table public.hypotheses            enable row level security;
alter table public.hypothesis_findings   enable row level security;

alter table public.investigations        enable row level security;
alter table public.investigation_results enable row level security;
alter table public.diagnostic_reports    enable row level security;

alter table public.evidence_sources      enable row level security;
alter table public.evidence_links        enable row level security;

alter table public.nexus_assessments     enable row level security;
alter table public.nexus_findings        enable row level security;
alter table public.nexus_recommendations enable row level security;

alter table public.reviews               enable row level security;
alter table public.decisions             enable row level security;
alter table public.safety_concerns       enable row level security;

alter table public.tasks                 enable row level security;
alter table public.timeline_events       enable row level security;
alter table public.audit_events          enable row level security;
alter table public.documents             enable row level security;

-- ----------------------------------------------------------
-- 2. Principle of Least Privilege: Revoke and explicit Grant
-- ----------------------------------------------------------
-- Anon cannot read or write any clinical or identity table
revoke all on public.organizations         from anon;
revoke all on public.profiles              from anon;
revoke all on public.organization_members  from anon;
revoke all on public.roles                 from anon;
revoke all on public.permissions           from anon;
revoke all on public.role_permissions      from anon;
revoke all on public.patients              from anon;
revoke all on public.encounters            from anon;
revoke all on public.cases                 from anon;
revoke all on public.case_members          from anon;
revoke all on public.provenance_records    from anon;
revoke all on public.observations          from anon;
revoke all on public.clinical_findings     from anon;
revoke all on public.hypotheses            from anon;
revoke all on public.hypothesis_findings   from anon;
revoke all on public.investigations        from anon;
revoke all on public.investigation_results from anon;
revoke all on public.diagnostic_reports    from anon;
revoke all on public.evidence_sources      from anon;
revoke all on public.evidence_links        from anon;
revoke all on public.nexus_assessments     from anon;
revoke all on public.nexus_findings        from anon;
revoke all on public.nexus_recommendations from anon;
revoke all on public.reviews               from anon;
revoke all on public.decisions             from anon;
revoke all on public.safety_concerns       from anon;
revoke all on public.tasks                 from anon;
revoke all on public.timeline_events       from anon;
revoke all on public.audit_events          from anon;
revoke all on public.documents             from anon;

-- Authenticated roles granted application-level table access subject to RLS
grant select, insert, update on public.organizations         to authenticated;
grant select, insert, update on public.profiles              to authenticated;
grant select                 on public.organization_members  to authenticated;
grant select                 on public.roles                 to authenticated;
grant select                 on public.permissions           to authenticated;
grant select                 on public.role_permissions      to authenticated;

grant select, insert, update on public.patients              to authenticated;
grant select, insert, update on public.encounters            to authenticated;
grant select, insert, update on public.cases                 to authenticated;
grant select, insert, delete on public.case_members          to authenticated;

grant select, insert         on public.provenance_records    to authenticated;
grant select, insert, update on public.observations          to authenticated;
grant select, insert, update on public.clinical_findings     to authenticated;
grant select, insert, update on public.hypotheses            to authenticated;
grant select, insert, delete on public.hypothesis_findings   to authenticated;

grant select, insert, update on public.investigations        to authenticated;
grant select, insert, update on public.investigation_results to authenticated;
grant select, insert, update on public.diagnostic_reports    to authenticated;

grant select                 on public.evidence_sources      to authenticated;
grant select, insert, delete on public.evidence_links        to authenticated;

grant select, insert, update on public.nexus_assessments     to authenticated;
grant select, insert, update on public.nexus_findings        to authenticated;
grant select, insert, update on public.nexus_recommendations to authenticated;

grant select, insert         on public.reviews               to authenticated;
grant select, insert, update on public.decisions             to authenticated;
grant select, insert, update on public.safety_concerns       to authenticated;

grant select, insert, update on public.tasks                 to authenticated;
grant select, insert         on public.timeline_events       to authenticated;
grant select, insert         on public.audit_events          to authenticated;
grant select, insert, update on public.documents             to authenticated;


-- ----------------------------------------------------------
-- 3. Core RLS Policies
-- ----------------------------------------------------------

-- Organizations: users view orgs where they are active members
create policy "members_can_view_organization"
  on public.organizations for select to authenticated
  using (public.is_org_member(id));

-- Profiles: users can view profiles in their shared organizations; update their own profile
create policy "users_view_colleague_profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid()) or
    exists (
      select 1 from public.organization_members my_org
      join public.organization_members peer_org on peer_org.organization_id = my_org.organization_id
      where my_org.user_id = (select auth.uid())
        and peer_org.user_id = profiles.id
        and my_org.is_active = true
        and peer_org.is_active = true
    )
  );

create policy "users_update_own_profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Organization Members: members can view colleagues within same organization
create policy "members_view_org_roster"
  on public.organization_members for select to authenticated
  using (public.is_org_member(organization_id));

-- Roles & Permissions: authenticated users can inspect roles & permissions
create policy "authenticated_read_roles"
  on public.roles for select to authenticated
  using (true);

create policy "authenticated_read_permissions"
  on public.permissions for select to authenticated
  using (true);

create policy "authenticated_read_role_permissions"
  on public.role_permissions for select to authenticated
  using (true);

-- Patients: users view patients belonging to their organizations
create policy "members_view_patients"
  on public.patients for select to authenticated
  using (public.is_org_member(organization_id));

create policy "members_insert_patients"
  on public.patients for insert to authenticated
  with check (public.is_org_member(organization_id));

-- Encounters: users view encounters for their organization
create policy "members_view_encounters"
  on public.encounters for select to authenticated
  using (public.is_org_member(organization_id));

create policy "members_insert_encounters"
  on public.encounters for insert to authenticated
  with check (public.is_org_member(organization_id));

-- Cases: access granted to assigned case members OR org clinicians (governed by org membership & case assignment)
create policy "case_members_view_cases"
  on public.cases for select to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.view'))
  );

create policy "case_create_permission"
  on public.cases for insert to authenticated
  with check (
    public.is_org_member(organization_id) and
    public.has_permission('case.create')
  );

create policy "case_edit_permission"
  on public.cases for update to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and public.has_permission('case.edit'))
  );

-- Case members: viewable by org members of the case
create policy "view_case_members"
  on public.case_members for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_members.case_id
        and public.is_org_member(c.organization_id)
    )
  );

-- Clinical findings: scoped through case membership / view permission
create policy "view_clinical_findings"
  on public.clinical_findings for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = clinical_findings.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_clinical_findings"
  on public.clinical_findings for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = clinical_findings.case_id
        and public.is_org_member(c.organization_id)
        and public.has_permission('finding.create')
    )
  );

-- Observations: scoped through case
create policy "view_observations"
  on public.observations for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = observations.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Hypotheses & hypothesis_findings: scoped through case
create policy "view_hypotheses"
  on public.hypotheses for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = hypotheses.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_hypothesis_findings"
  on public.hypothesis_findings for select to authenticated
  using (
    exists (
      select 1 from public.hypotheses h
      join public.cases c on c.id = h.case_id
      where h.id = hypothesis_findings.hypothesis_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Investigations & results
create policy "view_investigations"
  on public.investigations for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = investigations.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_investigations"
  on public.investigations for insert to authenticated
  with check (
    exists (
      select 1 from public.cases c
      where c.id = investigations.case_id
        and public.is_org_member(c.organization_id)
        and public.has_permission('investigation.request')
    )
  );

create policy "view_investigation_results"
  on public.investigation_results for select to authenticated
  using (
    exists (
      select 1 from public.investigations i
      join public.cases c on c.id = i.case_id
      where i.id = investigation_results.investigation_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Evidence sources (shared clinical library) & links
create policy "view_evidence_sources"
  on public.evidence_sources for select to authenticated
  using (true);

create policy "view_evidence_links"
  on public.evidence_links for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = evidence_links.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Nexus intelligence assessments & items
create policy "view_nexus_assessments"
  on public.nexus_assessments for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = nexus_assessments.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_nexus_findings"
  on public.nexus_findings for select to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_findings.assessment_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_nexus_recommendations"
  on public.nexus_recommendations for select to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = nexus_recommendations.assessment_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Reviews & Decisions
create policy "view_reviews"
  on public.reviews for select to authenticated
  using (
    exists (
      select 1 from public.nexus_assessments na
      join public.cases c on c.id = na.case_id
      where na.id = reviews.assessment_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_reviews"
  on public.reviews for insert to authenticated
  with check (
    reviewer_id = (select auth.uid()) and
    public.has_permission('nexus.review')
  );

create policy "view_decisions"
  on public.decisions for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = decisions.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "insert_decisions"
  on public.decisions for insert to authenticated
  with check (
    recorded_by = (select auth.uid()) and
    public.has_permission('decision.create')
  );

-- Safety concerns
create policy "view_safety_concerns"
  on public.safety_concerns for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = safety_concerns.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Tasks & Timeline
create policy "view_tasks"
  on public.tasks for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = tasks.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

create policy "view_timeline_events"
  on public.timeline_events for select to authenticated
  using (
    exists (
      select 1 from public.cases c
      where c.id = timeline_events.case_id
        and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
    )
  );

-- Audit Events: viewable only by users with audit.view permission in the organization
create policy "view_audit_events"
  on public.audit_events for select to authenticated
  using (
    public.is_org_member(organization_id) and
    public.has_permission('audit.view')
  );

-- Documents
create policy "view_documents"
  on public.documents for select to authenticated
  using (
    public.is_org_member(organization_id) and
    (
      case_id is null or
      exists (
        select 1 from public.cases c
        where c.id = documents.case_id
          and (public.is_case_member(c.id) or public.is_org_member(c.organization_id))
      )
    )
  );
