-- ============================================================
-- 033_delete_permissions.sql
-- Grants DELETE privilege on cases, tasks, investigations, and all associated
-- case records to authenticated, and adds dedicated RLS DELETE policies.
-- Ensures that deleting a case cascades or permits deleting all associated records
-- (tasks, findings, investigations, safety issues, decisions, timeline events, documents)
-- across all sections of the application.
-- ============================================================

-- 1. Grant table-level DELETE permissions to authenticated
grant delete on public.cases to authenticated;
grant delete on public.tasks to authenticated;
grant delete on public.investigations to authenticated;
grant delete on public.investigation_results to authenticated;
grant delete on public.clinical_findings to authenticated;
grant delete on public.safety_concerns to authenticated;
grant delete on public.decisions to authenticated;
grant delete on public.reviews to authenticated;
grant delete on public.timeline_events to authenticated;
grant delete on public.clinical_documents to authenticated;
grant delete on public.fhir_export_bundles to authenticated;

-- 2. Register 'investigation.delete' permission if not existing
insert into public.permissions (code, description)
values ('investigation.delete', 'Cancel or delete diagnostic investigation orders')
on conflict (code) do nothing;

-- 3. Grant 'investigation.delete' to clinician and org_admin roles
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name in ('clinician', 'organization_admin')
  and p.code = 'investigation.delete'
on conflict do nothing;

-- 4. RLS DELETE Policy on public.cases
drop policy if exists "authorized_users_delete_cases" on public.cases;
create policy "authorized_users_delete_cases"
  on public.cases for delete to authenticated
  using (
    public.is_case_member(id) or
    (public.is_org_member(organization_id) and (
      public.has_permission('case.close') or
      public.has_permission('case.edit')
    ))
  );

-- 5. RLS DELETE Policy on public.tasks
drop policy if exists "authorized_users_delete_tasks" on public.tasks;
create policy "authorized_users_delete_tasks"
  on public.tasks for delete to authenticated
  using (
    created_by = auth.uid() or
    assigned_to = auth.uid() or
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 6. RLS DELETE Policy on public.investigations
drop policy if exists "authorized_users_delete_investigations" on public.investigations;
create policy "authorized_users_delete_investigations"
  on public.investigations for delete to authenticated
  using (
    requested_by = auth.uid() or
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 7. RLS DELETE Policy on public.clinical_findings
drop policy if exists "authorized_users_delete_findings" on public.clinical_findings;
create policy "authorized_users_delete_findings"
  on public.clinical_findings for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 8. RLS DELETE Policy on public.safety_concerns
drop policy if exists "authorized_users_delete_safety_concerns" on public.safety_concerns;
create policy "authorized_users_delete_safety_concerns"
  on public.safety_concerns for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 9. RLS DELETE Policy on public.decisions
drop policy if exists "authorized_users_delete_decisions" on public.decisions;
create policy "authorized_users_delete_decisions"
  on public.decisions for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );

-- 10. RLS DELETE Policy on public.timeline_events
drop policy if exists "authorized_users_delete_timeline_events" on public.timeline_events;
create policy "authorized_users_delete_timeline_events"
  on public.timeline_events for delete to authenticated
  using (
    case_id in (
      select id from public.cases
      where public.is_case_member(id) or public.is_org_member(organization_id)
    )
  );
